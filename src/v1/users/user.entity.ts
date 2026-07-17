import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Attendance } from '../attendance/attendance.entity';
import { Revenue } from '../accounting/accounting.enitity';

export enum UserRole {
  ACCOUNTING = 'accounting',
  FINANCE = 'finance',
  HR = 'hr',
  IT = 'it',
}

export enum UserPosition {
  INTERN = 'intern',
  OFFICE_STAFF = 'office_staff',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  @Exclude()
  password!: string;

  @Column({ nullable: true })
  image?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.IT,
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserPosition,
    default: UserPosition.OFFICE_STAFF,
  })
  position!: UserPosition;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendance?: Attendance[];

  @OneToMany(() => Revenue, (revenue) => revenue.user)
  revenue?: Revenue[];
  
  @Column({ nullable: true })
  telegramChatId?: string;

  @Column({ nullable: true })
  telegramUsername?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}