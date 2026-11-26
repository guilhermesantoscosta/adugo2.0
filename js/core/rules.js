// Regras puras. Estado: { onca, dogs:[posições], capturas, turno:'onca'|'dog' }
import { NORMAL, JUMPS } from './board.js';
export const CAPTURE_GOAL = 5, ONCA_START = 12;

export function novoEstado() {
  const dogs = [];
  for (let i = 0; i <= 14; i++) if (i !== ONCA_START) dogs.push(i);
  return { onca: ONCA_START, dogs, capturas: 0, turno: 'onca' };
}
export const clonar = s => ({ onca: s.onca, dogs: s.dogs.slice(), capturas: s.capturas, turno: s.turno });
const ocupacao = s => { let m = 1 << s.onca; for (const d of s.dogs) m |= 1 << d; return m; };
export const chave = s => { let m = 0; for (const d of s.dogs) m |= 1 << d; return m + '|' + s.onca + '|' + s.turno + '|' + s.capturas; };

// Cachorro: from = índice do cachorro. Onça: from = casa.
export function movimentos(s, turno = s.turno) {
  const occ = ocupacao(s), out = [];
  if (turno === 'onca') {
    for (const to of NORMAL[s.onca]) if (!((occ >> to) & 1)) out.push({ turno, from: s.onca, to, type: 'normal' });
    for (const { over, to } of JUMPS[s.onca]) {
      if ((occ >> to) & 1) continue;
      const i = s.dogs.indexOf(over);
      if (i >= 0) out.push({ turno, from: s.onca, to, type: 'capture', dogIndex: i });
    }
  } else {
    s.dogs.forEach((pos, i) => { for (const to of NORMAL[pos]) if (!((occ >> to) & 1)) out.push({ turno, from: i, to, type: 'normal' }); });
  }
  return out;
}
export function aplicar(s, m) {
  const n = clonar(s);
  if (m.turno === 'onca') {
    n.onca = m.to;
    if (m.type === 'capture') { n.dogs.splice(m.dogIndex, 1); n.capturas++; }
    n.turno = 'dog';
  } else { n.dogs[m.from] = m.to; n.turno = 'onca'; }
  return n;
}
export function vencedor(s) {
  if (s.capturas >= CAPTURE_GOAL) return 'onca';
  return movimentos(s, 'onca').length ? null : 'dogs';
}
// Valida jogada vinda do oponente; devolve a jogada legal equivalente ou null.
export function validarRemota(s, m, ladoRemoto) {
  if (!m || s.turno !== ladoRemoto || m.turno !== ladoRemoto) return null;
  return movimentos(s).find(x => x.type === m.type && x.from === m.from && x.to === m.to) || null;
}
