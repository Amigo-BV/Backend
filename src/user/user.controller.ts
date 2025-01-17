import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 회원가입
   */
  @Post('register')
  async registerUser(
    @Body() body: { username: string; address: string; signature: string },
  ) {
    const { username, address, signature } = body;
  
    // 서명 검증
    const message = `Register: ${username}`;
    const signerAddress = this.userService.verifySignature(message, signature);
  
    if (signerAddress !== address) {
      throw new UnauthorizedException('Signature does not match the provided address');
    }
  
    // 스마트 컨트랙트 호출
    const receipt = await this.userService.registerUser(username, signerAddress);
  
    return {
      message: 'User registered successfully',
      txHash: receipt.transactionHash,
    };
  }
  

  /**
   * 로그인
   */
  @Post('login')
  async loginUser(
    @Body() body: { address: string; signature: string },
  ) {
    const { address, signature } = body;
  
    // 서명 검증
    const message = `Login: ${address}`;
    const signerAddress = this.userService.verifySignature(message, signature);
  
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }
  
    // JWT 토큰 생성
    const token = this.userService.generateJwtToken(address);
  
    return {
      message: 'Login successful',
      token,
    };
  }
  
}
