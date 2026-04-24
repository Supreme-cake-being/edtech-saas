export default () => ({
  port: parseInt(process.env.API_GATEWAY_PORT ?? '4000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  subgraphs: {
    coreService: process.env.CORE_SERVICE_GRAPHQL_URL ?? 'http://localhost:3002/graphql',
  },
});
