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
  imageUri: text('image_uri'),
  qrContent: text('qr_content'),
  notes: text('notes'),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type'), 
  paymentMethod: text('payment_method'), 
  totalAmount: real('total_amount').default(0),
  date: text('date').notNull(), 
  status: text('status').default('Draft'),
});

export const transactionItems = sqliteTable('transaction_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  materialId: integer('material_id').references(() => materials.id),
  weight: real('weight').notNull(),
  price: real('price').notNull(), 
  subtotal: real('subtotal').notNull(),
});

export const inventoryTransactionItems = sqliteTable('inventory_transaction_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  inventoryId: integer('inventory_id').references(() => inventory.id),
  transactionItemId: integer('transaction_item_id').references(() => transactionItems.id),
  allocatedWeight: real('allocated_weight').notNull(),
});

// --- UPDATED AUDIT TRAILS TABLE ---
export const auditTrails = sqliteTable('audit_trails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  inventoryId: integer('inventory_id').references(() => inventory.id).notNull(),
  action: text('action').notNull(),
  notes: text('notes'),
  date: text('date').notNull(),
  evidenceImageUri: text('evidence_image_uri'), // New: Photo Evidence
  previousWeight: real('previous_weight'),     // New: For adjustments
  newWeight: real('new_weight'),               // New: For adjustments
});