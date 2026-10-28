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
