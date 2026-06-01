import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const API_KEY_HEADER = 'x-api-key';
const API_KEY_ENV = 'COMPRAS_API_KEY';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedApiKey = this.configService.get<string>(API_KEY_ENV);
    const receivedApiKey = request.header(API_KEY_HEADER);

    if (!expectedApiKey || receivedApiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
