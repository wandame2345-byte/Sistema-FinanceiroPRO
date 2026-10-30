"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
async function authMiddleware(request, reply) {
    try {
        const token = request.headers.authorization?.split(' ')[1];
        if (!token)
            return reply.status(401).send({ error: 'Token necessário' });
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        request.user = decoded;
    }
    catch (err) {
        return reply.status(401).send({ error: 'Token inválido' });
    }
}
