CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`photo_uri` text,
	`created_at` text DEFAULT '2026-01-25T17:59:34.802Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);