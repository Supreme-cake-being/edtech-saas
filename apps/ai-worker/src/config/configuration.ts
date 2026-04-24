export default () => ({
  port: parseInt(process.env.AI_WORKER_PORT ?? '3003', 10),
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://edtech:edtech_password@localhost:5672',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  r2: {
    endpoint: process.env.R2_ENDPOINT!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME ?? 'edtech-files',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
});
