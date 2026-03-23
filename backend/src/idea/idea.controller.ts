import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { IdeaService } from './idea.service';
import { CreateIdeaDto } from './dto/createIdea.dto';
import { UpdateIdeaDto } from './dto/updateIdea.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { FastifyRequest } from 'fastify';

function getUserId(req: FastifyRequest): string {
  const user = req.user as { sub: string } | undefined;
  return user?.sub ?? '';
}

@UseGuards(AuthGuard)
@Controller('idea')
export class IdeaController {
  constructor(private readonly ideaService: IdeaService) {}

  @Post()
  create(@Req() req: FastifyRequest, @Body() createIdeaDto: CreateIdeaDto) {
    return this.ideaService.submit(getUserId(req), createIdeaDto);
  }

  @Get()
  findAll(@Req() req: FastifyRequest) {
    return this.ideaService.findAll(getUserId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: FastifyRequest) {
    return this.ideaService.findOne(id, getUserId(req));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
    @Req() req: FastifyRequest,
  ) {
    return this.ideaService.update(id, updateIdeaDto, getUserId(req));
  }

  @Put(':id/evaluate')
  reEvaluate(
    @Param('id') id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
    @Req() req: FastifyRequest,
  ) {
    return this.ideaService.reEvaluate(id, getUserId(req), updateIdeaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: FastifyRequest) {
    return this.ideaService.remove(id, getUserId(req));
  }
}
