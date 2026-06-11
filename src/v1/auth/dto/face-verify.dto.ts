import {
  IsArray,
  IsEmail,
} from 'class-validator'

export class RegisterFaceDto {
  @IsEmail()
  email!: string

  @IsArray()
  descriptor!: number[]
}