import type { GameMode, PlayerId } from '../types/game';
import { getPlayerName } from '../types/game';

interface HandoffScreenProps {
  player: PlayerId;
  mode: GameMode;
  lastAction: string | null;
  onReveal: () => void;
}

export default function HandoffScreen({
  player,
  mode,
  lastAction,
  onReveal,
}: HandoffScreenProps) {
  const name = getPlayerName(player, mode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-2">
            <span className="text-3xl">🙈</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Pass the device
          </h2>
          <p className="text-indigo-200/80 text-base">
            Hand it to <strong className="text-white">{name}</strong>
          </p>
        </div>

        {lastAction && (
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3">
            <p className="text-amber-200 text-sm font-medium">{lastAction}</p>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-white/50 text-sm">
            Keep your cards secret. Only reveal when {name} is ready and others
            look away.
          </p>
          <button
            type="button"
            onClick={onReveal}
            className="
              w-full px-6 py-4 rounded-xl font-bold text-lg
              bg-gradient-to-r from-indigo-500 to-blue-500 text-white
              hover:from-indigo-400 hover:to-blue-400
              shadow-lg shadow-indigo-900/40
              transition-all duration-200 hover:-translate-y-0.5
            "
          >
            I&apos;m {name} — Show my cards
          </button>
        </div>
      </div>
    </div>
  );
}
