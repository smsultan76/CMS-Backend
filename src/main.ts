import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => {
          const constraints = err.constraints ? Object.values(err.constraints).join(', ') : '';
          return `${err.property} - ${constraints}`;
        });
        return new BadRequestException(messages);
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
