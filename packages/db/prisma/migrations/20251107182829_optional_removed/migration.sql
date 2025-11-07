/*
  Warnings:

  - Made the column `focusArea` on table `UserSkill` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `UserSkill` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserSkill" ALTER COLUMN "focusArea" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
