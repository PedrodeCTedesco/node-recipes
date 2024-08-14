import { Socket } from 'net';

let currentConnections = 0; // Mantém o controle do número atual de conexões
const MAX_CONNECTIONS = 2; // Define o número máximo de conexões

// Função para gerenciar o número de conexões
const manageConnections = (socket: Socket): boolean => {
  if (currentConnections >= MAX_CONNECTIONS) {
    socket.write("Máximo de conexões atingido");
    socket.end();
    console.log('Número máximo de conexões atingido, conexão encerrada.');
    return false; // Indica que a conexão deve ser encerrada
  }
  
  // Se o limite não for atingido, incrementa o contador de conexões
  currentConnections += 1;
  console.log(`Conexões atuais: ${currentConnections}`);
  return true; // Indica que a conexão pode continuar
}

// Função para lidar com desconexões e decrementar o número de conexões
const handleDisconnection = (onDisconnect?: () => void) => {
  currentConnections -= 1;
  console.log(`Conexões atuais após desconexão: ${currentConnections}`);
  // Chama o callback se fornecido
  if (onDisconnect) 
    onDisconnect();
  
}; // fim de handleDisconnection()

export { manageConnections, handleDisconnection, currentConnections, MAX_CONNECTIONS };
