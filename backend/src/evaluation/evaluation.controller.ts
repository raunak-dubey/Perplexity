import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { AuthGuard } from 'src/auth/auth.guard';
import type { FastifyRequest } from 'fastify';

function getUserId(req: FastifyRequest): string {
  const user = req.user as { sub: string } | undefined;
  return user?.sub ?? '';
}

@UseGuards(AuthGuard)
@Controller('idea/:ideaId/evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  // GET /idea/:ideaId/evaluation
  @Get()
  getLatest(@Param('ideaId') ideaId: string, @Req() req: FastifyRequest) {
    return this.evaluationService.getLatest(ideaId, getUserId(req));
  }

  // GET /idea/:ideaId/evaluation/history
  @Get('history')
  getHistory(@Param('ideaId') ideaId: string, @Req() req: FastifyRequest) {
    return this.evaluationService.getHistory(ideaId, getUserId(req));
  }
}
