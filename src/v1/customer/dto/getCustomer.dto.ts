import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsPhoneNumber,
  MaxLength,
  Matches,
} from 'class-validator';

export class getCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  customer_name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  customer_email?: string;

  @IsOptional()
  @Matches(/^(\+855|0)[1-9]\d{7,8}$/, {
    message: 'Invalid Cambodian phone number',
  })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegram_linked?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegram_username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telegram_chat_id?: string;
}
