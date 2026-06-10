/*
  Warnings:

  - Added the required column `playersOrder` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" TEXT NOT NULL,
    "gameState" JSONB,
    "playersOrder" JSONB NOT NULL,
    "time" DATETIME NOT NULL,
    "finished" BOOLEAN NOT NULL
);
INSERT INTO "new_Game" ("finished", "gameState", "id", "roomId", "time") SELECT "finished", "gameState", "id", "roomId", "time" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_roomId_key" ON "Game"("roomId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
