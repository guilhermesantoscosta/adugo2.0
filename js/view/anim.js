import { scene } from './scene.js';
// Pulo em parábola com esticar/amassar. Resolve quando a peça pousa.
export function pular(mesh, de, para, { dur = 350, altura = 0.4, y = 0.11, aoSubir, aoMeio, aoPousar } = {}) {
  const base = (mesh.userData.base ??= mesh.scale.clone()), t0 = performance.now();
  let meio = false;
  aoSubir?.();
  return new Promise(res => {
    const passo = now => {
      const t = Math.min(1, (now - t0) / dur), sy = 1 + 0.22 * Math.sin(Math.PI * t), sxz = 1 / Math.sqrt(sy);
      mesh.position.set(de.x + (para.x - de.x) * t, y + 4 * altura * t * (1 - t), de.z + (para.z - de.z) * t);
      mesh.scale.set(base.x * sxz, base.y * sy, base.z * sxz);
      if (!meio && t >= 0.5) { meio = true; aoMeio?.(); }
      if (t < 1) return requestAnimationFrame(passo);
      mesh.position.y = y; aoPousar?.(); amassar(mesh, base); res();
    };
    requestAnimationFrame(passo);
  });
}
function amassar(mesh, base) {
  const t0 = performance.now();
  const p = now => {
    const u = Math.min(1, (now - t0) / 140), sy = 1 - 0.25 * Math.sin(Math.PI * u), sxz = 1 / Math.sqrt(sy);
    mesh.scale.set(base.x * sxz, base.y * sy, base.z * sxz);
    if (u < 1) requestAnimationFrame(p); else mesh.scale.copy(base);
  };
  requestAnimationFrame(p);
}
// Peça capturada: gira, sobe e encolhe.
export function sumir(mesh) {
  const t0 = performance.now(), s0 = mesh.scale.clone(), y0 = mesh.position.y;
  const p = now => {
    const u = Math.min(1, (now - t0) / 350);
    mesh.scale.copy(s0).multiplyScalar(1 - u); mesh.position.y = y0 + 0.5 * u; mesh.rotation.z += 0.3;
    if (u < 1) requestAnimationFrame(p); else scene.remove(mesh);
  };
  requestAnimationFrame(p);
}
