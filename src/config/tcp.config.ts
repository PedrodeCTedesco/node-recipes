import { Socket } from 'net';
import dotenv from 'dotenv';
import { ChatClientTCP } from '../server/interfaces/connection-manager.interface';
dotenv.config();

export const totalRead: number = 0;
export const totalWritten: number = 0;
export const serverConfig = {
  port: process.env.PORT ?? '8181',
  host: process.env.HOST ?? 'localhost'
}

let clients: ChatClientTCP[] = []

class ConnectionManager {
  private static instance:ConnectionManager;
  private readonly connectionLimits: Map<string, number> = new Map(); 
  private readonly connections: Map<string, Map<string, number>> = new Map();

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
    const maxCount = this.connectionLimits.get(port) ?? 0;

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
    const maxCount = this.connectionLimits.get(port) ?? 0;

    console.log(`Attempting to register connection: ${remoteAddress} on port ${port}`);
    console.log(`Current count: ${currentCount}, Max count: ${maxCount}`);

    if (currentCount < maxCount) {
        const count = portConnections.get(remoteAddress) ?? 0;
        portConnections.set(remoteAddress, count + 1);
        console.log(`Connection registered: ${remoteAddress}`);
    } else {
        console.log(`Connection not registered: ${remoteAddress} (at capacity)`);
    }
  }
  
public unregisterConnection(port: string, remoteAddress: string): void {
  const portConnections = this.connections.get(port);
  
  const currentCount = portConnections?.get(remoteAddress) ?? 0;

  if (currentCount > 0) {
    portConnections?.set(remoteAddress, currentCount - 1);

    if (portConnections?.get(remoteAddress) === 0) {
      portConnections.delete(remoteAddress);
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
    const maxConnections: number = 10;
    connectionManager.setConnectionLimit(port, maxConnections);
  }
  
  // Obtém o status das conexões para a porta e endereço remoto
  const connectionStatus = connectionManager.getConnectionStatus(port);
  console.log('Status das conexões:', JSON.stringify(connectionStatus));

  console.log('Current Connections:', connectionStatus.currentConnections);
  console.log('Max Connections:', connectionStatus.maxConnections);
  console.log('Is At Capacity:', connectionStatus.isAtCapacity);

  if (connectionStatus.isAtCapacity) {
    socket.write("Máximo de conexões atingido\n");
    socket.end();
    return false;
  }
  
  console.log('Conexão permitida');
  // Se o limite não for atingido, incrementa o contador de conexões
  connectionManager.registerConnection(port, remoteAddress);
  return true;
};

// Função para lidar com desconexões e decrementar o número de conexões
export const handleDisconnection = (socket: Socket): void => {
  const port = serverConfig.port;
  const remoteAddress = socket.remoteAddress ?? 'unknown';
  const connectionManager = ConnectionManager.getInstance();

  // Remove o cliente da lista global
  clients = clients.filter(client => client !== socket);
  
  // Desregistra a conexão
  connectionManager.unregisterConnection(port, remoteAddress);
  
  // Destrói o socket
  if (!socket.destroyed) socket.destroy();

  console.log(`Cliente desconectado: ${remoteAddress}`);
  console.log(`Clientes restantes: ${clients.length}`);
};

// Função para lidar com as conexões de clientes no servidor
export const connectionListener = (socket: ChatClientTCP): void => {
  const remoteAddress = socket.remoteAddress ?? 'unknown';

  if (!manageConnections(socket, serverConfig.port, remoteAddress)) {
    return;
  }

  console.log("Novo cliente conectado");
  socket.write("Por favor, digite seu nome de usuário: ");
  
  let buffer = '';
  let waitingForUsername = true;

  socket.on('data', (data) => {
    buffer += data.toString();
    const messages = buffer.split('\n');
    
    messages.slice(0, -1).forEach((message) => {
      message = message.trim();
      
      if (waitingForUsername) {
        socket.username = message;
        waitingForUsername = false;
        clients.push(socket);
        console.log(`Usuário ${socket.username} conectou`);
        socket.write(`Bem-vindo ao chat, ${socket.username}!\n`);
        // Avisa outros usuários que alguém entrou
        clients.forEach(client => {
          if (client !== socket && !client.destroyed) {
            client.write(`${socket.username} entrou no chat!\n`);
          }
        });
        return;
      }

      console.log(`Mensagem de ${socket.username}:`, message);

      if (message.toLowerCase() === 'exit') {
        socket.end('Conexão encerrada.\n');
        return;
      }

      clients.forEach(client => {
        if (client !== socket && !client.destroyed) {
          client.write(`${socket.username} diz: ${message}\n`);
        }
      });
    });
    
    buffer = messages[messages.length - 1];
  });

  socket.on('end', () => {
    if (socket.username) {
      // Avisa outros usuários que alguém saiu
      clients.forEach(client => {
        if (client !== socket && !client.destroyed) {
          client.write(`${socket.username} saiu do chat.\n`);
        }
      });
    }
    handleDisconnection(socket);
  });

  socket.on('error', (error) => {
    console.error('Erro na conexão:', error.message);
    handleDisconnection(socket);
  });
};