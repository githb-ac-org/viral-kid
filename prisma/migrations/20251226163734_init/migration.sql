-- CreateTable
CREATE TABLE "TwitterConfiguration" (
    "id" TEXT NOT NULL,
    "searchTerm" TEXT NOT NULL DEFAULT '',
    "schedule" TEXT NOT NULL DEFAULT 'every_hour',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterCredentials" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL DEFAULT '',
    "clientSecret" TEXT NOT NULL DEFAULT '',
    "rapidApiKey" TEXT NOT NULL DEFAULT '',
    "apiKey" TEXT NOT NULL DEFAULT '',
    "apiSecret" TEXT NOT NULL DEFAULT '',
    "bearerToken" TEXT NOT NULL DEFAULT '',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "userId" TEXT,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterCredentials_pkey" PRIMARY KEY ("id")
);
