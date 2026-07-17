import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserPosition, UserStatus } from '../../users/user.entity';

export class BroadcastFailureDto {
  @ApiProperty({ description: 'The UUID of the user' })
  userId!: string;

  @ApiProperty({ description: 'The name of the user' })
  name!: string;

  @ApiProperty({ description: 'The error message explaining the failure' })
  error!: string;
}

export class BroadcastResponseDto {
  @ApiProperty({ description: 'Indicates if the broadcast request was successfully handled', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Summary message of the broadcast outcome', example: 'Broadcast completed. Sent: 5, Failed: 1' })
  message!: string;

  @ApiProperty({ description: 'Total number of successfully sent notifications', example: 5 })
  sentCount!: number;

  @ApiProperty({ description: 'Total number of notifications that failed to send', example: 1 })
  failedCount!: number;

  @ApiProperty({
    description: 'List of detailed failures for each failed recipient',
    type: [BroadcastFailureDto],
    required: false,
  })
  failures?: BroadcastFailureDto[];
}

export class SendResponseDto {
  @ApiProperty({ description: 'Indicates if the notification was sent successfully', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Status message of the transmission', example: 'Notification sent successfully to John Doe.' })
  message!: string;
}

export class LinkingStatusResponseDto {
  @ApiProperty({ description: 'The UUID of the user', example: 'd3b07384-d113-4956-a572-e1678857dcd4' })
  id!: string;

  @ApiProperty({ description: 'The name of the user', example: 'John Doe' })
  name!: string;

  @ApiProperty({ description: 'The registered email of the user', example: 'customer@example.com' })
  email!: string;

  @ApiProperty({ description: 'The system role of the user', enum: UserRole, example: UserRole.IT })
  role!: UserRole;

  @ApiProperty({ description: 'The system position of the user', enum: UserPosition, example: UserPosition.OFFICE_STAFF })
  position!: UserPosition;

  @ApiProperty({ description: 'The status of the user account', enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiProperty({ description: 'Indicates if a Telegram account is linked', example: true })
  telegramLinked!: boolean;

  @ApiProperty({ description: 'The linked Telegram username (if available)', example: 'john_doe', nullable: true })
  telegramUsername!: string | null;

  @ApiProperty({ description: 'The linked Telegram Chat ID (if available)', example: '123456789', nullable: true })
  telegramChatId!: string | null;
}

export class ManualLinkUserDetailDto {
  @ApiProperty({ description: 'The UUID of the user', example: 'd3b07384-d113-4956-a572-e1678857dcd4' })
  id!: string;

  @ApiProperty({ description: 'The name of the user', example: 'John Doe' })
  name!: string;

  @ApiProperty({ description: 'The registered email of the user', example: 'customer@example.com' })
  email!: string;

  @ApiProperty({ description: 'Telegram link confirmation flag', example: true })
  telegramLinked!: boolean;

  @ApiProperty({ description: 'The newly linked Telegram Chat ID', example: '123456789' })
  telegramChatId!: string;

  @ApiProperty({ description: 'The newly linked Telegram username (if available)', example: 'john_doe', nullable: true })
  telegramUsername?: string;
}

export class LinkResponseDto {
  @ApiProperty({ description: 'Indicates if the manual link was successful', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Confirmation message of the association', example: 'Successfully linked user John Doe (customer@example.com) to Telegram Chat ID 123456789.' })
  message!: string;

  @ApiProperty({ description: 'Detailed object of the linked user', type: ManualLinkUserDetailDto })
  user!: ManualLinkUserDetailDto;
}
