// src/main.ts
import { startServer } from './server/server.js';
import { startClient } from './clients/connections.js';

// Inicia o servidor
startServer();

// Aguarda 1 segundo e inicia o cliente
setTimeout(() => {
  startClient();
}, 1000);
