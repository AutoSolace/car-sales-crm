-- AlterTable
ALTER TABLE "Deal" ADD COLUMN "nextActionCategory" TEXT;
ALTER TABLE "Deal" ADD COLUMN "nextActionDescription" TEXT;
ALTER TABLE "Deal" ADD COLUMN "nextActionDueAt" DATETIME;
ALTER TABLE "Deal" ADD COLUMN "nextActionKind" TEXT;

-- CreateIndex
CREATE INDEX "Deal_nextActionDueAt_idx" ON "Deal"("nextActionDueAt");
