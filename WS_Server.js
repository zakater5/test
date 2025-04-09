// WS_Server.js
require('dotenv').config(); // Load environment variables
const WebSocket = require('ws');

class WebSocketServer {
    constructor() {
        this.clients = new Map(); // To track connected clients with unique IDs
    }

    start() {
        this.wss = new WebSocket.Server({ port: process.env.WS_PORT });
        this.wss.on('connection', (ws) => {
            console.log('Client connected');
            let tempClientId = Date.now().toString();
            ws.send(JSON.stringify({ message: 'Please send your unique ID prefixed with "id: "' }));

            ws.on('message', (message) => {
                const messageString = message.toString();
                
                // Check if the message starts with "id: "
                const idPrefix = 'id: ';
                if (messageString.startsWith(idPrefix)) {
                    // Extract the ID
                    const clientId = messageString.substring(idPrefix.length).trim();
                    console.log(`Received and set client ID: ${clientId}`);

                    // Store the WebSocket connection with the extracted ID
                    this.clients.set(clientId, ws);

                    // Optionally, you can send a confirmation back to the client
                    ws.send(JSON.stringify({ message: 'ID received and stored', clientId: clientId }));

                    // Remove the temporary ID if the client has now been identified
                    this.clients.delete(tempClientId);
                } else {
                    // Handle other messages if needed
                    ws.send(JSON.stringify({ message: 'ID not found in message. Please send in format "id: your_id"' }));
                }
            });

            ws.on('close', () => {
                for (let [id, client] of this.clients.entries()) {
                    if (client === ws) {
                        this.clients.delete(id);
                        console.log(`Client with ID ${id} disconnected`);
                        break;
                    }
                }
            });
        });

        console.log(`WebSocket server is running on ws://localhost:${process.env.WS_PORT}`);
    }

    // Method to get all connected clients
    getConnectedClients() {
        return Array.from(this.clients.entries()).map(([clientId, client]) => {
            const ip = client._socket.remoteAddress; // This may vary based on your setup
            return {
                id: clientId,
                ip: ip,
                status: 'connected',
                connectionTime: new Date().toISOString(),
            };
        });
    }

    // Method to return clients as JSON
    getConnectedClientsJson() {
        return JSON.stringify(this.getConnectedClients());
    }

    // Method to send an IR signal to a specific client
    sendIRSignal(clientId, irCode) {
        // Retrieve the WebSocket connection using the client ID
        const client = this.clients.get(clientId);
        
        // Check if the client exists
        if (client) {
            // Create a message object with the IR code
            const message = JSON.stringify({ irCode: irCode });
            
            // Send the message to the client
            client.send(message);
            console.log(`Sent IR signal ${irCode} to client ${clientId}`);
        } else {
            // Log an error if the client ID is not found
            console.log(`Client ${clientId} not found`);
        }
    }    
}

// Export an instance of the WebSocketServer class
const wsServer = new WebSocketServer();
module.exports = {
    wsServer,
    startWebSocketServer: () => wsServer.start(),
    getConnectedClientsJson: () => wsServer.getConnectedClientsJson(),
    sendIRSignal: (clientId, irCode) => wsServer.sendIRSignal(clientId, irCode)
};
