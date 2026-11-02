CREATE TABLE `downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`owner_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`parent_id` text
);
--> statement-breakpoint
CREATE INDEX `records_kind_idx` ON `records` (`kind`);--> statement-breakpoint
CREATE INDEX `records_parent_idx` ON `records` (`parent_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `target_id`)
);
