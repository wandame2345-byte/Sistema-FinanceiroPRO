import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WHATSAPP_SESSION_PATH: z.string().default('./whatsapp-session'),
  TZ: z.string().default('America/Sao_Paulo'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALERT_HIGH_VALUE_THRESHOLD: z.coerce.number().default(100),
  DAILY_SUMMARY_HOUR: z.coerce.number().default(20),
});
export const env = envSchema.parse(process.env);
