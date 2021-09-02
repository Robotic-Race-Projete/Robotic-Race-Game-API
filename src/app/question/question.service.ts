import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma, Question, QuestionCategory } from '@prisma/client';

@Injectable()
export class QuestionService {

  questionCategories: string[]

  constructor (
    private prisma: PrismaService
  ) {
    const questionCategoryString: string[] = [];
    for (let enumMember in QuestionCategory) {
        questionCategoryString.push(enumMember);
    }
    this.questionCategories = questionCategoryString;
  }

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

  async findAll(page: number = 0, howMany: number = 50): Promise<any[]> {
    return this.prisma.question.findMany({
      skip: page * howMany,
      take: howMany,
      select: {
        id: true,
        question: true,
        category: true,
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

  async getLastQuestion () {
    const lastQuestion = await this.prisma.question.findMany({
      orderBy: {
        id: 'desc'
      },
      take: 1,
    });
    return lastQuestion[0];
  }

  async getCountOfQuestions () {
    return this.prisma.question.count();
  }
}
