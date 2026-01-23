import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// --- EXISTING TABLES (Keep these as they were) ---
export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  class: text("class"),
  uom: text("uom"),
});

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchId: text("batch_id").notNull().unique(),
  materialId: integer("material_id").references(() => materials.id),
  netWeight: real("net_weight").notNull(),
  date: text("date").notNull(),
  status: text("status").default("In Stock"),
  imageUri: text("image_uri"),
  qrContent: text("qr_content"),
  notes: text("notes"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type"),
  paymentMethod: text("payment_method"),
  totalAmount: real("total_amount").default(0),
  date: text("date").notNull(),
  status: text("status").default("Draft"),
  paidAmount: real("paid_amount").default(0),
  clientName: text("client_name"),
  clientAffiliation: text("client_affiliation"),
  driverName: text("driver_name"),
  truckPlate: text("truck_plate"),
  truckWeight: real("truck_weight"),
  licenseImageUri: text("license_image_uri"),
});

export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id").references(() => transactions.id, {
    onDelete: "cascade",
  }),
  materialId: integer("material_id").references(() => materials.id),
  weight: real("weight").notNull(),
  price: real("price").notNull(),
  subtotal: real("subtotal").notNull(),
});

export const inventoryTransactionItems = sqliteTable(
  "inventory_transaction_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inventoryId: integer("inventory_id").references(() => inventory.id),
    transactionItemId: integer("transaction_item_id").references(
      () => transactionItems.id,
    ),
    allocatedWeight: real("allocated_weight").notNull(),
  },
);

export const auditTrails = sqliteTable("audit_trails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryId: integer("inventory_id")
    .references(() => inventory.id)
    .notNull(),
  action: text("action").notNull(),
  notes: text("notes"),
  date: text("date").notNull(),
  evidenceImageUri: text("evidence_image_uri"),
  previousWeight: real("previous_weight"),
  newWeight: real("new_weight"),
});

// --- NEW SETTINGS TABLES (UPDATED) ---

export const unitOfMeasurements = sqliteTable("unit_of_measurements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unit: text("unit").notNull(), // e.g. "kg", "lbs"
  name: text("name").notNull(), // e.g. "Kilograms", "Pounds"
});

export const paymentMethods = sqliteTable("payment_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g. "Bank Transfer", "Cash"
});
