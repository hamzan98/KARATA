export type GameSound = 'select' | 'draw' | 'play' | 'special' | 'turn' | 'win';

let muted = false;
let audioContext: AudioContext | null = null;

export function setSoundMuted(value: boolean) {
  muted = value;
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function tone(context: AudioContext, frequency: number, start: number, duration: number, gainValue: number, type: OscillatorType = 'sine') {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function paperNoise(context: AudioContext, start: number) {
  const length = Math.floor(context.sampleRate * 0.07);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 1700;
  gain.gain.value = 0.055;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(start);
}

export function playGameSound(sound: GameSound) {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime + 0.005;

  if (sound === 'select') {
    tone(context, 520, now, 0.055, 0.025, 'sine');
  } else if (sound === 'draw') {
    paperNoise(context, now);
    tone(context, 250, now, 0.09, 0.018, 'triangle');
  } else if (sound === 'play') {
    paperNoise(context, now);
    tone(context, 390, now, 0.08, 0.03, 'triangle');
    tone(context, 520, now + 0.045, 0.1, 0.025, 'triangle');
  } else if (sound === 'special') {
    tone(context, 330, now, 0.12, 0.04, 'square');
    tone(context, 495, now + 0.08, 0.14, 0.035, 'square');
    tone(context, 660, now + 0.16, 0.18, 0.03, 'square');
  } else if (sound === 'turn') {
    tone(context, 440, now, 0.08, 0.02, 'sine');
    tone(context, 554, now + 0.06, 0.1, 0.018, 'sine');
  } else {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      tone(context, frequency, now + index * 0.11, 0.28, 0.04, 'triangle');
    });
  }
}