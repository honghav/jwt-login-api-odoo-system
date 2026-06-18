import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  LEAVE = 'leave',
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

 @Column({ type: 'uuid', nullable: true })
user_id!: string;

  @Column({ type: 'date' })
  attendance_date!: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  time_in!: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  time_out!: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude!: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude!: number;

  @Column({
    nullable: true,
  })
  address!: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  working_hours!: number;

  @ManyToOne(() => User, (user) => user.attendance)
@JoinColumn({ name: 'user_id' })
user!: User;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}