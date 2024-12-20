import * as dgram from 'dgram';
import { serverConfig } from '../../config/tcp.config.js';

export const startServer = () => {
  // Criar servidor UDP
  const server = dgram.createSocket('udp4');

  // Evento para receber mensagens
  server.on('message', (msg, rinfo) => {
    console.log(`Recebido: ${msg} de ${rinfo.address}:${rinfo.port}`);
    
    // Aqui você pode processar a mensagem recebida
    // E enviar uma resposta se necessário usando server.send()
  });

  // Evento quando o servidor está pronto
  server.on('listening', () => {
    const address = server.address();
    console.log(`Servidor UDP está rodando em ${address.address}:${address.port}`);
  });

  // Tratamento de erros
  server.on('error', (err) => {
    console.error('Erro no servidor:', err);
    server.close();
  });

  // Iniciar o servidor
  server.bind(+serverConfig.port, serverConfig.host);
}

startServer();