import { prisma } from '../config/database';
import { getGoalsWithInsufficientPace } from '../modules/goals/service';
import { sendMessage } from '../modules/whatsapp/client';
export async function checkGoals(): Promise<void> {
const users = await prisma.user.findMany();
for (const user of users) {
const behind = await getGoalsWithInsufficientPace(user.id);
if (behind.length > 0) {
let msg = `🎯 *ALERTA DE METAS*\nRitmo insuficiente em:\n`;
behind.forEach(g => msg += `• ${g.name}\n`);
await sendMessage(`${user.phone}@s.whatsapp.net`, msg);
}
}
}
