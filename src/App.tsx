import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, GameMode, GameState, PlayerId } from './types/game';
import { getPlayerName } from './types/game';
import {
  canPlayCard,
  chooseCpuCard,
  createDeck,
  dealCards,
  drawFromDeck,
  getSpecialEffect,
  shuffleDeck,
} from './game/deck';
import StartScreen from './components/StartScreen';
import PlayerHand from './components/PlayerHand';
import GameBoard from './components/GameBoard';
import WinnerModal from './components/WinnerModal';
import HandoffScreen from './components/HandoffScreen';
import NetworkLobby from './components/NetworkLobby';
import { playGameSound, setSoundMuted } from './game/sound';
import ZanzibarGame from './zanzibar/ZanzibarGame';

type NetworkRole = 'host' | 'guest';
type CardTheme = 'tanzania' | 'zanzibar';
type LobbyView = 'choose' | 'host-offer' | 'host-answer' | 'join-offer' | 'join-answer' | 'connecting';
type NetworkMessage =
  | { type: 'state'; state: GameState; theme: CardTheme }
  | { type: 'action'; action: 'play'; cardId: string }
  | { type: 'action'; action: 'draw' | 'restart' };

function encodeDescription(description: RTCSessionDescriptionInit): string {
  return window.btoa(JSON.stringify(description));
}

function decodeDescription(code: string): RTCSessionDescriptionInit {
  return JSON.parse(window.atob(code.trim())) as RTCSessionDescriptionInit;
}

function waitForIceCandidates(connection: RTCPeerConnection): Promise<void> {
  if (connection.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const listener = () => {
      if (connection.iceGatheringState === 'complete') {
        connection.removeEventListener('icegatheringstatechange', listener);
        resolve();
      }
    };
    connection.addEventListener('icegatheringstatechange', listener);
  });
}

function stateForGuest(state: GameState): GameState {
  return {
    ...state,
    hands: {
      ...state.hands,
      // Player 1 cards are replaced before transmission so the guest cannot inspect them.
      player1: state.hands.player1.map((_, index) => ({
        id: `private-host-card-${index}`,
        suit: 'spades',
        rank: 'A',
        color: 'black',
      })),
    },
  };
}

function opposite(player: PlayerId): PlayerId {
  return player === 'player1' ? 'player2' : 'player1';
}

function turnMessage(name: string): string {
  return name === 'You' ? 'Your turn — match suit or rank' : `${name}'s turn — match suit or rank`;
}

function canFinishWithPair(hand: Card[], selectedCard: Card | null): boolean {
  if (!selectedCard || hand.length !== 2) return false;
  const isNumber = /^\d+$/.test(selectedCard.rank);
  return isNumber && hand.every((card) => card.rank === selectedCard.rank);
}

function compareHandsBySmallest(first: Card[], second: Card[]): number {
  if (first.length !== second.length) return first.length - second.length;

  const rankOrder: Record<Card['rank'], number> = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 11,
    Q: 12,
    K: 13,
    Joker: 14,
  };
  const suitOrder: Record<Card['suit'], number> = {
    spades: 0,
    hearts: 1,
    diamonds: 2,
    clubs: 3,
    joker: 4,
  };
  const values = (hand: Card[]) =>
    [...hand]
      .map((card) => rankOrder[card.rank] * 10 + suitOrder[card.suit])
      .sort((a, b) => a - b);
  const firstValues = values(first);
  const secondValues = values(second);

  for (let index = 0; index < firstValues.length; index += 1) {
    if (firstValues[index] !== secondValues[index]) {
      return firstValues[index] - secondValues[index];
    }
  }
  return 0;
}

function finishBySmallestHand(
  state: GameState,
  hands: GameState['hands'] = state.hands,
  action = 'The draw pile is empty: the smallest hand wins'
): GameState {
  const comparison = compareHandsBySmallest(hands.player1, hands.player2);
  const winner: PlayerId = comparison <= 0 ? 'player1' : 'player2';

  return {
    ...state,
    hands,
    winner,
    message: `${getPlayerName(winner, state.mode)} has the smallest hand and wins!`,
    lastAction: action,
    waitingForHandoff: false,
    handoffPlayer: null,
  };
}

