import type { Suit } from '../types/game';

interface SuitIconProps {
  suit: Suit | 'joker';
  className?: string;
  color?: string;
}

/** Crisp SVG suit symbols for playing cards */
export default function SuitIcon({ suit, className = 'w-6 h-6', color }: SuitIconProps) {
  const fill = color ?? 'currentColor';

  if (suit === 'spades') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill={fill} aria-hidden>
        <path d="M32 4C32 4 8 28 8 40c0 8 6 14 14 14 4 0 7.5-1.5 10-4v6c0 2-4 4-4 4h16s-4-2-4-4v-6c2.5 2.5 6 4 10 4 8 0 14-6 14-14C54 28 32 4 32 4z" />
      </svg>
    );
  }

  if (suit === 'hearts') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill={fill} aria-hidden>
        <path d="M32 58S6 40 6 22C6 12 14 6 22 6c5 0 8.5 2.5 10 6 1.5-3.5 5-6 10-6 8 0 16 6 16 16 0 18-26 36-26 36z" />
      </svg>
    );
  }

  if (suit === 'diamonds') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill={fill} aria-hidden>
        <path d="M32 2L58 32 32 62 6 32z" />
      </svg>
    );
  }

  if (suit === 'clubs') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill={fill} aria-hidden>
        <circle cx="32" cy="18" r="12" />
        <circle cx="16" cy="34" r="12" />
        <circle cx="48" cy="34" r="12" />
        <path d="M28 36c0 6-6 12-6 14h20c0-2-6-8-6-14h-8z" />
      </svg>
    );
  }

  // Joker star
  return (
    <svg viewBox="0 0 64 64" className={className} fill={fill} aria-hidden>
      <path d="M32 4l6.5 18.5H58l-15.5 12 6 18.5L32 42l-16.5 11 6-18.5L6 22.5h19.5z" />
    </svg>
  );
}
