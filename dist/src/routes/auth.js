"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
async function authRoutes(app) {
    app.post('/register', async (req, reply) => {
        const { email, password, name } = req.body;
        const existingUser = await database_1.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return reply.status(400).send({ error: 'Email já cadastrado' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await database_1.prisma.user.create({
            data: { email, password: hashedPassword, name },
            select: { id: true, email: true, name: true, monthlySalary: true }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
        return reply.status(201).send({ user, token });
    });
    app.post('/login', async (req, reply) => {
        const { email, password } = req.body;
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return reply.status(401).send({ error: 'Credenciais inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...safeUser } = user;
        return reply.send({ user: safeUser, token });
    });
    app.get('/me', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, monthlySalary: true }
        });
        return reply.send({ user });
    });
    app.put('/salary', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const { monthlySalary } = req.body;
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: { monthlySalary: parseFloat(monthlySalary) },
            select: { id: true, email: true, name: true, monthlySalary: true }
        });
        return reply.send({ user });
    });
}
