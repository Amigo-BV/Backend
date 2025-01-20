import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { LikeService } from './like.service';

@Controller('like')
export class likeController {
  constructor(private readonly amigoService: LikeService) {}

  @Get('balance/:address')
  async getBalance(@Param('address') address: string): Promise<string> {
    return this.amigoService.getBalance(address);
  }

  @Get('send-list/:address')
  async getSendList(@Param('address') address: string): Promise<string[]> {
    return this.amigoService.getSendList(address);
  }

  @Get('recieve-list/:address')
  async getRecieveList(@Param('address') address: string): Promise<string[]> {
    return this.amigoService.getRecieveList(address);
  }

  // **매칭 목록 조회**
  @Get('matches/:address')
  async getMatches(@Param('address') address: string): Promise<string[]> {
    return this.amigoService.getMatches(address);
  }

  // 좋아요 전송
  @Post('transfer')
  async sendLike(@Body() body: { to: string; amount: string }): Promise<void> {
    return this.amigoService.sendLike(body.to, body.amount);
  }

  // 좋아요 보낸 리스트에서 특정 항목 삭제
  @Post('send-list/remove')
  async removeFromSendList(@Body() body: { from: string; to: string }): Promise<void> {
    return this.amigoService.removeFromSendList(body.from, body.to);
  }

  // 좋아요 받은 리스트에서 특정 항목 삭제
  @Post('recieve-list/remove')
  async removeFromRecieveList(@Body() body: { from: string; to: string }): Promise<void> {
    return this.amigoService.removeFromRecieveList(body.from, body.to);
  }
}
