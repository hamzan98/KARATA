export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '7' | 'K' | 'J' | 'Q' | '6' | '5' | '4' | '3';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  team?: 0 | 1;
  hand: Card[];
  wonCards: Card[];
  score: number;
}

export type GameMode = 'solo-2' | 'solo-4' | 'teams-2v2' | 'online-2v2';

export type Phase =
  | 'menu'
  | 'deal'
  | 'choose-trump'
  | 'play'
  | 'trick-resolve'
  | 'draw'
  | 'round-end'
  | 'game-over';

export interface TrickPlay {
  playerId: number;
  card: Card;
}

export interface GameState {
  phase: Phase;
  mode: GameMode;
  roomCode?: string;
  players: Player[];
  teamScores: [number, number];
  deck: Card[];
  trump: Suit | null;
  currentPlayerIndex: number;
  leadPlayerIndex: number;
  trick: TrickPlay[];
  leadSuit: Suit | null;
  message: string;
  lastTrickWinner: number | null;
  round: number;
  dealerIndex: number;
  selectedCardId: string | null;
  animating: boolean;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '7', 'K', 'J', 'Q', '6', '5', '4', '3'];

/** Higher number = stronger card */
export const RANK_ORDER: Record<Rank, number> = {
  A: 9,
  '7': 8,
  K: 7,
  J: 6,
  Q: 5,
  '6': 4,
  '5': 3,
  '4': 2,
  '3': 1,
};

export const POINT_VALUES: Record<Rank, number> = {
  A: 11,
  '7': 10,
  K: 4,
  J: 3,
  Q: 2,
  '6': 0,
  '5': 0,
  '4': 0,
  '3': 0,
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLOR: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

export const SUIT_LABEL: Record<Suit, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
};
