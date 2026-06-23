import { Controller, Post, Get, Patch, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.register(dto);
    res.setCookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600000 * 24 * 7, // 7 days
    });
    return { user: result.user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(dto);
    res.setCookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600000 * 24 * 7, // 7 days
    });
    return { user: result.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    return { success: true };
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
