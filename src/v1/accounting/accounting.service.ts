import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Revenue } from "./accounting.enitity";
import { Repository } from "typeorm/browser/repository/Repository.js";
import { CreateRevenueDto } from "./dto/create-revenue.dto";
import { User } from "../users/user.entity";
import { UpdateRevenueDto } from "./dto/update-revenue.dto";
import { randomUUID } from "crypto";
import path from "path/win32";
import * as fs from 'fs';


@Injectable()
export class AccountingService {
    // Implement accounting logic here
    constructor(
        @InjectRepository(Revenue)
        private revenueRepo: Repository<Revenue>,
         @InjectRepository(User)
        private readonly userRepo: Repository<User>,) { }

private saveBase64Image(base64: string): string {
    const matches = base64.match(
      /^data:image\/([A-Za-z0-9+]+);base64,(.+)$/,
    );

    if (!matches) {
      throw new Error('Invalid image format');
    }

    const extension = matches[1];
    const imageData = matches[2];

    const fileName = `${randomUUID()}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      'storage',
      'uploads',
      'revenues',
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {
        recursive: true,
      });
    }

    const filePath = path.join(
      uploadDir,
      fileName,
    );

    fs.writeFileSync(
      filePath,
      Buffer.from(imageData, 'base64'),
    );

    return `/storage/uploads/revenues/${fileName}`;
  }
// CREATE
  async create(dto: CreateRevenueDto) {
    let user: User | null = null;
    // if (dto.seller) {
    //   user = await this.userRepo.findOne({
    //     where: { id: dto.seller },
    //   });

    //   if (!user || user.role !== 'accounting') {
    //     throw new NotFoundException('User not found or not an accounting user');
    //   }
    // }

   let imagePath: string | undefined;

    if (
      dto.image &&
      dto.image.startsWith('data:image')
    ) {
      imagePath = this.saveBase64Image(
        dto.image,
      );
    }

    const revenue = this.revenueRepo.create({
      ...dto,
      image: imagePath,
    });


    return await this.revenueRepo.save(revenue);
  }

   
  // FIND ALL
  async findAll() {
    return await this.revenueRepo.find({
      relations: { user: true },
      order: { id: 'DESC' },
    });
  }

  // FIND ONE
  async findOne(id: string) {
    const revenue = await this.revenueRepo.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!revenue) {
      throw new NotFoundException('Revenue not found');
    }

    return revenue;
  }

  // UPDATE
  async update(
    id: string,
    dto: UpdateRevenueDto,
  ) {
    const revenue = await this.findOne(id);

    if (
      dto.image &&
      dto.image.startsWith('data:image')
    ) {
      dto.image = this.saveBase64Image(
        dto.image,
      );
    }

    Object.assign(revenue, dto);

    return this.revenueRepo.save(revenue);
  }

  // DELETE
  async remove(id: string) {
    const revenue = await this.findOne(id);
    return await this.revenueRepo.remove(revenue);
  }

  

//   Base 64 mapper






}