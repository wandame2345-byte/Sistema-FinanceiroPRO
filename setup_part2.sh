#!/bin/bash
echo "Criando arquivos de configuração..."
cat > src/config/env.ts << 'EOP'
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WHATSAPP_SESSION_PATH: z.string().default('./whatsapp-session'),
  TZ: z.string().default('America/Sao_Paulo'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALERT_HIGH_VALUE_THRESHOLD: z.coerce.number().default(100),
  DAILY_SUMMARY_HOUR: z.coerce.number().default(20),
});
export type Env = z.infer<typeof envSchema>;
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) { console.error('❌ Variáveis inválidas:', parsed.error.flatten().fieldErrors); process.exit(1); }
export const env = parsed.data;
EOP

cat > src/config/database.ts << 'EOP'
import { PrismaClient } from '@prisma/client';
import { env } from './env';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({ log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'] });
if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOP

echo "Criando utilitários..."
cat > src/shared/utils/format-currency.ts << 'EOP'
export function formatCurrency(value: number | string, currency = 'BRL'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(numValue);
}
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
EOP

cat > src/shared/utils/parse-command.ts << 'EOP'
export interface ParsedCommand { command: string; args: string[]; raw: string; }
export function parseCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;
  const parts = trimmed.split(/\s+/);
  return { command: parts[0].toLowerCase(), args: parts.slice(1), raw: trimmed };
}
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
EOP

echo "Criando serviços principais..."
cat > src/modules/transactions/service.ts << 'EOP'
import { prisma } from '../../config/database';
import { getCurrentMonth } from '../../shared/utils/parse-command';
export async function createTransaction(data: any) {
  return prisma.transaction.create({ data: { ...data, date: data.date || new Date() }, include: { category: true } });
}
export async function getBalance(userId: string) {
  const result = await prisma.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amount: true } });
  const income = Number(result.find(r => r.type === 'income')?._sum.amount || 0);
  const expense = Number(result.find(r => r.type === 'expense')?._sum.amount || 0);
  return { income, expense, balance: income - expense };
}
export async function getTodayExpenses(userId: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  return prisma.transaction.findMany({ where: { userId, type: 'expense', date: { gte: today, lt: tomorrow } }, include: { category: true } });
}
export async function getExpensesByCategory(userId: string) {
  const [year, month] = getCurrentMonth().split('-').map(Number);
  const start = new Date(year, month - 1, 1); const end = new Date(year, month, 0, 23, 59, 59);
  const txs = await prisma.transaction.findMany({ where: { userId, type: 'expense', date: { gte: start, lte: end } }, include: { category: true } });
  const map: any = {};
  for (const t of txs) { const c = t.category?.name || 'Sem categoria'; map[c] = (map[c] || 0) + Number(t.amount); }
  return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a,b) => b.total - a.total);
}
export async function findOrCreateUser(phone: string, name?: string) {
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) user = await prisma.user.create({ data: { phone, name: name || phone } });
  return user;
}
export async function findCategoryByName(name: string) { return prisma.category.findUnique({ where: { name } }); }
export async function getTransactionsByUser(userId: string, opts: any = {}) {
  const where: any = { userId };
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.type) where.type = opts.type;
  if (opts.startDate || opts.endDate) { where.date = {}; if (opts.startDate) where.date.gte = opts.startDate; if (opts.endDate) where.date.lte = opts.endDate; }
  return prisma.transaction.findMany({ where, include: { category: true }, orderBy: { date: 'desc' }, take: 50 });
}
EOP

cat > src/modules/installments/service.ts << 'EOP'
import { prisma } from '../../config/database';
export async function getInstallments(userId: string) {
  const list = await prisma.installment.findMany({ where: { userId, isCompleted: false } });
  const now = new Date();
  return list.map(i => {
    const parcelValue = Number(i.totalAmount) / i.totalParcels;
    const remaining = i.totalParcels - i.currentParcel + 1;
    let nextDue = new Date(now.getFullYear(), now.getMonth(), i.dueDay);
    if (nextDue < now) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, i.dueDay);
    const days = Math.ceil((nextDue.getTime() - now.getTime()) / (1000*60*60*24));
    return { ...i, parcelValue, remainingParcels: remaining, remainingAmount: parcelValue * remaining, nextDueDate: nextDue, daysUntilDue: days, totalAmount: Number(i.totalAmount) };
  });
}
export async function getInstallmentsDueSoon(userId: string, days = 3) {
  const all = await getInstallments(userId);
  return all.filter(i => i.daysUntilDue !== null && i.daysUntilDue <= days && i.daysUntilDue >= 0);
}
export async function getMonthlyInstallmentTotal(userId: string) {
  const list = await prisma.installment.findMany({ where: { userId, isCompleted: false } });
  return list.reduce((sum, i) => sum + (Number(i.totalAmount) / i.totalParcels), 0);
}
EOP

