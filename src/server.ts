import net, { Server } from 'net';
import { connectionListener } from './clients/connections.js';


// Create the server
const server: Server = net.createServer({
  allowHalfOpen: true
}, connectionListener);

// Handle server errors
server.on('error', (err) => {
  console.log(`Server error: ${err}`);
});

// servidor: localhost, fila de conexão 12, port: 8181
server.listen(8181, 12, () => {
  console.log('server is listening');
});