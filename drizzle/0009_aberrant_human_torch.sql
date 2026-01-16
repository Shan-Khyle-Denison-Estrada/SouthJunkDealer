PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audit_trails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_id` integer NOT NULL,
	`action` text NOT NULL,
	`notes` text,
	`date` text NOT NULL,
	`evidence_image_uri` text,
	`previous_weight` real,
	`new_weight` real,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_audit_trails`("id", "inventory_id", "action", "notes", "date", "evidence_image_uri", "previous_weight", "new_weight") SELECT "id", "inventory_id", "action", "notes", "date", "evidence_image_uri", "previous_weight", "new_weight" FROM `audit_trails`;--> statement-breakpoint
DROP TABLE `audit_trails`;--> statement-breakpoint
ALTER TABLE `__new_audit_trails` RENAME TO `audit_trails`;--> statement-breakpoint
PRAGMA foreign_keys=ON;