import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/createUser.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      return await this.userModel.create(createUserDto);
    } catch (error: unknown) {
      const e = error as { code?: number };
      const duplicateKeyErrorCode = 11000;
      if (e.code === duplicateKeyErrorCode) {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }
}
