import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/user.entity";
export enum TypeRevenue {
    SELL = 'sell',
    LOAN = 'loan',
    MAMBER_FEE = 'member_fee',
    RETURN = 'return',
    OTHER = 'other'
}
export enum StatusRevenue {
    PENDING = 'pending',
    APPROVED = 'approved',
    RETURN = 'RETURN',
}
export enum PaymentMethod {
    CASH = 'cash',
    TRANSFER = 'transfer',
    E_WALLET = 'e_wallet',
    OTHER = 'other'
}
@Entity('revenue')
@Entity('revenue')
export class Revenue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: TypeRevenue,
    default: TypeRevenue.SELL,
  })
  type_revenue!: TypeRevenue;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @Column({ default: false })
  approve!: boolean;

  @Column()
  customer_name!: string;

  @Column({
    type: 'enum',
    enum: StatusRevenue,
    default: StatusRevenue.PENDING,
  })
  status!: StatusRevenue;

  @Column('decimal', {
    precision: 12,
    scale: 2,
  })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  payment_method!: PaymentMethod;

  @Column({ nullable: true })
  bank_transaction?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  note?: string;
}