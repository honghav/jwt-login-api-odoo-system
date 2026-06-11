import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class UserFace {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  email!: string

  @Column('json')
  faceDescriptor1!: number[]
}