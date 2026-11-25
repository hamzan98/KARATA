import type { Card } from '../types/game';
import PlayingCard from './Card';

interface GameBoardProps {
  topCard: Card | null;
  deckCount: number;
  message: string;
  lastAction: string | null;
  canDraw: boolean;
  canAct: boolean;
  onDraw: () => void;
  onPlaySelected: () => void;
  hasSelection: boolean;
  selectionPlayable: boolean;
  canFinishPair?: boolean;
  isCpuThinking?: boolean;
  pendingDraw?: number;
  pendingSkip?: boolean;
  cardTheme?: 'tanzania' | 'zanzibar';
}

export default function GameBoard({
  topCard,
  deckCount,
  message,
  lastAction,
  canDraw,
  canAct,
  onDraw,
  onPlaySelected,
  hasSelection,
  selectionPlayable,
  canFinishPair = false,
  isCpuThinking = false,
  pendingDraw = 0,
  pendingSkip = false,
  cardTheme = 'tanzania',
}: GameBoardProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 py-1">
      <div className="min-h-[2.75rem] flex flex-col items-center justify-center px-3">
        <p className="text-amber-50 text-center font-medium text-sm sm:text-base drop-shadow">
          {isCpuThinking ? 'Computer is thinking...' : message}
        </p>
        {lastAction && !isCpuThinking && (
          <p className="text-amber-300 text-xs sm:text-sm mt-1 font-semibold animate-pulse text-center">{lastAction}</p>
        )}
        {isCpuThinking && (
          <div className="flex gap-1 mt-2">
            {[0, 150, 300].map((delay) => <span key={delay} className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-5 sm:gap-10">
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={onDraw}
            disabled={!canAct || !canDraw}
            className={`relative ${canAct && canDraw ? 'cursor-pointer group' : 'cursor-not-allowed'}`}
            title={pendingSkip ? 'Accept the skip' : deckCount === 0 ? 'End the game' : 'Draw a card'}
          >
            {deckCount > 2 && <div className="absolute top-1.5 left-1.5 w-[4.8rem] h-[6.95rem] sm:w-[5.75rem] sm:h-[8.25rem] rounded-xl bg-slate-950 border border-indigo-900/40" />}
            {deckCount > 1 && <div className="absolute top-0.5 left-0.5 w-[4.8rem] h-[6.95rem] sm:w-[5.75rem] sm:h-[8.25rem] rounded-xl bg-slate-900 border border-indigo-900/40" />}
            {deckCount > 0 ? (
              <PlayingCard card={{ id: 'deck', suit: 'spades', rank: 'A', color: 'black' }} theme={cardTheme} faceDown className={canAct && canDraw ? 'group-hover:-translate-y-1 group-active:translate-y-0 transition-transform' : 'opacity-80'} />
            ) : (
              <div className="w-[4.8rem] h-[6.95rem] sm:w-[5.75rem] sm:h-[8.25rem] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center"><span className="text-white/30 text-xs">Empty</span></div>
            )}
          </button>
          <span className="text-white/45 text-[11px] font-medium tracking-wide">DECK · {deckCount}</span>
        </div>

        <div className="hidden sm:flex flex-col items-center opacity-40"><span className="text-white text-xs font-bold tracking-widest">VS</span></div>

        <div className="flex flex-col items-center gap-1.5">
          {topCard ? <PlayingCard key={topCard.id} card={topCard} theme={cardTheme} size="md" className="discard-arrive shadow-2xl ring-1 ring-white/10" /> : <div className="w-[4.8rem] h-[6.95rem] sm:w-[5.75rem] sm:h-[8.25rem] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center"><span className="text-white/30 text-xs">Play</span></div>}
          <span className="text-white/45 text-[11px] font-medium tracking-wide">DISCARD</span>
        </div>
      </div>

      {canAct && (
        <div className="grid w-full max-w-sm grid-cols-2 gap-2.5 mt-1">
          <button
            type="button"
            onClick={onDraw}
            disabled={!canDraw}
            className={`min-h-11 px-3 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 border ${canDraw ? pendingSkip ? 'bg-sky-600/90 hover:bg-sky-500 text-white border-sky-400/50 shadow-lg hover:-translate-y-0.5' : deckCount === 0 ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-lg hover:-translate-y-0.5' : pendingDraw > 0 ? 'bg-rose-600/90 hover:bg-rose-500 text-white border-rose-400/50 shadow-lg hover:-translate-y-0.5 animate-pulse' : 'bg-slate-700/90 hover:bg-slate-600 text-white border-slate-500/50 shadow-lg hover:-translate-y-0.5' : 'bg-white/5 text-white/25 border-white/10 cursor-not-allowed'}`}
          >
            {pendingSkip ? 'Accept Skip' : deckCount === 0 ? 'End Game' : pendingDraw > 0 ? `Draw ${pendingDraw} Cards` : 'Draw Card'}
          </button>
          <button
            type="button"
            onClick={onPlaySelected}
            disabled={!hasSelection || !selectionPlayable}
            className={`min-h-11 px-3 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 border ${hasSelection && selectionPlayable ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 border-amber-300 shadow-lg shadow-amber-900/30 hover:-translate-y-0.5' : 'bg-white/5 text-white/25 border-white/10 cursor-not-allowed'}`}
          >
            {canFinishPair && selectionPlayable ? 'Finish with Pair' : 'Play Card'}
          </button>
        </div>
      )}
    </div>
  );
}