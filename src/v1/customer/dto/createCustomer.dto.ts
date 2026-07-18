import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'The full name of the customer',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  customer_name!: string;

  @ApiProperty({
    description: 'The email address of the customer',
    example: 'johndoe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  customer_email!: string;

  @ApiPropertyOptional({
    description: 'The contact phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Telegram linking token or status flag',
    example: 'linked_account_01',
  })
  @IsString()
  @IsOptional()
  telegram_linked?: string;

  @ApiPropertyOptional({
    description: 'The Telegram handle/username without the @ symbol',
    example: 'john_tg',
  })
  @IsString()
  @IsOptional()
  telegram_username?: string;

  @ApiPropertyOptional({
    description: 'The unique Telegram chat ID used for sending direct messages',
    example: '987654321',
  })
  @IsString()
  @IsOptional()
  telegram_chat_id?: string;
}
