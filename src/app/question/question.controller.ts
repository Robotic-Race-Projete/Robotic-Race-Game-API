import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionRangeDto } from './dto/question-range.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Answer, Question, Prisma, QuestionCategory } from '@prisma/client';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionService.create(createQuestionDto);
    return QuestionCategory;
  }

  @Get()
  async findAll(@Body() body: QuestionRangeDto) {
    return {
      meta: {
        question: {
          questionQuantity: await this.questionService.getCountOfQuestions(),
          lastQuestion: await this.questionService.getLastQuestion(),
          required: {
            categories: this.questionService.questionCategories
          }
        },
        answers: {
          required: {
            min: 2,
            max: 8
          }
        }
      },
      questions: await this.questionService.findAll(body.page, body.howMany)
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionService.update(+id, updateQuestionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    throw Error('errer')
    return this.questionService.remove(+id);
  }
}
