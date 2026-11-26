import {
  Card,
  RANK_ORDER,
  RANKS,
  POINT_VALUES,
  SUITS,
  Suit,
  Rank,
} from './types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cardPoints(card: Card): number {
  return POINT_VALUES[card.rank];
}

export function handPoints(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + cardPoints(c), 0);
}

/** Compare two cards for trick-taking. Returns positive if a beats b. */
export function compareCards(
  a: Card,
  b: Card,
  leadSuit: Suit,
  trump: Suit
): number {
  const aTrump = a.suit === trump;
  const bTrump = b.suit === trump;
  const aLead = a.suit === leadSuit;
  const bLead = b.suit === leadSuit;

  if (aTrump && !bTrump) return 1;
  if (!aTrump && bTrump) return -1;
  if (aTrump && bTrump) return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  if (aLead && !bLead) return 1;
  if (!aLead && bLead) return -1;
  if (aLead && bLead) return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  // Neither follows lead nor trump — neither wins over the other in isolation
  return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
}

export function sortHand(hand: Card[], trump: Suit | null): Card[] {
  return [...hand].sort((a, b) => {
    if (trump) {
      if (a.suit === trump && b.suit !== trump) return -1;
      if (a.suit !== trump && b.suit === trump) return 1;
    }
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
    return RANK_ORDER[b.rank] - RANK_ORDER[a.rank];
  });
}

/** Any card in hand may be played — no follow-suit requirement. */
export function getLegalPlays(
  hand: Card[],
  _leadSuit: Suit | null,
  _trump: Suit | null
): Card[] {
  return hand;
}

export function rankLabel(rank: Rank): string {
  return rank;
}
