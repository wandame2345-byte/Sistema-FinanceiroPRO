"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalRoutes = goalRoutes;
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
async function goalRoutes(app) {
    app.get('/', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const goals = await database_1.prisma.goal.findMany({
            where: { userId: req.user.id },
            orderBy: { deadline: 'asc' }
        });
        return reply.send({ goals });
    });
    app.post('/', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const { name, targetAmount, savedAmount, deadline } = req.body;
        const goal = await database_1.prisma.goal.create({
            data: {
                userId: req.user.id,
                name,
                targetAmount: parseFloat(targetAmount),
                savedAmount: parseFloat(savedAmount || 0),
                deadline: deadline ? new Date(deadline) : null
            }
        });
        return reply.status(201).send({ goal });
    });
    app.put('/:id', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const { id } = req.params;
        const { name, targetAmount, savedAmount, deadline } = req.body;
        const goal = await database_1.prisma.goal.update({
            where: { id, userId: req.user.id },
            data: {
                ...(name && { name }),
                ...(targetAmount && { targetAmount: parseFloat(targetAmount) }),
                ...(savedAmount !== undefined && { savedAmount: parseFloat(savedAmount) }),
                ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
            }
        });
        return reply.send({ goal });
    });
    app.delete('/:id', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const { id } = req.params;
        await database_1.prisma.goal.delete({ where: { id, userId: req.user.id } });
        return reply.send({ success: true });
    });
}
