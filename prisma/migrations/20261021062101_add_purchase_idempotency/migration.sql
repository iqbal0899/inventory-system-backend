-- CreateTable
CREATE TABLE "purchase_idempotency" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "payloadHash" VARCHAR(64) NOT NULL,
    "purchaseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_idempotency_key_key" ON "purchase_idempotency"("key");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_idempotency_purchaseId_key" ON "purchase_idempotency"("purchaseId");

-- AddForeignKey
ALTER TABLE "purchase_idempotency" ADD CONSTRAINT "purchase_idempotency_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
