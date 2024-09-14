import { Socket } from 'net';
//import { tryConnect } from '../clients/connections.js';

export let currentConnections: number = 0; 
export const MAX_CONNECTIONS: number = 10; 
export let totalRead: number = 0;
export let totalWritten: number = 0;
let clients: Socket[] = [];
export const serverConfig = {
  port: 8181,
  host: '127.0.0.1'
}

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
  });

  // Evento para lidar com erros de conexão
  socket.on('error', (error) => {
    console.error('Erro na conexão:', error.message);
    
    // Remove o cliente da lista em caso de erro
    clients = clients.filter(client => client !== socket);
  });

};