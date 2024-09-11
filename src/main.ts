import { queue, tryConnect } from "./clients/connections.js";
import { startServer } from "./server/server.js";

export async function main() {
    startServer();
  
    // Adiciona conexões à fila
    queue.push({ timeout: 10000, message: "Conexão 1", name: "Pedro" });
    queue.push({ timeout: 3000, message: "Conexão 2", name: "João" });
    queue.push({ timeout: 1000, message: "Conexão 3", name: "Maria" });
  
    // Inicia o loop de conexões
    tryConnect();
  }
  
  main().catch(console.error);
  