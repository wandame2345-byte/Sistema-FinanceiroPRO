#!/bin/bash
echo "Criando integração WhatsApp e Jobs..."

# --- Comandos WhatsApp ---
cat > src/modules/whatsapp/commands/ajuda.ts << 'EOP'
export function handleAjuda(): string {
return `📚 *COMANDOS DISPONÍVEIS*\n\n💰 *Consultas*\n/saldo - Ver saldo atual\n/gastos [categoria] - Detalhamento de gastos\n/parcelas - Parcelas ativas\n/metas - Status das metas\n/investimentos - Portfólio\n/orcamento - Status dos orçamentos\n\n📝 *Ações*\n/adicionar [valor] [categoria] [descrição]\nEx: /adicionar 50 mercado compra semanal\n\n📊 *Relatórios*\n/relatorio [diario|semanal|mensal]\n\n❓ *Ajuda*\n/ajuda - Esta mensagem`;
}
EOP

cat > src/modules/whatsapp/commands/saldo.ts << 'EOP'
import { getBalance, getTodayExpenses } from '../../transactions/service';
import { getMonthlyInstallmentTotal } from '../../installments/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleSaldo(userId: string): Promise<string> {
const balance = await getBalance(userId);
const todayExpenses = await getTodayExpenses(userId);
const monthlyInstallments = await getMonthlyInstallmentTotal(userId);
const todayTotal = todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
let msg = `💰 *SALDO ATUAL*\n`;
msg += `📊 Receitas: ${formatCurrency(balance.income)}\n`;
msg += `📉 Despesas: ${formatCurrency(balance.expense)}\n`;
msg += `💵 *Saldo: ${formatCurrency(balance.balance)}*\n\n`;
msg += `📅 Gastos hoje: ${formatCurrency(todayTotal)}\n`;
msg += `📦 Parcelas/mês: ${formatCurrency(monthlyInstallments)}`;
return msg;
}
EOP

cat > src/modules/whatsapp/commands/gastos.ts << 'EOP'
import { getExpensesByCategory, getTransactionsByUser, findCategoryByName } from '../../transactions/service';
import { formatCurrency, formatDate } from '../../../shared/utils/format-currency';
export async function handleGastos(userId: string, categoryArg?: string): Promise<string> {
if (categoryArg) {
const category = await findCategoryByName(categoryArg.toLowerCase());
if (!category) return `❌ Categoria "${categoryArg}" não encontrada.`;
const transactions = await getTransactionsByUser(userId, { categoryId: category.id, type: 'expense' });
if (transactions.length === 0) return `📭 Nenhum gasto em *${category.name}*.`;
const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
let msg = `📊 *GASTOS - ${category.name.toUpperCase()}*\n`;
for (const t of transactions.slice(0, 10)) msg += `• ${formatDate(t.date)} - ${t.description}: ${formatCurrency(t.amount)}\n`;
msg += `\n💰 *Total: ${formatCurrency(total)}*`;
return msg;
}
const byCategory = await getExpensesByCategory(userId);
if (byCategory.length === 0) return '📭 Nenhum gasto este mês.';
const total = byCategory.reduce((sum, c) => sum + c.total, 0);
let msg = `📊 *GASTOS DO MÊS*\n`;
for (const c of byCategory) msg += `${c.category}: ${formatCurrency(c.total)} (${((c.total/total)*100).toFixed(1)}%)\n`;
msg += `\n💰 *Total: ${formatCurrency(total)}*`;
return msg;
}
EOP

