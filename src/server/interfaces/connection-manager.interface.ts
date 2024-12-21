import { Socket } from "net";

export interface ConnectionManagerInterface {
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

export interface ChatClientTCP extends Socket {
  username?: string;
}