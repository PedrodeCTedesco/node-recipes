import dotenv from 'dotenv';
dotenv.config();

export interface UDPClient {
  address: string;
  port: number;
  lastSeen: Date;
}

class UDPClientManager {
  private static instance: UDPClientManager;
  private readonly clients: Map<string, UDPClient> = new Map();
  private readonly timeoutInterval: number = 30000;

  private constructor() {
    // Limpa clientes inativos periodicamente
    setInterval(() => this.cleanInactiveClients(), 10000);
  }

  public static getInstance(): UDPClientManager {
    if (!UDPClientManager.instance) {
      UDPClientManager.instance = new UDPClientManager();
    }
    return UDPClientManager.instance;
  }

  public getClientKey(address: string, port: number): string {
    return `${address}:${port}`;
  }

  public updateClient(address: string, port: number): void {
    const key = this.getClientKey(address, port);
    this.clients.set(key, {
      address,
      port,
      lastSeen: new Date()
    });
  }

  public getActiveClients(): UDPClient[] {
    return Array.from(this.clients.values());
  }

  private cleanInactiveClients(): void {
    const now = new Date();
    for (const [key, client] of this.clients.entries()) {
      if (now.getTime() - client.lastSeen.getTime() > this.timeoutInterval) {
        this.clients.delete(key);
        console.log(`Cliente removido por inatividade: ${client.address}:${client.port}`);
      }
    }
  }
}

export const serverConfig = {
  port: process.env.PORT ?? '8181',
  host: process.env.HOST ?? 'localhost'
};

export const clientManager = UDPClientManager.getInstance();