import { useState } from 'react';
import type { GameMode } from '../types/game';
import SuitIcon from './SuitIcon';

interface StartScreenProps {
  onStart: (mode: GameMode, cardStyle: 'tanzania' | 'zanzibar') => void;
  onOpenZanzibar: () => void;
  activeIndex?: number;
}

export default function StartScreen({ onStart, onOpenZanzibar, activeIndex = 0 }: StartScreenProps) {
  const [showRules, setShowRules] = useState(false);
  const [cardStyle, setCardStyle] = useState<'tanzania' | 'zanzibar' | null>(null);
  const selectedCardName = cardStyle === 'zanzibar' ? 'Zanzibar Card' : 'Tanzania Card';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 40%, rgba(251, 191, 36, 0.18) 0%, transparent 42%),
            radial-gradient(circle at 85% 25%, rgba(30, 64, 175, 0.35) 0%, transparent 40%),
            radial-gradient(circle at 55% 85%, rgba(220, 38, 38, 0.15) 0%, transparent 38%)
          `,
        }}
      />

      {/* Floating suit decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
        <div className="absolute top-[12%] left-[8%] text-white"><SuitIcon suit="spades" className="w-16 h-16" color="white" /></div>
        <div className="absolute top-[20%] right-[10%] text-white"><SuitIcon suit="hearts" className="w-14 h-14" color="white" /></div>
        <div className="absolute bottom-[18%] left-[14%] text-white"><SuitIcon suit="clubs" className="w-12 h-12" color="white" /></div>
        <div className="absolute bottom-[22%] right-[12%] text-white"><SuitIcon suit="diamonds" className="w-16 h-16" color="white" /></div>
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col gap-6 text-center sm:gap-7">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center gap-1 mb-1">
            {(['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit) => (
              <div
                key={suit}
                className="w-10 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center -mx-0.5 border border-black/5"
                style={{ transform: `rotate(${suit === 'spades' || suit === 'diamonds' ? -6 : 6}deg)` }}
              >
                <SuitIcon
                  suit={suit}
                  className="w-5 h-5"
                  color={suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#0f172a'}
                />
              </div>
            ))}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
            LAST CARD
          </h1>
          <p className="text-amber-100/75 text-base sm:text-lg">
            Choose Game
          </p>
        </div>

        {/* Scenery */}
        <div className="flex justify-center gap-2 py-1 sm:gap-3">
          {[
            { name: 'Serengeti', url: 'https://images.pexels.com/photos/18000394/pexels-photo-18000394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600' },
            { name: 'Kilimanjaro', url: 'https://images.pexels.com/photos/15994035/pexels-photo-15994035.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600' },
            { name: 'Visit Zanzibar', url: 'https://images.pexels.com/photos/30312987/pexels-photo-30312987.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600' }
          ].map((place, idx) => {
            const isActive = idx === (activeIndex % 3);
            return (
              <div
                key={place.name}
                className={`relative w-1/3 aspect-[3/2] rounded-xl overflow-hidden shadow-lg group transition-all duration-300 ${
                  isActive ? 'border-2 border-amber-400 ring-2 ring-amber-400/30 scale-[1.03]' : 'border border-white/20'
                }`}
              >
                <img src={place.url} alt={place.name} className={`object-cover w-full h-full transition-transform duration-700 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <span className="text-white text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1">
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    {place.name}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-amber-400 text-[8px] font-black text-slate-900 px-1.5 py-0.5 shadow">NOW</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Choose game first, then reveal start options */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="text-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
              Choose game
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCardStyle('tanzania')}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  cardStyle === 'tanzania'
                    ? 'border-amber-300 bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/25'
                    : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                }`}
              >
                <span className="block text-sm font-black">Choose Tanzania Card Game</span>
                <span className={`mt-0.5 block text-[10px] font-medium ${cardStyle === 'tanzania' ? 'text-slate-800/70' : 'text-white/45'}`}>
                  Serengeti and Kilimanjaro style
                </span>
                {cardStyle === 'tanzania' && <span className="mt-2 inline-block rounded-full bg-slate-950/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Selected</span>}
              </button>
              <button
                type="button"
                onClick={() => setCardStyle('zanzibar')}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  cardStyle === 'zanzibar'
                    ? 'border-cyan-200 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/25'
                    : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                }`}
              >
                <span className="block text-sm font-black">Choose Zanzibar Card Game</span>
                <span className={`mt-0.5 block text-[10px] font-medium ${cardStyle === 'zanzibar' ? 'text-slate-800/70' : 'text-white/45'}`}>
                  Island coast and ocean style
                </span>
                {cardStyle === 'zanzibar' && <span className="mt-2 inline-block rounded-full bg-slate-950/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Selected</span>}
              </button>
            </div>
          </div>

          {!cardStyle && (
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-semibold text-white/60">
              Select Tanzania Card Game or Zanzibar Card Game to continue.
            </p>
          )}

          {cardStyle === 'zanzibar' && (
            <>
              <p className="text-left text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                Start Zanzibar Card Game
              </p>
              <button
                type="button"
                onClick={onOpenZanzibar}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-300 to-teal-500 px-6 py-5 text-left text-base font-bold text-slate-950 shadow-xl shadow-cyan-950/30 transition-all duration-200 hover:-translate-y-1 hover:from-cyan-200 hover:to-teal-400 active:translate-y-0"
              >
                <span className="block text-lg">Start Zanzibar Card Game</span>
                <span className="mt-0.5 block text-xs font-medium opacity-75">
                  Runs inside LAST CARD using your Zanzibar game
                </span>
              </button>
            </>
          )}

          {cardStyle === 'tanzania' && (
            <>
              <p className="text-left text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
                Start {selectedCardName} Game
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onStart('cpu', cardStyle)}
                  className="group relative overflow-hidden px-6 py-4 rounded-2xl font-bold text-base bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 shadow-xl shadow-amber-900/30 hover:from-amber-300 hover:to-amber-400 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left"
                >
                  <span className="block text-lg">Start {selectedCardName}</span>
                  <span className="block text-xs font-medium opacity-70 mt-0.5">Solo match · AI opponent</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStart('pvp', cardStyle)}
                  className="group relative overflow-hidden px-6 py-4 rounded-2xl font-bold text-base bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-900/40 hover:from-indigo-400 hover:to-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left"
                >
                  <span className="block text-lg">Start {selectedCardName} · 2 Players</span>
                  <span className="block text-xs font-medium opacity-80 mt-0.5">Pass & play · private hands</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStart('online', cardStyle)}
                  className="group relative overflow-hidden sm:col-span-2 px-6 py-4 rounded-2xl font-bold text-base bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-950/40 hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left"
                >
                  <span className="block text-lg">Start {selectedCardName} · Online / Same WiFi</span>
                  <span className="block text-xs font-medium opacity-80 mt-0.5">Connect two phones with a private invite</span>
                </button>
              </div>

              {/* How to Play toggle button */}
              <button
                type="button"
                onClick={() => setShowRules((v) => !v)}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200 hover:bg-amber-400/15 hover:text-amber-100 transition-colors"
                aria-expanded={showRules}
              >
                <span className="text-base">{showRules ? '✖' : '📖'}</span>
                {showRules ? 'Hide Rules' : 'How to Play'}
                <svg
                  className={`h-4 w-4 transition-transform ${showRules ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Rules – only visible when button toggled */}
        {cardStyle && showRules && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/55 p-5 text-left backdrop-blur-md sm:p-6 animate-[fadeIn_0.25s_ease-out]">
            <h2 className="text-amber-300 font-semibold text-xs uppercase tracking-wider">
              How to Play
            </h2>
            <ul className="space-y-2 text-white/80 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="text-amber-400 shrink-0">▸</span>
                <span>
                  Match <strong className="text-white">suit</strong> (♠♥♦♣) or <strong className="text-white">rank</strong> of the top card.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-400 shrink-0">▸</span>
                <span><strong className="text-orange-300">2</strong> → next player draws <strong>+2</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-sky-400 shrink-0">▸</span>
                <span><strong className="text-sky-300">7</strong> → next player is skipped, but may <strong>counter with another 7</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 shrink-0">▸</span>
                <span><strong className="text-purple-300">Joker</strong> → next player draws <strong>+5</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-400 shrink-0">▸</span>
                <span><strong className="text-pink-300">Stacking:</strong> Play matching +2 / +5 to sum and bounce back!</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">▸</span>
                <span>Empty your hand first to <strong className="text-white">win</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 shrink-0">▸</span>
                <span>A player with <strong className="text-white">one card</strong> is announced.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400 shrink-0">▸</span>
                <span>Final two cards with same number can be played together to win.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 shrink-0">▸</span>
                <span>When deck is empty, <strong className="text-white">smallest hand wins</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-400 shrink-0">▸</span>
                <span><strong className="text-white">2 or Joker</strong> may be your final winning card.</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-white/10">
              <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2 font-medium">Suits</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { suit: 'spades' as const, name: 'Spades' },
                  { suit: 'hearts' as const, name: 'Hearts' },
                  { suit: 'diamonds' as const, name: 'Diamonds' },
                  { suit: 'clubs' as const, name: 'Clubs' },
                ].map((s) => (
                  <div key={s.suit} className="flex flex-col items-center gap-1 bg-white rounded-xl py-2.5 shadow-md">
                    <SuitIcon suit={s.suit} className="w-6 h-6" color={s.suit === 'hearts' || s.suit === 'diamonds' ? '#dc2626' : '#0f172a'} />
                    <span className="text-[10px] font-semibold text-slate-700">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-white/35 text-xs max-w-sm mx-auto leading-relaxed">
          In 2-player mode, cards stay hidden. Pass the device and tap “Show my cards”.
        </p>
      </div>
    </div>
  );
}
