import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';

export class AuthResponseDto {
  @ApiProperty()
  access_token!: string;

  @ApiProperty()
  user!: Partial<User>;
}