import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) return reply.status(401).send({ error: 'Token necessário' });
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    (request as any).user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido' });
  }
}
