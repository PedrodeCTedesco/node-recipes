require('dotenv').config();
import { Socket } from 'net';

export let totalRead: number = 0;
export let totalWritten: number = 0;
export const serverConfig = {
  port: process.env.PORT || '8181',
  host: process.env.HOST || 'localhost'
}
let clients: Socket[] = [];

class ConnectionManager {
  private static instance:ConnectionManager;
  private connectionLimits: Map<string, number> = new Map(); // Limite máximo de conexões por porta
  private connections: Map<string, Map<string, number>> = new Map(); // Conexões registradas por porta e endereço IP

  private constructor() {}

  public static getInstance():ConnectionManager {
      if (!ConnectionManager.instance) {
          ConnectionManager.instance = new ConnectionManager();
      }
      return ConnectionManager.instance;
  }

  public getConnectionStatus(port: string): {
      currentConnections: number;
      maxConnections: number;
      isAtCapacity: boolean;
  } {
      const portConnections = this.connections.get(port) || new Map<string, number>();
      const currentCount = Array.from(portConnections.values()).reduce((acc, count) => acc + count, 0);
      const maxCount = this.connectionLimits.get(port) || 0;

      return {
          currentConnections: currentCount,
          maxConnections: maxCount,
          isAtCapacity: currentCount >= maxCount
      };
  }

  public setConnectionLimit(port: string, maxConnections: number): void {
      this.connectionLimits.set(port, maxConnections);
  }

  public registerConnection(port: string, remoteAddress: string): void {
      let portConnections = this.connections.get(port);
      if (!portConnections) {
          portConnections = new Map<string, number>();
          this.connections.set(port, portConnections);
      }
  
      const currentCount = Array.from(portConnections.values()).reduce((acc, count) => acc + count, 0);
      const maxCount = this.connectionLimits.get(port) || 0;
  
      console.log(`Attempting to register connection: ${remoteAddress} on port ${port}`);
      console.log(`Current count: ${currentCount}, Max count: ${maxCount}`);
  
      if (currentCount < maxCount) {
          const count = portConnections.get(remoteAddress) || 0;
          portConnections.set(remoteAddress, count + 1);
          console.log(`Connection registered: ${remoteAddress}`);
      } else {
          console.log(`Connection not registered: ${remoteAddress} (at capacity)`);
      }
  }
  

  public unregisterConnection(port: string, remoteAddress: string): void {
      const portConnections = this.connections.get(port);
      if (portConnections && portConnections.has(remoteAddress)) {
          const count = portConnections.get(remoteAddress) || 0;
          if (count > 0) {
              portConnections.set(remoteAddress, count - 1);
              if (portConnections.get(remoteAddress) === 0) {
                  portConnections.delete(remoteAddress); // Remove address if no more connections
              }
          }
      }
  }

  public hasPortLimit(port: string): boolean {
      return this.connectionLimits.has(port);
  }
}

// Função para gerenciar o número de conexões
export const manageConnections = (socket: Socket, port: string, remoteAddress: string): boolean => {
  const connectionManager: ConnectionManager = ConnectionManager.getInstance();
  
  console.log('Definindo limite de conexões:', port);
  
  if (!connectionManager.hasPortLimit(port)) {
    console.error(`Limite de conexões não definido para a porta ${port}`);
    
    // Se o limite não for definido, defina-o imediatamente
    const maxConnections: number = 10;
    connectionManager.setConnectionLimit(port, maxConnections);
    console.log('Limite de conexões definido:', maxConnections);
  }
  
  // Obtém o status das conexões para a porta e endereço remoto
  const connectionStatus = connectionManager.getConnectionStatus(port);
  console.log('Status das conexões:', JSON.stringify(connectionStatus));

  console.log('Current Connections:', connectionStatus.currentConnections);
  console.log('Max Connections:', connectionStatus.maxConnections);
  console.log('Is At Capacity:', connectionStatus.isAtCapacity);

  if (connectionStatus.isAtCapacity) {
    console.log('Conexão limitada. Encerrando...');
    socket.write("Máximo de conexões atingido");
    socket.end();
    return false;
  }
  
  console.log('Conexão permitida');
  // Se o limite não for atingido, incrementa o contador de conexões
  connectionManager.registerConnection(port, remoteAddress);
  return true;
};

// Função para lidar com desconexões e decrementar o número de conexões
export const handleDisconnection = (port: string, remoteAddress: string, onDisconnect?: () => void, socket?: Socket) => {
  const connectionManager = ConnectionManager.getInstance();

  // Destrói o socket se ele existir
  if (socket) {
    socket.destroy();
  }

  // Desregistra a conexão para a porta e endereço remoto especificados
  connectionManager.unregisterConnection(port, remoteAddress);

  // Opcionalmente, execute a função de callback onDisconnect
  if (onDisconnect) {
    onDisconnect();
  }

  // Obtém e exibe o status atual das conexões
  const connectionStatus = connectionManager.getConnectionStatus(port);
  console.log(`Conexões atuais para ${port}:${remoteAddress} após desconexão: ${connectionStatus.currentConnections}`);
};

// Função para lidar com as conexões de clientes no servidor
export const connectionListener = (socket: Socket) => {
  const port = process.env.PORT || '8181';
  const remoteAddress = socket.remoteAddress || 'unknown';

  const connectionManager = ConnectionManager.getInstance();
  connectionManager.registerConnection(port, remoteAddress);

  console.log("Novo cliente conectado");
  clients.push(socket); // adiciona novo cliente
  socket.write("Seja bem-vindo ao chat!\n");

  let buffer = '';

  // dados recebidos pelo cliente
  socket.on('data', (data) => {
    buffer += data.toString();  // Acumula os dados no buffer
    const messages = buffer.split('\n');  // Divide as mensagens por linha
    
    // Itera sobre todas as mensagens completas
    messages.slice(0, -1).forEach((message) => {
      message = message.trim(); // Remove espaços extras
      console.log('Mensagem do cliente:', message);

      if (message.toLowerCase() === 'exit') {
        console.log('Cliente solicitou o encerramento da conexão.');
        socket.end('Conexão encerrada.\n');  // Encerra a conexão com o cliente
        return;
      }

      // Envia a mensagem para todos os outros clientes
      clients.forEach(client => {
        if (client !== socket) client.write(`Cliente diz: ${message}\n`);
      });
    });
    
    // Atualiza o buffer para manter qualquer mensagem incompleta
    buffer = messages[messages.length - 1];
  });

  // desconexão do cliente
  socket.on('end', () => {
    console.log('Cliente desconectado.');
    
    // Remove o cliente da lista quando ele se desconectar
    clients = clients.filter(client => client !== socket);
    console.log('Clientes restantes:', clients.length);

    // Desregistra a conexão
    connectionManager.unregisterConnection(port, remoteAddress);
  });

  // Evento para lidar com erros de conexão
  socket.on('error', (error) => {
    console.error('Erro na conexão:', error.message);
    
    // Remove o cliente da lista em caso de erro
    clients = clients.filter(client => client !== socket);

    // Desregistra a conexão
    connectionManager.unregisterConnection(port, remoteAddress);
  });
};