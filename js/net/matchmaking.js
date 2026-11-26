// Pareamento 1x1 sem servidor próprio, usando o broker gratuito do PeerJS (global `Peer`).
// Fila: "slots" com IDs fixos. Quem chega visita os slots; se ninguém espera, ocupa um e aguarda.
const PRE = 'adugo-v1-', SLOTS = 5;
const sorteio = () => (Math.random() < 0.5 ? 'onca' : 'dog');
const rand = n => Math.random().toString(36).slice(2, 2 + n);

// Conecta num ID e espera o 'start' do anfitrião. Resolve {conn, lado} ou null.
function visitar(peer, id, ms = 3500) {
  return new Promise(res => {
    const conn = peer.connect(id, { reliable: true });
    let fim = false, t;
    const onErr = e => { if (e.type === 'peer-unavailable') sair(null); };
    const sair = v => { if (fim) return; fim = true; clearTimeout(t); peer.off('error', onErr); if (!v) try { conn.close(); } catch {} res(v); };
    peer.on('error', onErr);
    t = setTimeout(() => sair(null), ms);
    conn.on('open', () => conn.send({ t: 'hello' }));
    conn.on('data', d => { if (d?.t === 'start') sair({ conn, lado: d.hostLado === 'onca' ? 'dog' : 'onca' }); });
    conn.on('close', () => sair(null));
  });
}
// Anfitrião: ao receber o primeiro visitante, sorteia os lados e inicia.
function aceitar(p, conn, ctl, cb) {
  conn.on('open', () => {
    if (ctl.pareado) return conn.close();
    ctl.pareado = true; clearTimeout(ctl.retry);
    const lado = sorteio();
    conn.send({ t: 'start', hostLado: lado });
    cb.onPronto({ peer: p, conn, lado });
  });
}

export function entrarNaFila(cb) {
  const ctl = { cancelado: false, pareado: false, peer: null, retry: null };
  const hospedar = () => {
    let slot = 0;
    const tentar = () => {
      if (ctl.cancelado) return;
      if (slot >= SLOTS) { cb.onStatus?.('Fila cheia, tentando de novo...'); return setTimeout(ctl.iniciar, 2000); }
      const p = new Peer(PRE + slot); ctl.peer = p; let ok = false;
      p.on('open', () => {
        ok = true; cb.onStatus?.('Aguardando oponente...');
        p.on('connection', c => aceitar(p, c, ctl, cb));
        // Evita dois jogadores esperando em slots diferentes: reinicia a busca de tempos em tempos.
        if (slot > 0) ctl.retry = setTimeout(() => { if (!ctl.pareado) { p.destroy(); ctl.iniciar(); } }, 4000 + Math.random() * 4000);
      });
      p.on('error', e => {
        if (ok) return;
        if (e.type === 'unavailable-id') { p.destroy(); slot++; tentar(); } else cb.onErro?.(e);
      });
    };
    tentar();
  };
  ctl.iniciar = async () => {
    if (ctl.cancelado) return;
    cb.onStatus?.('Procurando oponente...');
    const p = new Peer(); ctl.peer = p;
    try { await new Promise((ok, no) => { p.on('open', ok); p.on('error', no); }); } catch (e) { return cb.onErro?.(e); }
    for (let s = 0; s < SLOTS && !ctl.cancelado; s++) {
      const r = await visitar(p, PRE + s);
      if (r) { ctl.pareado = true; return cb.onPronto({ peer: p, ...r }); }
    }
    p.destroy(); hospedar();
  };
  ctl.iniciar();
  return { cancelar() { ctl.cancelado = true; clearTimeout(ctl.retry); ctl.peer?.destroy(); } };
}

// Convite por código curto (substitui o ID longo do PeerJS).
export function criarSala(cb) {
  const ctl = { pareado: false }; let p;
  const abrir = () => {
    const codigo = rand(5); p = new Peer(PRE + 'sala-' + codigo);
    p.on('open', () => { cb.onCodigo(codigo.toUpperCase()); p.on('connection', c => aceitar(p, c, ctl, cb)); });
    p.on('error', e => e.type === 'unavailable-id' ? (p.destroy(), abrir()) : cb.onErro?.(e));
  };
  abrir();
  return { cancelar: () => p?.destroy() };
}
export function entrarNaSala(codigo, cb) {
  const p = new Peer();
  p.on('error', e => { if (e.type !== 'peer-unavailable') cb.onErro?.(e); });
  p.on('open', async () => {
    const r = await visitar(p, PRE + 'sala-' + codigo.trim().toLowerCase(), 6000);
    r ? cb.onPronto({ peer: p, ...r }) : cb.onErro?.({ type: 'sala-nao-encontrada' });
  });
  return { cancelar: () => p.destroy() };
}

// Mensagens da partida: jogada, desistência e queda de conexão.
export function abrirSessao(conn, { onJogada, onDesistiu, onSaiu }) {
  conn.on('data', d => { if (d?.t === 'move') onJogada(d.move); else if (d?.t === 'resign') onDesistiu(); });
  conn.on('close', onSaiu);
  return { enviarJogada: m => conn.send({ t: 'move', move: m }), desistir: () => conn.send({ t: 'resign' }), fechar: () => conn.close() };
}
