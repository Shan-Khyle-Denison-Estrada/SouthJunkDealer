CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` text NOT NULL,
	`material_id` integer,
	`net_weight` real NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'In Stock',
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_batch_id_unique` ON `inventory` (`batch_id`);