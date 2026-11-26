import * as THREE from 'three';
import { scene } from './scene.js';

function texturaOnca() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  const bola = (px, py, r, cor) => { x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fillStyle = cor; x.fill(); };
  x.fillStyle = '#d97c2b'; x.fillRect(0, 0, 512, 512);
  [[120,80,35],[300,150,45],[450,70,30],[80,280,40],[220,350,38],[400,300,42],[520,250,35],[150,470,32],[350,450,40],[480,420,36],
   [60,120,28],[420,180,33],[280,250,30],[180,200,25],[490,360,29],[90,390,27],[320,420,31],[440,490,26],[250,70,22],[380,520,24]]
    .forEach(([px, py, r]) => { bola(px, py, r, '#5a3a1a'); bola(px - 5, py - 3, r * 0.55, '#b87a3a'); bola(px + 8, py + 6, r * 0.25, '#3a2a1a'); });
  for (let i = 0; i < 180; i++) {
    const px = Math.random() * 512, py = Math.random() * 512, r = 4 + Math.random() * 12;
    bola(px, py, r, 'rgba(50,30,15,' + (0.6 + Math.random() * 0.4) + ')');
    if (Math.random() > 0.6) bola(px - 2, py - 2, r * 0.4, 'rgba(200,140,70,0.7)');
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const jaguarShape = [
  [0.04,0],[-0.03,0.16],[0,0.38],[-0.02,0.5],[-0.03,0.5],[-0.05,0.48],[-0.07,0.45],[-0.09,0.42],[-0.11,0.28],[-0.13,0.22],[-0.15,0.16],
  [-0.19,0.15],[-0.21,0.155],[-0.23,0.17],[-0.23,0.19],[-0.20,0.18],[-0.18,0.23],[-0.16,0.28],[-0.14,0.42],[-0.12,0.45],[-0.10,0.48],
  [-0.08,0.51],[-0.06,0.54],[-0.02,0.57],[0.02,0.6],[0.06,0.62],[0.70,0.68],[0.85,0.73],[1.0,0.7],[1.14,0.75],[1.17,0.78],[1.20,0.78],
  [1.23,0.75],[1.31,0.7],[1.33,0.67],[1.40,0.64],[1.40,0.54],[1.26,0.54],[1.12,0.52],[1.00,0.4],[0.97,0.03],[1.00,0.02],[1.00,0],
  [0.90,0],[0.85,0.30],[0.50,0.27],[0.20,0.30],[0.06,0.16],[0.123,0.03],[0.15,0.02],[0.15,0]];
const dogShape = [[0,0],[0,0.6],[0.06,0.47],[0.7,0.55],[0.8,0.8],[0.85,0.73],[1.1,0.6],[1.1,0.5],[0.9,0.5],[0.8,0.4],[0.8,0],[0.7,0],[0.7,0.2],[0.1,0.2],[0.1,0]];

function geometria(pts) {
  const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
  g.computeBoundingBox(); const b = g.boundingBox;
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); return g;
}
export const onca = new THREE.Mesh(geometria(jaguarShape), new THREE.MeshStandardMaterial({ map: texturaOnca(), roughness: 0.4, metalness: 0.1 }));
onca.scale.setScalar(0.36); onca.rotation.y = -Math.PI / 2; onca.castShadow = true; scene.add(onca);

const dogGeo = geometria(dogShape);
export function createDog(color, scale) {
  const m = new THREE.Mesh(dogGeo, new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.55 }));
  m.scale.setScalar(scale); m.rotation.y = -Math.PI / 2; m.castShadow = true; return m;
}
