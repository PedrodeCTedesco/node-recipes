import { Socket } from 'net';

export let currentConnections = 0; // Mantém o controle do número atual de conexões
export const MAX_CONNECTIONS = 2; // Define o número máximo de conexões

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
