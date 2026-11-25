import type { Card as CardType } from '../types/game';
import SuitIcon from './SuitIcon';

interface CardProps {
  card: CardType;
  theme?: 'tanzania' | 'zanzibar';
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const SIZES = {
  xs: { box: 'w-11 h-16', rank: 'text-[10px]', suit: 'w-2.5 h-2.5', center: 'w-5 h-5', badge: 'text-[7px]' },
  sm: { box: 'w-[4.25rem] h-[6.1rem]', rank: 'text-xs', suit: 'w-3 h-3', center: 'w-7 h-7', badge: 'text-[8px]' },
  md: { box: 'w-[4.8rem] h-[6.95rem] sm:w-[5.75rem] sm:h-[8.25rem]', rank: 'text-sm sm:text-base', suit: 'w-3 h-3 sm:w-3.5 sm:h-3.5', center: 'w-9 h-9 sm:w-10 sm:h-10', badge: 'text-[8px] sm:text-[9px]' },
  lg: { box: 'w-[7.25rem] h-[10.5rem]', rank: 'text-xl', suit: 'w-4 h-4', center: 'w-14 h-14', badge: 'text-[10px]' },
};

function pipColor(card: CardType): string {
  if (card.color === 'red') return '#dc2626';
  if (card.color === 'joker') return '#7c3aed';
  return '#0f172a';
}

const IMAGE_URL = 'https://storage.googleapis.com/arena_images-v2/342be3b4-5ceb-47de-af5f-70233e4f35f8.jpeg';
const ZANZIBAR_IMAGE_URL = 'https://images.pexels.com/photos/30312987/pexels-photo-30312987.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=650';

function FaceArt({ rank, theme }: { rank: string; theme: 'tanzania' | 'zanzibar' }) {
  let bgPos = '0% 50%'; // K
  if (rank === 'Q') bgPos = '33.33% 50%';
  if (rank === 'J') bgPos = '66.67% 50%';
  if (rank === 'A') bgPos = '100% 50%';

  return (
    <div
      className="absolute inset-[9%] overflow-hidden rounded-[0.55rem] border border-black/15 bg-white shadow-inner"
      style={{
        backgroundImage: `url('${theme === 'zanzibar' ? ZANZIBAR_IMAGE_URL : IMAGE_URL}')`,
        backgroundSize: theme === 'zanzibar' ? 'cover' : '405% 105%',
        backgroundPosition: theme === 'zanzibar' ? 'center' : bgPos,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-950/15 pointer-events-none" />
      <div className="absolute inset-[3px] rounded-[0.4rem] border border-white/55 shadow-[inset_0_0_10px_rgba(0,0,0,0.15)] pointer-events-none" />
    </div>
  );
}

export default function PlayingCard({
  card,
  theme = 'tanzania',
  faceDown = false,
  selected = false,
  playable = false,
  dimmed = false,
  onClick,
  size = 'md',
  className = '',
  style,
}: CardProps) {
  const s = SIZES[size];
  const isJoker = card.rank === 'Joker';
  const color = pipColor(card);
  const isFace = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K' || card.rank === 'A';
  const isNumber = !isJoker && !isFace;

  if (faceDown) {
    const zanzibarBack = theme === 'zanzibar';
    return (
      <div
        className={`
          ${s.box} card-back-art card-enter relative rounded-xl select-none shrink-0
          shadow-[0_6px_18px_rgba(0,0,0,0.45)] border-2 border-white/80
          overflow-hidden transition-transform duration-200 will-change-transform
          ${className}
        `}
        style={style}
        aria-hidden
      >
        {/* Theme-specific card back */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: zanzibarBack
              ? `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.75), transparent 20%), linear-gradient(145deg, #7dd3fc 0%, #14b8a6 42%, #0f766e 100%)`
              : `
                linear-gradient(
                  to bottom right,
                  transparent 43%,
                  #FCD116 43%,
                  #FCD116 46%,
                  #000000 46%,
                  #000000 64%,
                  #FCD116 64%,
                  #FCD116 67%,
                  transparent 67%
                ),
                linear-gradient(to bottom right, #1EB53A 50%, #0099E5 50%)
              `,
          }}
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-[6%] rounded-lg border border-white/60 shadow-[inset_0_0_16px_rgba(0,0,0,0.28)]" />
        <div className="absolute inset-[10%] rounded-md border border-amber-200/45" />
        
        {/* Center emblem */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-9 h-9 rounded-full bg-black/40 border border-white/50 flex items-center justify-center shadow-lg backdrop-blur-sm ${zanzibarBack ? 'text-cyan-100' : 'text-amber-400'}`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 drop-shadow-md" stroke="currentColor" strokeWidth="2">
              {zanzibarBack ? (
                <path d="M4 14c2.3-2 4.6-2 7 0s4.7 2 7 0M5 18c2-1.3 4-1.3 6 0s4 1.3 6 0M12 5c1.7 2.3 2.5 4.2 2.5 5.7A2.5 2.5 0 0 1 12 13.2a2.5 2.5 0 0 1-2.5-2.5C9.5 9.2 10.3 7.3 12 5Z" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z" fill="currentColor" strokeWidth="0" />
              )}
            </svg>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-2 z-10 text-center">
          <span className="rounded-full bg-black/35 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
            {zanzibarBack ? 'Zanzibar' : 'Tanzania'}
          </span>
        </div>

        {/* Corner flourishes */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-white/70 rounded-tl-sm" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-white/70 rounded-tr-sm" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-white/70 rounded-bl-sm" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-white/70 rounded-br-sm" />
      </div>
    );
  }

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={onClick ? false : undefined}
      className={`
          ${s.box} card-surface card-enter relative rounded-xl select-none shrink-0 text-left
          shadow-[0_7px_20px_rgba(0,0,0,0.32)] border overflow-hidden
          transition-all duration-200 ease-out origin-bottom will-change-transform
          ${selected ? 'ring-[3px] ring-amber-400 -translate-y-4 sm:-translate-y-5 scale-105 z-30 shadow-[0_18px_35px_rgba(251,191,36,0.25)]' : ''}
          ${playable && onClick && !selected ? 'hover:-translate-y-3 hover:shadow-2xl cursor-pointer hover:scale-[1.03] ring-2 ring-emerald-400/50' : ''}
        ${!onClick ? 'cursor-default' : ''}
        ${dimmed ? 'opacity-45 grayscale-[30%]' : 'opacity-100'}
        ${className}
      `}
      style={{
        background: theme === 'zanzibar'
          ? 'linear-gradient(180deg, #f0fdff 0%, #e0f7f5 100%)'
          : 'linear-gradient(180deg, #fffefb 0%, #f7f3eb 100%)',
        borderColor: selected ? '#fbbf24' : `${color}33`,
        ...style,
      }}
    >
      {/* Inner frame */}
      <div
        className="absolute inset-[3px] rounded-[10px] border pointer-events-none"
        style={{ borderColor: `${color}18` }}
      />
      <div className="card-gloss pointer-events-none absolute inset-0 z-20" />

      {/* Top-left index */}
      <div className="absolute top-1 left-1 z-10 flex flex-col items-center leading-none w-5">
        <span className={`${s.rank} font-bold font-serif`} style={{ color }}>
          {isJoker ? 'J' : card.rank}
        </span>
        {!isJoker && (
          <SuitIcon suit={card.suit} className={`${s.suit} mt-0.5`} color={color} />
        )}
        {isJoker && (
          <SuitIcon suit="joker" className={`${s.suit} mt-0.5`} color={color} />
        )}
      </div>

      {/* Bottom-right index (inverted) */}
      <div className="absolute bottom-1 right-1 z-10 flex flex-col items-center leading-none w-5 rotate-180">
        <span className={`${s.rank} font-bold font-serif`} style={{ color }}>
          {isJoker ? 'J' : card.rank}
        </span>
        <SuitIcon
          suit={isJoker ? 'joker' : card.suit}
          className={`${s.suit} mt-0.5`}
          color={color}
        />
      </div>

      {/* Center artwork */}
      {isJoker && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border border-violet-200/80 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed 50%, #5b21b6)',
            }}
          >
            <SuitIcon suit="joker" className="h-7 w-7" color="white" />
          </div>
          <span className={`${s.badge} font-extrabold uppercase tracking-wider text-violet-700`}>
            Joker
          </span>
          <span
            className={`${s.badge} font-bold uppercase tracking-wide text-white px-1.5 py-0.5 rounded-full`}
            style={{ backgroundColor: '#7c3aed' }}
          >
            +5 Draw
          </span>
        </div>
      )}

      {isFace && !isJoker && (
        <>
          <FaceArt rank={card.rank} theme={theme} />
        </>
      )}

      {isNumber && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center shadow-sm"
            style={{
              padding: size === 'xs' ? 6 : size === 'sm' ? 8 : 14,
              background: `radial-gradient(circle, ${color}14 0%, ${color}07 70%, transparent 100%)`,
              border: `2px solid ${theme === 'zanzibar' ? '#06b6d466' : `${color}26`}`,
            }}
          >
            <SuitIcon suit={card.suit} className={s.center} color={color} />
          </div>
          {theme === 'zanzibar' && (
            <div className="absolute bottom-[18%] left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-cyan-300/45 shadow-[0_0_12px_rgba(103,232,249,0.55)]" />
          )}
        </div>
      )}

      {/* Special badges */}
      {card.rank === '2' && (
        <div className="absolute top-1 right-1 z-10">
          <span className={`${s.badge} font-extrabold text-white bg-orange-500 px-1 py-0.5 rounded shadow`}>
            +2
          </span>
        </div>
      )}
      {card.rank === '7' && (
        <div className="absolute top-1 right-1 z-10">
          <span className={`${s.badge} font-extrabold text-white bg-sky-500 px-1 py-0.5 rounded shadow`}>
            SKIP
          </span>
        </div>
      )}
    </Tag>
  );
}
