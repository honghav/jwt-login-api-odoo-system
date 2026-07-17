import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserPosition } from '../../users/user.entity';

export class BroadcastNotificationDto {
  @ApiProperty({
    description: 'The notification message, supporting placeholders like {name}, {email}, {role}, {position}, {date}',
    example: 'Hello {name}, this is an alert for all {role} team members.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description: 'Optional list of user IDs to broadcast to. If not provided, broadcasts to all linked users.',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiProperty({
    description: 'Filter users by role',
    required: false,
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Filter users by position',
    required: false,
    enum: UserPosition,
  })
  @IsOptional()
  @IsEnum(UserPosition)
  position?: UserPosition;
}
