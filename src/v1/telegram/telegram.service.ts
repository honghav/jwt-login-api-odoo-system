import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CustomerTelegram } from '../customer/customer.enitity';
import { User } from '../users/user.entity';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CustomerTelegram)
    private readonly customerRepository: Repository<CustomerTelegram>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not defined or is default. Telegram bot will be disabled.',
      );
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupBotCommands();
      this.bot.launch().catch((err) => {
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
          `• Unlink account: /unlink`,
      );
    });

    // Command: /link <email>
    this.bot.command('link', async (ctx) => {
      const messageText = ctx.message.text;
      const args = messageText.split(/\s+/).slice(1);

      if (args.length < 1) {
        return ctx.reply(
          '❌ Usage: /link <your_registered_email>\nExample: /link customer@example.com',
        );
      }

      const email = args[0].trim().toLowerCase();
      const chatId = ctx.chat.id.toString();
      const username = ctx.from?.username || '';

      try {
        const customer = await this.customerRepository.findOne({
          where: { customer_email: email },
        });
        if (!customer) {
          return ctx.reply(
            `❌ No registered user found with the email: ${email}`,
          );
        }

        // Link the telegram chat ID
        customer.telegram_chat_id = chatId;
        customer.telegram_username = username;
        await this.customerRepository.save(customer);

        this.logger.log(
          `Telegram account linked successfully: ${email} -> Chat ID: ${chatId}`,
        );
        return ctx.reply(
          `✅ Successfully linked your Telegram account to ${customer.customer_name} (${customer.customer_email}). You will now receive system notifications here!`,
        );
      } catch (error: any) {
        this.logger.error(`Error linking user with Telegram: ${error.message}`);
        return ctx.reply(
          '❌ An error occurred while linking your account. Please try again later.',
        );
      }
    });

    // Command: /unlink
    this.bot.command('unlink', async (ctx) => {
      const chatId = ctx.chat.id.toString();

      try {
        const customer = await this.customerRepository.findOne({
          where: { telegram_chat_id: chatId },
        });
        if (!customer) {
          return ctx.reply(
            '❌ No account is currently linked to this Telegram chat.',
          );
        }

        const email = customer.customer_email;
        customer.telegram_chat_id = undefined;
        customer.telegram_username = undefined;
        await this.customerRepository.save(customer);

        this.logger.log(`Telegram account unlinked: ${email}`);
        return ctx.reply(`✅ Successfully unlinked from account: ${email}.`);
      } catch (error: any) {
        this.logger.error(`Error unlinking user: ${error.message}`);
        return ctx.reply(
          '❌ An error occurred while unlinking. Please try again.',
        );
      }
    });

    // Command: /status
    this.bot.command('status', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      try {
        const customer = await this.customerRepository.findOne({
          where: { telegram_chat_id: chatId },
        });
        if (customer) {
          return ctx.reply(
            `ℹ️ Telegram Connection Status:\n` +
              `• Linked Account: ${customer.customer_name}\n` +
              `• Email: ${customer.customer_email}\n`,
          );
        } else {
          return ctx.reply(
            'ℹ️ Account Status: Not linked.\nUse `/link <your_email>` to connect.',
          );
        }
      } catch (error) {
        return ctx.reply('❌ Error fetching connection status.');
      }
    });
  }

  /**
   * Replace placeholders in message template with user properties
   */
  private formatMessage(
    template: string,
    user: User | CustomerTelegram,
  ): string {
    const name = 'customer_name' in user ? user.customer_name : user.name;
    const email = 'customer_email' in user ? user.customer_email : user.email;
    const role = 'role' in user ? user.role : '';
    const position = 'position' in user ? user.position : '';

    return template
      .replace(/{name}/g, name || '')
      .replace(/{email}/g, email || '')
      .replace(/{role}/g, role || '')
      .replace(/{position}/g, position || '')
      .replace(/{date}/g, new Date().toLocaleDateString());
  }

  /**
   * Broadcast a customized message to matching registered users
   */
  async broadcastNotification(dto: BroadcastNotificationDto) {
    if (!this.bot) {
      throw new BadRequestException(
        'Telegram bot is not initialized. Please verify your TELEGRAM_BOT_TOKEN.',
      );
    }

    const query = this.usersRepository
      .createQueryBuilder('user')
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
        message:
          'No users found matching the filter criteria with linked Telegram accounts.',
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
        await this.bot.telegram.sendMessage(
          user.telegramChatId,
          customizedMessage,
        );
        sentCount++;
      } catch (error) {
        this.logger.error(
          `Failed to send telegram message to user ${user.id} (${user.email}): ${error.message}`,
        );
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
      throw new BadRequestException(
        'Telegram bot is not initialized. Please verify your TELEGRAM_BOT_TOKEN.',
      );
    }

    const user = await this.customerRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    if (!user.telegram_chat_id) {
      throw new BadRequestException(
        `User ${user.customer_name} (${user.customer_email}) does not have a linked Telegram account.`,
      );
    }

    const customizedMessage = this.formatMessage(dto.message, user);
    try {
      await this.bot.telegram.sendMessage(
        user.telegram_chat_id,
        customizedMessage,
      );
      return {
        success: true,
        message: `Notification sent successfully to ${user.customer_name}.`,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send telegram message to user ${user.id}: ${error.message}`,
      );
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get linking status for all users (or only linked users)
   */
  async getLinkingStatus(linkedOnly?: boolean) {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.id',
        'customer.customer_name',
        'customer.customer_email',
        'customer.phone_number',
        'customer.telegram_chat_id',
        'customer.telegram_username',
      ]);

    if (linkedOnly) {
      query.where('user.telegram_chat_id IS NOT NULL');
    }

    const users = await query.getMany();
    return users.map((user) => ({
      id: user.id,
      name: user.customer_name,
      email: user.customer_email,
      phone: user.phone_number,
      telegramLinked: !!user.telegram_linked,
      telegramUsername: user.telegram_username || null,
      telegramChatId: user.telegram_chat_id || null,
    }));
  }

  /**
   * Manually link a user to a Telegram Chat ID via REST API
   */
  async linkManually(
    email: string,
    telegramChatId: string,
    telegramUsername?: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException(
        `No registered user found with the email: ${email}`,
      );
    }

    user.telegramChatId = telegramChatId;
    if (telegramUsername) {
      user.telegramUsername = telegramUsername;
    }

    await this.usersRepository.save(user);
    this.logger.log(
      `Telegram account linked manually via API: ${normalizedEmail} -> Chat ID: ${telegramChatId}`,
    );

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
      },
    };
  }
}
