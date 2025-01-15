import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { AmigoService } from './app.service';

@Controller('amigo')
export class AppController {
  constructor(private readonly amigoService: AmigoService) {}

  @Get('balance/:address')
  async getBalance(@Param('address') address: string): Promise<string> {
    return this.amigoService.getBalance(address);
  }

  @Post('transfer')
  async transferTokens(@Body() body: { to: string; amount: string }): Promise<void> {
    return this.amigoService.transferTokens(body.to, body.amount);
  }
}
