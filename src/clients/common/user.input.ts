import readline from 'readline';
import { Socket } from 'net';

interface MessageHandler {
  send: (message: string) => void;
  close: () => void;
}

export const setupUserInput = (client: Socket | MessageHandler) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input.toLowerCase() === 'exit') {
      if ('end' in client) {
        client.end();  // TCP
      } else {
        client.close(); // UDP
      }
      rl.close();
      return;
    }

    if ('write' in client) {
      client.write(input + '\n');  // TCP - Adicionado '\n' aqui
    } else {
      client.send(input);   // UDP
    }
  });

  rl.on('close', () => {
    console.log('Cliente encerrado.');
    process.exit(0);
  });
};