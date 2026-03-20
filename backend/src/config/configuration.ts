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
});
