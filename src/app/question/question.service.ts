import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma, Question, QuestionCategory } from '@prisma/client';
import { questions } from './questions';

@Injectable()
export class QuestionService implements OnModuleInit {
	questionCategories: string[];

	constructor(private prisma: PrismaService) {
		const questionCategoryString: string[] = [];
		for (let enumMember in QuestionCategory) {
			questionCategoryString.push(enumMember);
		}
		this.questionCategories = questionCategoryString;
	}

	async onModuleInit() {
		const count = await this.prisma.question.count();
		if (count == 0) {
			for (let question of questions) {
				await this.create(question);
			}
		}
	}

	create(data: CreateQuestionDto): Promise<Question | null> {
		return this.prisma.question.create({
			data: {
				question: data.question,
				category: data.category,
				answers: {
					create: data.answers,
				},
			},
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
				answers: true,
			},
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

	async getLastQuestion() {
		const lastQuestion = await this.prisma.question.findMany({
			orderBy: {
				id: 'desc',
			},
			take: 1,
		});
		return lastQuestion[0];
	}

	async getCountOfQuestions() {
		return this.prisma.question.count();
	}

	async getRandomQuestion() {
		const count = await this.prisma.question.count();
		const randomOffset = Math.floor(count * Math.random());
		const gotValue = await this.prisma.question.findMany({
			take: 1,
			skip: randomOffset,
			include: {
				answers: {
					select: {
						answer: true,
						id: true
					}
				}
			}
		});

		return gotValue[0];
	}
}
