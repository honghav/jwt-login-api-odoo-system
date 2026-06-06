import { IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserPosition, UserStatus } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password too weak. Must contain uppercase, lowercase, number and special character',
  })
  password!: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false, nullable: true })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.IT, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: UserPosition, example: UserPosition.MANAGER, required: false })
  @IsOptional()
  @IsEnum(UserPosition)
  position?: UserPosition;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}