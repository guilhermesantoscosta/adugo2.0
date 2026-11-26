// IA: minimax + poda alfa-beta + aprofundamento iterativo + tabela de transposição.
import { vertexPos, NORMAL } from '../core/board.js';
import { movimentos, aplicar, chave, CAPTURE_GOAL } from '../core/rules.js';

export const NIVEIS = {
  facil:   { prof: 2,  ms: 250,  erro: 0.35 },
  medio:   { prof: 4,  ms: 600,  erro: 0.08 },
  dificil: { prof: 14, ms: 1500, erro: 0 },
};
const TT = new Map();
let nos = 0, fim = 0, abortou = false;

// Pontuação do ponto de vista da onça (maior = melhor para a onça).
function avaliar(s, om) {
  let amea = 0;
  for (const m of om) if (m.type === 'capture') amea++;
  const p = vertexPos[s.onca];
  let v = s.capturas * 600 + om.length * 14 + amea * (s.turno === 'onca' ? 90 : 35) - Math.hypot(p.x, p.z) * 8;
  if (om.length === 1) v -= 120;
  for (const d of s.dogs) if (NORMAL[s.onca].includes(d)) v -= 15;
  return v;
}
function ordenar(s, ms) {
  const p = vertexPos[s.onca];
  const peso = m => m.type === 'capture' ? -100 : s.turno === 'onca' ? 0
    : Math.hypot(vertexPos[m.to].x - p.x, vertexPos[m.to].z - p.z);
  return ms.sort((a, b) => peso(a) - peso(b));
}
function busca(s, prof, alfa, beta) {
  if ((++nos & 255) === 0 && Date.now() > fim) abortou = true;
  if (abortou) return 0;
  if (s.capturas >= CAPTURE_GOAL) return 10000 + prof;
  const om = movimentos(s, 'onca');
  if (!om.length) return -10000 - prof;
  if (prof === 0) return avaliar(s, om);
  const k = chave(s), e = TT.get(k);
  if (e && e.p >= prof && (e.f === 0 || (e.f === 1 && e.v >= beta) || (e.f === 2 && e.v <= alfa))) return e.v;
  const max = s.turno === 'onca';
  const ms = ordenar(s, max ? om : movimentos(s, 'dog'));
  if (!ms.length) return avaliar(s, om);
  const a0 = alfa, b0 = beta;
  let melhor = max ? -Infinity : Infinity;
  for (const m of ms) {
    const v = busca(aplicar(s, m), prof - 1, alfa, beta);
    if (max) { if (v > melhor) melhor = v; if (melhor > alfa) alfa = melhor; }
    else { if (v < melhor) melhor = v; if (melhor < beta) beta = melhor; }
    if (beta <= alfa) break;
  }
  if (abortou) return 0;
  TT.set(k, { p: prof, v: melhor, f: melhor <= a0 ? 2 : melhor >= b0 ? 1 : 0 });
  return melhor;
}

// hist: Map(chave(estado) -> vezes vista), usado para evitar repetição infinita.
export function escolherJogada(s, nivel = 'medio', hist = new Map()) {
  const cfg = NIVEIS[nivel] || NIVEIS.medio;
  const todos = movimentos(s);
  if (!todos.length) return null;
  const max = s.turno === 'onca';
  fim = Date.now() + cfg.ms; abortou = false; nos = 0;
  if (TT.size > 200000) TT.clear();
  let pontos = new Map(todos.map(m => [m, 0]));
  for (let d = 1; d <= cfg.prof; d++) {
    const ord = [...todos].sort((a, b) => max ? pontos.get(b) - pontos.get(a) : pontos.get(a) - pontos.get(b));
    const novo = new Map();
    for (const m of ord) {
      const ns = aplicar(s, m);
      const v = busca(ns, d - 1, -Infinity, Infinity);
      if (abortou) break;
      novo.set(m, v + (max ? -1 : 1) * 30 * (hist.get(chave(ns)) || 0));
    }
    if (abortou) break;
    pontos = novo;
    const vs = [...novo.values()];
    if (Math.abs(max ? Math.max(...vs) : Math.min(...vs)) >= 10000) break; // vitória/derrota forçada
  }
  const ranque = [...pontos].sort((a, b) => max ? b[1] - a[1] : a[1] - b[1]);
  let cand = ranque.filter(([, v]) => Math.abs(v - ranque[0][1]) <= 3).map(([m]) => m);
  if (Math.random() < cfg.erro) cand = ranque.slice(0, 3).map(([m]) => m);
  return cand[Math.floor(Math.random() * cand.length)];
}
