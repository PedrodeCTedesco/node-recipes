import * as net from 'net';
import { connectionListener, serverConfig } from '../../config/tcp.config.js';
import { Server } from 'net';

export const startServer = () => {
  const server: Server = net.createServer((socket) => {
    connectionListener(socket);
  });

  server.listen(+serverConfig.port, serverConfig.host, () => {
    console.log(`Servidor TCP está rodando na porta ${serverConfig.port}`);
  });

  server.on('error', (err) => {
    if (err.message === 'EADDRINUSE') {
      console.log('Porta já está em uso. Tente outra porta.');
    } else {
      console.error('Erro no servidor:', err);
    }
  });

  server.on('close', () => {
    console.log('Servidor fechado');
  });
}

startServer();