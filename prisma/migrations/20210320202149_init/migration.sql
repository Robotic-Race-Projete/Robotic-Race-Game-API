/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `isValidated` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isAdmin` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isValidated" BOOLEAN NOT NULL,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Admin";
