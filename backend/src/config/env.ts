import dotenv from 'dotenv';

dotenv.config();

const valueOrDefault = (value: string | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback;

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: valueOrDefault(process.env.NODE_ENV, 'development'),
  corsOrigin: valueOrDefault(process.env.CORS_ORIGIN, 'http://localhost:5173'),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  // Google Gemini / Generative API
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: valueOrDefault(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
  dbName: valueOrDefault(process.env.DB_NAME, 'reelstudio'),
  dbUser: valueOrDefault(process.env.DB_USER, 'postgres'),
  dbPassword: valueOrDefault(process.env.DB_PASSWORD, 'postgres'),
  dbHost: valueOrDefault(process.env.DB_HOST, 'localhost'),
  dbPort: Number(process.env.DB_PORT ?? 5432),
};
