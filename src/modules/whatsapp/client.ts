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
for (const msg of messages) { if (!msg.key.fromMe) await onMessage(msg, sock!); }
});
return sock;
}
export async function sendMessage(jid: string, text: string): Promise<void> {
if (sock) await sock.sendMessage(jid, { text });
}
