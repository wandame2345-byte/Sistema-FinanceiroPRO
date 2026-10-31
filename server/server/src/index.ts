import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { authRoutes } from './routes/auth';
import { transactionRoutes } from './routes/transactions';
import { categoryRoutes } from './routes/categories';
import { goalRoutes } from './routes/goals';
import { salaryRoutes } from './routes/salary';

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(cors, { origin: true, credentials: true });
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(transactionRoutes, { prefix: '/api/transactions' });
    await app.register(categoryRoutes, { prefix: '/api/categories' });
    await app.register(goalRoutes, { prefix: '/api/goals' });
    await app.register(salaryRoutes, { prefix: '/api/salary' });

    const distPath = path.join(__dirname, '..', 'dist', 'public');
    const publicPath = path.join(__dirname, '..', 'public');
    let staticPath = '';
    if (fs.existsSync(distPath)) staticPath = distPath;
    else if (fs.existsSync(publicPath)) staticPath = publicPath;

    if (staticPath) {
      console.log('📁 Servindo frontend de:', staticPath);
      await app.register(fastifyStatic, { root: staticPath, prefix: '/' });
      app.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api')) return reply.status(404).send({ error: 'Not Found' });
        return reply.sendFile('index.html');
      });
    } else {
      app.get('/', async () => ({ message: 'API FinancePRO rodando.' }));
    }

    app.get('/health', async () => ({ status: 'ok' }));
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Servidor na porta ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
start();