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
