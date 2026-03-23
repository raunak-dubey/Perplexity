import { PartialType } from '@nestjs/mapped-types';
import { CreateIdeaDto } from './createIdea.dto';

export class UpdateIdeaDto extends PartialType(CreateIdeaDto) {}
