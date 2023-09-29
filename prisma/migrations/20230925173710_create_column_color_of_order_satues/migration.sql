-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#333'
);
INSERT INTO "new_OrderStatus" ("id", "label") SELECT "id", "label" FROM "OrderStatus";
DROP TABLE "OrderStatus";
ALTER TABLE "new_OrderStatus" RENAME TO "OrderStatus";
CREATE UNIQUE INDEX "OrderStatus_id_key" ON "OrderStatus"("id");
CREATE UNIQUE INDEX "OrderStatus_label_key" ON "OrderStatus"("label");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
