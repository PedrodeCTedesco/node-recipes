import net, { Socket } from 'net';
import { manageConnections, handleDisconnection, currentConnections, MAX_CONNECTIONS } from '../server.config/config.js';

// variáveis
// gerenciador de fila de conexões (simplificado)
const queue: any = [];
// Função para lidar com as conexões de clientes no servidor
export const connectionListener = (socket: Socket) => {
  console.log("Conexão bem-sucedida");

  // Verifica e gerencia o número máximo de conexões
  if (!manageConnections(socket)) 
    return; // Se a conexão deve ser encerrada, sai da função

  // Retorna as informações do servidor
  console.log("Address:", socket.localAddress);
  console.log("Port:", socket.localPort);

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
const connections = async (timeout: number, message: string, onConnect: () => void, success: boolean) => {
  return new Promise<void>((resolve, reject) => {
    const connection = net.createConnection({
      port: 8181,
      host: '127.0.0.1'
    }, () => {
      console.log(`${message} estabelecida.`);
      connection.write(`${message}`);
      resolve(onConnect());
    });

    connection.on('end', () => {
      console.log(`${message} desconectada.`);
      resolve();
    });

    connection.on('error', (error) => {
      console.error(`Erro na conexão ${message}:`, error.message);
      reject(error);
    });

    // Adiciona um temporizador para desconectar a conexão após o tempo especificado
    setTimeout(() => {
      connection.end();
      console.log(`${message} desconectada após ${timeout / 1000} segundos.`);
      handleDisconnection(tryConnect)
      reject(new Error(`Conexão ${message} desconectada após ${timeout / 1000} segundos.`));
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
    const { timeout, message } = queue.shift();
    try {
      await connections(timeout, message, tryConnect, true);
    } catch (error: any) {
      console.error(`Erro na conexão ${message}:`, error.message);
    }; // fim da rotina de tratamento de erros
  }; // fim da sentença de seleção condicional simples
}; // fim da tryConnect();

// Loop para tentar estabelecer conexões enquanto houver itens na fila
setInterval(() => {
  if (queue.length > 0 && currentConnections < MAX_CONNECTIONS) 
    tryConnect();
  
}, 500); // Verifica a cada segundo

// conexões
queue.push({ timeout: 5000, message: "Conexão 1" });
queue.push({ timeout: 3000, message: "Conexão 2" });
queue.push({ timeout: 1000, message: "Conexão 3" });

/* tryConnect();
console.log(tryConnect()) */

export default {
  connectionListener,
}
