import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Attendance,
  AttendanceStatus,
} from './attendance.entity';

import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

async checkIn(data: {
  user_id: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}) {
  const today = new Date().toISOString().split('T')[0];

  // const existing = await this.attendanceRepository.findOne({
  //   where: {
  //     user_id: data.user_id,
  //     attendance_date: today as any,
  //   },
  // });

  // if (existing) {
  //   throw new BadRequestException('Already checked in today');
  // }

  const attendance = this.attendanceRepository.create({
    user_id: data.user_id,
    attendance_date: today as any,
    time_in: new Date(),
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
  });

  return this.attendanceRepository.save(attendance);
}

  async checkOut(userId: string) {
  const today = new Date()
    .toISOString()
    .split('T')[0];

  const attendance =
    await this.attendanceRepository.findOne({
      where: {
        user_id: userId,
        attendance_date: today as any,
      },
    });

  if (!attendance) {
    throw new BadRequestException(
      'You have not checked in today',
    );
  }

  if (attendance.time_out) {
    throw new BadRequestException(
      'You have already checked out',
    );
  }

  attendance.time_out = new Date();

  return await this.attendanceRepository.save(
    attendance,
  );
}

 async findToday(userId: string) {
  console.log('Searching for:', userId);

  const result = await this.attendanceRepository.find({
    where: { user_id: userId },
    relations: { user: true },
  });

  console.log('ALL DATA:', result);

  return result;
}


  async findAll(
  page: number = 1,
  limit: number = 10,
) {
  const [data, total] =
    await this.attendanceRepository.findAndCount({
      relations: {
        user: true,
      },
      order: {
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

  return {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
}
}