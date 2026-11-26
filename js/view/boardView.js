import * as THREE from 'three';
import { scene, camera, renderer } from './scene.js';
import { vertexPos, segments } from '../core/board.js';

// Casas e linhas
const discoMat = new THREE.MeshStandardMaterial({ color: 0xD4A373, roughness: 0.4, emissive: 0x442200, emissiveIntensity: 0.15 });
const aroMat = new THREE.MeshStandardMaterial({ color: 0xB87C4F });
const discoGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.025, 20), aroGeo = new THREE.TorusGeometry(0.105, 0.018, 12, 24);
vertexPos.forEach(p => {
  const d = new THREE.Mesh(discoGeo, discoMat); d.position.set(p.x, 0.025, p.z);
  const a = new THREE.Mesh(aroGeo, aroMat); a.rotation.x = Math.PI / 2; a.position.set(p.x, 0.032, p.z);
  scene.add(d, a);
});
segments.forEach(([a, b]) => scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, 0.012, a.z), new THREE.Vector3(b.x, 0.012, b.z)]),
  new THREE.LineBasicMaterial({ color: 0x3a2a1a }))));

// Marcadores: anéis verdes nos destinos válidos e anel dourado no cachorro selecionado
const anel = (r, cor) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 10, 28), new THREE.MeshBasicMaterial({ color: cor })); m.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); return m; };
const marcas = vertexPos.map(p => { const m = anel(0.17, 0x9be564); m.position.set(p.x, 0.05, p.z); return m; });
const anelSel = anel(0.2, 0xffdd66);
export const marcar = idx => { marcas.forEach(m => (m.visible = false)); idx.forEach(i => (marcas[i].visible = true)); };
export const selecionarAnel = p => { anelSel.visible = !!p; if (p) anelSel.position.set(p.x, 0.06, p.z); };
export const pulsar = t => { const k = 1 + 0.12 * Math.sin(t * 0.006); marcas.forEach(m => m.visible && m.scale.set(k, k, k)); };

// Seleção por proximidade na tela: alvo grande no celular, sem exigir acertar o disco de 0,1.
const tmp = new THREE.Vector3();
function tela(x, y, z) {
  const r = renderer.domElement.getBoundingClientRect(); tmp.set(x, y, z).project(camera);
  return { x: r.left + ((tmp.x + 1) / 2) * r.width, y: r.top + ((1 - tmp.y) / 2) * r.height };
}
export function maisProximo(cx, cy, itens, fator = 0.5) {
  const a = tela(0, 0.1, 0), b = tela(1, 0.1, 0);
  let melhor = null, dm = Math.max(26, Math.hypot(a.x - b.x, a.y - b.y) * fator);
  for (const it of itens) { const p = tela(it.x, it.y ?? 0.1, it.z), d = Math.hypot(p.x - cx, p.y - cy); if (d < dm) { dm = d; melhor = it.id; } }
  return melhor;
}
