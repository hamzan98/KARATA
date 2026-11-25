import type { GameMode, PlayerId } from '../types/game';
import { getPlayerName } from '../types/game';

interface WinnerModalProps {
  winner: PlayerId;
  mode: GameMode;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export default function WinnerModal({
  winner,
  mode,
  onPlayAgain,
  onMainMenu,
}: WinnerModalProps) {
  const name = getPlayerName(winner, mode);
  const isCpuWin = mode === 'cpu' && winner === 'player2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="winner-modal relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 rounded-3xl p-8 max-w-sm w-full text-center border border-amber-500/25 shadow-2xl space-y-5 animate-[fadeIn_0.3s_ease-out]">
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/35 bg-amber-400/10 text-amber-300 shadow-lg shadow-amber-950/40">
          {isCpuWin ? (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="4" y="6" width="16" height="13" rx="3" /><path d="M9 11h.01M15 11h.01M8 15h8M12 6V3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="m4 7 4.4 3L12 4l3.6 6L20 7l-1.3 10H5.3L4 7Z" strokeLinejoin="round" /><path d="M6 20h12" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'cpu' && winner === 'player1'
              ? 'You Win!'
              : mode === 'cpu' && winner === 'player2'
                ? 'Computer Wins!'
                : `${name} Wins!`}
          </h2>
          <p className="text-white/55 text-sm">
            {isCpuWin
              ? 'Better luck next time — try again!'
              : 'All cards played. Victory!'}
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="
              w-full px-6 py-3.5 rounded-xl font-bold
              bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900
              hover:from-amber-300 hover:to-amber-400
              shadow-lg transition-all duration-200 hover:-translate-y-0.5
            "
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="
              w-full px-6 py-3 rounded-xl font-semibold text-sm
              bg-white/5 text-white/70 hover:bg-white/10 hover:text-white
              border border-white/10 transition-colors
            "
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
