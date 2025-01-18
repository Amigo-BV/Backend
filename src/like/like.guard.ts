import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1]; // Bearer 토큰에서 토큰 추출

    try {
      const decoded = this.jwtService.verify(token); // JWT 검증
      request.user = decoded; // 사용자 정보 추가
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
