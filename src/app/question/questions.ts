// import { Question, QuestionCategory, Answer } from '@prisma/client';

import { QuestionCategory } from "@prisma/client";
import { CreateQuestionDto } from "./dto/create-question.dto";

export const questions: CreateQuestionDto[] = [
    {
        question: "1+1?",
        answers: [
            {
                answer: '1',
                isRight: false,
            },
            {
                answer: '2',
                isRight: true,
            },
            {
                answer: '42',
                isRight: false,
            },
            {
                answer: '11',
                isRight: false,
            }
        ],
        category: QuestionCategory.Dumb
    }, {
        question: "2+2?",
        answers: [
            {
                answer: '1',
                isRight: false,
            },
            {
                answer: '4',
                isRight: true,
            },
            {
                answer: '42',
                isRight: false,
            },
            {
                answer: '22',
                isRight: false,
            }
        ],
        category: QuestionCategory.Dumb
    }
]