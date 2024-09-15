export interface ConnectionManagerInterface {
  // Note que a interface não pode definir métodos estáticos, mas o comentário documenta a intenção
  // getInstance(): ConnectionManagerInterface;
  getConnectionStatus(port: string, remoteAddress: string): {
      currentConnections: number;
      maxConnections: number;
      isAtCapacity: boolean;
  };
  setConnectionLimit(port: string, maxConnections: number): void;
  registerConnection(port: string, remoteAddress: string): void;
  unregisterConnection(port: string, remoteAddress: string): void;
  hasPortLimit(port: string): boolean;
}
