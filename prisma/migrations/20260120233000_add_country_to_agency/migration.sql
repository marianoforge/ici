-- AlterTable
ALTER TABLE "Agency" ADD COLUMN "country" TEXT;

-- CreateIndex
CREATE INDEX "Agency_country_province_city_idx" ON "Agency"("country", "province", "city");
