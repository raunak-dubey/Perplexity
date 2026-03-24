import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto, UpdateChatDto } from './dto/chat.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { getUserId } from 'src/utils/getUser';
import type { FastifyRequest } from 'fastify';

@UseGuards(AuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /** POST /chats — Create a new chat session */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: FastifyRequest, @Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(getUserId(req), createChatDto);
  }

  /** GET /chats — List all non-archived chats */
  @Get()
  findAll(@Req() req: FastifyRequest) {
    return this.chatsService.findAll(getUserId(req));
  }

  /** GET /chats/:id — Get a specific chat */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: FastifyRequest) {
    return this.chatsService.findOne(id, getUserId(req));
  }

  /** PATCH /chats/:id — Update chat (e.g. rename) */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
    @Req() req: FastifyRequest,
  ) {
    return this.chatsService.update(id, updateChatDto, getUserId(req));
  }

  /** DELETE /chats/:id — Delete a chat */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: FastifyRequest) {
    return this.chatsService.remove(id, getUserId(req));
  }
}
