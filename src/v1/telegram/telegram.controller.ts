import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { LinkTelegramDto } from './dto/link-telegram.dto';
import {
  BroadcastResponseDto,
  SendResponseDto,
  LinkingStatusResponseDto,
  LinkResponseDto,
} from './dto/telegram-responses.dto';

@ApiTags('Telegram Notifications')
@Controller('v1/telegram')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('broadcast')
  @Roles('hr', 'manager', 'it')
  @ApiOperation({
    summary: 'Broadcast custom notification to registered users',
    description:
      'Sends a custom notification message to users who have linked their Telegram accounts. ' +
      'You can customize the message template using placeholders: ' +
      '"{name}" (user name), "{email}" (user email), "{role}" (user role), "{position}" (user position), and "{date}" (current date). ' +
      'Use query filters to restrict the broadcast to specific roles, positions, or specific user IDs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Broadcast completed successfully.',
    type: BroadcastResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input payload, filter parameters, or Telegram bot is not initialized.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have the required permissions.',
  })
  async broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.telegramService.broadcastNotification(dto);
  }

  @Post('send')
  @Roles('hr', 'manager', 'it')
  @ApiOperation({
    summary: 'Send custom notification to a specific registered user',
    description:
      'Sends a direct customized message to a single user. Supports placeholders: ' +
      '"{name}", "{email}", "{role}", "{position}", and "{date}".',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully.',
    type: SendResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'User does not have a linked Telegram account, or Telegram bot is not initialized.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have the required permissions.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async send(@Body() dto: SendNotificationDto) {
    return this.telegramService.sendNotification(dto);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get list of users and their Telegram linking status',
    description:
      'Retrieves all registered system users and details about whether their accounts are linked to a Telegram Chat ID.',
  })
  @ApiQuery({
    name: 'linkedOnly',
    required: false,
    type: Boolean,
    description: 'Filter to return only users with active Telegram linkings',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns linking status list.',
    type: [LinkingStatusResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have the required permissions.',
  })
  async getStatus(@Query('linkedOnly') linkedOnly?: boolean) {
    const isLinkedOnly = String(linkedOnly) === 'true';
    return this.telegramService.getLinkingStatus(isLinkedOnly);
  }

  @Post('link')
  @ApiOperation({
    summary: 'Manually link a registered user to a Telegram chat ID',
    description:
      'Manually links a registered user (by email) to a specific Telegram Chat ID and username.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully linked user.',
    type: LinkResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have the required permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'No registered user found with the specified email.',
  })
  async linkManually(@Body() dto: LinkTelegramDto) {
    return this.telegramService.linkManually(
      dto.email,
      dto.telegramChatId,
      dto.telegramUsername,
    );
  }
}
