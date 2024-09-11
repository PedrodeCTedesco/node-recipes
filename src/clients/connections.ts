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

    // Envio de dados em JSON para que o servidor leia os dados e responda
    socket.on('connect', () => {
      const saudacao = {
        name: "ops",
        obj: "salamandra"
      };
      socket.write(JSON.stringify(saudacao.name), () => {
        socket.end(JSON.stringify(saudacao.obj));
      })
    });

    socket.on('data', (data) => {
      console.log('Dados recebidos do cliente:', data.toString());
      
      try {
        const parsedData = JSON.parse(data.toString());
        if ('response' in parsedData) {
          console.log('Resposta recebida:', parsedData.response);
        } else if ('status' in parsedData) {
          console.log('Status recebido:', parsedData.status);
        }
      } catch (e: unknown) {
        console.error('Erro ao processar dados:', e instanceof Error ? e.message : 'Erro desconhecido');
      }
    });
    
    socket.on('readable', () => {
      let data: Buffer | string;
      while (null !== (data = socket.read())) {
        try {
          const parsedData = JSON.parse(data.toString());
          if (parsedData.name) {
            socket.write('hello ' + parsedData.name);
          }
        } catch (e: unknown) {
          console.error('Erro ao processar dados:', e instanceof Error ? e.message : "");
        }
      };

      // Quando o socket estiver pronto para ser usado, resolva a Promise
      socket.on('ready', () => {
        resolve(onConnect());
      });
    });

    socket.on('error', (error) => {
      console.error(`Erro na conexão ${message}:`, error.message);
      socket.destroy();
      reject(error);
    });

    socket.on('end', () => {
      const totalWrittenFrmoConfig: number = socket.bytesWritten;
      console.log("Total de bytes", totalWrittenFrmoConfig);
      resolve();
    });

    // Adiciona um temporizador para desconectar a conexão após o tempo especificado
    setTimeout(() => {
      const seconds = Math.floor(timeout / 1000);
      console.log(`${message} desconectada após ${seconds} segundos.`);
      handleDisconnection(tryConnect, socket);
      reject(new Error(`Conexão ${message} desconectada após ${seconds} segundos.`));
    }, timeout);
    
  }).then(() => {
    if (success) {
      console.log("Processo bem-sucedido");
    }
  }).catch((error) => {
    console.error(`Erro na conexão ${message}:`, error.message);
    if (!success) {
      console.log("Fila", queue);
    }
  });
}; // fim de connection(...)

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