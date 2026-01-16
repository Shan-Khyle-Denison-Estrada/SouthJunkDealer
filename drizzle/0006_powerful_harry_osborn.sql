CREATE TABLE `inventory_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_id` integer,
	`transaction_item_id` integer,
	`allocated_weight` real NOT NULL,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_item_id`) REFERENCES `transaction_items`(`id`) ON UPDATE no action ON DELETE no action
);
