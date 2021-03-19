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
        answers: {
          create: data.answers
        }
      }
    });
  }

  findAll(): Promise<any[]> {
    return this.prisma.question.findMany({
      where: {},
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
