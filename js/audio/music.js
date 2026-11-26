// Música de fundo sintetizada + controle de volume da tela.
const CICLO = 3.0;
const padrao = [
  [0.0,'D2',0.5],[0.5,'D2',0.2],[0.7,'D2',0.4],[1.1,'G2',0.4],[1.5,'C2',0.5],[2.0,'C2',0.2],[2.2,'C2',0.4],[2.6,'E2',0.4],
  [0.0,'D4',0.4],[0.4,'D4',0.2],[0.6,'G4',0.4],[1.0,'C4',0.5],[1.5,'C4',0.4],[1.9,'C4',0.5],[2.4,'E4',0.6]];
let ctx = null, tocando = false, timer = null, proximoInicio = 0, master = null, volume = 0.8, notas = [];

function freq(nota) {
  const nomes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const i = nomes.indexOf(nota.slice(0, -1)); if (i < 0) return 0;
  return 440 * Math.pow(2, ((parseInt(nota.slice(-1)) - 4) * 12 + (i - 9)) / 12);
}
function nota(f, ini, dur) {
  if (!ctx || !master) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 2000; fl.Q.value = 1;
    g.gain.setValueAtTime(0, ini); g.gain.linearRampToValueAtTime(0.35, ini + 0.02);
    const rel = Math.max(ini + dur - 0.12, ini + 0.021); g.gain.setValueAtTime(0.35, rel);
    g.gain.exponentialRampToValueAtTime(0.001, ini + dur);
    o.connect(fl); fl.connect(g); g.connect(master); o.start(ini); o.stop(ini + dur + 0.05);
    notas.push({ o, g, fl });
  } catch (e) {}
}
function agendar() {
  if (!tocando) return;
  try {
    const ini = Math.max(ctx.currentTime, proximoInicio);
    padrao.forEach(([t, n, d]) => nota(freq(n), ini + t, d));
    proximoInicio = ini + CICLO;
    timer = setTimeout(agendar, Math.max((proximoInicio - ctx.currentTime) * 1000, 10));
  } catch (e) { timer = setTimeout(agendar, 1000); }
}
function iniciar() {
  if (tocando) return;
  try {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    tocando = true; proximoInicio = ctx.currentTime; agendar();
  } catch (e) {}
}
function setVolume(v) {
  volume = Math.max(0, Math.min(1, v / 100));
  if (master) try { master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05); } catch (e) {}
  document.getElementById('vol-display').textContent = Math.round(v) + '%';
}

const botao = document.getElementById('volume-toggle'), caixa = document.getElementById('volume-slider-wrap'), barra = document.getElementById('volume-slider');
let aberta = false;
botao.addEventListener('click', e => { e.stopPropagation(); aberta = !aberta; caixa.classList.toggle('open', aberta); });
barra.addEventListener('input', e => setVolume(parseInt(e.target.value)));
document.addEventListener('click', e => { if (aberta && !caixa.contains(e.target) && e.target !== botao) { caixa.classList.remove('open'); aberta = false; } });
setVolume(80);
const primeiro = () => { iniciar(); document.removeEventListener('click', primeiro); document.removeEventListener('touchstart', primeiro); };
document.addEventListener('click', primeiro); document.addEventListener('touchstart', primeiro);
