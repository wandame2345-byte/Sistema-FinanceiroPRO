import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    try {
      const { email, password, name } = req.body as any;
      if (!email || !password || !name) return reply.status(400).send({ error: 'Preencha todos os campos' });
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return reply.status(400).send({ error: 'Email já cadastrado' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
        select: { id: true, email: true, name: true }
      });
      const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
      return reply.status(201).send({ user, token });
    } catch (err: any) {
      console.error('Erro no register:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao criar conta' });
    }
  });

  app.post('/login', async (req, reply) => {
    try {
      const { email, password } = req.body as any;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) return reply.status(401).send({ error: 'Credenciais inválidas' });
      const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...safeUser } = user;
      return reply.send({ user: safeUser, token });
    } catch (err: any) {
      console.error('Erro no login:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao fazer login' });
    }
  });

  app.get('/me', { preHandler: [authMiddleware] }, async (req, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: (req as any).user.id },
        select: { id: true, email: true, name: true }
      });
      return reply.send({ user });
    } catch (err: any) {
      console.error('Erro no /me:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao buscar usuário' });
    }
  });
}