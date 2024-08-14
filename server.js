import net from 'net';

// Define a function for the connection listener
const connectionListener = (socket) => {
  console.log('connected');

  // Get the configured address for the server
  console.log(server.address());
  // Get connections count
  server.getConnections((err, count) => {
    if (err) {
      console.log('Error getting connections');
    } else {
      console.log(`Connections count: ${count}`);
    }
  });

  socket.on('end', () => {
    console.log('disconnected');
  });

  // Write to the connected socket
  socket.write('heyyo\r\n');
};

// Define uma conexão
const connection = net.createConnection({
  port: 8181,
  host: ''
}, () => {
  console.log("connection successful!!");
});
const connection2 = net.createConnection({
  port: 8181,
  host: ''
}, () => {
  console.log("connection successful!!!!!");
})

// Create the server
const server = net.createServer({
  allowHalfOpen: true
}, connectionListener);

// Handle server errors
server.on('error', (err) => {
  console.log(`Server error: ${err}`);
});

// Handle data events (this may not be necessary if only handling data on the socket level)
server.on('data', (data) => {
  console.log(data.toString());
});

// Start listening on port 8181
server.listen(8181, 12, () => {
  console.log('server is listening');
});
