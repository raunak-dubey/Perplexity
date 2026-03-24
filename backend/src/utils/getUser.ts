import { FastifyRequest } from 'fastify';

export function getUserId(req: FastifyRequest): string {
  const user = req.user as { sub: string } | undefined;
  return user?.sub ?? '';
}
