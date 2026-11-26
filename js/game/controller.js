// Fluxo da partida: turnos, IA, jogadas remotas, animação e HUD.
import { vertexPos } from '../core/board.js';
import { novoEstado, movimentos, aplicar, vencedor, chave, validarRemota } from '../core/rules.js';
import { pensar } from '../ai/client.js';
import { onca, createDog } from '../view/models.js';
import { scene, renderer } from '../view/scene.js';
import { marcar, selecionarAnel, maisProximo } from '../view/boardView.js';
import { pular, sumir } from '../view/anim.js';
import { iniciarInput } from '../view/input.js';
import { sfx } from '../audio/sfx.js';

const $ = id => document.getElementById(id);
let cb = {}, cfg = {}, estado, hist, dogMeshes = [], sel = null, ocupado = false, ativo = false, partida = 0, fila = [];

const souEu = t => cfg.modo === 'online' ? t === cfg.lado : cfg.modo === 'cpu_onca' ? t === 'onca' : cfg.modo === 'cpu_dog' ? t === 'dog' : true;

export function initJogo(callbacks) {
  cb = callbacks;
  iniciarInput(renderer.domElement, aoToque);
  $('voltar-btn').onclick = () => $('confirm-modal').classList.add('visible');
  $('confirm-nao').onclick = () => $('confirm-modal').classList.remove('visible');
  $('confirm-sim').onclick = () => { $('confirm-modal').classList.remove('visible'); cfg.sessao?.desistir(); cb.onSair(); };
}
export function novaPartida(c) {
  cfg = c; estado = novoEstado(); hist = new Map(); fila = []; sel = null; ocupado = false; ativo = true; partida++;
  dogMeshes.forEach(m => scene.remove(m));
  dogMeshes = estado.dogs.map(p => { const d = createDog(0x4A2A12, 0.32); d.position.set(vertexPos[p].x, 0.11, vertexPos[p].z); scene.add(d); return d; });
  onca.position.set(vertexPos[estado.onca].x, 0.11, vertexPos[estado.onca].z);
  if (c.modo === 'online') aviso('Você joga de ' + (c.lado === 'onca' ? 'ONÇA' : 'CACHORROS'));
  proximo();
}
export const pararPartida = () => { ativo = false; partida++; };
export const finalizar = v => { if (ativo) fimJogo(v); };

function hud() {
  $('turn-indicator').textContent = 'Turno: ' + (estado.turno === 'onca' ? 'ONÇA' : 'CACHORRO') +
    (cfg.modo === 'online' ? (souEu(estado.turno) ? ' (você)' : ' (oponente)') : '');
  $('dogs-left').textContent = estado.dogs.length; $('captures').textContent = estado.capturas;
}
function marcas() {
  const dono = ativo && !ocupado && souEu(estado.turno);
  let dest = [];
  if (dono) {
    const ms = movimentos(estado);
    dest = estado.turno === 'onca' ? ms.map(m => m.to) : sel == null ? [] : ms.filter(m => m.from === sel).map(m => m.to);
  }
  marcar(dest);
  selecionarAnel(dono && estado.turno === 'dog' && sel != null ? vertexPos[estado.dogs[sel]] : null);
}
function proximo() {
  if (!ativo) return;
  hud(); marcas();
  if (souEu(estado.turno) || cfg.modo === 'online') return;
  const id = partida;
  Promise.all([pensar(estado, cfg.nivel, hist), new Promise(r => setTimeout(r, 350))])
    .then(([m]) => { if (ativo && id === partida && m && !ocupado) executar(m); });
}

function aoToque(x, y) {
  if (!ativo || ocupado) return;
  if (!souEu(estado.turno)) return aviso(cfg.modo === 'online' ? 'Aguardando oponente...' : 'A CPU está pensando...', true);
  const ms = movimentos(estado), cao = estado.turno === 'dog';
  const itens = (cao ? (sel == null ? [] : ms.filter(m => m.from === sel)) : ms)
    .map(m => ({ id: m, x: vertexPos[m.to].x, z: vertexPos[m.to].z }));
  if (cao) estado.dogs.forEach((p, i) => itens.push({ id: i, x: vertexPos[p].x, y: 0.25, z: vertexPos[p].z }));
  const alvo = maisProximo(x, y, itens);
  if (alvo == null) return sfx.erro();
  if (typeof alvo === 'number') { sel = alvo === sel ? null : alvo; sfx.selecionar(); return marcas(); }
  if (cfg.modo === 'online') cfg.sessao.enviarJogada(alvo);
  executar(alvo);
}
export function receberJogada(msg) {
  if (!ativo) return;
  if (ocupado) return void fila.push(msg);
  const m = validarRemota(estado, msg, cfg.lado === 'onca' ? 'dog' : 'onca');
  if (!m) return fimJogo('abandono'); // jogada ilegal = oponente perde
  executar(m);
}

async function executar(m) {
  ocupado = true; sel = null; marcas();
  const antes = estado, id = partida;
  estado = aplicar(estado, m);
  const k = chave(estado); hist.set(k, (hist.get(k) || 0) + 1);
  const cap = m.type === 'capture' ? dogMeshes.splice(m.dogIndex, 1)[0] : null;
  const ehOnca = m.turno === 'onca', mesh = ehOnca ? onca : dogMeshes[m.from];
  const de = vertexPos[ehOnca ? m.from : antes.dogs[m.from]], para = vertexPos[m.to];
  const d = Math.hypot(para.x - de.x, para.z - de.z);
  await pular(mesh, de, para, {
    dur: 280 + 110 * d, altura: 0.22 + 0.18 * d, aoSubir: sfx.pulo, aoPousar: sfx.pouso,
    aoMeio: () => { if (cap) { sfx.captura(); sumir(cap); } },
  });
  if (id !== partida) return;
  ocupado = false; hud();
  const v = vencedor(estado);
  if (v) return fimJogo(v);
  if (fila.length) return receberJogada(fila.shift());
  proximo();
}
function fimJogo(v) {
  ativo = false; marcas(); sfx.fim();
  $('turn-indicator').textContent = v === 'onca' ? '🏆 FIM DE JOGO - ONÇA VENCEU 🏆' : v === 'dogs' ? '🏆 FIM DE JOGO - CACHORROS VENCERAM 🏆' : 'FIM DE JOGO';
  cb.onFim(v);
}
function aviso(txt, erro) {
  const d = document.createElement('div'); d.className = 'move-hint'; d.textContent = txt;
  d.style.background = erro ? 'rgba(100,30,20,0.9)' : 'rgba(30,60,40,0.9)';
  $('game-container').appendChild(d); setTimeout(() => d.remove(), 1500);
}
