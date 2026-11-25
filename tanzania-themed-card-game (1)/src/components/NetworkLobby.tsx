import { useState } from 'react';

type LobbyView = 'choose' | 'host-offer' | 'host-answer' | 'join-offer' | 'join-answer' | 'connecting';

interface NetworkLobbyProps {
  view: LobbyView;
  code: string;
  status: string;
  onCreate: () => void;
  onJoin: () => void;
  onAcceptOffer: (code: string) => void;
  onAcceptAnswer: (code: string) => void;
  onContinueHost: () => void;
  onCancel: () => void;
}

export default function NetworkLobby({
  view,
  code,
  status,
  onCreate,
  onJoin,
  onAcceptOffer,
  onAcceptAnswer,
  onContinueHost,
  onCancel,
}: NetworkLobbyProps) {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/95 p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Private connection</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Online or Same WiFi</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
            Connect two devices directly. The host creates an invite, and the second player joins it.
          </p>
        </div>

        {view === 'choose' && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onCreate} className="rounded-2xl bg-emerald-500 px-5 py-4 text-left font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-400">
              <span className="block text-lg">Create Game</span>
              <span className="mt-1 block text-xs font-medium opacity-70">I am Player 1 and will share an invite</span>
            </button>
            <button type="button" onClick={onJoin} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              <span className="block text-lg">Join Game</span>
              <span className="mt-1 block text-xs font-medium text-white/55">I am Player 2 and received an invite</span>
            </button>
          </div>
        )}

        {(view === 'host-offer' || view === 'join-answer') && (
          <div className="mt-7 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/55">
                {view === 'host-offer' ? 'Step 1: Send this invite to Player 2' : 'Step 2: Send this answer back to the host'}
              </label>
              <textarea readOnly value={code} className="mt-2 h-32 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[10px] leading-4 text-white/70 outline-none" />
            </div>
            <button type="button" onClick={copyCode} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">
              {copied ? 'Copied' : 'Copy Code'}
            </button>
            {view === 'host-offer' && (
              <button type="button" onClick={onContinueHost} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                I sent it, enter Player 2 answer
              </button>
            )}
            {view === 'join-answer' && <p className="text-center text-xs text-amber-200/70">Waiting for the host to accept your answer...</p>}
          </div>
        )}

        {(view === 'join-offer' || view === 'host-answer') && (
          <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); view === 'join-offer' ? onAcceptOffer(input.trim()) : onAcceptAnswer(input.trim()); }}>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/55">
                {view === 'join-offer' ? 'Paste the host invite' : 'Paste Player 2 answer'}
              </label>
              <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste connection code here" className="mt-2 h-36 w-full resize-none rounded-xl border border-white/15 bg-black/30 p-3 font-mono text-[10px] leading-4 text-white outline-none focus:border-emerald-400" />
            </div>
            <button type="submit" disabled={!input.trim()} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-400">
              {view === 'join-offer' ? 'Create Answer' : 'Connect Game'}
            </button>
          </form>
        )}

        {view === 'connecting' && (
          <div className="mt-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-emerald-400" />
            <p className="mt-4 text-sm font-semibold text-white">Connecting both players...</p>
          </div>
        )}

        {status && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-center text-xs text-rose-200">{status}</p>}
        <button type="button" onClick={onCancel} className="mx-auto mt-6 block text-xs font-semibold text-white/45 hover:text-white">Back to main menu</button>
      </div>
    </div>
  );
}