// Roda a IA num Worker (não trava a tela); se falhar, roda direto.
let w = null;
export async function pensar(estado, nivel, hist = new Map()) {
  try {
    w ??= new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    return await new Promise((ok, err) => {
      w.onmessage = e => ok(e.data); w.onerror = err;
      w.postMessage({ estado, nivel, hist: [...hist] });
    });
  } catch { w = null; const { escolherJogada } = await import('./ai.js'); return escolherJogada(estado, nivel, hist); }
}
