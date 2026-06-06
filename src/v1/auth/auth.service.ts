import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserRole, UserPosition, UserStatus } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: registerDto.email },
        { name: registerDto.name }
      ]
    });

    if (existingUser) {
      throw new ConflictException('User with this email or name already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create new user - Fixed type issues
    const user = this.usersRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      image: registerDto.image || undefined, // Use null instead of undefined
      role: registerDto.role || UserRole.IT,
      position: registerDto.position || UserPosition.OFFICE_STAFF,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.usersRepository.save(user);

    this.logger.log(`User registered successfully: ${savedUser.email}`);

    // Generate JWT token
    const payload = {
      email: savedUser.email,
      sub: savedUser.id,
      role: savedUser.role,
      position: savedUser.position,
    };

    // Remove password from response
    const { password, ...userWithoutPassword } = savedUser;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
      message: 'Registration successful',
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    // Need to explicitly select password since it's set to select: false
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: loginDto.email })
      .getOne();
    
    if (!user) {
      this.logger.warn(`User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(`Account not active: ${user.email}`);
      throw new UnauthorizedException('Account is inactive or suspended');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role,
      position: user.position,
    };
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    this.logger.log(`Login successful for: ${user.email}`);
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    return await this.usersService.findById(userId);
  }
}