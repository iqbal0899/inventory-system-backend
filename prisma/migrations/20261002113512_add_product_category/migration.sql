-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");
