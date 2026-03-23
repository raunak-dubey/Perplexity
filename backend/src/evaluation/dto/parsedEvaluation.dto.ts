import {
  IsNumber,
  Min,
  Max,
  IsArray,
  IsString,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MvpPlanDto {
  @IsString()
  day1to2!: string;

  @IsString()
  day3to4!: string;

  @IsString()
  day5to6!: string;

  @IsString()
  day7!: string;
}

class CapitalEstimateDto {
  @IsNumber()
  @Min(0)
  development!: number;

  @IsNumber()
  @Min(0)
  marketing!: number;

  @IsNumber()
  @Min(0)
  tools!: number;

  @IsNumber()
  @Min(0)
  total!: number;
}

export class ParsedEvaluationDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  clarityScore!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  marketScore!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  executionScore!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  overallScore!: number;

  @IsArray()
  @IsString({ each: true })
  majorRisks!: string[];

  @IsArray()
  @IsString({ each: true })
  unrealisticAssumptions!: string[];

  @IsArray()
  @IsString({ each: true })
  mustFix!: string[];

  @ValidateNested()
  @Type(() => MvpPlanDto)
  mvpPlan!: MvpPlanDto;

  @IsString()
  first20CustomersStrategy!: string;

  @ValidateNested()
  @Type(() => CapitalEstimateDto)
  capitalEstimate!: CapitalEstimateDto;

  @IsEnum(['YES', 'NO'])
  investmentDecision!: 'YES' | 'NO';

  @IsString()
  investmentReason!: string;

  @IsEnum(['BUILD', 'PIVOT', 'DROP'])
  finalVerdict!: 'BUILD' | 'PIVOT' | 'DROP';
}
