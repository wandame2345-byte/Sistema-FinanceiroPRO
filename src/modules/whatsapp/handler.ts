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