cat > src/modules/whatsapp/commands/adicionar.ts << 'EOP'
import { createTransaction, findCategoryByName } from '../../transactions/service';
import { checkBudgetAlert } from '../../budgets/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
import { parseAmount } from '../../../shared/utils/parse-command';
export async function handleAdicionar(userId: string, args: string[]): Promise<string> {
if (args.length < 2) return `❌ Use: /adicionar [valor] [categoria] [descrição]\nEx: /adicionar 50 mercado compra`;
const amount = parseAmount(args[0]);
if (amount === null || amount <= 0) return '❌ Valor inválido.';
const category = await findCategoryByName(args[1].toLowerCase());
if (!category) return `❌ Categoria "${args[1]}" não encontrada.\nDisponíveis: mercado, transporte, lazer, saúde, educação, moradia, vestuário, assinaturas, outros`;
const description = args.slice(2).join(' ') || 'Sem descrição';
await createTransaction({ userId, amount, description, type: 'expense', categoryId: category.id });
let msg = `✅ *GASTO REGISTRADO*\n💰 ${formatCurrency(amount)}\n📁 ${category.name}\n📝 ${description}`;
const alert = await checkBudgetAlert(userId, category.id);
if (alert && alert.alertLevel !== 'ok') {
if (alert.alertLevel === 'exceeded') msg += `\n\n🔴 *LIMITE EXCEDIDO!*`;
else if (alert.alertLevel === 'critical') msg += `\n\n🔶 *ALERTA:* ${alert.percentUsed.toFixed(0)}% usado`;
else msg += `\n\n⚠️ *Atenção:* ${alert.percentUsed.toFixed(0)}% usado`;
}
return msg;
}
EOP

# Handlers simples para os outros comandos
cat > src/modules/whatsapp/commands/parcelas.ts << 'EOP'
import { getInstallments, getInstallmentsDueSoon } from '../../installments/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleParcelas(userId: string): Promise<string> {
const installments = await getInstallments(userId);
if (installments.length === 0) return '📭 Nenhuma parcela ativa.';
let msg = `📦 *PARCELAS ATIVAS*\n`;
for (const i of installments.slice(0, 5)) {
msg += `• ${i.description} (${i.currentParcel}/${i.totalParcels}): ${formatCurrency(i.parcelValue)}/mês\n`;
}
return msg;
}
EOP

cat > src/modules/whatsapp/commands/metas.ts << 'EOP'
import { getGoals } from '../../goals/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleMetas(userId: string): Promise<string> {
const goals = await getGoals(userId);
if (goals.length === 0) return '🎯 Nenhuma meta cadastrada.';
let msg = `🎯 *METAS*\n`;
for (const g of goals.filter(g => g.isActive).slice(0, 5)) {
msg += `• ${g.name}: ${g.percentComplete.toFixed(0)}% (${formatCurrency(g.savedAmount)}/${formatCurrency(g.targetAmount)})\n`;
}
return msg;
}
EOP

cat > src/modules/whatsapp/commands/investimentos.ts << 'EOP'
import { getInvestments, getTotalPortfolio } from '../../investments/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleInvestimentos(userId: string): Promise<string> {
const investments = await getInvestments(userId);
const total = await getTotalPortfolio(userId);
if (investments.length === 0) return '📈 Nenhum investimento.';
let msg = `📈 *INVESTIMENTOS*\n💰 Total: ${formatCurrency(total)}\n\n`;
for (const i of investments.slice(0, 5)) msg += `• ${i.name}: ${formatCurrency(i.amount)}\n`;
return msg;
}
EOP

cat > src/modules/whatsapp/commands/orcamento.ts << 'EOP'
import { getBudgetStatus } from '../../budgets/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleOrcamento(userId: string): Promise<string> {
const budgets = await getBudgetStatus(userId);
if (budgets.length === 0) return '📊 Nenhum orçamento configurado.';
let msg = `📊 *ORÇAMENTO*\n`;
for (const b of budgets) {
const icon = b.alertLevel === 'exceeded' ? '🔴' : b.alertLevel === 'critical' ? '🔶' : b.alertLevel === 'warning' ? '⚠️' : '✅';
msg += `${icon} ${b.category}: ${formatCurrency(b.spent)}/${formatCurrency(b.limit)} (${b.percentUsed.toFixed(0)}%)\n`;
}
return msg;
}
EOP

