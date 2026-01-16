import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// --- MATERIALS TABLE (Updated) ---
export const materials = sqliteTable('materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  class: text('class'),
  uom: text('uom'),
  // maxCap removed
});

// --- INVENTORY TABLE (Kept as is) ---
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  batchId: text('batch_id').notNull().unique(),
  materialId: integer('material_id').references(() => materials.id),
  netWeight: real('net_weight').notNull(),
  date: text('date').notNull(),
  status: text('status').default('In Stock'),
});