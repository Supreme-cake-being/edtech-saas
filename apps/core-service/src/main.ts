import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Swagger для REST ендпоінту upload
  const config = new DocumentBuilder()
    .setTitle('EdTech Core Service')
    .setDescription('Course management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.CORE_SERVICE_PORT ?? 3002;
  await app.listen(port);
  console.log(`🚀 Core Service running on http://localhost:${port}`);
  console.log(`🔷 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
