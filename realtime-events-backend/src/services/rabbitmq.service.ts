import amqp from 'amqplib';
import { handleIncomingMessage } from './event.service';

const QUEUE_NAME = 'notebook_events';

export async function setupRabbitMQ() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log('📥 Listening for RabbitMQ messages...');
    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        const payload = JSON.parse(content);
        await handleIncomingMessage(payload);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('❌ RabbitMQ connection failed:', err);
  }
}
