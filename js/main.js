import './audio/music.js';
import './audio/sfx.js';
import { renderer, labelRenderer, camera, scene, controls } from './view/scene.js';
import { pulsar } from './view/boardView.js';
import { initJogo, novaPartida, pararPartida, receberJogada, finalizar } from './game/controller.js';
import { entrarNaFila, criarSala, entrarNaSala, abrirSessao } from './net/matchmaking.js';

const $ = id => document.getElementById(id);
let rede = null, busca = null, timer = null, noJogo = false;

// ---- Loop de render e resize
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
});
(function loop(t) {
  requestAnimationFrame(loop);
  if (!noJogo) return;
  controls.update(); pulsar(t); renderer.render(scene, camera); labelRenderer.render(scene, camera);
})();

// ---- Navegação
const status = t => ($('netStatus').textContent = t || '');
function cancelarBusca() { busca?.cancelar(); busca = null; status(''); $('btnFila').textContent = 'Jogar Online (fila)'; }
function mostrarMenu() {
  noJogo = false; pararPartida(); clearInterval(timer);
  $('menuWrapper').style.display = 'block'; $('game-container').style.display = 'none'; $('result-overlay').classList.remove('visible');
  rede?.conn?.close(); rede?.peer?.destroy(); rede = null; cancelarBusca();
}
function iniciar(cfg) {
  $('menuWrapper').style.display = 'none'; $('game-container').style.display = 'block'; noJogo = true;
  dispatchEvent(new Event('resize')); novaPartida(cfg);
}
function mostrarResultado(v) {
  const T = {
    onca: ['Onça venceu!', 'A onça capturou 5 cachorros e venceu a partida.'],
    dogs: ['Cachorros venceram!', 'Os cachorros cercaram a onça e venceram a partida.'],
    abandono: ['Vitória!', 'O oponente saiu da partida.'],
  }[v] || ['Fim de jogo!', ''];
  $('winnerText').textContent = T[0]; $('subText').textContent = T[1];
  $('result-overlay').classList.add('visible');
  let s = 10; $('timerText').textContent = `Voltando ao menu em ${s}s`;
  clearInterval(timer);
  timer = setInterval(() => { s--; $('timerText').textContent = `Voltando ao menu em ${s}s`; if (s <= 0) mostrarMenu(); }, 1000);
}
initJogo({ onFim: mostrarResultado, onSair: mostrarMenu });

// ---- Online
function partidaOnline({ peer, conn, lado }) {
  busca = null; status(''); $('btnFila').textContent = 'Jogar Online (fila)';
  const sessao = abrirSessao(conn, { onJogada: receberJogada, onDesistiu: () => finalizar('abandono'), onSaiu: () => finalizar('abandono') });
  rede = { peer, conn };
  iniciar({ modo: 'online', lado, sessao });
}
const erroRede = e => { cancelarBusca(); status('Não foi possível conectar (' + (e?.type || 'erro') + ').'); };

// ---- Botões do menu
const nivel = () => $('nivel').value;
$('btnCpuOnca').onclick = () => iniciar({ modo: 'cpu_onca', nivel: nivel() });
$('btnCpuDog').onclick = () => iniciar({ modo: 'cpu_dog', nivel: nivel() });
$('btnPvp').onclick = () => iniciar({ modo: 'pvp' });
$('btnFila').onclick = () => {
  if (busca) return cancelarBusca();
  $('btnFila').textContent = 'Cancelar busca';
  busca = entrarNaFila({ onStatus: status, onPronto: partidaOnline, onErro: erroRede });
};
$('btnHost').onclick = () => {
  cancelarBusca();
  busca = criarSala({ onCodigo: c => status('Código da sala: ' + c + ' — aguardando oponente...'), onPronto: partidaOnline, onErro: erroRede });
};
$('btnJoin').onclick = () => {
  const c = prompt('Digite o código da sala:'); if (!c) return;
  cancelarBusca(); status('Conectando...');
  busca = entrarNaSala(c, { onPronto: partidaOnline, onErro: erroRede });
};

// ---- Regras, créditos e sair
const alternar = (a, b) => { $(b).classList.remove('visible'); $(a).classList.toggle('visible'); };
$('howtoBtn').onclick = e => { e.stopPropagation(); alternar('rulesOverlay', 'creditsOverlay'); };
$('creditsBtn').onclick = e => { e.stopPropagation(); alternar('creditsOverlay', 'rulesOverlay'); };
$('closeRulesBtn').onclick = () => $('rulesOverlay').classList.remove('visible');
$('closeCreditsBtn').onclick = () => $('creditsOverlay').classList.remove('visible');
document.querySelector('[data-action="exit"]').onclick = () => confirm('Deseja realmente sair?') && window.close();
