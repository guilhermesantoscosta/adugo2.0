// Grafo do tabuleiro, sem THREE. Os índices são os mesmos do jogo original
// (12 = centro, 22 = entrada da toca, 25..30 = toca).
export const segments = [];
const seg = (x1, z1, x2, z2) => segments.push([{ x: x1, z: z1 }, { x: x2, z: z2 }]);
for (let i = -2; i <= 2; i++) { seg(i, -2, i, 2); seg(-2, i, 2, i); }
seg(-2, -2, 2, 2); seg(-2, 2, 2, -2);
seg(-2, 0, 0, 2); seg(0, 2, 2, 0); seg(2, 0, 0, -2); seg(0, -2, -2, 0);
const baseZ = 2 + Math.sqrt(3), meioZ = (2 + baseZ) / 2;
seg(0, 2, -1, baseZ); seg(0, 2, 1, baseZ); seg(-1, baseZ, 1, baseZ); seg(0, 2, 0, baseZ);
seg(0, meioZ, -0.5, meioZ); seg(0, meioZ, 0.5, meioZ);

function cruza(a, b, c, d) {
  const den = (a.x - b.x) * (c.z - d.z) - (a.z - b.z) * (c.x - d.x);
  if (Math.abs(den) < 1e-8) return null;
  const t = ((a.x - c.x) * (c.z - d.z) - (a.z - c.z) * (c.x - d.x)) / den;
  const u = -((a.x - b.x) * (a.z - c.z) - (a.z - b.z) * (a.x - c.x)) / den;
  const e = 1e-9;
  return t >= -e && t <= 1 + e && u >= -e && u <= 1 + e
    ? { x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z) } : null;
}
const r6 = v => Math.round(v * 1e6) / 1e6;
const mapa = new Map();
const add = p => { const q = { x: r6(p.x), z: r6(p.z) }; mapa.set(q.x + ',' + q.z, q); };
segments.forEach(([a, b]) => { add(a); add(b); });
for (let i = 0; i < segments.length; i++)
  for (let j = i + 1; j < segments.length; j++) {
    const p = cruza(...segments[i], ...segments[j]);
    if (p) add(p);
  }
export const vertexPos = [...mapa.values()].sort((a, b) => a.z - b.z || a.x - b.x);
export const V = vertexPos.length; // 31

const adj = vertexPos.map((p, i) => vertexPos.map((q, j) => j).filter(j => j !== i &&
  Math.hypot(p.x - vertexPos[j].x, p.z - vertexPos[j].z) < 1.9));
const TOCA = { 22: [25, 26, 27], 25: [22, 26, 28], 26: [22, 25, 27, 29], 27: [22, 26, 30], 28: [25, 29], 29: [26, 28, 30], 30: [27, 29] };
const inToca = i => i >= 25 && i <= 30;
export const ehDiagonal = (a, b) => {
  const dx = Math.abs(vertexPos[b].x - vertexPos[a].x), dz = Math.abs(vertexPos[b].z - vertexPos[a].z);
  return Math.abs(dx - dz) < 0.01 && dx > 0.01;
};

function passoEstatico(from, to) {
  if (from === to) return false;
  const fT = inToca(from), tT = inToca(to);
  if (fT || tT) {
    if (tT && !fT && from !== 22) return false;
    if (fT && !tT && to !== 22) return false;
    return !!(TOCA[from]?.includes(to) || TOCA[to]?.includes(from));
  }
  if (!adj[from].includes(to)) return false;
  return !(ehDiagonal(from, to) && from % 2 !== 0);
}

const jm = new Map();
const addJump = (f, o, t) => { if (!jm.has(f)) jm.set(f, new Map()); jm.get(f).set(t, o); };
[[30,29,28],[30,27,22],[29,26,22],[28,25,22],[28,29,30],[27,22,16],[27,26,25],[26,22,17],
 [25,22,18],[25,26,27],[22,27,30],[22,26,29],[22,25,28],[16,22,27],[17,22,26],[18,22,25]]
  .forEach(j => addJump(...j));
for (let i = 0; i < V; i++) {
  if (inToca(i)) continue;
  for (let j = i + 1; j < V; j++) {
    if (inToca(j)) continue;
    const mx = (vertexPos[i].x + vertexPos[j].x) / 2, mz = (vertexPos[i].z + vertexPos[j].z) / 2;
    for (let k = 0; k < V; k++) {
      if (k === i || k === j) continue;
      if (Math.abs(vertexPos[k].x - mx) < 0.05 && Math.abs(vertexPos[k].z - mz) < 0.05 &&
          adj[i].includes(k) && adj[k].includes(j) && !jm.get(i)?.has(j)) {
        addJump(i, k, j); addJump(j, k, i);
      }
    }
  }
}
for (const [from, m] of jm) if (from % 2 !== 0) for (const to of [...m.keys()]) if (ehDiagonal(from, to)) m.delete(to);

// Tabelas pré-calculadas: o motor e a IA só consultam estas listas.
export const NORMAL = Array.from({ length: V }, (_, f) => [...Array(V).keys()].filter(t => passoEstatico(f, t)));
export const JUMPS = Array.from({ length: V }, (_, f) => [...(jm.get(f) || [])].map(([to, over]) => ({ over, to })));
