import { IsNumber } from 'class-validator';

export class CheckOutDto {
  @IsNumber()
  user_id!: string;
}