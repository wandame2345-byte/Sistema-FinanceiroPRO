import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: (req as any).user.id },
        include: { category: true },
        orderBy: { date: 'desc' }
      });
      return reply.send({ transactions });
    } catch (err: any) {
      console.error('Erro ao listar transações:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao listar transações' });
    }
  });

  app.post('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { amount, description, type, categoryId, date } = req.body as any;
      const transaction = await prisma.transaction.create({
        data: {
          userId: (req as any).user.id,
          amount: parseFloat(amount),
          description,
          type,
          categoryId: categoryId || null,
          date: date ? new Date(date) : new Date()
        },
        include: { category: true }
      });
      return reply.status(201).send({ transaction });
    } catch (err: any) {
      console.error('Erro ao criar transação:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao criar transação' });
    }
  });

  app.delete('/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const { id } = req.params as any;
      await prisma.transaction.delete({ where: { id, userId: (req as any).user.id } });
      return reply.send({ success: true });
    } catch (err: any) {
      console.error('Erro ao deletar transação:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao deletar transação' });
    }
  });

  app.get('/summary', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const userId = (req as any).user.id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const result = await prisma.transaction.groupBy({
        by: ['type'],
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      });

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { monthlySalary: true } });
      const income = Number(result.find((r: any) => r.type === 'income')?._sum.amount || 0);
      const expense = Number(result.find((r: any) => r.type === 'expense')?._sum.amount || 0);
      const salary = Number(user?.monthlySalary || 0);

      return reply.send({ income, expense, balance: salary + income - expense, salary, available: salary + income - expense });
    } catch (err: any) {
      console.error('Erro no summary:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao buscar resumo' });
    }
  });
}