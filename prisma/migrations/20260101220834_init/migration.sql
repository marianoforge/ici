-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchName" TEXT,
    "website" TEXT,
    "googlePlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "prevHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "signature" TEXT,
    "anchorDate" TIMESTAMP(3),

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewProjection" (
    "reviewId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "operationType" TEXT NOT NULL,
    "positivesOverall" DOUBLE PRECISION,
    "severityPoints" INTEGER NOT NULL DEFAULT 0,
    "isVerifiedOperation" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',

    CONSTRAINT "ReviewProjection_pkey" PRIMARY KEY ("reviewId")
);

-- CreateIndex
CREATE INDEX "Agency_name_idx" ON "Agency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewEvent_eventHash_key" ON "ReviewEvent"("eventHash");

-- CreateIndex
CREATE INDEX "ReviewEvent_agencyId_createdAt_idx" ON "ReviewEvent"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewEvent_reviewId_createdAt_idx" ON "ReviewEvent"("reviewId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewProjection_agencyId_createdAt_idx" ON "ReviewProjection"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewProjection_province_city_neighborhood_idx" ON "ReviewProjection"("province", "city", "neighborhood");

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewProjection" ADD CONSTRAINT "ReviewProjection_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
