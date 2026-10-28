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
    // Helmet pode bloquear imagens inline, vamos relaxar para o QR code funcionar
    await app.register(helmet, {
      contentSecurityPolicy: false,
    });
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

    app.get('/health', async () => ({ status: 'ok' }));

    // ROTA MÁGICA DO QR CODE
    app.get('/qr', async (request, reply) => {
      const qrData = getCurrentQR();
      if (!qrData) {
        return reply.status(200).send('<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>✅ WhatsApp já está conectado!</h1><p>Nenhum QR Code pendente.</p></body></html>');
      }
      try {
        const buffer = await qrcode.toBuffer(qrData, { type: 'png', width: 400 });
        reply.type('image/png').send(buffer);
      } catch (err) {
        reply.status(500).send('Erro ao gerar QR Code');
      }
    });

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
