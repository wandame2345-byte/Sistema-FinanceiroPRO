import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

export async function categoryRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const userId = (req as any).user.id;
      const categories = await prisma.category.findMany({
        where: { OR: [{ userId: null }, { userId: userId }] },
        orderBy: { name: 'asc' }
      });
      return reply.send({ categories });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { name, color } = req.body as any;
      const userId = (req as any).user.id;
      const category = await prisma.category.create({ data: { name, color: color || '#3b82f6', userId } });
      return reply.status(201).send({ category });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.put('/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { id } = req.params as any;
      const { name, color } = req.body as any;
      const userId = (req as any).user.id;
      const category = await prisma.category.update({
        where: { id, userId },
        data: { ...(name && { name }), ...(color && { color }) }
      });
      return reply.send({ category });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.delete('/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { id } = req.params as any;
      const userId = (req as any).user.id;
      await prisma.category.delete({ where: { id, userId } });
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}