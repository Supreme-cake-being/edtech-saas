export default () => ({
  port: parseInt(process.env.CORE_SERVICE_PORT ?? '3002', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://edtech:edtech_password@localhost:5672',
  },
  r2: {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME ?? 'edtech-files',
  },
});
