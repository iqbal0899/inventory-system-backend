-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "requestId" TEXT;

-- CreateIndex
CREATE INDEX "stock_movements_requestId_idx" ON "stock_movements"("requestId");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
