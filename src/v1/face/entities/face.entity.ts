import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../users/user.entity";

export enum FaceVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

@Entity('user_faces')
export class UserFace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  name!: string;

  @Column('json')
  faceDescriptor!: number[];

  @Column('json', { nullable: true })
  faceDescriptorBackup?: number[];

  @Column({
    type: 'enum',
    enum: FaceVerificationStatus,
    default: FaceVerificationStatus.PENDING
  })
  status!: FaceVerificationStatus;

  @Column({ nullable: true })
  verificationToken?: string;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'float', nullable: true })
  confidence?: number;

  @Column({ type: 'text', nullable: true })
  faceImageUrl?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    deviceInfo?: string;
    ipAddress?: string;
    browserInfo?: string;
    attempts?: number;
    lastAttemptAt?: Date;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}