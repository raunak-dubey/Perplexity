import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { FastifyRequest } from 'fastify';

@UseGuards(AuthGuard)
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /** GET /chats/:chatId/messages — Get all messages for a chat */
  @Get()
  findAll(@Param('chatId') chatId: string, @Req() req: FastifyRequest) {
    return this.messagesService.findByChatId(chatId, req);
  }

  /** POST /chats/:chatId/messages — Send a message and get AI response */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: FastifyRequest,
  ) {
    return this.messagesService.sendMessage(chatId, sendMessageDto, req);
  }
}
