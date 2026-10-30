"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = transactionRoutes;
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
async function transactionRoutes(app) {
    app.get('/', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const transactions = await database_1.prisma.transaction.findMany({
            where: { userId: req.user.id },
            include: { category: true },
            orderBy: { date: 'desc' }
        });
        return reply.send({ transactions });
    });
    app.post('/', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const { amount, description, type, categoryId, date } = req.body;
        const transaction = await database_1.prisma.transaction.create({
            data: {
                userId: req.user.id,
                amount: parseFloat(amount),
                description,
                type,
                categoryId: categoryId || null,
                date: date ? new Date(date) : new Date()
            },
            include: { category: true }
        });
        return reply.status(201).send({ transaction });
    });
    app.delete('/:id', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const { id } = req.params;
        await database_1.prisma.transaction.delete({ where: { id, userId: req.user.id } });
        return reply.send({ success: true });
    });
    app.get('/summary', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const userId = req.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const result = await database_1.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                userId,
                date: { gte: startOfMonth, lte: endOfMonth }
            },
            _sum: { amount: true }
        });
        const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { monthlySalary: true } });
        const income = Number(result.find(r => r.type === 'income')?._sum.amount || 0);
        const expense = Number(result.find(r => r.type === 'expense')?._sum.amount || 0);
        const salary = Number(user?.monthlySalary || 0);
        return reply.send({
            income,
            expense,
            balance: salary + income - expense,
            salary,
            available: salary + income - expense
        });
    });
}
