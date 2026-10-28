import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { createWhatsAppClient, getCurrentQR } from './modules/whatsapp/client';
import { messageHandler } from './modules/whatsapp/handler';
import { startScheduler } from './jobs/scheduler';
import qrcode from 'qrcode';

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(cors, { origin: true });
    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

    app.get('/health', async () => ({ status: 'ok' }));

    // ROTA DO QR CODE COMO IMAGEM
    app.get('/qr', async (request, reply) => {
      const qrData = getCurrentQR();
      if (!qrData) {
        return reply.status(200).send('<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>✅ WhatsApp já conectado!</h1><p>Atualize a página se precisar reconectar.</p></body></html>');
      }
      try {
        const buffer = await qrcode.toBuffer(qrData, { type: 'png', width: 400 });
        reply.type('image/png').send(buffer);
      } catch (err) {
        reply.status(500).send('Erro ao gerar QR');
      }
    });

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Servidor na porta ${env.PORT}`);
    await createWhatsAppClient(messageHandler);
    startScheduler();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
start();
