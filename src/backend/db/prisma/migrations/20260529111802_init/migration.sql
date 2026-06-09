-- CreateTable
CREATE TABLE "Games" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameState" JSONB NOT NULL,
    "time" DATETIME NOT NULL,
    "finished" BOOLEAN NOT NULL
);