cat > src/modules/whatsapp/commands/relatorio.ts << 'EOP'
import { getBalance } from '../../transactions/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleRelatorio(userId: string): Promise<string> {
const balance = await getBalance(userId);
return `📊 *RELATÓRIO RÁPIDO*\n💰 Saldo: ${formatCurrency(balance.balance)}\n📈 Receitas: ${formatCurrency(balance.income)}\n📉 Despesas: ${formatCurrency(balance.expense)}`;
}
EOP

# --- Handler Principal ---
cat > src/modules/whatsapp/handler.ts << 'EOP'
import { proto, WASocket } from '@whiskeysockets/baileys';
import { parseCommand } from '../../shared/utils/parse-command';
import { findOrCreateUser } from '../transactions/service';
import { handleSaldo } from './commands/saldo';
import { handleGastos } from './commands/gastos';
import { handleParcelas } from './commands/parcelas';
import { handleMetas } from './commands/metas';
import { handleInvestimentos } from './commands/investimentos';
import { handleOrcamento } from './commands/orcamento';
import { handleAdicionar } from './commands/adicionar';
import { handleAjuda } from './commands/ajuda';
import { handleRelatorio } from './commands/relatorio';

export async function messageHandler(msg: proto.IWebMessageInfo, sock: WASocket): Promise<void> {
const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
if (!text.trim()) return;
const jid = msg.key.remoteJid!;
const phone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
try {
const user = await findOrCreateUser(phone, msg.pushName || phone);
const parsed = parseCommand(text);
if (!parsed) {
await sock.sendMessage(jid, { text: '💡 Olá! Sou seu assistente financeiro.\nDigite /ajuda para ver os comandos.' });
return;
}
let response: string;
switch (parsed.command) {
case '/saldo': response = await handleSaldo(user.id); break;
case '/gastos': response = await handleGastos(user.id, parsed.args[0]); break;
case '/parcelas': response = await handleParcelas(user.id); break;
case '/metas': response = await handleMetas(user.id); break;
case '/investimentos': response = await handleInvestimentos(user.id); break;
case '/orcamento': response = await handleOrcamento(user.id); break;
case '/adicionar': response = await handleAdicionar(user.id, parsed.args); break;
case '/relatorio': response = await handleRelatorio(user.id); break;
case '/ajuda': response = handleAjuda(); break;
default: response = `❓ Comando desconhecido: ${parsed.command}\nDigite /ajuda.`;
}
await sock.sendMessage(jid, { text: response });
} catch (error) {
console.error('Erro:', error);
await sock.sendMessage(jid, { text: '❌ Erro ao processar comando.' }).catch(() => {});
}
}
EOP

# --- Client WhatsApp ---
cat > src/modules/whatsapp/client.ts << 'EOP'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, proto, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { env } from '../../config/env';

let sock: WASocket | null = null;

export async function createWhatsAppClient(onMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => Promise<void>): Promise<WASocket> {
const sessionPath = path.resolve(env.WHATSAPP_SESSION_PATH);
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false, browser: ['Finance WhatsApp', 'Chrome', '1.0.0'] });

sock.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect, qr } = update;
if (qr) { console.log('\n📱 ESCANEIE O QR CODE ABAIXO:\n'); qrcode.generate(qr, { small: true }); }
if (connection === 'close') {
const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
if (shouldReconnect) setTimeout(() => createWhatsAppClient(onMessage), 5000);
} else if (connection === 'open') console.log('✅ WhatsApp conectado!');
});
sock.ev.on('creds.update', saveCreds);
sock.ev.on('messages.upsert', async ({ messages, type }) => {
if (type !== 'notify') return;
for (const msg of messages) { if (!msg.key.fromMe) await onMessage(msg, sock); }
});
return sock;
}
export async function sendMessage(jid: string, text: string): Promise<void> {
if (sock) await sock.sendMessage(jid, { text });
}
EOP

