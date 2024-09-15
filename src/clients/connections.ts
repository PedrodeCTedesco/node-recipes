// src/clients/connections.ts
import net from 'net';
import { manageConnections, serverConfig } from '../server/config.js';
import readline from 'readline';

export const startClient = () => {
  const client = net.createConnection({ port: serverConfig.port, host: serverConfig.host }, () => {
    console.log('Conectado ao servidor.');
  });

  // Recebe mensagens do servidor (mensagens de outros clientes)
  client.on('data', (data) => {
    console.log(data.toString());
  });

  client.on('end', () => {
    console.log('Conexão encerrada pelo servidor.');
  });

  // Captura a entrada do usuário e envia ao servidor
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input.toLowerCase() === 'exit') {
      client.end();  // Encerra a conexão quando o usuário digitar 'exit'
      rl.close();    // Encerra a interface de entrada
    } else {
      client.write(input);  // Envia a mensagem ao servidor
    }
  });
};
