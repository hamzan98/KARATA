import {
  Card,
  GameState,
  Player,
  GameMode,
  Suit,
  TrickPlay,
  SUITS,
} from './types';
import {
  compareCards,
  createDeck,
  getLegalPlays,
  handPoints,
  shuffleDeck,
  sortHand,
} from './deck';

const PLAYER_NAMES = ['You', 'Amira', 'Karim', 'Sofia'];

export function createInitialState(
  numPlayers = 4,
  mode: GameMode = numPlayers === 2 ? 'solo-2' : 'solo-4',
  roomCode?: string
): GameState {
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    name: PLAYER_NAMES[i] ?? `Player ${i + 1}`,
    isHuman: i === 0,
    team: mode === 'teams-2v2' || mode === 'online-2v2' ? ((i % 2) as 0 | 1) : undefined,
    hand: [],
    wonCards: [],
    score: 0,
  }));

  return {
    phase: 'menu',
    mode,
    roomCode,
    players,
    teamScores: [0, 0],
    deck: [],
    trump: null,
    currentPlayerIndex: 0,
    leadPlayerIndex: 0,
    trick: [],
    leadSuit: null,
    message: 'Welcome to Zanzibar!',
    lastTrickWinner: null,
    round: 0,
    dealerIndex: 0,
    selectedCardId: null,
    animating: false,
  };
}

export function startNewGame(state: GameState): GameState {
  const players = state.players.map((p) => ({
    ...p,
    hand: [],
    wonCards: [],
    score: 0,
  }));

  return startRound({
    ...state,
    mode: state.mode,
    roomCode: state.roomCode,
    players,
    teamScores: [0, 0],
    phase: 'deal',
    trump: null,
    trick: [],
    leadSuit: null,
    lastTrickWinner: null,
    round: 0,
    dealerIndex: 0,
    selectedCardId: null,
    animating: false,
    message: 'Dealing cards…',
  });
}

export function startRound(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());
  const players = state.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    wonCards: [] as Card[],
  }));

  // Deal 3 cards each
  let idx = 0;
  for (let c = 0; c < 3; c++) {
    for (let p = 0; p < players.length; p++) {
      const playerIdx = (state.dealerIndex + 1 + p) % players.length;
      players[playerIdx].hand.push(deck[idx++]);
    }
  }

  const remaining = deck.slice(idx);
  const leadPlayerIndex = (state.dealerIndex + 1) % players.length;

  // Sort hands (no trump yet)
  for (const p of players) {
    p.hand = sortHand(p.hand, null);
  }

  return {
    ...state,
    players,
    deck: remaining,
    trump: null,
    currentPlayerIndex: leadPlayerIndex,
    leadPlayerIndex,
    trick: [],
    leadSuit: null,
    lastTrickWinner: null,
    round: state.round + 1,
    selectedCardId: null,
    animating: false,
    phase: 'choose-trump',
    message:
      players[leadPlayerIndex].isHuman
        ? 'Choose the trump suit (the color that beats all others).'
        : `${players[leadPlayerIndex].name} is choosing trump…`,
  };
}

export function chooseTrump(state: GameState, suit: Suit): GameState {
  const players = state.players.map((p) => ({
    ...p,
    hand: sortHand(p.hand, suit),
  }));

  return {
    ...state,
    players,
    trump: suit,
    phase: 'play',
    currentPlayerIndex: state.leadPlayerIndex,
    message: `Trump is ${suitLabel(suit)}. ${players[state.leadPlayerIndex].name} leads.`,
  };
}

function suitLabel(suit: Suit): string {
  const labels: Record<Suit, string> = {
    hearts: 'Hearts ♥',
    diamonds: 'Diamonds ♦',
    clubs: 'Clubs ♣',
    spades: 'Spades ♠',
  };
  return labels[suit];
}

/** AI chooses trump based on strongest suit in hand */
export function aiChooseTrump(state: GameState): Suit {
  const player = state.players[state.currentPlayerIndex];
  const suitStrength: Record<Suit, number> = {
    hearts: 0,
    diamonds: 0,
    clubs: 0,
    spades: 0,
  };

  for (const card of player.hand) {
    // Prefer suits with A, 7, K
    const bonus =
      card.rank === 'A' ? 20 : card.rank === '7' ? 15 : card.rank === 'K' ? 8 : 3;
    suitStrength[card.suit] += bonus + handPoints([card]);
  }

  let best: Suit = 'hearts';
  let bestScore = -1;
  for (const s of SUITS) {
    if (suitStrength[s] > bestScore) {
      bestScore = suitStrength[s];
      best = s;
    }
  }
  return best;
}

