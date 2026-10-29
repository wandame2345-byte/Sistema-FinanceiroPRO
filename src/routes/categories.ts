import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

export async function categoryRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    const categories = await prisma.category.findMany();
    return reply.send({ categories });
  });
}
