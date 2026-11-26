import { useCallback, useEffect, useRef, useState } from 'react';
import SuitIcon from '../components/SuitIcon';
import { playGameSound } from '../game/sound';
import {
  aiChooseCard,
  aiChooseTrump,
  chooseTrump,
  createInitialState,
  drawAfterTrick,
  playCard,
  resolveTrick,
  selectCard,
  startNewGame,
  startRound,
} from './engine';
import { handPoints } from './deck';
import {
  Card,
  GameMode,
  GameState,
  POINT_VALUES,
  SUITS,
  SUIT_COLOR,
  SUIT_LABEL,
  Suit,
} from './types';

interface ZanzibarGameProps {
  onBack: () => void;
}

const MODES: { mode: GameMode; title: string; blurb: string }[] = [
  { mode: 'solo-2', title: '2 Players', blurb: 'You vs Amira' },
  { mode: 'solo-4', title: '4 Players', blurb: 'Every player for themselves' },
  { mode: 'teams-2v2', title: '2 vs 2 Teams', blurb: 'You + Karim vs Amira + Sofia' },
];

const ZANZIBAR_BG =
  'https://images.pexels.com/photos/30312987/pexels-photo-30312987.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1920';

function ZanzibarScenery({ subtle = false, showLabel = false }: { subtle?: boolean; showLabel?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${ZANZIBAR_BG}')` }}
      />
      <div className={`absolute inset-0 ${subtle ? 'bg-slate-950/35' : 'bg-slate-950/25'}`} />
      <div
        className={`absolute inset-0 ${
          subtle
            ? 'bg-gradient-to-b from-slate-950/50 via-slate-950/20 to-slate-950/75'
            : 'bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/70'
        }`}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {showLabel && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-amber-300/30 bg-black/55 px-4 py-1.5 shadow-xl backdrop-blur-md">
          <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-200">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Visit Zanzibar
          </span>
        </div>
      )}
    </div>
  );
}

function pipColor(suit: Suit): string {
  return SUIT_COLOR[suit] === 'red' ? '#dc2626' : '#0f172a';
}

function ZCard({
  card,
  size = 'md',
  selected = false,
  trump = false,
  onClick,
}: {
  card: Card;
  size?: 'sm' | 'md';
  selected?: boolean;
  trump?: boolean;
  onClick?: () => void;
}) {
  const color = pipColor(card.suit);
  const pts = POINT_VALUES[card.rank];
  const box = size === 'sm' ? 'w-12 h-[4.4rem]' : 'w-[3.6rem] h-[5.3rem] sm:w-[4.6rem] sm:h-[6.7rem]';
  const rankCls = size === 'sm' ? 'text-xs' : 'text-sm sm:text-base';
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        ${box} card-surface card-enter relative shrink-0 select-none overflow-hidden rounded-xl border text-left
        shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out origin-bottom
        ${selected ? 'ring-[3px] ring-amber-400 -translate-y-4 scale-105 z-30' : ''}
        ${!selected && trump ? 'ring-2 ring-cyan-300/70' : ''}
        ${onClick && !selected ? 'cursor-pointer hover:-translate-y-2' : ''}
      `}
      style={{ borderColor: selected ? '#fbbf24' : `${color}33` }}
    >
      <div className="absolute left-1 top-1 z-10 flex w-5 flex-col items-center leading-none">
        <span className={`${rankCls} font-bold font-serif`} style={{ color }}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="mt-0.5 h-3 w-3" color={color} />
      </div>
      <div className="absolute bottom-1 right-1 z-10 flex w-5 rotate-180 flex-col items-center leading-none">
        <span className={`${rankCls} font-bold font-serif`} style={{ color }}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="mt-0.5 h-3 w-3" color={color} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            padding: size === 'sm' ? 6 : 10,
            background: `radial-gradient(circle, ${color}14 0%, ${color}07 70%, transparent 100%)`,
            border: '2px solid #06b6d466',
          }}
        >
          <SuitIcon suit={card.suit} className={size === 'sm' ? 'h-5 w-5' : 'h-7 w-7 sm:h-9 sm:w-9'} color={color} />
        </div>
      </div>
      {pts > 0 && (
        <span className="absolute right-1 top-1 z-10 rounded bg-teal-600 px-1 text-[8px] font-extrabold leading-4 text-white shadow">
          {pts}
        </span>
      )}
    </Tag>
  );
}

function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-[3.1rem] w-8 shrink-0 rounded-md border border-white/70 shadow ${className}`}
      style={{ backgroundImage: 'linear-gradient(145deg, #7dd3fc 0%, #14b8a6 42%, #0f766e 100%)' }}
    />
  );
}

