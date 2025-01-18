import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException  } from '@nestjs/common';
import { LikeService } from './like.service';
import { AuthGuard } from './like.guard';

@Controller('like')
@UseGuards(AuthGuard) // AuthGuard를 통해 JWT 인증 적용
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Get('balance')
  async getBalance(@Request() req): Promise<string> {
    const address = req.user.address; // JWT에서 추출된 사용자 주소
    console.log('Requesting balance for:', address);
    return this.likeService.getBalance(address);
  }

  @Get('send-list')
  async getSendList(@Request() req): Promise<string[]> {
    const address = req.user.address;
    console.log('Requesting send list for:', address);
    return this.likeService.getSendList(address);
  }

  @Get('receive-list')
  async getReceiveList(@Request() req): Promise<string[]> {
    const address = req.user.address;
    console.log('Requesting receive list for:', address);
    return this.likeService.getReceiveList(address);
  }

  @Post('transfer')
  async sendLike(
    @Request() req,
    @Body() body: { to: string; amount: string; signature: string },
  ): Promise<void> {
    const from = req.user.address; // JWT에서 가져온 사용자 주소
    const { to, amount, signature } = body;

    // 서명 검증
    const message = `Transfer: ${from} ${to} ${amount}`;
    const signerAddress = this.likeService.verifySignature(message, signature);

    if (signerAddress !== from) {
      throw new UnauthorizedException('Signature does not match the provided address');
    }

    // 좋아요 전송
    return this.likeService.sendLike(signerAddress, to, amount);
  }

  @Post('send-list/remove')
  async removeFromSendList(@Request() req, @Body() body: { to: string }): Promise<void> {
    const from = req.user.address;
    return this.likeService.removeFromSendList(from, body.to);
  }

  @Post('receive-list/remove')
  async removeFromReceiveList(@Request() req, @Body() body: { from: string }): Promise<void> {
    const to = req.user.address;
    return this.likeService.removeFromReceiveList(body.from, to);
  }
}
