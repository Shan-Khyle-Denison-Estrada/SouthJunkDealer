CREATE TABLE `payment_methods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_methods_name_unique` ON `payment_methods` (`name`);--> statement-breakpoint
CREATE TABLE `unit_of_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit` text NOT NULL,
	`name` text NOT NULL
);
