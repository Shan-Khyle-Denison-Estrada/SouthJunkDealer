import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// --- EXISTING TABLES ---
export const materials = sqliteTable('materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  class: text('class'),
  uom: text('uom'),
});

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  batchId: text('batch_id').notNull().unique(),
  materialId: integer('material_id').references(() => materials.id),
  netWeight: real('net_weight').notNull(),
  date: text('date').notNull(),
  status: text('status').default('In Stock'),
});

// --- NEW TRANSACTIONS TABLES ---
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type'), // 'Buying' or 'Selling'
  paymentMethod: text('payment_method'), // 'Cash', 'G-Cash', 'Bank Transfer'
  totalAmount: real('total_amount').default(0),
  date: text('date').notNull(), // ISO Date String
  status: text('status').default('Draft'), // 'Draft' or 'Completed'
});

export const transactionItems = sqliteTable('transaction_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  materialId: integer('material_id').references(() => materials.id),
  weight: real('weight').notNull(),
  price: real('price').notNull(), // Price per unit
  subtotal: real('subtotal').notNull(),
});