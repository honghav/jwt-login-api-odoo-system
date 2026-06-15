import { Module } from "@nestjs/common";
import { AccountingService } from "./accounting.service";
import { Revenue } from "./accounting.enitity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountingController } from "./accounting.controller";
import { User } from "../users/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Revenue, User]), ],
    controllers: [AccountingController],
    providers: [AccountingService],
    exports: [AccountingService],
})
export class AccountingModule { }