import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 14, 30);
export const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(7, 5, 9); camera.lookAt(0, 0.2, 1);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const raiz = document.getElementById('game-container');
raiz.appendChild(renderer.domElement);
export const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
raiz.appendChild(labelRenderer.domElement);
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.target.set(0, 0.1, 1.2);
controls.maxPolarAngle = Math.PI / 2.4; controls.minDistance = 3; controls.maxDistance = 18;

// Chão
const chao = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.95 }));
chao.rotation.x = -Math.PI / 2; chao.position.set(0, -0.15, 0.75); chao.receiveShadow = true; scene.add(chao);
const manchaMat = new THREE.MeshStandardMaterial({ color: 0x7a654a, roughness: 0.9, transparent: true, opacity: 0.3 });
for (let i = 0; i < 30; i++) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.4 + Math.random() * 0.8, 6), manchaMat);
  m.rotation.x = -Math.PI / 2; m.position.set((Math.random() - 0.5) * 20, -0.14, (Math.random() - 0.5) * 20 + 0.75); scene.add(m);
}

// Árvores
function arvore(x, z, s) {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.16 * s, 0.8 * s, 6), new THREE.MeshStandardMaterial({ color: 0x6b4a3a, roughness: 0.9 }));
  tronco.position.y = 0.4 * s; tronco.castShadow = true; g.add(tronco);
  const verdes = [0x3a7a3a, 0x4a8a4a, 0x2a6a2a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
  const copa = (r, dx, dy, dz, mat) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * s, 7, 7), verdes[mat]);
    b.position.set(dx * s, (1.2 + dy) * s, dz * s); b.castShadow = true; g.add(b);
  };
  copa(0.6, 0, 0, 0, 0);
  [[.55, .1, .4], [-.55, .1, -.3], [.3, -.1, .7], [-.3, -.1, -.6], [.5, .2, -.5], [-.5, .2, .5], [0, .25, 0]]
    .forEach(([dx, dy, dz]) => copa(0.35 + Math.random() * 0.25, dx, dy, dz, Math.random() > 0.5 ? 1 : 2));
  g.position.set(x, -0.15, z); return g;
}
const pos = [];
function plantar(n, rMin, rVar, sMin, sVar) {
  for (let i = 0; i < n; i++) for (let t = 0; t < 100; t++) {
    const a = Math.random() * Math.PI * 2, r = rMin + Math.random() * rVar, x = Math.cos(a) * r, z = Math.sin(a) * r + 0.75;
    if (Math.hypot(x, z - 0.75) < 5 || pos.some(p => Math.hypot(p.x - x, p.z - z) < 1.5)) continue;
    pos.push({ x, z, s: sMin + Math.random() * sVar }); break;
  }
}
plantar(30, 5, 4.5, 0.8, 0.7); plantar(25, 8, 6, 0.6, 0.6);
pos.forEach(p => scene.add(arvore(p.x, p.z, p.s)));

// Luzes
scene.add(new THREE.AmbientLight(0x8a9a8a, 0.5));
const sol = new THREE.DirectionalLight(0xfff5e6, 0.9);
sol.position.set(5, 10, 3); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
Object.assign(sol.shadow.camera, { near: 1, far: 25, left: -10, right: 10, top: 10, bottom: -10 });
scene.add(sol);
const luz2 = new THREE.DirectionalLight(0xcce0ff, 0.4); luz2.position.set(-3, 4, -2); scene.add(luz2);
