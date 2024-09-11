import net, { Socket } from 'net';
import { manageConnections, handleDisconnection, currentConnections, MAX_CONNECTIONS } from '../server.config/config.js';

const queue: any = [];
// Função para lidar com as conexões de clientes no servidor
export const connectionListener = (socket: Socket) => {
  // Verifica e gerencia o número máximo de conexões
  if (!manageConnections(socket)) 
    return; 

  // Retorna as informações do servidor
/*   console.log("Address:", socket.localAddress);
  console.log("Port:", socket.localPort); */
  socket.on('data', (data) => {
    console.log('Dados recebidos do cliente:', data.toString());

    try {
      const parsedData = JSON.parse(data.toString());
      if (parsedData.name) {
        console.log('Nome recebido:', parsedData.name);
        socket.write(`Hello ${parsedData.name}`); // Responde ao cliente
      } else {
        socket.write('Dados não reconhecidos');
      }
    } catch (e: unknown) {
      console.error('Erro ao processar dados:', e instanceof Error ? e.message : 'Erro desconhecido');
    }
  });

  // Lida com desconexões
  socket.on('end', () => {
    console.log('Desconectado');
    handleDisconnection(tryConnect); // Passa tryConnect como callback para onDisconnect
  });

  // Lida com erros de conexão
  socket.on('error', (error) => {
    console.error('Erro na conexão:', error.message);
    handleDisconnection(tryConnect); // Também chama handleDisconnection em caso de erro
  });
}; // fim de connectionListener(...)

// Define as conexões, i.e., os clientes que se conectam com o servidor e institui um tempo de conexão
const connections = async (timeout: number, message: string, onConnect: () => void, success: boolean, name: string) => {
  return new Promise<void>((resolve, reject) => {
    const socket: Socket = net.createConnection({
      port: 8181,
      host: '127.0.0.1'
    });

    // Envio de dados em JSON para que o servidor leia os dados e responda
    socket.on('connect', () => {
      /* const obj = { 
        name: 'Frodo', 
        occupation: 'adventurer' 
      }; */
      socket.write(name);
    })

    socket.on('data', (data) => {
      console.log('from server: ' + data.toString());
    });

    socket.setEncoding('utf-8');
    socket.setTimeout(2000, () => {
      console.log('timeout completed');
      const obj = { name: 'timeout', message: 'I came from a timeout' };
      socket.write(JSON.stringify(obj));
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
      resolve();
    });

    // Adiciona um temporizador para desconectar a conexão após o tempo especificado
    const timerId = setTimeout(() => {
      const seconds = Math.floor(timeout / 1000);
      console.log(`${message} desconectada após ${seconds} segundos.`);
      handleDisconnection(tryConnect, socket); // Passa o socket para handleDisconnection
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
const tryConnect = async () => {
  if (queue.length > 0 && currentConnections < MAX_CONNECTIONS) {
    const { timeout, message, name } = queue.shift();
    try {
      await connections(timeout, message, tryConnect, true, name);
    } catch (error: any) {
      console.error(`Erro na conexão ${message}:`, error.message);
    }; // fim da rotina de tratamento de erros
  }; // fim da sentença de seleção condicional simples
}; // fim da tryConnect();

// Loop para tentar estabelecer conexões enquanto houver itens na fila
setInterval(() => {
  if (queue.length > 0 && currentConnections < MAX_CONNECTIONS) 
    tryConnect();
}, 500);

// conexões
queue.push({ timeout: 10000, message: "Conexão 1", name: "Pedro" });
queue.push({ timeout: 3000, message: "Conexão 2" });
queue.push({ timeout: 1000, message: "Conexão 3" });

export default {
  connectionListener,
}
