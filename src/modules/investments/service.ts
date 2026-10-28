import { prisma } from '../../config/database';
export async function getInvestments(userId: string) { return prisma.investment.findMany({ where: { userId } }); }
export async function getTotalPortfolio(userId: string) {
  const res = await prisma.investment.aggregate({ where: { userId }, _sum: { amount: true } });
  return Number(res._sum.amount || 0);
}
