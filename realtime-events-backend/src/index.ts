import express from 'express';
import http from 'http';
import { Server as WebSocketServer } from 'ws';
import { setupRabbitMQ } from './services/rabbitmq.service';
import { handleIncomingMessage } from './services/event.service';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4001;
const WS_CLIENTS = new Set<WebSocket>();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 Client connected');
  WS_CLIENTS.add(ws);

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    WS_CLIENTS.delete(ws);
  });
});

// Expose function to broadcast to all clients
export const broadcast = (data: any) => {
  const json = JSON.stringify(data);
  WS_CLIENTS.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(json);
    }
  });
};

// Middleware
app.use(express.json());

// Simple health check
app.get('/health', (_, res) => res.send('✅ Realtime backend running'));

// Route to manually trigger events (for testing)
app.post('/events', async (req, res) => {
  const event = req.body;
  await handleIncomingMessage(event);
  res.send({ ok: true });
});

// Initialize RabbitMQ
setupRabbitMQ();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Realtime backend listening on http://localhost:${PORT}`);
});