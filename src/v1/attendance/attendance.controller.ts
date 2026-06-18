import {
    Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckInDto } from './dto/check-in.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('check-in')
  @ApiOperation({
    summary: 'Check In',
    description:
      'Authenticated user checks in for today',
  })
  @ApiResponse({
    status: 201,
    description: 'Check in successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Already checked in today',
  })
 async checkIn(
  @Req() req: any,
  @Body() dto: CheckInDto,
) {
  return this.attendanceService.checkIn({
    user_id: req.user.userId,
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address,
  });
}

  @Post('check-out')
  @ApiOperation({
    summary: 'Check Out',
    description:
      'Authenticated user checks out for today',
  })
  @ApiResponse({
    status: 200,
    description: 'Check out successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Already checked out',
  })
  async checkOut(@Req() req: any) {
    return this.attendanceService.checkOut(
      req.user.userId,
    );
  }

  @Get('today')
  @ApiOperation({
    summary: 'Get Today Attendance',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns attendance information for today',
  })
  async today(@Req() req: any) {
    return this.attendanceService.findToday(
      req.user.userId,
    );
  }

  @Get()
  async findAll(
     @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  ) {
    return this.attendanceService.findAll(page, limit);
  }
}