import type { Card, GameMode, PlayerId, Rank } from '../types/game';
import { getPlayerName } from '../types/game';
import { canPlayCard } from '../game/deck';
import PlayingCard from './Card';

interface PlayerHandProps {
  playerId: PlayerId;
  hand: Card[];
  mode: GameMode;
  isCurrent: boolean;
  isWinner: boolean;
  topCard: Card | null;
  pendingDraw?: number;
  penaltyType?: Rank | null;
  pendingSkip?: boolean;
  cardTheme?: 'tanzania' | 'zanzibar';
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  /** Hide faces (opponent / privacy) */
  faceDown?: boolean;
  /** Label override e.g. "Your hand" */
  title?: string;
  compact?: boolean;
}

export default function PlayerHand({
  playerId,
  hand,
  mode,
  isCurrent,
  isWinner,
  topCard,
  pendingDraw = 0,
  penaltyType = null,
  pendingSkip = false,
  cardTheme = 'tanzania',
  selectedCardId,
  onSelectCard,
  faceDown = false,
  title,
  compact = false,
}: PlayerHandProps) {
  const name = title ?? getPlayerName(playerId, mode);

  return (
    <div
      className={`
        relative rounded-2xl transition-all duration-300
        ${compact ? 'p-2 md:p-3' : 'p-2.5 sm:p-3 md:p-4'}
        ${
          isCurrent
            ? 'bg-slate-900/95 ring-2 ring-amber-400/80 shadow-lg shadow-amber-950/40'
            : 'bg-slate-900/90 ring-1 ring-white/15'
        }
        ${isWinner ? 'ring-2 ring-emerald-400 bg-emerald-500/15' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`
              w-2.5 h-2.5 rounded-full shrink-0
              ${isCurrent && !isWinner ? 'bg-amber-400 animate-pulse' : 'bg-white/25'}
              ${isWinner ? 'bg-emerald-400' : ''}
            `}
          />
          <h2 className="text-white font-semibold text-sm sm:text-base tracking-wide truncate">
            {name}
          </h2>
          {isCurrent && !isWinner && (
            <span className="hidden xs:inline text-[10px] font-bold uppercase tracking-wider text-amber-200 bg-amber-500/25 px-2 py-0.5 rounded-full shrink-0">
              Turn
            </span>
          )}
          {isWinner && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
              Winner
            </span>
          )}
          {hand.length === 1 && !isWinner && (
            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-rose-600 px-2 py-0.5 rounded-full shadow-md shadow-rose-950/40 animate-pulse shrink-0">
              One card!
            </span>
          )}
          {faceDown && !isWinner && (
            <span className="text-[10px] text-white/40 italic shrink-0">hidden</span>
          )}
        </div>
        <span className="text-white/55 text-xs font-semibold tabular-nums bg-black/20 px-2 py-0.5 rounded-full shrink-0">
          {hand.length}
        </span>
      </div>

      <div
        className={`
          flex justify-center items-end
          ${compact ? 'min-h-[4.5rem]' : 'min-h-[6.35rem] sm:min-h-[8.5rem]'}
        `}
      >
        {hand.length === 0 ? (
          <p className="text-white/35 text-sm italic self-center py-6">No cards left</p>
        ) : (
          <div className="flex justify-center w-full px-1 overflow-x-auto overflow-y-visible pb-1 pt-5 sm:pt-6 [scrollbar-width:thin]">
            <div className="flex items-end" style={{ marginLeft: 0 }}>
              {hand.map((card, index) => {
                const playable =
                  isCurrent &&
                  !faceDown &&
                  canPlayCard(card, topCard, pendingDraw, penaltyType, pendingSkip);
                const overlap =
                  hand.length > 10 ? -2.4 : hand.length > 7 ? -1.8 : hand.length > 5 ? -1.2 : -0.5;
                return (
                  <div
                    key={card.id}
                    className="card-fan-in relative transition-transform duration-200"
                    style={{
                      marginLeft: index === 0 ? 0 : `${overlap}rem`,
                      zIndex: selectedCardId === card.id ? 40 : index + 1,
                      animationDelay: `${Math.min(index * 45, 360)}ms`,
                    }}
                  >
                    <PlayingCard
                      card={card}
                      theme={cardTheme}
                      faceDown={faceDown}
                      selected={selectedCardId === card.id}
                      playable={playable}
                      dimmed={isCurrent && !faceDown && !playable && !!onSelectCard}
                      onClick={
                        isCurrent && !faceDown
                          ? () => onSelectCard(card.id)
                          : undefined
                      }
                      size={compact ? 'sm' : 'md'}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
