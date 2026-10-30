import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

export async function goalRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const goals = await prisma.goal.findMany({
        where: { userId: (req as any).user.id },
        orderBy: { deadline: 'asc' }
      });
      return reply.send({ goals });
    } catch (err: any) {
      console.error('Erro ao listar metas:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao listar metas' });
    }
  });

  app.post('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { name, targetAmount, savedAmount, deadline } = req.body as any;
      const goal = await prisma.goal.create({
        data: {
          userId: (req as any).user.id,
          name,
          targetAmount: parseFloat(targetAmount),
          savedAmount: parseFloat(savedAmount || 0),
          deadline: deadline ? new Date(deadline) : null
        }
      });
      return reply.status(201).send({ goal });
    } catch (err: any) {
      console.error('Erro ao criar meta:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao criar meta' });
    }
  });

  app.put('/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { id } = req.params as any;
      const { name, targetAmount, savedAmount, deadline } = req.body as any;
      const goal = await prisma.goal.update({
        where: { id, userId: (req as any).user.id },
        data: {
          ...(name && { name }),
          ...(targetAmount && { targetAmount: parseFloat(targetAmount) }),
          ...(savedAmount !== undefined && { savedAmount: parseFloat(savedAmount) }),
          ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
        }
      });
      return reply.send({ goal });
    } catch (err: any) {
      console.error('Erro ao atualizar meta:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao atualizar meta' });
    }
  });

  app.delete('/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { id } = req.params as any;
      await prisma.goal.delete({ where: { id, userId: (req as any).user.id } });
      return reply.send({ success: true });
    } catch (err: any) {
      console.error('Erro ao deletar meta:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao deletar meta' });
    }
  });
}