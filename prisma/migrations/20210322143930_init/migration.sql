/*
  Warnings:

  - Added the required column `category` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('Geography', 'Science', 'History', 'Sport', 'Art', 'Entertainment', 'Electronics', 'Dumb');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "category" "QuestionCategory" NOT NULL;
