import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkTelegramDto {
  @ApiProperty({
    description: 'The registered email of the user',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'The Telegram Chat ID to link to this account',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  telegramChatId!: string;

  @ApiProperty({
    description: 'Optional Telegram username of the user',
    required: false,
    example: 'john_doe',
  })
  @IsString()
  @IsOptional()
  telegramUsername?: string;
}
