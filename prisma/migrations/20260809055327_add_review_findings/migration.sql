-- CreateTable
CREATE TABLE "ReviewFinding" (
    "id" TEXT NOT NULL,
    "reviewResultId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "line" INTEGER,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewFinding_reviewResultId_idx" ON "ReviewFinding"("reviewResultId");

-- AddForeignKey
ALTER TABLE "ReviewFinding" ADD CONSTRAINT "ReviewFinding_reviewResultId_fkey" FOREIGN KEY ("reviewResultId") REFERENCES "ReviewResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
