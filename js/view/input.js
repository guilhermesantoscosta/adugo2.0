// Toque/clique: age ao soltar e ignora arrastos (girar a câmera não gera jogada).
export function iniciarInput(el, aoToque) {
  let ini = null;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { ini = e.isPrimary ? { x: e.clientX, y: e.clientY } : null; });
  el.addEventListener('pointerup', e => { if (ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 10) aoToque(e.clientX, e.clientY); ini = null; });
  el.addEventListener('pointercancel', () => (ini = null));
}
