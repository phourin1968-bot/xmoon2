// lib/soundEffects.ts
// Génération de sons synthétiques pour l'app

export function createSwipeSound(): AudioBuffer | null {
  if (typeof window === 'undefined') return null;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.1;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = Math.sin(2 * Math.PI * (800 - t * 4000) * t) * Math.exp(-t * 15);
  }
  
  return buffer;
}

export function createLikeSound(): AudioBuffer | null {
  if (typeof window === 'undefined') return null;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.3;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = (
      Math.sin(2 * Math.PI * 523.25 * t) + 
      Math.sin(2 * Math.PI * 659.25 * t) +
      Math.sin(2 * Math.PI * 783.99 * t)
    ) * Math.exp(-t * 5) * 0.3;
  }
  
  return buffer;
}

export function createMatchSound(): AudioBuffer | null {
  if (typeof window === 'undefined') return null;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.8;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const note1 = Math.sin(2 * Math.PI * 523.25 * t) * (t < 0.2 ? 1 : 0);
    const note2 = Math.sin(2 * Math.PI * 659.25 * t) * (t >= 0.2 && t < 0.4 ? 1 : 0);
    const note3 = Math.sin(2 * Math.PI * 783.99 * t) * (t >= 0.4 && t < 0.6 ? 1 : 0);
    const note4 = Math.sin(2 * Math.PI * 1046.50 * t) * (t >= 0.6 ? 1 : 0);
    
    data[i] = (note1 + note2 + note3 + note4) * Math.exp(-t * 3) * 0.4;
  }
  
  return buffer;
}

export function createSuperLikeSound(): AudioBuffer | null {
  if (typeof window === 'undefined') return null;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.4;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = (
      Math.sin(2 * Math.PI * (400 + t * 1200) * t) +
      Math.sin(2 * Math.PI * (800 + t * 2400) * t) * 0.5
    ) * Math.exp(-t * 6) * 0.3;
  }
  
  return buffer;
}

// Classe pour jouer les sons
export class SoundPlayer {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.loadSounds();
    }
  }
  
  private loadSounds() {
    const swipe = createSwipeSound();
    const like = createLikeSound();
    const match = createMatchSound();
    const superlike = createSuperLikeSound();
    
    if (swipe) this.sounds.set('swipe', swipe);
    if (like) this.sounds.set('like', like);
    if (match) this.sounds.set('match', match);
    if (superlike) this.sounds.set('superlike', superlike);
  }
  
  play(soundName: string) {
    if (!this.audioContext) return;
    
    const buffer = this.sounds.get(soundName);
    if (!buffer) return;
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = 0.8; // Volume à 30%
    
    source.start(0);
  }
}