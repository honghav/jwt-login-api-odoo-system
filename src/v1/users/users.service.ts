import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    // Check if user exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: createUserDto.email }, { name: createUserDto.name }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or name already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      image: createUserDto.image || undefined, // Use null instead of undefined
    });

    const savedUser = await this.usersRepository.save(user);
    
    // Remove password from response
    const { password, ...result } = savedUser;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<Partial<User> | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return null;
    
    const { password, ...result } = user;
    return result;
  }

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
      const { password, ...result } = user;
      return result;
    });
  }

  async updateProfile(id: string, updateData: Partial<User>): Promise<Partial<User>> {
    await this.usersRepository.update(id, updateData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async updateStatus(id: string, status: string): Promise<Partial<User>> {
    await this.usersRepository.update(id, { status: status as UserStatus });
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}