import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { createWhatsAppClient } from './modules/whatsapp/client';
import { messageHandler } from './modules/whatsapp/handler';
import { startScheduler } from './jobs/scheduler';
const app = Fastify({ logger: true });
async function start() {
try {
await app.register(cors, { origin: true });
await app.register(helmet);
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
app.get('/health', async () => ({ status: 'ok' }));
await app.listen({ port: env.PORT, host: '0.0.0.0' });
console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
await createWhatsAppClient(messageHandler);
startScheduler();
} catch (err) {
console.error(err);
process.exit(1);
}
}
start();
