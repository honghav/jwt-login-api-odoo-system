import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { UpdateCustomerDto } from './dto/updateCustomer.dto';
import { CustomerTelegram } from './customer.enitity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerTelegram)
    private customerRepo: Repository<CustomerTelegram>,
  ) {}

  async create(dto: CreateCustomerDto) {
    const customer = this.customerRepo.create({ ...dto });
    return await this.customerRepo.save(customer);
  }
  async getAll() {
    try {
      return await this.customerRepo.find({ order: { createdAt: 'DESC' } });
    } catch (error: any) {
      // This sends the REAL database error back to Postman instead of "Internal server error"
      throw new Error(`DB Error: ${error.message} -> Code: ${error.code}`);
    }
  }
  async getOne(id: string) {
    const findCustomer = await this.customerRepo.findOne({
      where: { id },
    });
    if (!findCustomer) {
      throw new NotFoundException('Customer not found');
    }
    return findCustomer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.getOne(id);
    Object.assign(customer, dto);
    return await this.customerRepo.save(customer);
  }

  async remove(id: string) {
    const customer = await this.getOne(id);
    await this.customerRepo.remove(customer);
    return { message: 'Customer deleted successfully' };
  }
}