export default function ZanzibarGame({ onBack }: ZanzibarGameProps) {
  const [state, setState] = useState<GameState>(() => createInitialState(4));
  const timerRef = useRef<number | null>(null);
  const prevRef = useRef<GameState | null>(null);
  const [showRules, setShowRules] = useState(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  // AI / automatic phases
  useEffect(() => {
    clearTimer();

    if (state.phase === 'choose-trump' && !state.players[state.currentPlayerIndex]?.isHuman) {
      timerRef.current = window.setTimeout(() => {
        setState((s) => chooseTrump(s, aiChooseTrump(s)));
      }, 900);
      return;
    }

    if (
      state.phase === 'play' &&
      !state.animating &&
      !state.players[state.currentPlayerIndex]?.isHuman
    ) {
      timerRef.current = window.setTimeout(() => {
        setState((s) => {
          const cardId = aiChooseCard(s);
          return cardId ? playCard(s, cardId) : s;
        });
      }, 700);
      return;
    }

    if (state.phase === 'trick-resolve') {
      timerRef.current = window.setTimeout(() => setState((s) => resolveTrick(s)), 1100);
      return;
    }

    if (state.phase === 'draw') {
      timerRef.current = window.setTimeout(() => setState((s) => drawAfterTrick(s)), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentPlayerIndex, state.animating, state.trick.length, state.round]);

  // Sound effects
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    if (!prev) return;
    if (state.phase === 'game-over' && prev.phase !== 'game-over') playGameSound('win');
    else if (state.trick.length > prev.trick.length) playGameSound('play');
    else if (state.phase === 'draw' && prev.phase !== 'draw') playGameSound('draw');
    else if (state.phase === 'choose-trump' && prev.phase !== 'choose-trump') playGameSound('turn');
  }, [state]);

  const handleStart = useCallback((mode: GameMode) => {
    const n = mode === 'solo-2' ? 2 : 4;
    setState(startNewGame(createInitialState(n, mode)));
  }, []);

  const handlePlayAgain = useCallback(() => {
    setState((s) => startNewGame(createInitialState(s.players.length, s.mode)));
  }, []);

  const handleMenu = useCallback(() => {
    clearTimer();
    setState(createInitialState(4));
  }, []);

  const handleCardClick = useCallback((cardId: string) => {
    setState((s) => {
      if (s.phase !== 'play' || s.animating) return s;
      if (!s.players[s.currentPlayerIndex]?.isHuman) return s;
      return s.selectedCardId === cardId ? playCard(s, cardId) : selectCard(s, cardId);
    });
  }, []);

  const handlePlaySelected = useCallback(() => {
    setState((s) => (s.selectedCardId ? playCard(s, s.selectedCardId) : s));
  }, []);

  const me = state.players[0];
  const isTeams = state.mode === 'teams-2v2' || state.mode === 'online-2v2';
  const humanTurn =
    state.phase === 'play' && !state.animating && state.players[state.currentPlayerIndex]?.isHuman;
  const humanPicksTrump =
    state.phase === 'choose-trump' && state.players[state.currentPlayerIndex]?.isHuman;
  const nameOf = (id: number) => state.players[id]?.name ?? '';

  const header = (
    <header className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">LAST CARD</p>
        <h1 className="text-lg font-black text-white">Zanzibar Card Game</h1>
      </div>
      <div className="flex items-center gap-2">
        {state.phase !== 'menu' && (
          <button
            type="button"
            onClick={handleMenu}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            New game
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          Back
        </button>
      </div>
    </header>
  );

  const shell = (children: React.ReactNode) => (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <ZanzibarScenery subtle />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col p-3 sm:p-5">
        {header}
        {children}
      </div>
    </div>
  );

  // ——— Menu ———
  if (state.phase === 'menu') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <ZanzibarScenery showLabel />
        <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">LAST CARD</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Zanzibar Card Game</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
                Pick the trump, win tricks and collect points. Choose how you want to play.
              </p>
            </div>

            <div className="mt-7 grid gap-3">
              {MODES.map((m, i) => (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => handleStart(m.mode)}
                  className={`rounded-2xl px-5 py-4 text-left font-bold transition hover:-translate-y-0.5 ${
                    i === 0
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  <span className="block text-lg">{m.title}</span>
                  <span className={`mt-1 block text-xs font-medium ${i === 0 ? 'opacity-70' : 'text-white/55'}`}>
                    {m.blurb}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className="mx-auto mt-5 block text-xs font-semibold text-cyan-200/80 hover:text-cyan-100"
            >
              {showRules ? 'Hide how to play' : 'How to play'}
            </button>
            {showRules && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-5 text-white/65">
                <p>
                  36-card deck (A, 7, K, J, Q, 6, 5, 4, 3). Each round everyone gets 3 cards and the first
                  player picks the trump suit. Play one card per trick; any card may be played. Highest trump
                  wins, otherwise the highest card of the suit led. The winner leads next, and everyone draws a
                  card after each trick.
                </p>
                <p className="mt-2">
                  Points: A 11 · 7 10 · K 4 · J 3 · Q 2 · others 0. First to 50 points wins, or the highest
                  score after 5 rounds.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onBack}
              className="mx-auto mt-6 block text-xs font-semibold text-white/45 hover:text-white"
            >
              Back to main menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const opponents = state.players.filter((p) => !p.isHuman);

  return shell(
    <div className="flex flex-1 flex-col gap-3">
      {/* Scoreboard */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70">
        <span className="font-semibold">Round {state.round} / 5</span>
        <span className="flex items-center gap-1.5">
          Trump:
          {state.trump ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-bold" style={{ color: pipColor(state.trump) }}>
              <SuitIcon suit={state.trump} className="h-3 w-3" color={pipColor(state.trump)} />
              {SUIT_LABEL[state.trump]}
            </span>
          ) : (
            <span className="text-white/40">not chosen</span>
          )}
        </span>
        <span>Stock: {state.deck.length}</span>
        {isTeams && (
          <span className="font-semibold text-cyan-200">
            Team A {state.teamScores[0]} · Team B {state.teamScores[1]}
          </span>
        )}
      </div>

      {/* Opponents */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(opponents.length, 3)}, minmax(0, 1fr))` }}>
        {opponents.map((p) => {
          const active = state.currentPlayerIndex === p.id && (state.phase === 'play' || state.phase === 'choose-trump');
          return (
            <div
              key={p.id}
              className={`rounded-2xl p-2.5 ${active ? 'bg-slate-900/95 ring-2 ring-amber-400/80' : 'bg-slate-900/85 ring-1 ring-white/15'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-white">
                  {p.name}
                  {isTeams && <span className="ml-1 text-[10px] text-cyan-200">({p.team === 0 ? 'A' : 'B'})</span>}
                </span>
                <span className="text-xs font-bold text-amber-200">{p.score} pts</span>
              </div>
              <div className="mt-2 flex min-h-[3.1rem] items-center gap-0.5 overflow-hidden">
                {p.hand.map((c) => <CardBack key={c.id} className="-ml-3 first:ml-0" />)}
              </div>
              <p className="mt-1 text-[10px] text-white/40">Won this round: {handPoints(p.wonCards)} pts</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="flex min-h-[10.5rem] flex-1 flex-col items-center justify-center rounded-3xl border border-cyan-200/20 bg-slate-950/55 px-3 py-4 backdrop-blur-sm">
        <p className="mb-3 text-center text-sm font-medium text-cyan-50 drop-shadow">{state.message}</p>
        <div className="flex flex-wrap items-end justify-center gap-3">
          {state.trick.length === 0 ? (
            <span className="text-xs text-white/30">Trick area</span>
          ) : (
            state.trick.map((t) => (
              <div key={t.card.id} className="flex flex-col items-center gap-1">
                <ZCard card={t.card} size="sm" trump={t.card.suit === state.trump} />
                <span className="text-[10px] font-semibold text-white/60">{nameOf(t.playerId)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Round end / game over */}
      {(state.phase === 'round-end' || state.phase === 'game-over') && (
        <div className="rounded-3xl border border-amber-400/30 bg-slate-950/95 p-5 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-white">
            {state.phase === 'game-over' ? 'Game over' : `Round ${state.round} complete`}
          </h2>
          <p className="mt-2 text-sm text-white/70">{state.message}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {state.phase === 'round-end' ? (
              <button
                type="button"
                onClick={() => setState((s) => startRound(s))}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
              >
                Next round
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
                >
                  Play again
                </button>
                <button
                  type="button"
                  onClick={handleMenu}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Main menu
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Trump chooser */}
      {humanPicksTrump && (
        <div className="rounded-3xl border border-cyan-300/30 bg-slate-950/95 p-4 text-center shadow-2xl">
          <p className="mb-3 text-sm font-semibold text-white">Choose the trump suit</p>
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map((suit) => (
              <button
                key={suit}
                type="button"
                onClick={() => setState((s) => chooseTrump(s, suit))}
                className="flex flex-col items-center gap-1 rounded-xl bg-white py-3 transition hover:-translate-y-0.5"
              >
                <SuitIcon suit={suit} className="h-7 w-7" color={pipColor(suit)} />
                <span className="text-[11px] font-bold" style={{ color: pipColor(suit) }}>{SUIT_LABEL[suit]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Your hand */}
      <div className={`rounded-2xl p-2.5 sm:p-3 ${humanTurn || humanPicksTrump ? 'bg-slate-900/95 ring-2 ring-amber-400/80' : 'bg-slate-900/90 ring-1 ring-white/15'}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white">
            {me.name}
            {isTeams && <span className="ml-1 text-[10px] text-cyan-200">(A)</span>}
            {humanTurn && <span className="ml-2 rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">Your turn</span>}
          </span>
          <span className="text-xs font-bold text-amber-200">{me.score} pts · round {handPoints(me.wonCards)}</span>
        </div>
        <div className="flex min-h-[6.5rem] items-end justify-center gap-1.5 overflow-x-auto overflow-y-visible px-1 pb-1 pt-5 sm:min-h-[8rem]">
          {me.hand.length === 0 ? (
            <p className="self-center py-4 text-sm italic text-white/35">No cards</p>
          ) : (
            me.hand.map((c) => (
              <ZCard
                key={c.id}
                card={c}
                trump={c.suit === state.trump}
                selected={state.selectedCardId === c.id}
                onClick={humanTurn ? () => handleCardClick(c.id) : undefined}
              />
            ))
          )}
        </div>
        <button
          type="button"
          onClick={handlePlaySelected}
          disabled={!humanTurn || !state.selectedCardId}
          className={`mt-2 min-h-11 w-full rounded-xl border px-5 py-2.5 text-sm font-semibold tracking-wide transition ${
            humanTurn && state.selectedCardId
              ? 'border-amber-300 bg-amber-400 text-slate-900 shadow-lg hover:bg-amber-300'
              : 'cursor-not-allowed border-white/10 bg-white/5 text-white/25'
          }`}
        >
          Play Card
        </button>
      </div>
    </div>
  );
}
