import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('validateLogin')
  validateLogin(@Body() data: Record<string, any>) {
    return this.authService.validateLogin(data.workspace, data.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verifyLoginCode')
  verifyLoginCode(@Body() data: Record<string, any>) {
    return this.authService.verifyLoginCode(data.auth_code, data.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('checkLicense')
  checkLicense(@Body() data: Record<string, any>) {
    return this.authService.checkLicense(data.license);
  }

  @HttpCode(HttpStatus.OK)
  @Post('checkWorkspace')
  checkWorkspace(@Body() data: Record<string, any>) {
    return this.authService.checkWorkspace(data.name);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sendAuthCode')
  sendAuthCode(@Body() data: Record<string, any>) {
    return this.authService.sendAuthCode(
      data.license,
      data.apiurl,
      data.user_id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('verifyAuthCode')
  verifyAuthCode(@Body() data: Record<string, any>) {
    return this.authService.verifyAuthCode(
      data.workspace,
      data.user_id,
      data.user_name,
      data.user_email,
      data.license,
      data.auth_code,
      data.apiurl,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
