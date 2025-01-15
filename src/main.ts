import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { useSwagger } from './swagger';

import * as _cluster from 'cluster';
import * as os from 'os';
const cluster = _cluster as unknown as _cluster.Cluster;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get('PORT') || 3000;

  app.enableShutdownHooks();
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (configService.getOrThrow('NODE_ENV') !== 'production') useSwagger(app);

  const origins = ['http://localhost:5173', 'https://localhost:5173'];

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['POST', 'PUT', 'GET', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 200,
  });

  if (
    cluster.isPrimary &&
    configService.getOrThrow('NODE_ENV') !== 'development'
  ) {
    const cpuCounts = os.cpus().length;
    console.log(`Master ${process.pid},  Cpu Counts:${cpuCounts}`);

    for (let i = 0; i < os.cpus().length; i++) {
      console.log('Cluster: ', i);
      cluster.fork();
    }
  } else {
    await app.listen(port);
  }
  return { port, data: new Date() };
}
bootstrap().then(console.log).catch(console.log);
