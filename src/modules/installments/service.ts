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
