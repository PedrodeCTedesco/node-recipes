import { Socket } from 'net';
import { tryConnect } from '../clients/connections.js';

export let currentConnections: number = 0; 
export const MAX_CONNECTIONS: number = 10; 
export let totalRead: number = 0;
export let totalWritten: number = 0;
export const PORT: number = 8181;
export const HOST: string = '127.0.0.1';

// Função para gerenciar o número de conexões
export const manageConnections = (socket: Socket): boolean => {
  if (currentConnections >= MAX_CONNECTIONS) {
    socket.write("Máximo de conexões atingido");
    socket.end();
    return false; // Indica que a conexão deve ser encerrada
  }
  
  // Se o limite não for atingido, incrementa o contador de conexões
  currentConnections += 1;
  return true; // Indica que a conexão pode continuar
}

// Função para lidar com desconexões e decrementar o número de conexões
export const handleDisconnection = (onDisconnect?: () => void, socket?: Socket) => {
  if (socket) {
    // Remove a referência à conexão
    socket.destroy();
  }

  currentConnections -= 1;

  console.log(`Conexões atuais após desconexão: ${currentConnections}`);

  // Chama o callback se fornecido
  if (onDisconnect) 
    onDisconnect();
};

// Função para lidar com as conexões de clientes no servidor
export const connectionListener = (socket: Socket) => {
  // Verifica e gerencia o número máximo de conexões
  if (!manageConnections(socket)) 
    return; 

  socket.on('connect', () => {
    console.log(`[INFO] Conexão estabelecida com o cliente.`);
    console.log(`[INFO] Endereço do cliente: ${socket.remoteAddress}`);
    console.log(`[INFO] Porta do cliente: ${socket.remotePort}`);
    console.log(`[INFO] Porta do servidor: ${socket.localPort}`);
  });

  socket.on('data', (data) => {
    console.log('Dados recebidos do cliente:', data.toString());
  
    try {
      const parsedData = JSON.parse(data.toString());

      if (Object.keys(parsedData).length === 0) {
        socket.write('{"status": "empty"}');
      } else if ('name' in parsedData && parsedData.name !== null) {
        socket.write(`{"response": "Hello ${parsedData.name}"}`);
      } else {
        socket.write('{"status": "invalid"}');
      }
    } catch (e: unknown) {
      console.error('Erro ao processar dados:', e instanceof Error ? e.message : 'Erro desconhecido');
    }
  });
  
  socket.on('end', () => {
    console.log('Desconectado');
    totalRead += socket.bytesRead;
    handleDisconnection(tryConnect); // Passa tryConnect como callback para onDisconnect
  });

  socket.on('error', (error) => {
    console.error('Erro na conexão:', error.message);
    handleDisconnection(tryConnect); // Também chama handleDisconnection em caso de erro
  });
}; // fim de connectionListener(...)
