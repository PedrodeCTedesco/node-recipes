import net, { Socket } from 'net';
import { handleDisconnection, currentConnections, MAX_CONNECTIONS, totalWritten } from '../server/config.js';

export const queue: any = [];

// Define as conexões, i.e., os clientes que se conectam com o servidor e institui um tempo de conexão
export const connections = async (timeout: number, message: string, onConnect: () => void, success: boolean, name: string) => {
  return new Promise<void>((resolve, reject) => {
    const socket: Socket = net.createConnection({
      port: 8181,
      host: '127.0.0.1'
    });

    // Acumulador para os dados recebidos
    let buffer = '';

    socket.on('connect', () => {
      const saudacao = {
        name: name,
        message: message
      };

      // Envia a saudação para o servidor
      socket.write(JSON.stringify(saudacao), () => {
        // Aguarda a resposta do servidor
        socket.on('data', (data) => {
          console.log('Resposta do servidor:', data.toString());

          // Após receber a resposta, prepara para enviar as informações do socket
          const totalWrittenFromConfig: number = socket.bytesWritten;
          const socketInfo = {
            totalBytesWritten: totalWrittenFromConfig,
            address: socket.localAddress,  // Usa localAddress para o cliente
            port: socket.localPort,        // Usa localPort para o cliente
          };

          // Envia as informações do socket antes de encerrar a conexão
          socket.write(JSON.stringify(socketInfo), () => {
            console.log('Informações do socket enviadas:', socketInfo);

            // Após enviar as informações, encerra a conexão
            socket.end();
            resolve();
          });
        });
      });
    });

    socket.on('data', (data: Buffer) => {
      buffer += data.toString();  // Acumula os dados recebidos no buffer

      try {
        const parsedData = JSON.parse(buffer); // Tenta parsear o buffer como JSON completo
        if (parsedData.name) {
          console.log('Nome recebido:', parsedData.name);
          socket.write('hello ' + parsedData.name);
        }
        buffer = '';  // Limpa o buffer após processar os dados com sucesso
      } catch (e) {
        // Mantém o buffer até que o JSON completo seja recebido
        console.error('Erro ao processar dados:', e instanceof Error ? e.message : "");
      }
    });

    socket.on('end', () => {
      resolve();
    });

    socket.on('error', (error) => {
      console.error(`Erro na conexão ${message}:`, error.message);
      socket.destroy();
      reject(error);
    });

    // Desconectar a conexão após o timeout
    setTimeout(() => {
      const seconds = Math.floor(timeout / 1000);
      console.log(`${message} desconectada após ${seconds} segundos.`);
      socket.destroy();
      reject(new Error(`Conexão ${message} desconectada após ${seconds} segundos.`));
    }, timeout);
  }).then(() => {
    if (success) {
      console.log("Processo bem-sucedido");
    }
  }).catch((error) => {
    console.error(`Erro na conexão ${message}:`, error.message);
  });
};

// função para estabelecer as conexões
export const tryConnect = async () => {
  if (queue.length > 0 && currentConnections <= MAX_CONNECTIONS) {
    const { timeout, message, name } = queue.shift();
    try {
      await connections(timeout, message, tryConnect, true, name);
    } catch (error: any) {
      console.error(`Erro na conexão ${message}:`, error.message);
    }; 
  };
};

// Loop para tentar estabelecer conexões enquanto houver itens na fila
setInterval(() => {
  if (queue.length > 0 && currentConnections < MAX_CONNECTIONS) 
    tryConnect();
}, 500);