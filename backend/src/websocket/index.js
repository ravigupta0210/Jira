const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> Set of WebSocket connections

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  handleConnection(ws, req) {
    let userId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'auth') {
          userId = this.authenticateClient(ws, data.token);
          if (userId) {
            ws.send(JSON.stringify({ type: 'auth_success', userId }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed' }));
            ws.close();
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        this.removeClient(userId, ws);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send ping to keep connection alive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  }

  authenticateClient(ws, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      return userId;
    } catch (error) {
      return null;
    }
  }

  removeClient(userId, ws) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  // Send message to specific user
  sendToUser(userId, message) {
    if (this.clients.has(userId)) {
      const data = JSON.stringify(message);
      this.clients.get(userId).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }
  }

  // Send message to multiple users
  sendToUsers(userIds, message) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, message);
    });
  }

  // Broadcast to all connected clients
  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach((sockets) => {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    });
  }

  // Start heartbeat to detect dead connections
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
}

let wsServer = null;

const initWebSocket = (server) => {
  wsServer = new WebSocketServer(server);
  wsServer.startHeartbeat();
  return wsServer;
};

const getWebSocketServer = () => wsServer;

// Event emitters for different actions
const emitTicketUpdate = (projectMembers, ticketData) => {
  if (wsServer) {
    wsServer.sendToUsers(projectMembers, {
      type: 'ticket_update',
      data: ticketData
    });
  }
};

const emitTicketCreated = (projectMembers, ticketData) => {
  if (wsServer) {
    wsServer.sendToUsers(projectMembers, {
      type: 'ticket_created',
      data: ticketData
    });
  }
};

const emitMeetingNotification = (userIds, meetingData) => {
  if (wsServer) {
    wsServer.sendToUsers(userIds, {
      type: 'meeting_notification',
      data: meetingData
    });
  }
};

const emitNotification = (userId, notification) => {
  if (wsServer) {
    wsServer.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }
};

module.exports = {
  initWebSocket,
  getWebSocketServer,
  emitTicketUpdate,
  emitTicketCreated,
  emitMeetingNotification,
  emitNotification
};
