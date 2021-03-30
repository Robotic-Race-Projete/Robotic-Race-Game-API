import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma, Question } from '@prisma/client';

@Injectable()
export class QuestionService {
  constructor (
    private prisma: PrismaService
  ) {}

  create(data: CreateQuestionDto): Promise<Question|null> {
    return this.prisma.question.create({ 
      data: {
        question: data.question,
        category: data.category,
        answers: {
          create: data.answers
        }
      }
    });
  }

  findAll(startingIndex: number = 0, howMany: number = 50): Promise<any[]> {
    return this.prisma.question.findMany({
      where: {
        id: {
          gte: startingIndex,
          lte: startingIndex + howMany
        }
      },
      select: {
        question: true,
        answers: true
      }
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} question`;
  }

  update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return `This action updates a #${id} question`;
  }

  remove(id: number) {
    return `This action removes a #${id} question`;
  }
}
