import { NestFactory } from '@nestjs/core';
import { AppModule } from './like/like.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 추가
  app.enableCors({
    origin: 'http://localhost:3001', // 프론트엔드 URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
    credentials: true, // 인증 정보를 포함한 요청 허용 (쿠키 등)
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
