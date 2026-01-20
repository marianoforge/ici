-- AlterTable
ALTER TABLE "ReviewProjection" ADD COLUMN     "accompanimentScore" INTEGER,
ADD COLUMN     "compositeRating" DOUBLE PRECISION,
ADD COLUMN     "npsScore" INTEGER,
ADD COLUMN     "problemResolutionScore" INTEGER,
ADD COLUMN     "responseTimeScore" INTEGER;
