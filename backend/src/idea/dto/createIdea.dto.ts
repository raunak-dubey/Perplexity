import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateIdeaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(500)
  targetCustomer!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(1000)
  problemStatement!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  existingAlternatives!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  solution!: string;

  @IsNumber()
  @Min(0)
  pricingINR!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  distributionStrategy!: string;

  @IsNumber()
  @Min(0)
  estimatedBudgetINR!: number;
}