# --- Jobs ---
cat > src/jobs/scheduler.ts << 'EOP'
import cron from 'node-cron';
import { sendDailySummary } from './send-daily-summary';
import { checkInstallments } from './check-installments';
import { checkGoals } from './check-goals';
import { env } from '../config/env';
export function startScheduler() {
cron.schedule(`0 ${env.DAILY_SUMMARY_HOUR} * * *`, () => sendDailySummary().catch(console.error), { timezone: 'America/Sao_Paulo' });
cron.schedule('0 8 * * *', () => checkInstallments().catch(console.error), { timezone: 'America/Sao_Paulo' });
cron.schedule('0 9 * * *', () => checkGoals().catch(console.error), { timezone: 'America/Sao_Paulo' });
console.log('✅ Scheduler iniciado');
}
EOP

cat > src/jobs/send-daily-summary.ts << 'EOP'
import { prisma } from '../config/database';
import { getBalance, getTodayExpenses } from '../modules/transactions/service';
import { sendMessage } from '../modules/whatsapp/client';
import { formatCurrency, formatDate } from '../shared/utils/format-currency';
export async function sendDailySummary(): Promise<void> {
const users = await prisma.user.findMany();
for (const user of users) {
try {
const balance = await getBalance(user.id);
const today = await getTodayExpenses(user.id);
const todayTotal = today.reduce((s, t) => s + Number(t.amount), 0);
let msg = `📊 *RESUMO DIÁRIO - ${formatDate(new Date())}*\n\n`;
msg += `💰 *Saldo:* ${formatCurrency(balance.balance)}\n`;
msg += `📅 *Gastos Hoje:* ${formatCurrency(todayTotal)}\n`;
await sendMessage(`${user.phone}@s.whatsapp.net`, msg);
} catch (e) { console.error(e); }
}
}
EOP

cat > src/jobs/check-installments.ts << 'EOP'
import { prisma } from '../config/database';
import { getInstallmentsDueSoon } from '../modules/installments/service';
import { sendMessage } from '../modules/whatsapp/client';
import { formatCurrency } from '../shared/utils/format-currency';
export async function checkInstallments(): Promise<void> {
const users = await prisma.user.findMany();
for (const user of users) {
const due = await getInstallmentsDueSoon(user.id, 3);
if (due.length > 0) {
let msg = `⚠️ *PARCELAS VENCENDO*\n`;
due.forEach(i => msg += `• ${i.description}: ${formatCurrency(i.parcelValue)} (${i.daysUntilDue} dias)\n`);
await sendMessage(`${user.phone}@s.whatsapp.net`, msg);
}
}
}
EOP

cat > src/jobs/check-goals.ts << 'EOP'
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
EOP

# --- App Principal ---
cat > src/app.ts << 'EOP'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { createWhatsAppClient } from './modules/whatsapp/client';
import { messageHandler } from './modules/whatsapp/handler';
import { startScheduler } from './jobs/scheduler';

const app = Fastify({ logger: true });

async function start() {
try {
await app.register(cors, { origin: true });
await app.register(helmet);
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
app.get('/health', async () => ({ status: 'ok' }));
await app.listen({ port: env.PORT, host: '0.0.0.0' });
console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
await createWhatsAppClient(messageHandler);
startScheduler();
} catch (err) {
console.error(err);
process.exit(1);
}
}
start();
EOP

# --- Seed ---
cat > prisma/seed.ts << 'EOP'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
const categories = [
{ name: 'mercado', color: '#ef4444' }, { name: 'transporte', color: '#f97316' },
{ name: 'lazer', color: '#eab308' }, { name: 'saúde', color: '#22c55e' },
{ name: 'educação', color: '#3b82f6' }, { name: 'moradia', color: '#8b5cf6' },
{ name: 'vestuário', color: '#ec4899' }, { name: 'assinaturas', color: '#6366f1' },
{ name: 'outros', color: '#64748b' }
];
for (const cat of categories) {
await prisma.category.upsert({ where: { name: cat.name }, update: {}, create: cat });
}
console.log('✅ Categorias criadas!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
EOP

# --- Dockerfile ---
cat > Dockerfile << 'EOP'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/app.js"]
EOP

echo "TUDO PRONTO! Código gerado com sucesso."
