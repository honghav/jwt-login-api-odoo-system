import { IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserPosition } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  password!: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.IT, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: UserPosition, example: UserPosition.MANAGER, required: false })
  @IsOptional()
  @IsEnum(UserPosition)
  position?: UserPosition;
}