export function selectCard(state: GameState, cardId: string | null): GameState {
  return { ...state, selectedCardId: cardId };
}

export function playCard(state: GameState, cardId: string): GameState {
  if (state.phase !== 'play' || state.animating) return state;
  if (!state.trump) return state;

  const player = state.players[state.currentPlayerIndex];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return state;

  const legal = getLegalPlays(player.hand, state.leadSuit, state.trump);
  if (!legal.some((c) => c.id === cardId)) return state;

  const newHand = player.hand.filter((c) => c.id !== cardId);
  const players = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  const leadSuit = state.leadSuit ?? card.suit;
  const trick: TrickPlay[] = [...state.trick, { playerId: player.id, card }];

  const nextState: GameState = {
    ...state,
    players,
    trick,
    leadSuit,
    selectedCardId: null,
    message: `${player.name} played ${card.rank}${symbol(card.suit)}.`,
  };

  // Trick complete?
  if (trick.length === players.length) {
    return {
      ...nextState,
      phase: 'trick-resolve',
      animating: true,
      message: 'Resolving trick…',
    };
  }

  // Next player
  const nextIdx = (state.currentPlayerIndex + 1) % players.length;
  return {
    ...nextState,
    currentPlayerIndex: nextIdx,
    message: `${players[nextIdx].name}'s turn.`,
  };
}

