import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { StatusRevenue, TypeRevenue, PaymentMethod } from '../accounting.enitity';


export class CreateRevenueDto {
  @IsOptional()
  @IsEnum(TypeRevenue)
  type_revenue?: TypeRevenue;

  @IsOptional()
  @IsUUID()
  seller?: string;

  @IsOptional()
  @IsBoolean()
  approve?: boolean;

  @IsString()
  customer_name!: string;

  @IsOptional()
  @IsEnum(StatusRevenue)
  status?: StatusRevenue;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsString()
  bank_transaction?: string;

  // Base64 image from frontend
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  note?: string;
}