import type { Card, Rank, Suit } from '../types/game';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function suitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `card-${id++}`,
        suit,
        rank,
        color: suitColor(suit),
      });
    }
  }

  deck.push({ id: `card-${id++}`, suit: 'joker', rank: 'Joker', color: 'joker' });
  deck.push({ id: `card-${id++}`, suit: 'joker', rank: 'Joker', color: 'joker' });

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(
  deck: Card[],
  count: number
): { hand: Card[]; remaining: Card[] } {
  return {
    hand: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

export function getSpecialEffect(card: Card): 'draw2' | 'skip' | 'draw5' | null {
  if (card.rank === '2') return 'draw2';
  if (card.rank === '7') return 'skip';
  if (card.rank === 'Joker') return 'draw5';
  return null;
}

export function canPlayCard(
  card: Card,
  topCard: Card | null,
  pendingDraw: number = 0,
  penaltyType: Rank | null = null,
  pendingSkip: boolean = false
): boolean {
  if (pendingSkip) {
    return card.rank === '7';
  }
  if (pendingDraw > 0) {
    return card.rank === penaltyType;
  }
  if (!topCard) return true;
  if (card.rank === 'Joker' || topCard.rank === 'Joker') return true;
  return card.suit === topCard.suit || card.rank === topCard.rank;
}

export function drawFromDeck(
  deck: Card[],
  discardPile: Card[],
  count: number
): { drawn: Card[]; newDeck: Card[]; newDiscard: Card[] } {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) break;
    drawn.push(currentDeck[0]);
    currentDeck = currentDeck.slice(1);
  }

  return { drawn, newDeck: currentDeck, newDiscard: currentDiscard };
}

/** Rank strength for AI decisions (higher = prefer to hold / save) */
function rankValue(rank: Rank): number {
  const map: Record<Rank, number> = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    '10': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2,
    Joker: 15,
  };
  return map[rank];
}

/**
 * Simple AI: prefer playing specials when opponent has few cards,
 * otherwise dump lowest non-special matching cards first.
 */
export function chooseCpuCard(
  hand: Card[],
  topCard: Card | null,
  opponentCount: number,
  pendingDraw: number = 0,
  penaltyType: Rank | null = null,
  pendingSkip: boolean = false
): Card | null {
  const playable = hand.filter((c) =>
    canPlayCard(c, topCard, pendingDraw, penaltyType, pendingSkip)
  );
  if (playable.length === 0) return null;

  if (pendingSkip || pendingDraw > 0) return playable[0];

  const specials = playable.filter((c) => getSpecialEffect(c) !== null);
  const normals = playable.filter((c) => getSpecialEffect(c) === null);

  // If opponent is close to winning, hit them with specials
  if (opponentCount <= 2 && specials.length > 0) {
    const joker = specials.find((c) => c.rank === 'Joker');
    if (joker && opponentCount <= 1) return joker;
    const draw2 = specials.find((c) => c.rank === '2');
    if (draw2) return draw2;
    const skip = specials.find((c) => c.rank === '7');
    if (skip) return skip;
    return specials[0];
  }

  // Prefer normal cards that leave the computer with the strongest follow-up suit.
  if (normals.length > 0) {
    const strategicScore = (candidate: Card) => {
      const remaining = hand.filter((card) => card.id !== candidate.id);
      const suitFollowUps = remaining.filter((card) => card.suit === candidate.suit).length;
      const rankFollowUps = remaining.filter((card) => card.rank === candidate.rank).length;
      return suitFollowUps * 5 + rankFollowUps * 3 - rankValue(candidate.rank) * 0.08;
    };
    return [...normals].sort((a, b) => strategicScore(b) - strategicScore(a))[0];
  }

  // Only specials left — play weakest special first (7, then 2, then Joker)
  return [...specials].sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
}
