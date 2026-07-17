import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Telegraf } from 'telegraf';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not defined or is default. Telegram bot will be disabled.');
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupBotCommands();
      this.bot.launch().catch(err => {
        this.logger.error('Failed to launch Telegram bot: ' + err.message);
      });
      this.logger.log('Telegram Bot initialized and listening for commands.');
    } catch (err) {
      this.logger.error('Error creating Telegraf instance: ' + err.message);
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGINT');
      this.logger.log('Telegram Bot stopped.');
    }
  }

  private setupBotCommands() {
    if (!this.bot) return;

    // Command: /start
    this.bot.start((ctx) => {
      const greeting = 
        `Welcome to the Notification Bot! 🤖\n\n` +
        `To link your system account and receive alerts, please use the /link command with your registered email.\n\n` +
        `Example:\n` +
        `/link customer@example.com\n\n` +
        `Available Commands:\n` +
        `/link <email> - Link your registered email\n` +
        `/status - Check your linking status\n` +
        `/unlink - Unlink your account\n` +
        `/help - Show this guide`;
      ctx.reply(greeting);
    });

    // Command: /help
    this.bot.help((ctx) => {
      ctx.reply(
        `Help Guide ℹ️\n\n` +
        `• Link account: /link your_email@example.com\n` +
        `• Check status: /status\n` +
        `• Unlink account: /unlink`
      );
    });

    // Command: /link <email>
    this.bot.command('link', async (ctx) => {
      const messageText = ctx.message.text;
      const args = messageText.split(/\s+/).slice(1);

      if (args.length < 1) {
        return ctx.reply('❌ Usage: /link <your_registered_email>\nExample: /link customer@example.com');
      }

      const email = args[0].trim().toLowerCase();
      const chatId = ctx.chat.id.toString();
      const username = ctx.from?.username || '';

      try {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
          return ctx.reply(`❌ No registered user found with the email: ${email}`);
        }

        // Link the telegram chat ID
        user.telegramChatId = chatId;
        user.telegramUsername = username;
        await this.usersRepository.save(user);

        this.logger.log(`Telegram account linked successfully: ${email} -> Chat ID: ${chatId}`);
        return ctx.reply(`✅ Successfully linked your Telegram account to ${user.name} (${user.email}). You will now receive system notifications here!`);
      } catch (error) {
        this.logger.error(`Error linking user with Telegram: ${error.message}`);
        return ctx.reply('❌ An error occurred while linking your account. Please try again later.');
      }
    });

    // Command: /unlink
    this.bot.command('unlink', async (ctx) => {
      const chatId = ctx.chat.id.toString();

      try {
        const user = await this.usersRepository.findOne({ where: { telegramChatId: chatId } });
        if (!user) {
          return ctx.reply('❌ No account is currently linked to this Telegram chat.');
        }

        const email = user.email;
        user.telegramChatId = undefined;
        user.telegramUsername = undefined;
        await this.usersRepository.save(user);

        this.logger.log(`Telegram account unlinked: ${email}`);
        return ctx.reply(`✅ Successfully unlinked from account: ${email}.`);
      } catch (error) {
        this.logger.error(`Error unlinking user: ${error.message}`);
        return ctx.reply('❌ An error occurred while unlinking. Please try again.');
      }
    });

    // Command: /status
    this.bot.command('status', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      try {
        const user = await this.usersRepository.findOne({ where: { telegramChatId: chatId } });
        if (user) {
          return ctx.reply(
            `ℹ️ Telegram Connection Status:\n` +
            `• Linked Account: ${user.name}\n` +
            `• Email: ${user.email}\n` +
            `• Role: ${user.role}\n` +
            `• Position: ${user.position}`
          );
        } else {
          return ctx.reply('ℹ️ Account Status: Not linked.\nUse `/link <your_email>` to connect.');
        }
      } catch (error) {
        return ctx.reply('❌ Error fetching connection status.');
      }
    });
  }

  /**
   * Replace placeholders in message template with user properties
   */
  private formatMessage(template: string, user: User): string {
    return template
      .replace(/{name}/g, user.name || '')
      .replace(/{email}/g, user.email || '')
      .replace(/{role}/g, user.role || '')
      .replace(/{position}/g, user.position || '')
      .replace(/{date}/g, new Date().toLocaleDateString());
  }

  /**
   * Broadcast a customized message to matching registered users
   */
  async broadcastNotification(dto: BroadcastNotificationDto) {
    if (!this.bot) {
      throw new BadRequestException('Telegram bot is not initialized. Please verify your TELEGRAM_BOT_TOKEN.');
    }

    const query = this.usersRepository.createQueryBuilder('user')
      .where('user.telegramChatId IS NOT NULL');

    if (dto.userIds && dto.userIds.length > 0) {
      query.andWhere('user.id IN (:...userIds)', { userIds: dto.userIds });
    }

    if (dto.role) {
      query.andWhere('user.role = :role', { role: dto.role });
    }

    if (dto.position) {
      query.andWhere('user.position = :position', { position: dto.position });
    }

    const users = await query.getMany();

    if (users.length === 0) {
      return {
        success: true,
        message: 'No users found matching the filter criteria with linked Telegram accounts.',
        sentCount: 0,
      };
    }

    let sentCount = 0;
    let failedCount = 0;
    const failures: { userId: string; name: string; error: string }[] = [];

    for (const user of users) {
      if (!user.telegramChatId) continue;
      const customizedMessage = this.formatMessage(dto.message, user);
      try {
        await this.bot.telegram.sendMessage(user.telegramChatId, customizedMessage);
        sentCount++;
      } catch (error) {
        this.logger.error(`Failed to send telegram message to user ${user.id} (${user.email}): ${error.message}`);
        failedCount++;
        failures.push({
          userId: user.id,
          name: user.name,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Broadcast completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      sentCount,
      failedCount,
      failures,
    };
  }

  /**
   * Send a customized message to a single registered user
   */
  async sendNotification(dto: SendNotificationDto) {
    if (!this.bot) {
      throw new BadRequestException('Telegram bot is not initialized. Please verify your TELEGRAM_BOT_TOKEN.');
    }

    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    if (!user.telegramChatId) {
      throw new BadRequestException(`User ${user.name} (${user.email}) does not have a linked Telegram account.`);
    }

    const customizedMessage = this.formatMessage(dto.message, user);
    try {
      await this.bot.telegram.sendMessage(user.telegramChatId, customizedMessage);
      return {
        success: true,
        message: `Notification sent successfully to ${user.name}.`,
      };
    } catch (error) {
      this.logger.error(`Failed to send telegram message to user ${user.id}: ${error.message}`);
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get linking status for all users (or only linked users)
   */
  async getLinkingStatus(linkedOnly?: boolean) {
    const query = this.usersRepository.createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.role', 'user.position', 'user.status', 'user.telegramChatId', 'user.telegramUsername']);

    if (linkedOnly) {
      query.where('user.telegramChatId IS NOT NULL');
    }

    const users = await query.getMany();
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      status: user.status,
      telegramLinked: !!user.telegramChatId,
      telegramUsername: user.telegramUsername || null,
      telegramChatId: user.telegramChatId || null,
    }));
  }

  /**
   * Manually link a user to a Telegram Chat ID via REST API
   */
  async linkManually(email: string, telegramChatId: string, telegramUsername?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    
    if (!user) {
      throw new NotFoundException(`No registered user found with the email: ${email}`);
    }

    user.telegramChatId = telegramChatId;
    if (telegramUsername) {
      user.telegramUsername = telegramUsername;
    }
    
    await this.usersRepository.save(user);
    this.logger.log(`Telegram account linked manually via API: ${normalizedEmail} -> Chat ID: ${telegramChatId}`);
    
    return {
      success: true,
      message: `Successfully linked user ${user.name} (${user.email}) to Telegram Chat ID ${telegramChatId}.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        telegramLinked: true,
        telegramChatId: user.telegramChatId,
        telegramUsername: user.telegramUsername,
      }
    };
  }
}
