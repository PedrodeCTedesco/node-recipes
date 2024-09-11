import * as net from 'net';
import { Socket } from 'net';
import { manageConnections, handleDisconnection, currentConnections, MAX_CONNECTIONS } from './server.config/config.js';

// Configurações do servidor
const PORT = 8181;
const HOST = '127.0.0.1';

// Fila de conexões pendentes
let queue: any[] = [];

// Função para lidar com as conexões de clientes no servidor
const connectionListener = (socket: Socket) => {
  // Verifica e gerencia o número máximo de conexões
  if (!manageConnections(socket)) {
    return;
  }

  console.log("Nova conexão estabelecida");

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
    handleDisconnection(connectionListener); // Passa connectionListener como callback para onDisconnect
  });

  // Lida com erros de conexão
  socket.on('error', (error) => {
    console.error('Erro na conexão:', error.message);
    handleDisconnection(connectionListener); // Também chama handleDisconnection em caso de erro
  });
};

// Função para iniciar o servidor
function startServer() {
  const server = net.createServer((socket) => {
    connectionListener(socket);
  });

  server.listen(PORT, HOST, () => {
    console.log(`Servidor TCP está rodando na porta ${PORT}`);
  });
}

// Função para conectar ao servidor
async function connectToServer(timeout: number, message: string, name: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
      console.log('Conectado ao servidor');
      client.write(JSON.stringify({ name }));
    });

    client.on('data', (data) => {
      console.log('Resposta do servidor:', data.toString());
      client.end();
      resolve();
    });

    client.on('error', (error) => {
      console.error('Erro na conexão:', error.message);
      reject(error);
    });

    client.setTimeout(timeout, () => {
      console.log(`${message} desconectada após ${timeout / 1000} segundos.`);
      client.destroy();
      reject(new Error(`Conexão ${message} desconectada após ${timeout / 1000} segundos.`));
    });
  });
}

// Função para estabelecer as conexões
const tryConnect = async () => {
  if (queue.length > 0 && currentConnections < MAX_CONNECTIONS) {
    const { timeout, message, name } = queue.shift();
    try {
      await connectToServer(timeout, message, name);
    } catch (error: any) {
      console.error(`Erro na conexão ${message}:`, error.message);
    }
  }
};

// Loop para tentar estabelecer conexões enquanto houver itens na fila
setInterval(() => {
  if (queue.length > 0 && currentConnections < MAX_CONNECTIONS) 
    tryConnect();
}, 500);

// Função principal
async function main() {
  startServer();

  // Adiciona conexões à fila
  queue.push({ timeout: 10000, message: "Conexão 1", name: "Pedro" });
  queue.push({ timeout: 3000, message: "Conexão 2", name: "João" });
  queue.push({ timeout: 1000, message: "Conexão 3", name: "Maria" });

  // Inicia o loop de conexões
  tryConnect();
}

main().catch(console.error);
