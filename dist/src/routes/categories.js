"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = categoryRoutes;
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
async function categoryRoutes(app) {
    app.get('/', { preHandler: [auth_1.authMiddleware] }, async (req, reply) => {
        const categories = await database_1.prisma.category.findMany();
        return reply.send({ categories });
    });
}
