import { escolherJogada } from './ai.js';
self.onmessage = e => {
  const { estado, nivel, hist } = e.data;
  self.postMessage(escolherJogada(estado, nivel, new Map(hist)));
};
