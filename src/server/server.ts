import * as net from 'net';
import { connectionListener, serverConfig } from './config.js';
import { Server } from 'net';


// Função para iniciar o servidor
export const startServer = ()=> {
  const server: Server = net.createServer((socket) => {
    connectionListener(socket);
  });

  server.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`Servidor TCP está rodando na porta ${serverConfig.port}`);
  });
}