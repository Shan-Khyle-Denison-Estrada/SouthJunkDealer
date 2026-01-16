CREATE TABLE `audit_trails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_id` integer,
	`action` text NOT NULL,
	`notes` text,
	`date` text NOT NULL,
	`image_uri` text,
	`previous_weight` real,
	`new_weight` real,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE no action
);
