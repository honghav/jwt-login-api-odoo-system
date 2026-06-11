import { IsString, IsArray, IsOptional, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterFaceDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Face name/label' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Face descriptor array (128-dimension vector)' })
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor!: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  faceDescriptorBackup?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  faceImageUrl?: string;
}

export class VerifyFaceDto {
  @ApiProperty({ description: 'Face descriptor to verify' })
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor!: number[];

  @ApiProperty({ required: false, description: 'User ID (optional, for specific user)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ required: false, default: 0.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;
}

export class FaceVerificationResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty()
  confidence!: number;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  userName?: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ required: false })
  matchedFaces?: Array<{
    userId: string;
    name: string;
    confidence: number;
  }>;
}