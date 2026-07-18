import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { AuthModule } from '../auth/auth.module';
import { CustomerModule } from '../customer/customer.module';
import { CustomerTelegram } from '../customer/customer.enitity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerTelegram, User]),
    AuthModule,
    CustomerModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
