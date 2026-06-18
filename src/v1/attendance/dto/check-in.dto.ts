import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
 @IsOptional()
user_id?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;
}