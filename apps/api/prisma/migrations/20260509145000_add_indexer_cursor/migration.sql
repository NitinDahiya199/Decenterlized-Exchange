-- CreateTable
CREATE TABLE "IndexerCursor" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "eventGroup" TEXT NOT NULL,
    "lastBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndexerCursor_chainId_contractAddress_eventGroup_key" ON "IndexerCursor"("chainId", "contractAddress", "eventGroup");

-- CreateIndex
CREATE INDEX "IndexerCursor_chainId_eventGroup_idx" ON "IndexerCursor"("chainId", "eventGroup");
