import { broadcast } from '../index';

export async function handleIncomingMessage(payload: any) {
  console.log('📨 Incoming Event:', payload);

  // Emit the event via WebSocket
  broadcast({
    type: payload.type || 'UNKNOWN_EVENT',
    payload,
  });
}
