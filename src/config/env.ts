import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.string().default('production'),
});
export const env = envSchema.parse(process.env);
