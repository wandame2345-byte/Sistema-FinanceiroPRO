"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./config/env");
const auth_1 = require("./routes/auth");
const transactions_1 = require("./routes/transactions");
const categories_1 = require("./routes/categories");
const goals_1 = require("./routes/goals");
const app = (0, fastify_1.default)({ logger: true });
async function start() {
    try {
        await app.register(cors_1.default, { origin: true, credentials: true });
        await app.register(rate_limit_1.default, { max: 100, timeWindow: '1 minute' });
        await app.register(auth_1.authRoutes, { prefix: '/api/auth' });
        await app.register(transactions_1.transactionRoutes, { prefix: '/api/transactions' });
        await app.register(categories_1.categoryRoutes, { prefix: '/api/categories' });
        await app.register(goals_1.goalRoutes, { prefix: '/api/goals' });
        const distPath = path_1.default.join(__dirname, '..', 'dist', 'public');
        if (fs_1.default.existsSync(distPath)) {
            console.log('📁 Servindo frontend de:', distPath);
            await app.register(static_1.default, { root: distPath, prefix: '/' });
            app.setNotFoundHandler((request, reply) => {
                if (request.url.startsWith('/api'))
                    return reply.status(404).send({ error: 'Not Found' });
                return reply.sendFile('index.html');
            });
        }
        else {
            app.get('/', async () => ({ message: 'API FinancePRO Blue rodando' }));
        }
        app.get('/health', async () => ({ status: 'ok' }));
        await app.listen({ port: env_1.env.PORT, host: '0.0.0.0' });
        console.log(`🚀 Servidor na porta ${env_1.env.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
