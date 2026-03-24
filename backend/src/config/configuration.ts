export default () => ({
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  cookie: {
    secret: process.env.COOKIE_SECRET,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 2048,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
  },
});

// import { registerAs } from '@nestjs/config';

// export const appConfig = registerAs('app', () => ({
//   port: parseInt(process.env.PORT, 10) || 4000,
//   frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
// }));

// export const databaseConfig = registerAs('database', () => ({
//   uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot',
// }));

// export const aiConfig = registerAs('ai', () => ({
//   googleApiKey: process.env.GOOGLE_API_KEY,
//   model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
//   maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 2048,
//   temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
// }));
