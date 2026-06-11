import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FaceService } from './face.service';
import { RegisterFaceDto, VerifyFaceDto, FaceVerificationResponseDto } from './dto/register-face.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Face Verification')
@Controller('face')
export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register user face for verification' })
  @ApiResponse({ status: 201, description: 'Face registered successfully' })
  async registerFace(@Body() registerFaceDto: RegisterFaceDto) {
    return await this.faceService.registerFace(registerFaceDto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify face against registered faces' })
  @ApiResponse({ status: 200, description: 'Face verification completed' })
  async verifyFace(@Body() verifyFaceDto: VerifyFaceDto): Promise<FaceVerificationResponseDto> {
    return await this.faceService.verifyFace(verifyFaceDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login using face verification' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async loginWithFace(@Body() verifyFaceDto: VerifyFaceDto) {
    return await this.faceService.verifyAndAuthenticate(verifyFaceDto);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user face registration' })
  async getUserFace(@Param('userId') userId: string) {
    return await this.faceService.getUserFace(userId);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('it', 'hr', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending face verifications (Admin only)' })
  async getPendingVerifications() {
    return await this.faceService.getPendingVerifications();
  }

  @Put('approve/:faceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('it', 'hr', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve face registration (Admin only)' })
  async approveFace(@Param('faceId') faceId: string) {
    return await this.faceService.approveFace(faceId);
  }

  @Put('reject/:faceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('it', 'hr', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject face registration (Admin only)' })
  async rejectFace(@Param('faceId') faceId: string, @Body('reason') reason?: string) {
    return await this.faceService.rejectFace(faceId, reason);
  }

  @Put('update/:faceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update face descriptor' })
  async updateFaceDescriptor(
    @Param('faceId') faceId: string,
    @Body('descriptor') descriptor: number[]
  ) {
    return await this.faceService.updateFaceDescriptor(faceId, descriptor);
  }

  @Delete(':faceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete face registration' })
  async deleteFace(@Param('faceId') faceId: string) {
    await this.faceService.deleteFace(faceId);
    return { message: 'Face registration deleted successfully' };
  }
}