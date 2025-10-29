import { Injectable,ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}


    async create(userData: RegisterDto): Promise<User> {
    if (!userData.password) {
      throw new BadRequestException('Password is required');
    }
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...(userData as Prisma.UserCreateInput),
        password: hashedPassword,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

}
