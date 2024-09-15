import { ConnectionManagerInterface } from '../../../src/server/interfaces/connection-manager.interface';

export class MockConnectionManager implements ConnectionManagerInterface {
    private static instance: MockConnectionManager;
    private connectionLimits: Map<string, number> = new Map(); // Limite máximo de conexões por porta
    private connections: Map<string, Map<string, number>> = new Map(); // Conexões registradas por porta e endereço IP

    private constructor() {}

    public static getInstance(): MockConnectionManager {
        if (!MockConnectionManager.instance) {
            MockConnectionManager.instance = new MockConnectionManager();
        }
        return MockConnectionManager.instance;
    }

    public getConnectionStatus(port: string): {
        currentConnections: number;
        maxConnections: number;
        isAtCapacity: boolean;
    } {
        const portConnections = this.connections.get(port) || new Map<string, number>();
        const currentCount = Array.from(portConnections.values()).reduce((acc, count) => acc + count, 0);
        const maxCount = this.connectionLimits.get(port) || 0;

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
        const maxCount = this.connectionLimits.get(port) || 0;
    
        console.log(`Attempting to register connection: ${remoteAddress} on port ${port}`);
        console.log(`Current count: ${currentCount}, Max count: ${maxCount}`);
    
        if (currentCount < maxCount) {
            const count = portConnections.get(remoteAddress) || 0;
            portConnections.set(remoteAddress, count + 1);
            console.log(`Connection registered: ${remoteAddress}`);
        } else {
            console.log(`Connection not registered: ${remoteAddress} (at capacity)`);
        }
    }
    
    public unregisterConnection(port: string, remoteAddress: string): void {
        const portConnections = this.connections.get(port);
        if (portConnections && portConnections.has(remoteAddress)) {
            const count = portConnections.get(remoteAddress) || 0;
            if (count > 0) {
                portConnections.set(remoteAddress, count - 1);
                if (portConnections.get(remoteAddress) === 0) {
                    portConnections.delete(remoteAddress); // Remove address if no more connections
                }
            }
        }
    }

    public hasPortLimit(port: string): boolean {
        return this.connectionLimits.has(port);
    }

    public getConnectedAddresses(port: string): string[] {
        const portConnections = this.connections.get(port) || new Map<string, number>();
        return Array.from(portConnections.keys());
    }
}