const TANZANIA_SCENERY = [
  {
    name: 'Serengeti',
    url: 'https://images.pexels.com/photos/18000394/pexels-photo-18000394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1920',
  },
  {
    name: 'Mount Kilimanjaro',
    url: 'https://images.pexels.com/photos/15994035/pexels-photo-15994035.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1920',
  },
  {
    name: 'Visit Zanzibar',
    url: 'https://images.pexels.com/photos/30312987/pexels-photo-30312987.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1920',
  },
] as const;

function TanzaniaScenery({
  activeIndex = 0,
  subtle = false,
  showLabel = false,
}: {
  activeIndex?: number;
  subtle?: boolean;
  showLabel?: boolean;
}) {
  const safeIndex = ((activeIndex % TANZANIA_SCENERY.length) + TANZANIA_SCENERY.length) % TANZANIA_SCENERY.length;
  const active = TANZANIA_SCENERY[safeIndex];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Cross-fading single-scenery backgrounds - now vivid and obvious */}
      {TANZANIA_SCENERY.map((place, i) => (
        <div
          key={place.name}
          className="absolute inset-0 bg-cover bg-center transition-all duration-[1200ms] ease-in-out"
          style={{
            backgroundImage: `url('${place.url}')`,
            opacity: i === safeIndex ? 1 : 0,
            transform: i === safeIndex ? 'scale(1)' : 'scale(1.08)',
          }}
        />
      ))}

      {/* Lighter dim layers so scenery stays clearly visible during play */}
      <div className={`absolute inset-0 ${subtle ? 'bg-slate-950/35' : 'bg-slate-950/25'}`} />
      <div className={`absolute inset-0 ${subtle ? 'bg-gradient-to-b from-slate-950/50 via-slate-950/20 to-slate-950/75' : 'bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/70'}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {showLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full border border-amber-300/30 bg-black/55 px-4 py-1.5 shadow-xl backdrop-blur-md">
          <span className="text-[11px] font-black tracking-widest text-amber-200 uppercase flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {active.name}
          </span>
        </div>
      )}
    </div>
  );
}

function createInitialState(mode: GameMode): GameState {
  let deck = shuffleDeck(createDeck());

  const d1 = dealCards(deck, 5);
  const hand1 = d1.hand;
  deck = d1.remaining;

  const d2 = dealCards(deck, 5);
  const hand2 = d2.hand;
  deck = d2.remaining;

  let starter: Card;
  let attempts = 0;
  do {
    const dealt = dealCards(deck, 1);
    starter = dealt.hand[0];
    deck = dealt.remaining;
    attempts++;
  } while (
    attempts < 12 &&
    deck.length > 0 &&
    (starter.rank === '2' || starter.rank === '7' || starter.rank === 'Joker')
  );

  const first: PlayerId = 'player1';

  return {
    mode,
    deck,
    discardPile: [starter],
    hands: { player1: hand1, player2: hand2 },
    currentPlayer: first,
    message: turnMessage(getPlayerName(first, mode)),
    winner: null,
    gameStarted: true,
    lastAction: null,
    pendingDraw: 0,
    penaltyType: null,
    pendingSkip: false,
    // PvP starts with handoff so P2 doesn't peek at P1
    waitingForHandoff: mode === 'pvp',
    handoffPlayer: mode === 'pvp' ? first : null,
  };
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [networkPending, setNetworkPending] = useState(false);
  const [networkRole, setNetworkRole] = useState<NetworkRole | null>(null);
  const [lobbyView, setLobbyView] = useState<LobbyView | null>(null);
  const [lobbyCode, setLobbyCode] = useState('');
  const [lobbyStatus, setLobbyStatus] = useState('');
  const [cardTheme, setCardTheme] = useState<CardTheme>('tanzania');
  const [showZanzibarGame, setShowZanzibarGame] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(() => localStorage.getItem('tanzania-sound-muted') === 'true');
  const [bgIndex, setBgIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('tanzania-bg-index');
      const n = Number(saved);
      if (Number.isFinite(n)) return ((n % TANZANIA_SCENERY.length) + TANZANIA_SCENERY.length) % TANZANIA_SCENERY.length;
    } catch {}
    return 0;
  });
  const cpuTimer = useRef<number | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const networkActionHandler = useRef<((message: NetworkMessage) => void) | null>(null);
  const previousGame = useRef<GameState | null>(null);

  const topCard = game?.discardPile[game.discardPile.length - 1] ?? null;

  const selectedCard = useMemo(() => {
    if (!game || !selectedCardId) return null;
    return game.hands[game.currentPlayer].find((c) => c.id === selectedCardId) ?? null;
  }, [game, selectedCardId]);

  const selectionPlayable = useMemo(() => {
    if (!game || !selectedCard || !topCard) return false;
    return canPlayCard(selectedCard, topCard, game.pendingDraw, game.penaltyType, game.pendingSkip);
  }, [game, selectedCard, topCard]);

  const selectedFinishingPair = useMemo(() => {
    if (!game) return false;
    return canFinishWithPair(game.hands[game.currentPlayer], selectedCard);
  }, [game, selectedCard]);

  useEffect(() => {
    setSoundMuted(soundMuted);
    localStorage.setItem('tanzania-sound-muted', String(soundMuted));
  }, [soundMuted]);

  useEffect(() => {
    try {
      localStorage.setItem('tanzania-bg-index', String(bgIndex));
    } catch {}
  }, [bgIndex]);

  useEffect(() => {
    const previous = previousGame.current;
    if (game && previous && game !== previous) {
      if (!previous.winner && game.winner) {
        playGameSound('win');
      } else if (game.discardPile.length > previous.discardPile.length) {
        const played = game.discardPile[game.discardPile.length - 1];
        playGameSound(played.rank === '2' || played.rank === '7' || played.rank === 'Joker' ? 'special' : 'play');
      } else if (game.deck.length < previous.deck.length) {
        playGameSound('draw');
      } else if (game.currentPlayer !== previous.currentPlayer) {
        playGameSound('turn');
      }
    }
    previousGame.current = game;
  }, [game]);

  const clearCpuTimer = () => {
    if (cpuTimer.current !== null) {
      window.clearTimeout(cpuTimer.current);
      cpuTimer.current = null;
    }
  };

  const closeNetwork = useCallback(() => {
    dataChannel.current?.close();
    peerConnection.current?.close();
    dataChannel.current = null;
    peerConnection.current = null;
    setNetworkRole(null);
    setNetworkPending(false);
    setLobbyView(null);
    setLobbyCode('');
    setLobbyStatus('');
  }, []);

  const prepareDataChannel = useCallback((channel: RTCDataChannel, role: NetworkRole) => {
    dataChannel.current = channel;

    channel.onopen = () => {
      setLobbyStatus('');
      setNetworkRole(role);
      if (role === 'host') {
        setGame(createInitialState('online'));
        setLobbyView(null);
      } else {
        setLobbyView('connecting');
      }
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as NetworkMessage;
        if (message.type === 'state' && role === 'guest') {
          setCardTheme(message.theme);
          setGame(message.state);
          setNetworkPending(false);
          setLobbyView(null);
        } else if (message.type === 'action' && role === 'host') {
          networkActionHandler.current?.(message);
        }
      } catch {
        setLobbyStatus('A connection message could not be read. Try creating the room again.');
      }
    };

    channel.onclose = () => {
      setGame((current) => current ? { ...current, message: 'The other player disconnected.' } : current);
    };
  }, []);

  const createPeerConnection = useCallback(() => {
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === 'failed') {
        setLobbyStatus('Connection failed. Check both devices are online, then create a new room.');
      }
    };
    peerConnection.current = connection;
    return connection;
  }, []);

  const createOnlineRoom = useCallback(async () => {
    try {
      setLobbyStatus('');
      const connection = createPeerConnection();
      const channel = connection.createDataChannel('tanzania-game');
      prepareDataChannel(channel, 'host');
      await connection.setLocalDescription(await connection.createOffer());
      await waitForIceCandidates(connection);
      setLobbyCode(encodeDescription(connection.localDescription!));
      setLobbyView('host-offer');
    } catch {
      setLobbyStatus('Could not create the invite. Please try again.');
    }
  }, [createPeerConnection, prepareDataChannel]);

  const joinOnlineRoom = useCallback(async (offerCode: string) => {
    try {
      setLobbyStatus('');
      const connection = createPeerConnection();
      connection.ondatachannel = (event) => prepareDataChannel(event.channel, 'guest');
      await connection.setRemoteDescription(decodeDescription(offerCode));
      await connection.setLocalDescription(await connection.createAnswer());
      await waitForIceCandidates(connection);
      setLobbyCode(encodeDescription(connection.localDescription!));
      setLobbyView('join-answer');
    } catch {
      setLobbyStatus('That invite is invalid or expired. Ask the host for a new invite.');
    }
  }, [createPeerConnection, prepareDataChannel]);

  const acceptOnlineAnswer = useCallback(async (answerCode: string) => {
    try {
      if (!peerConnection.current) throw new Error('Missing connection');
      setLobbyStatus('');
      setLobbyView('connecting');
      await peerConnection.current.setRemoteDescription(decodeDescription(answerCode));
    } catch {
      setLobbyView('host-answer');
      setLobbyStatus('That answer is invalid. Copy the complete answer from Player 2.');
    }
  }, []);

  const startGame = useCallback((m: GameMode, theme: CardTheme = cardTheme) => {
    clearCpuTimer();
    setCpuThinking(false);
    playGameSound('turn');
    setCardTheme(theme);
    // Rotate to the next Tanzania destination each time a new game starts
    setBgIndex((prev) => {
      const next = (prev + 1) % TANZANIA_SCENERY.length;
      return next;
    });
    if (m === 'online') {
      closeNetwork();
      setGame(null);
      setLobbyView('choose');
    } else {
      setGame(createInitialState(m));
    }
    setSelectedCardId(null);
  }, [cardTheme, closeNetwork]);

  const backToMenu = useCallback(() => {
    clearCpuTimer();
    setCpuThinking(false);
    closeNetwork();
    setShowZanzibarGame(false);
    setGame(null);
    setSelectedCardId(null);
  }, [closeNetwork]);

  const revealHand = useCallback(() => {
    setGame((g) =>
      g
        ? {
            ...g,
            waitingForHandoff: false,
            handoffPlayer: null,
            message: g.pendingSkip
              ? `${getPlayerName(g.currentPlayer, g.mode)}: play a 7 or accept the skip`
              : g.pendingDraw > 0
                ? `${getPlayerName(g.currentPlayer, g.mode)} must draw ${g.pendingDraw} or bounce with a ${g.penaltyType}`
                : turnMessage(getPlayerName(g.currentPlayer, g.mode)),
          }
        : g
    );
    setSelectedCardId(null);
  }, []);

  /** Apply a played card and resolve specials / turn advance. */
  const applyPlay = useCallback(
    (state: GameState, player: PlayerId, card: Card): GameState => {
      const finishingPair = canFinishWithPair(state.hands[player], card);
      const playedCards = finishingPair ? state.hands[player] : [card];
      const playedIds = new Set(playedCards.map((playedCard) => playedCard.id));
      const newHand = state.hands[player].filter((handCard) => !playedIds.has(handCard.id));
      const newDiscard = [...state.discardPile, ...playedCards];
      const effect = getSpecialEffect(card);

      if (newHand.length === 0) {
        return {
          ...state,
          hands: { ...state.hands, [player]: newHand },
          discardPile: newDiscard,
          winner: player,
          message: finishingPair
            ? `${getPlayerName(player, state.mode)} played a matching pair of ${card.rank}s and wins!`
            : `${getPlayerName(player, state.mode)} wins!`,
          lastAction: finishingPair ? `Matching pair finish: two ${card.rank}s` : 'Victory!',
          waitingForHandoff: false,
          handoffPlayer: null,
        };
      }

      const next = opposite(player);
      let nextPlayer = next;
      let lastAction: string | null = null;
      const hands = {
        ...state.hands,
        [player]: newHand,
        [next]: [...state.hands[next]],
      };
      let newPendingDraw = state.pendingDraw;
      let newPenaltyType = state.penaltyType;
      let newPendingSkip = false;

      if (effect === 'draw2') {
        newPendingDraw += 2;
        newPenaltyType = '2';
        lastAction = `+2! Penalty is now ${newPendingDraw}`;
      } else if (effect === 'draw5') {
        newPendingDraw += 5;
        newPenaltyType = 'Joker';
        lastAction = `Joker! Penalty is now ${newPendingDraw}`;
      } else if (effect === 'skip') {
        const canCounter = hands[next].some((handCard) => handCard.rank === '7');
        if (canCounter) {
          newPendingSkip = true;
          lastAction = `7 played! ${getPlayerName(next, state.mode)} can counter with another 7`;
        } else {
          lastAction = `Skip! ${getPlayerName(next, state.mode)} has no 7 and is skipped`;
          nextPlayer = player;
        }
      } else {
        lastAction = `${getPlayerName(player, state.mode)} played ${card.rank}`;
      }

      if (newHand.length === 1) {
        lastAction = `ONE CARD: ${getPlayerName(player, state.mode)} has one card left!`;
      }

      const needsHandoff = state.mode === 'pvp' && nextPlayer !== player;

      return {
        ...state,
        hands,
        discardPile: newDiscard,
        currentPlayer: nextPlayer,
        message: newPendingSkip
          ? `${getPlayerName(nextPlayer, state.mode)}: play a 7 or accept the skip`
          : newPendingDraw > 0
            ? `${getPlayerName(nextPlayer, state.mode)} must draw ${newPendingDraw} or bounce with a ${newPenaltyType}`
            : turnMessage(getPlayerName(nextPlayer, state.mode)),
        lastAction,
        pendingDraw: newPendingDraw,
        penaltyType: newPenaltyType,
        pendingSkip: newPendingSkip,
        waitingForHandoff: needsHandoff,
        handoffPlayer: needsHandoff ? nextPlayer : null,
      };
    },
    []
  );

  const applyDraw = useCallback((state: GameState, player: PlayerId): GameState => {
    if (state.pendingSkip) {
      const next = opposite(player);
      const needsHandoff = state.mode === 'pvp';
      return {
        ...state,
        currentPlayer: next,
        message: turnMessage(getPlayerName(next, state.mode)),
        lastAction: `${getPlayerName(player, state.mode)} accepted the skip`,
        pendingSkip: false,
        waitingForHandoff: needsHandoff,
        handoffPlayer: needsHandoff ? next : null,
      };
    }

    if (state.deck.length === 0) {
      return finishBySmallestHand(state);
    }

    const drawCount = state.pendingDraw > 0 ? state.pendingDraw : 1;
    const r = drawFromDeck(state.deck, state.discardPile, drawCount);

    if (r.drawn.length === 0) {
      return finishBySmallestHand(state);
    }

    const newHand = [...state.hands[player], ...r.drawn];
    const newHands = { ...state.hands, [player]: newHand };

    // Drawing the last available card ends the round immediately, including after +2 or +5.
    if (r.newDeck.length === 0) {
      const drawAction = state.pendingDraw > 0
        ? `${getPlayerName(player, state.mode)} drew ${r.drawn.length} penalty cards. The draw pile is empty.`
        : `${getPlayerName(player, state.mode)} drew the final card.`;
      return finishBySmallestHand(
        { ...state, deck: r.newDeck, discardPile: r.newDiscard },
        newHands,
        drawAction
      );
    }

    const next = opposite(player);
    const needsHandoff = state.mode === 'pvp';

    return {
      ...state,
      deck: r.newDeck,
      discardPile: r.newDiscard,
      hands: newHands,
      currentPlayer: next,
      message: turnMessage(getPlayerName(next, state.mode)),
      lastAction: state.pendingDraw > 0
        ? `${getPlayerName(player, state.mode)} drew ${drawCount} penalty cards`
        : `${getPlayerName(player, state.mode)} drew a card`,
      pendingDraw: 0,
      penaltyType: null,
      pendingSkip: false,
      waitingForHandoff: needsHandoff,
      handoffPlayer: needsHandoff ? next : null,
    };
  }, []);

  useEffect(() => {
    networkActionHandler.current = (message) => {
      if (message.type !== 'action') return;
      setGame((current) => {
        if (!current || current.mode !== 'online') return current;
        if (message.action === 'restart') return createInitialState('online');
        if (current.winner || current.currentPlayer !== 'player2') return current;

        if (message.action === 'draw') return applyDraw(current, 'player2');
        if (message.action !== 'play') return current;
        const card = current.hands.player2.find((candidate) => candidate.id === message.cardId);
        const top = current.discardPile[current.discardPile.length - 1] ?? null;
        if (!card || !canPlayCard(card, top, current.pendingDraw, current.penaltyType, current.pendingSkip)) {
          return current;
        }
        return applyPlay(current, 'player2', card);
      });
    };
  }, [applyDraw, applyPlay]);

  useEffect(() => {
    if (networkRole !== 'host' || !game || game.mode !== 'online') return;
    if (dataChannel.current?.readyState !== 'open') return;
    const message: NetworkMessage = { type: 'state', state: stateForGuest(game), theme: cardTheme };
    dataChannel.current.send(JSON.stringify(message));
  }, [cardTheme, game, networkRole]);

  const sendNetworkAction = useCallback((message: NetworkMessage) => {
    if (dataChannel.current?.readyState !== 'open') return false;
    dataChannel.current.send(JSON.stringify(message));
    setNetworkPending(true);
    return true;
  }, []);

  const handleSelectCard = useCallback(
    (cardId: string) => {
      if (!game || game.winner || game.waitingForHandoff) return;
      if (game.mode === 'cpu' && game.currentPlayer === 'player2') return;
      playGameSound('select');
      setSelectedCardId((prev) => (prev === cardId ? null : cardId));
    },
    [game]
  );

  const handlePlaySelected = useCallback(() => {
    if (!game || game.winner || game.waitingForHandoff || !selectedCard || !topCard) return;
    if (game.mode === 'cpu' && game.currentPlayer === 'player2') return;
    if (!canPlayCard(selectedCard, topCard, game.pendingDraw, game.penaltyType, game.pendingSkip)) return;

    if (game.mode === 'online' && networkRole === 'guest') {
      sendNetworkAction({ type: 'action', action: 'play', cardId: selectedCard.id });
      setSelectedCardId(null);
      return;
    }

    const next = applyPlay(game, game.currentPlayer, selectedCard);
    setGame(next);
    setSelectedCardId(null);
  }, [game, selectedCard, topCard, applyPlay, networkRole, sendNetworkAction]);

  const handleDraw = useCallback(() => {
    if (!game || game.winner || game.waitingForHandoff) return;
    if (game.mode === 'cpu' && game.currentPlayer === 'player2') return;

    if (game.mode === 'online' && networkRole === 'guest') {
      sendNetworkAction({ type: 'action', action: 'draw' });
      setSelectedCardId(null);
      return;
    }

    setGame(applyDraw(game, game.currentPlayer));
    setSelectedCardId(null);
  }, [game, applyDraw, networkRole, sendNetworkAction]);

  // CPU turn
  useEffect(() => {
    if (!game || game.winner) return;
    if (game.mode !== 'cpu') return;
    if (game.currentPlayer !== 'player2') return;
    if (game.waitingForHandoff) return;

    setCpuThinking(true);
    clearCpuTimer();

    cpuTimer.current = window.setTimeout(() => {
      setGame((current) => {
        if (!current || current.winner || current.currentPlayer !== 'player2') {
          return current;
        }
        const top = current.discardPile[current.discardPile.length - 1] ?? null;
        const choice = chooseCpuCard(
          current.hands.player2,
          top,
          current.hands.player1.length,
          current.pendingDraw,
          current.penaltyType,
          current.pendingSkip
        );

        if (choice) return applyPlay(current, 'player2', choice);
        return applyDraw(current, 'player2');
      });
      setCpuThinking(false);
      setSelectedCardId(null);
    }, 900 + Math.random() * 700);

    return () => clearCpuTimer();
  }, [
    game?.currentPlayer,
    game?.mode,
    game?.winner,
    game?.waitingForHandoff,
    game?.discardPile.length,
    game?.hands.player2.length,
    applyPlay,
    applyDraw,
  ]);

  if (lobbyView) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950">
        <TanzaniaScenery activeIndex={bgIndex} subtle />
        <NetworkLobby
          view={lobbyView}
          code={lobbyCode}
          status={lobbyStatus}
          onCreate={createOnlineRoom}
          onJoin={() => { setLobbyStatus(''); setLobbyView('join-offer'); }}
          onAcceptOffer={joinOnlineRoom}
          onAcceptAnswer={acceptOnlineAnswer}
          onContinueHost={() => { setLobbyStatus(''); setLobbyView('host-answer'); }}
          onCancel={backToMenu}
        />
      </div>
    );
  }

  if (showZanzibarGame) {
    return <ZanzibarGame onBack={backToMenu} />;
  }

  // —— Start screen ——
  if (!game || !game.gameStarted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950">
        <TanzaniaScenery activeIndex={bgIndex} />
        <StartScreen
          onStart={startGame}
          onOpenZanzibar={() => {
            setCardTheme('zanzibar');
            setBgIndex(2);
            setShowZanzibarGame(true);
          }}
          activeIndex={bgIndex}
        />
      </div>
    );
  }

  const isCpu = game.mode === 'cpu';
  const isOnline = game.mode === 'online';
  const localNetworkPlayer: PlayerId | null = isOnline
    ? networkRole === 'guest' ? 'player2' : 'player1'
    : null;
  const humanCanAct =
    !game.winner &&
    !game.waitingForHandoff &&
    !cpuThinking &&
    !networkPending &&
    !(isCpu && game.currentPlayer === 'player2') &&
    (!isOnline || game.currentPlayer === localNetworkPlayer);

  // In PvP, only show the current player's cards face-up (after handoff)
  // In CPU, always show player1, hide player2
  const showP1Face = isOnline
    ? localNetworkPlayer === 'player1'
    : isCpu || (!game.waitingForHandoff && game.currentPlayer === 'player1') || !!game.winner;
  const showP2Face =
    isOnline
      ? localNetworkPlayer === 'player2'
      : !isCpu && ((!game.waitingForHandoff && game.currentPlayer === 'player2') || !!game.winner);

  const p1IsCurrent =
    game.currentPlayer === 'player1' &&
    !game.winner &&
    !game.waitingForHandoff &&
    (!isOnline || localNetworkPlayer === 'player1');
  const p2IsCurrent =
    game.currentPlayer === 'player2' &&
    !game.winner &&
    !game.waitingForHandoff &&
    !cpuThinking &&
    (!isOnline || localNetworkPlayer === 'player2');

  const restartCurrentGame = () => {
    // Every restart also cycles the scenery so each new game feels fresh
    setBgIndex((prev) => (prev + 1) % TANZANIA_SCENERY.length);
    if (!isOnline) {
      // startGame already rotates, but we rotated here to avoid double-rotate;
      // so we set flag to not rotate again in startGame when called from here?
      // For simplicity, just create state directly for local games too.
      if (game) {
        setGame(createInitialState(game.mode));
      }
    } else if (networkRole === 'host') {
      setGame(createInitialState('online'));
    } else {
      sendNetworkAction({ type: 'action', action: 'restart' });
    }
    setSelectedCardId(null);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950">
      {/* Rotating Tanzania backdrop: Serengeti → Kilimanjaro → Zanzibar, changes each new game */}
      <div className="fixed inset-0"><TanzaniaScenery activeIndex={bgIndex} subtle showLabel /></div>

      <div className="relative z-10 max-w-5xl mx-auto px-2.5 sm:px-5 py-2.5 sm:py-5 flex flex-col min-h-screen gap-2 sm:gap-3">
        {/* Header */}
        <header className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">🇹🇿</span>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm sm:text-lg tracking-tight leading-tight truncate">
                LAST CARD
              </h1>
              <p className="text-white/40 text-[11px] sm:text-xs">
                {cardTheme === 'zanzibar' ? 'Zanzibar Card' : 'Tanzania Card'}
                {' · '}
                {isCpu ? 'You vs Computer' : isOnline ? 'Private peer-to-peer match' : '2 Players · Pass & Play'}
                {' · '}♠ ♥ ♦ ♣
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundMutedState((muted) => !muted)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={soundMuted ? 'Turn sound on' : 'Mute sound'}
              title={soundMuted ? 'Turn sound on' : 'Mute sound'}
            >
              {soundMuted ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" strokeLinejoin="round" />
                  <path d="m16 9 5 5m0-5-5 5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" strokeLinejoin="round" />
                  <path d="M15 9.3a4 4 0 0 1 0 5.4M18 6.5a8 8 0 0 1 0 11" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={restartCurrentGame}
              className="text-[11px] sm:text-xs font-medium text-amber-100/80 hover:text-amber-50 bg-white/5 hover:bg-white/10 border border-white/10 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={backToMenu}
              className="text-[11px] sm:text-xs font-medium text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Menu
            </button>
          </div>
        </header>

        {/* Opponent / Player 2 */}
        <PlayerHand
          playerId="player2"
          hand={game.hands.player2}
          mode={game.mode}
          isCurrent={p2IsCurrent}
          isWinner={game.winner === 'player2'}
          topCard={topCard}
          pendingDraw={game.pendingDraw}
          penaltyType={game.penaltyType}
          pendingSkip={game.pendingSkip}
          cardTheme={cardTheme}
          selectedCardId={
            game.currentPlayer === 'player2' && showP2Face ? selectedCardId : null
          }
          onSelectCard={handleSelectCard}
          faceDown={!showP2Face}
          title={isCpu ? 'Computer' : isOnline ? localNetworkPlayer === 'player2' ? 'You' : 'Opponent' : undefined}
          compact={isCpu}
        />

        {/* Center table */}
        <div className="flex-1 flex items-center justify-center py-1">
          <div
            className="w-full rounded-2xl sm:rounded-3xl border border-white/15 px-2.5 sm:px-5 py-3 sm:py-5 shadow-2xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(14, 46, 38, 0.98) 0%, rgba(6, 16, 28, 0.98) 70%)',
            }}
          >
            <GameBoard
              topCard={topCard}
              deckCount={game.deck.length}
              message={game.message}
              lastAction={game.lastAction}
              canDraw={humanCanAct}
              canAct={humanCanAct}
              onDraw={handleDraw}
              onPlaySelected={handlePlaySelected}
              hasSelection={!!selectedCard}
              selectionPlayable={selectionPlayable}
              canFinishPair={selectedFinishingPair}
              isCpuThinking={cpuThinking}
              pendingDraw={game.pendingDraw}
              pendingSkip={game.pendingSkip}
              cardTheme={cardTheme}
            />
          </div>
        </div>

        {/* Player 1 */}
        <PlayerHand
          playerId="player1"
          hand={game.hands.player1}
          mode={game.mode}
          isCurrent={p1IsCurrent}
          isWinner={game.winner === 'player1'}
          topCard={topCard}
          pendingDraw={game.pendingDraw}
          penaltyType={game.penaltyType}
          pendingSkip={game.pendingSkip}
          cardTheme={cardTheme}
          selectedCardId={
            game.currentPlayer === 'player1' && showP1Face ? selectedCardId : null
          }
          onSelectCard={handleSelectCard}
          faceDown={!showP1Face}
          title={isCpu ? 'You' : isOnline ? localNetworkPlayer === 'player1' ? 'You' : 'Opponent' : undefined}
        />

        <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pb-1 text-[10px] sm:text-xs text-white/35">
          <span><span className="text-orange-400 font-bold">2</span> +2 draw</span>
          <span className="text-white/15">·</span>
          <span><span className="text-sky-400 font-bold">7</span> skip or counter with 7</span>
          <span className="text-white/15">·</span>
          <span><span className="text-purple-400 font-bold">Joker</span> +5 draw</span>
          <span className="text-white/15">·</span>
          <span>Match suit or rank</span>
          <span className="text-white/15">·</span>
          <span>Matching final pair wins</span>
          <span className="text-white/15">·</span>
          <span>Smallest hand wins when deck ends</span>
        </footer>
      </div>

      {/* PvP privacy handoff */}
      {game.waitingForHandoff && game.handoffPlayer && !game.winner && (
        <HandoffScreen
          player={game.handoffPlayer}
          mode={game.mode}
          lastAction={game.lastAction}
          onReveal={revealHand}
        />
      )}

      {game.winner && (
        <WinnerModal
          winner={game.winner}
          mode={game.mode}
          onPlayAgain={restartCurrentGame}
          onMainMenu={backToMenu}
        />
      )}
    </div>
  );
}
