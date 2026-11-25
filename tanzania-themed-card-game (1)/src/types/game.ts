export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'Joker';

export interface Card {
  id: string;
  suit: Suit | 'joker';
  rank: Rank;
  /** red | black | joker */
  color: 'red' | 'black' | 'joker';
}

export type PlayerId = 'player1' | 'player2';

export type GameMode = 'pvp' | 'cpu' | 'online';

export interface GameState {
  mode: GameMode;
  deck: Card[];
  discardPile: Card[];
  hands: Record<PlayerId, Card[]>;
  currentPlayer: PlayerId;
  message: string;
  winner: PlayerId | null;
  gameStarted: boolean;
  lastAction: string | null;
  pendingDraw: number;
  penaltyType: Rank | null;
  /** A player facing a 7 may counter with another 7 or accept the skip. */
  pendingSkip: boolean;
  /** Hot-seat: waiting for next player to reveal hand */
  waitingForHandoff: boolean;
  handoffPlayer: PlayerId | null;
}

export const SUIT_META: Record<
  Suit | 'joker',
  { label: string; symbol: string; color: 'red' | 'black' | 'joker'; hex: string }
> = {
  spades: { label: 'Spades', symbol: '♠', color: 'black', hex: '#0f172a' },
  hearts: { label: 'Hearts', symbol: '♥', color: 'red', hex: '#dc2626' },
  diamonds: { label: 'Diamonds', symbol: '♦', color: 'red', hex: '#dc2626' },
  clubs: { label: 'Clubs', symbol: '♣', color: 'black', hex: '#0f172a' },
  joker: { label: 'Joker', symbol: '★', color: 'joker', hex: '#7c3aed' },
};

export function getPlayerName(id: PlayerId, mode: GameMode): string {
  if (mode === 'cpu') {
    return id === 'player1' ? 'You' : 'Computer';
  }
  if (mode === 'online') {
    return id === 'player1' ? 'Host' : 'Guest';
  }
  return id === 'player1' ? 'Player 1' : 'Player 2';
}
