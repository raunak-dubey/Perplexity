export default () => ({
  port: Number(process.env.PORT) || 3000,
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
  },

  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
});
