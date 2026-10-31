import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

export async function salaryRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const userId = (req as any).user.id;
      const { month, year } = req.query as any;
      const salary = await prisma.monthlySalary.findUnique({
        where: {
          userId_month_year: {
            userId,
            month: parseInt(month),
            year: parseInt(year)
          }
        }
      });
      return reply.send({ salary: salary?.amount || 0 });
    } catch (err: any) {
      console.error('Erro ao buscar salário:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao buscar salário' });
    }
  });

  app.post('/', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const userId = (req as any).user.id;
      const { month, year, amount } = req.body as any;
      const salary = await prisma.monthlySalary.upsert({
        where: {
          userId_month_year: {
            userId,
            month: parseInt(month),
            year: parseInt(year)
          }
        },
        update: { amount: parseFloat(amount) },
        create: {
          userId,
          month: parseInt(month),
          year: parseInt(year),
          amount: parseFloat(amount)
        }
      });
      return reply.send({ salary });
    } catch (err: any) {
      console.error('Erro ao salvar salário:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao salvar salário' });
    }
  });
}