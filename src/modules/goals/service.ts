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
