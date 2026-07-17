import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    description: 'The UUID of the registered user to send notification to',
    example: 'd3b07384-d113-4956-a572-e1678857dcd4',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'The notification message, supporting placeholders like {name}, {email}, {role}, {position}, {date}',
    example: 'Hello {name}, you have a custom alert.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