function symbol(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export function resolveTrick(state: GameState): GameState {
  if (!state.trump || !state.leadSuit || state.trick.length === 0) return state;

  let winnerPlay = state.trick[0];
  for (let i = 1; i < state.trick.length; i++) {
    const play = state.trick[i];
    if (
      compareCards(play.card, winnerPlay.card, state.leadSuit, state.trump) > 0
    ) {
      winnerPlay = play;
    }
  }

  const wonCards = state.trick.map((t) => t.card);
  const players = state.players.map((p) =>
    p.id === winnerPlay.playerId
      ? { ...p, wonCards: [...p.wonCards, ...wonCards] }
      : p
  );

  const winner = players.find((p) => p.id === winnerPlay.playerId)!;
  const points = handPoints(wonCards);

  return {
    ...state,
    players,
    lastTrickWinner: winnerPlay.playerId,
    leadPlayerIndex: winnerPlay.playerId,
    currentPlayerIndex: winnerPlay.playerId,
    phase: 'draw',
    animating: false,
    message: `${winner.name} wins the trick (+${points} pts). Everyone draws…`,
    trick: [],
    leadSuit: null,
  };
}

/** After a trick, every player draws one card (if available). */
export function drawAfterTrick(state: GameState): GameState {
  let deck = [...state.deck];
  const players = state.players.map((p) => ({ ...p, hand: [...p.hand] }));

  // Winner draws first, then clockwise
  const order: number[] = [];
  for (let i = 0; i < players.length; i++) {
    order.push((state.leadPlayerIndex + i) % players.length);
  }

  const drew: string[] = [];
  for (const pi of order) {
    if (deck.length > 0) {
      const card = deck.shift()!;
      players[pi].hand.push(card);
      players[pi].hand = sortHand(players[pi].hand, state.trump);
      drew.push(players[pi].name);
    }
  }

  // Check if anyone still has cards
  const anyoneHasCards = players.some((p) => p.hand.length > 0);

  if (!anyoneHasCards) {
    return finishRound({
      ...state,
      players,
      deck,
      phase: 'round-end',
      message: 'Round over! Tallying points…',
    });
  }

  return {
    ...state,
    players,
    deck,
    phase: 'play',
    message:
      deck.length === 0 && drew.length === 0
        ? `${players[state.leadPlayerIndex].name} leads. (Stock empty)`
        : `Cards drawn. ${players[state.leadPlayerIndex].name} leads.`,
  };
}

export function finishRound(state: GameState): GameState {
  const players = state.players.map((p) => {
    const roundPts = handPoints(p.wonCards);
    return {
      ...p,
      score: p.score + roundPts,
    };
  });

  const isTeamGame = state.mode === 'teams-2v2' || state.mode === 'online-2v2';
  const teamRoundPoints: [number, number] = [0, 0];
  if (isTeamGame) {
    for (const p of players) {
      if (p.team !== undefined) teamRoundPoints[p.team] += handPoints(p.wonCards);
    }
  }
  const teamScores: [number, number] = [
    state.teamScores[0] + teamRoundPoints[0],
    state.teamScores[1] + teamRoundPoints[1],
  ];

  // Find round winner
  let bestId = 0;
  let bestPts = -1;
  for (const p of players) {
    const pts = handPoints(p.wonCards);
    if (pts > bestPts) {
      bestPts = pts;
      bestId = p.id;
    }
  }

  const winner = players.find((p) => p.id === bestId)!;
  const scores = players
    .map((p) => `${p.name}: ${p.score} (round ${handPoints(p.wonCards)})`)
    .join(' · ');

  // Game ends after several rounds or when someone reaches target
  const TARGET = 50;
  const someoneWon = isTeamGame
    ? teamScores.some((score) => score >= TARGET)
    : players.some((p) => p.score >= TARGET);

  if (someoneWon || state.round >= 5) {
    const champ = [...players].sort((a, b) => b.score - a.score)[0];
    const winningTeam = teamScores[0] >= teamScores[1] ? 0 : 1;
    return {
      ...state,
      players,
      teamScores,
      phase: 'game-over',
      message: isTeamGame
        ? `Team ${winningTeam === 0 ? 'A' : 'B'} wins with ${teamScores[winningTeam]} points!`
        : `${champ.name} wins the game with ${champ.score} points! ${scores}`,
    };
  }

  return {
    ...state,
    players,
    teamScores,
    phase: 'round-end',
    message: `${winner.name} took the round with ${bestPts} pts. ${scores}`,
    dealerIndex: (state.dealerIndex + 1) % players.length,
  };
}

/** AI card selection — simple heuristic */
export function aiChooseCard(state: GameState): string | null {
  const player = state.players[state.currentPlayerIndex];
  if (!state.trump) return null;

  const legal = getLegalPlays(player.hand, state.leadSuit, state.trump);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0].id;

  const trump = state.trump;
  const leadSuit = state.leadSuit;

  // Leading
  if (!leadSuit) {
    // Lead low non-trump if possible, else low trump
    const nonTrump = legal.filter((c) => c.suit !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : legal;
    const sorted = [...pool].sort(
      (a, b) => handPoints([a]) - handPoints([b]) || a.rank.localeCompare(b.rank)
    );
    // Prefer saving A and 7
    const low = sorted.find((c) => c.rank !== 'A' && c.rank !== '7') ?? sorted[0];
    return low.id;
  }

  // Find current winning card in trick
  let winning = state.trick[0];
  for (let i = 1; i < state.trick.length; i++) {
    if (
      compareCards(
        state.trick[i].card,
        winning.card,
        leadSuit,
        trump
      ) > 0
    ) {
      winning = state.trick[i];
    }
  }

  const canBeat = legal.filter(
    (c) => compareCards(c, winning.card, leadSuit, trump) > 0
  );

  const isLast = state.trick.length === state.players.length - 1;

  if (canBeat.length > 0) {
    // If last to play, win with cheapest card; else maybe save big ones
    const sorted = [...canBeat].sort((a, b) => {
      // Prefer non-point cards to win cheaply, but use trump sparingly
      const aCost =
        (a.suit === trump ? 5 : 0) + handPoints([a]) * (isLast ? 1 : 0.3);
      const bCost =
        (b.suit === trump ? 5 : 0) + handPoints([b]) * (isLast ? 1 : 0.3);
      return aCost - bCost;
    });
    return sorted[0].id;
  }

  // Can't win — dump lowest point card, prefer non-trump
  const sorted = [...legal].sort((a, b) => {
    const aPts = handPoints([a]) * 10 + (a.suit === trump ? 5 : 0);
    const bPts = handPoints([b]) * 10 + (b.suit === trump ? 5 : 0);
    return aPts - bPts;
  });
  return sorted[0].id;
}
