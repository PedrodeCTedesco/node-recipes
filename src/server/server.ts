import * as net from 'net';
import { connectionListener, HOST, PORT } from './config.js';
import { Server } from 'net';


// Função para iniciar o servidor
export const startServer = ()=> {
  const server: Server = net.createServer((socket) => {
    connectionListener(socket);
  });

  server.listen(PORT, HOST, () => {
    console.log(`Servidor TCP está rodando na porta ${PORT}`);
  });
}