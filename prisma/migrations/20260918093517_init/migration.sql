-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "leadSource" TEXT,
    "preferredContactMethod" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'LEAD',
    "findCarOutcome" TEXT NOT NULL DEFAULT 'PENDING',
    "proposalAcceptedOutcome" TEXT NOT NULL DEFAULT 'PENDING',
    "completedLostOutcome" TEXT NOT NULL DEFAULT 'PENDING',
    "commissionReceived" DECIMAL,
    "completedAt" DATETIME,
    "lostAt" DATETIME,
    "carsInterested" TEXT,
    "finalMake" TEXT,
    "finalModel" TEXT,
    "finalYear" INTEGER,
    "finalRegistration" TEXT,
    "finalMileage" INTEGER,
    "finalPrice" DECIMAL,
    "finalIsNew" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdditionalProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    CONSTRAINT "AdditionalProduct_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "headers" TEXT NOT NULL,
    "rawDataJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Contact_lastName_firstName_idx" ON "Contact"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "AdditionalProduct_dealId_idx" ON "AdditionalProduct"("dealId");
