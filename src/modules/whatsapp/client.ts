import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, proto, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import pino from 'pino';
import { env } from '../../config/env';
import fs from 'fs';
let sock: WASocket | null = null;
let currentQR: string | null = null;
let socketStatus: string = 'disconnected';
export function getCurrentQR(): string | null { return currentQR; }
export function getSocketStatus(): string { return socketStatus; }
export async function createWhatsAppClient(onMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => Promise<void>): Promise<WASocket> {
const sessionPath = path.resolve(env.WHATSAPP_SESSION_PATH);
console.log(`[WA] Iniciando cliente. Path: ${sessionPath}`);
if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
console.log(`[WA] Versão: ${version.join('.')}. Já logado: ${!!state.creds?.me}`);
sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false, browser: ['Finance WhatsApp', 'Chrome', '1.0.0'], connectTimeoutMs: 60000, defaultQueryTimeoutMs: 60000, keepAliveIntervalMs: 30000 });
sock.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect, qr } = update;
console.log(`[WA] connection.update -> connection=${connection}, hasQR=${!!qr}`);
if (qr) { currentQR = qr; socketStatus = 'awaiting-qr'; console.log('📱 QR Code gerado! Acesse /qr'); }
if (connection === 'close') {
currentQR = null; socketStatus = 'closed';
const code = (lastDisconnect?.error as any)?.output?.statusCode;
console.log(`[WA] Conexão fechada. Status=${code}`);
if (code !== DisconnectReason.loggedOut) { console.log('🔄 Reconectando em 5s...'); setTimeout(() => createWhatsAppClient(onMessage).catch(console.error), 5000); }
} else if (connection === 'open') { socketStatus = 'connected'; currentQR = null; console.log('✅ WhatsApp conectado!'); }
});
sock.ev.on('creds.update', () => { console.log('[WA] Salvando credenciais...'); saveCreds(); });
sock.ev.on('messages.upsert', async (payload) => {
const { messages, type } = payload;
console.log(`[WA] messages.upsert -> type=${type}, count=${messages.length}`);
if (type !== 'notify') return;
for (const msg of messages) {
const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
console.log(`📩 MSG | from=${msg.key.remoteJid} | fromMe=${msg.key.fromMe} | text="${text.substring(0, 80)}"`);
if (msg.key.fromMe) continue;
try { await onMessage(msg, sock!); console.log('[WA] Handler concluído ✅'); } catch (err) { console.error('[WA] ERRO no handler:', err); }
}
});
return sock;
}
export async function sendMessage(jid: string, text: string): Promise<void> {
if (!sock) { console.error('[WA] sock é null'); return; }
try { await sock.sendMessage(jid, { text }); console.log(`📤 Enviado para ${jid}`); } catch (err) { console.error('[WA] Erro ao enviar:', err); }
}
