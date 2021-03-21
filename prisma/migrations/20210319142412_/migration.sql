/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[nickname]` on the table `Admin`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Admin.nickname_unique" ON "Admin"("nickname");
