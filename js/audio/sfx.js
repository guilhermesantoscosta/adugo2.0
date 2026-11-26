// Efeitos sonoros sintetizados (WebAudio), sem arquivos. Segue o controle de volume da tela.
let ctx, master, vol = 0.8;
const pronto = () => {
  if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
};
document.getElementById('volume-slider')?.addEventListener('input', e => { vol = e.target.value / 100; if (master) master.gain.value = vol; });
function tom(f0, f1, dur, tipo = 'sine', g = 0.3, atraso = 0) {
  pronto(); const t = ctx.currentTime + atraso, o = ctx.createOscillator(), a = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(a); a.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function ruido(dur, freq, g = 0.25) {
  pronto(); const n = (ctx.sampleRate * dur) | 0, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), a = ctx.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; a.gain.value = g;
  s.connect(f); f.connect(a); a.connect(master); s.start();
}
export const sfx = {
  selecionar: () => tom(520, 780, 0.08, 'triangle', 0.2),
  pulo: () => { tom(240, 560, 0.16, 'triangle', 0.15); ruido(0.12, 1800, 0.06); },
  pouso: () => { tom(170, 60, 0.12, 'sine', 0.4); ruido(0.05, 900, 0.1); },
  captura: () => { ruido(0.25, 300, 0.4); tom(190, 50, 0.3, 'sawtooth', 0.22); },
  erro: () => tom(170, 120, 0.14, 'square', 0.1),
  fim: () => [523, 659, 784, 1047].forEach((f, i) => tom(f, f, 0.25, 'triangle', 0.25, i * 0.12)),
};
