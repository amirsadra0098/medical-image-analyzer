CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` text,
	`originalFilename` varchar(255),
	`imageType` enum('CT_SCAN','MRI','XRAY','UNKNOWN') DEFAULT 'UNKNOWN',
	`status` enum('pending','processing','completed','failed','rejected') NOT NULL DEFAULT 'pending',
	`isMedicalImage` boolean,
	`rejectionReason` text,
	`findings` json,
	`diagnosis` text,
	`similarityScores` json,
	`medicalReferences` json,
	`confidenceScore` float,
	`rawAnalysis` text,
	`language` enum('en','fa') DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;