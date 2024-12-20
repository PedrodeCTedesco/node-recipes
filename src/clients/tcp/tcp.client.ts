import net from 'net';
import { serverConfig } from '../../config/tcp.config.js';
import { setupUserInput } from '../common/user.input.js';

export const startTCPClient = () => {
  const client = net.createConnection({ 
    port: +serverConfig.port, 
    host: serverConfig.host 
  }, () => {
    console.log('Conectado ao servidor TCP.');
  });

  client.on('data', (data) => {
    console.log(data.toString());
  });

  client.on('error', (err) => {
    console.error('Erro na conexão:', err);
  });

  client.on('end', () => {
    console.log('Conexão encerrada pelo servidor.');
  });

  setupUserInput(client);
};

startTCPClient();