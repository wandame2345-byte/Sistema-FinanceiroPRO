import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const { email, password, name } = req.body as any;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return reply.status(400).send({ error: 'Email já cadastrado' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, monthlySalary: true }
    });
    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
    return reply.status(201).send({ user, token });
  });

  app.post('/login', async (req, reply) => {
    const { email, password } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    return reply.send({ user: safeUser, token });
  });

  app.get('/me', { preHandler: [authMiddleware] }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: { id: true, email: true, name: true, monthlySalary: true }
    });
    return reply.send({ user });
  });

  app.put('/salary', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { monthlySalary } = req.body as any;
    const user = await prisma.user.update({
      where: { id: (req as any).user.id },
      data: { monthlySalary: parseFloat(monthlySalary) },
      select: { id: true, email: true, name: true, monthlySalary: true }
    });
    return reply.send({ user });
  });
}
