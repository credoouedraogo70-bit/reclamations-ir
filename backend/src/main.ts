import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { ValidationError } from 'class-validator';
import { join } from 'path';
import { AppModule } from './app.module';

/**
 * All our own DTOs carry French `message` options, but class-validator's
 * built-in whitelist check ("property X should not exist") has no such hook —
 * translate that one pattern here so no English ever reaches the client.
 */
function collectValidationMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        const unknownProperty = /^property (.+) should not exist$/.exec(message);
        messages.push(unknownProperty ? `Le champ « ${unknownProperty[1]} » n'est pas autorisé.` : message);
      }
    }
    if (error.children?.length) {
      messages.push(...collectValidationMessages(error.children));
    }
  }
  return messages;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(collectValidationMessages(errors)),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