cat > src/modules/goals/service.ts << 'EOP'
import { prisma } from '../../config/database';
export async function getGoals(userId: string) {
  const goals = await prisma.goal.findMany({ where: { userId } });
  const now = new Date();
  return goals.map(g => {
    const target = Number(g.targetAmount); const saved = Number(g.savedAmount);
    const percent = target > 0 ? (saved / target) * 100 : 0;
    const months = Math.max(1, (g.deadline.getFullYear() - now.getFullYear()) * 12 + (g.deadline.getMonth() - now.getMonth()));
    const needed = Math.max(0, target - saved) / months;
    return { ...g, targetAmount: target, savedAmount: saved, percentComplete: percent, monthlyNeeded: needed, isOnTrack: saved >= (target * ((months - Math.max(0, months)) / months) * 0.8) };
  });
}
export async function getGoalsWithInsufficientPace(userId: string) {
  const all = await getGoals(userId);
  return all.filter(g => g.isActive && !g.isOnTrack && g.percentComplete < 100);
}
EOP

cat > src/modules/investments/service.ts << 'EOP'
import { prisma } from '../../config/database';
export async function getInvestments(userId: string) {
  return prisma.investment.findMany({ where: { userId } });
}
export async function getTotalPortfolio(userId: string) {
  const res = await prisma.investment.aggregate({ where: { userId }, _sum: { amount: true } });
  return Number(res._sum.amount || 0);
}
EOP

cat > src/modules/budgets/service.ts << 'EOP'
import { prisma } from '../../config/database';
import { getCurrentMonth } from '../../shared/utils/parse-command';
export async function getBudgetStatus(userId: string) {
  const month = getCurrentMonth();
  const budgets = await prisma.budget.findMany({ where: { userId, month }, include: { category: true } });
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m-1, 1); const end = new Date(y, m, 0, 23, 59, 59);
  const expenses = await prisma.transaction.groupBy({ by: ['categoryId'], where: { userId, type: 'expense', date: { gte: start, lte: end } }, _sum: { amount: true } });
  const spentMap: any = {}; expenses.forEach(e => { if(e.categoryId) spentMap[e.categoryId] = Number(e._sum.amount||0); });
  return budgets.map(b => {
    const spent = spentMap[b.categoryId] || 0; const limit = Number(b.monthLimit);
    const percent = limit > 0 ? (spent/limit)*100 : 0;
    let level: any = 'ok'; if(percent>=100) level='exceeded'; else if(percent>=90) level='critical'; else if(percent>=70) level='warning';
    return { category: b.category.name, limit, spent, remaining: limit-spent, percentUsed: percent, alertLevel: level };
  });
}
export async function checkBudgetAlert(userId: string, categoryId: string) {
  const month = getCurrentMonth();
  const b = await prisma.budget.findUnique({ where: { userId_categoryId_month: { userId, categoryId, month } }, include: { category: true } });
  if(!b) return null;
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m-1, 1); const end = new Date(y, m, 0, 23, 59, 59);
  const res = await prisma.transaction.aggregate({ where: { userId, categoryId, type: 'expense', date: { gte: start, lte: end } }, _sum: { amount: true } });
  const spent = Number(res._sum.amount||0); const limit = Number(b.monthLimit);
  const percent = limit > 0 ? (spent/limit)*100 : 0;
  let level: any = 'ok'; if(percent>=100) level='exceeded'; else if(percent>=90) level='critical'; else if(percent>=70) level='warning';
  return { category: b.category.name, limit, spent, remaining: limit-spent, percentUsed: percent, alertLevel: level };
}
EOP

echo "Arquivos de serviço criados! Agora rode: bash setup_part3.sh"
