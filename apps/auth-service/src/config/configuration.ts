import { StringValue } from 'ms';

export default () => ({
  port: parseInt(process.env.AUTH_SERVICE_PORT ?? '3001', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as StringValue,
  },
});
