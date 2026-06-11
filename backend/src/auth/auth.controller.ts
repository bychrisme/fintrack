import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return req.user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Patch('security')
  @UseGuards(JwtAuthGuard)
  async updateSecurity(@Req() req: any, @Body() body: any) {
    return this.authService.updateSecurity(req.user.id, body);
  }
}
