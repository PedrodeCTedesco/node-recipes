import { MockConnectionManager } from './config.mocks';

describe('ConnectionManager class', () => {
    let manager: MockConnectionManager;

    beforeEach(() => {
        // Obtenha a instância do singleton antes de cada teste
        manager = MockConnectionManager.getInstance();
        manager['connections'].clear();
    });

    it('if getConnectionStatus is called should return: isAtCapacity, false; maxConnections = 0 and currentConnections = 0', () => {
        // Arrange, Act
        const status = manager.getConnectionStatus('8080');
        // Assert
        expect(status.currentConnections).toBe(0);
        expect(status.maxConnections).toBe(0);
        expect(status.isAtCapacity).toBe(true);
    });

    it('should set and get connection limit', () => {
        // Arrange
        manager.setConnectionLimit('8080', 10);
        // Act
        const status = manager.getConnectionStatus('8080');
        // Assert
        expect(status.maxConnections).toBe(10);
    });

    it('should handle connection limit correctly', () => {
        // Arrange
        manager.setConnectionLimit('8080', 1);
        // Act
        manager.registerConnection('8080', '192.168.1.1');
        // Assert
        const status = manager.getConnectionStatus('8080');
        expect(status.currentConnections).toBe(1); // A conexão original ainda deve estar presente
    });
    
    it('should handle connection limit correctly', () => {
        // Arrange, Assert
        manager.setConnectionLimit('8080', 1);
        manager.registerConnection('8080', '192.168.1.1');
        const stats_1 = manager.getConnectionStatus('8080');
        expect(stats_1.currentConnections).toBe(1);
        expect(stats_1.maxConnections).toBe(1);
        expect(stats_1.isAtCapacity).toBe(true);
        // Act
        manager.registerConnection('8080', '192.168.1.2');
        // Assert
        const statusForNewConnection = manager.getConnectionStatus('8080');
        expect(statusForNewConnection.currentConnections).toBe(1);
        expect(statusForNewConnection.maxConnections).toBe(1);
        expect(statusForNewConnection.isAtCapacity).toBe(true);
    });
    
    it('should remove an existing connection correctly', () => {
        // Arrange
        manager.setConnectionLimit('8080', 2);
        manager.registerConnection('8080', '192.168.1.1');
        manager.registerConnection('8080', '192.168.1.1'); // Multiple connections from the same IP
        
        // Act
        manager.unregisterConnection('8080', '192.168.1.1');
        
        // Assert
        const status = manager.getConnectionStatus('8080');
        expect(status.currentConnections).toBe(1); // Should still have one connection
    });

    it('should not change state when removing a non-existent connection', () => {
        // Arrange
        manager.setConnectionLimit('8080', 1);
        manager.registerConnection('8080', '192.168.1.1');
        
        // Act
        manager.unregisterConnection('8080', '192.168.1.2'); // Trying to remove a connection that doesn't exist
        
        // Assert
        const status = manager.getConnectionStatus('8080');
        expect(status.currentConnections).toBe(1); // The existing connection should still be there
    });

    it('should handle multiple connections correctly when removing', () => {
        // Arrange
        manager.setConnectionLimit('8080', 2);
        manager.registerConnection('8080', '192.168.1.1');
        manager.registerConnection('8080', '192.168.1.1'); // Two connections from the same IP
        manager.registerConnection('8080', '192.168.1.2');
        
        // Act
        manager.unregisterConnection('8080', '192.168.1.1');
        
        // Assert
        const status = manager.getConnectionStatus('8080');
        expect(status.currentConnections).toBe(1); // One connection should remain
        const statusForOtherIP = manager.getConnectionStatus('8080');
        expect(statusForOtherIP.currentConnections).toBe(1); // Other IP should still have its connection
    });

    it('should not remove a connection if the count is already zero', () => {
        // Arrange
        manager.setConnectionLimit('8080', 1);
        manager.registerConnection('8080', '192.168.1.1');
        manager.unregisterConnection('8080', '192.168.1.1'); // Remove the connection
        
        // Act
        manager.unregisterConnection('8080', '192.168.1.1'); // Trying to remove again
        
        // Assert
        const status = manager.getConnectionStatus('8080');
        expect(status.currentConnections).toBe(0); // Should still be zero
    });

    it('should return connected addresses for a specific port', () => {
        // Arrange
        manager.setConnectionLimit('8080', 3);
        manager.registerConnection('8080', '192.168.1.1');
        manager.registerConnection('8080', '192.168.1.2');
        manager.registerConnection('8080', '192.168.1.3');
        
        // Act
        const connectedAddresses = manager.getConnectedAddresses('8080');
        
        // Assert
        expect(connectedAddresses).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
    });

    it('should return an empty array if no addresses are connected to the port', () => {
        // Act
        const connectedAddresses = manager.getConnectedAddresses('8080');
        
        // Assert
        expect(connectedAddresses).toEqual([]);
    });

    it('should return true if a limit is set for the port', () => {
        // Arrange
        manager.setConnectionLimit('8080', 5);
        // Act
        const hasLimit = manager.hasPortLimit('8080');
        // Assert
        expect(hasLimit).toBe(true);
    });

    it('should return false for ports that have had limits set but were cleared', () => {
        // Arrange
        manager.setConnectionLimit('8080', 5);
        manager['connectionLimits'].delete('8080'); // Remove the limit
        
        // Act
        const hasLimit = manager.hasPortLimit('8080');
        
        // Assert
        expect(hasLimit).toBe(false);
    });
}); 
