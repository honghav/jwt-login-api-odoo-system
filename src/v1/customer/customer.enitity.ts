import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('customer')
export class CustomerTelegram {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  customer_name!: string;
  @Column()
  customer_email!: string;
  @Column({ nullable: true })
  phone_number?: string;
  @Column({ nullable: true })
  telegram_linked?: string;
  @Column({ nullable: true })
  telegram_username?: string;
  @Column({ nullable: true })
  telegram_chat_id?: string;
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
