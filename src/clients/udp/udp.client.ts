import dgram from 'dgram';
import { serverConfig } from '../../config/udp.config.js';
import { setupUserInput } from '../common/user.input.js';

export const startUDPClient = () => {
  const client = dgram.createSocket('udp4');
  
  client.on('message', (msg, rinfo) => {
    console.log(`${rinfo.address}:${rinfo.port} > ${msg.toString()}`);
  });

  client.on('error', (err) => {
    console.error('Erro no cliente UDP:', err);
    client.close();
  });

  // Keep-alive para manter o cliente ativo no servidor
  const keepAlive = setInterval(() => {
    sendMessage(client, 'keepalive');
  }, 15000);

  const messageHandler = {
    send: (message: string) => sendMessage(client, message),
    close: () => {
      clearInterval(keepAlive);
      client.close();
    }
  };

  setupUserInput(messageHandler);
};

function sendMessage(client: dgram.Socket, message: string) {
  client.send(message, +serverConfig.port, serverConfig.host, (err) => {
    if (err) console.error('Erro ao enviar mensagem:', err);
  });
}

startUDPClient();