-- Client Area Migration
-- Creates new tables for client services, integrations, assignments, notes, and KPIs

CREATE TABLE IF NOT EXISTS `client_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `service` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `client_services_client_idx` (`clientId`),
  UNIQUE INDEX `client_services_unique` (`clientId`, `service`),
  CONSTRAINT `client_services_clientId_fk` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `client_integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `service` varchar(100) NOT NULL,
  `integrationType` varchar(100) NOT NULL,
  `displayName` varchar(191) NOT NULL,
  `externalId` varchar(191) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `metadata` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `client_integrations_client_idx` (`clientId`),
  INDEX `client_integrations_service_idx` (`service`),
  INDEX `client_integrations_type_idx` (`integrationType`),
  CONSTRAINT `client_integrations_clientId_fk` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `client_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `employeeId` int DEFAULT NULL,
  `departmentId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `client_assignments_client_idx` (`clientId`),
  INDEX `client_assignments_employee_idx` (`employeeId`),
  INDEX `client_assignments_department_idx` (`departmentId`),
  UNIQUE INDEX `client_assignments_client_employee_unique` (`clientId`, `employeeId`),
  UNIQUE INDEX `client_assignments_client_department_unique` (`clientId`, `departmentId`),
  CONSTRAINT `client_assignments_clientId_fk` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_assignments_employeeId_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_assignments_departmentId_fk` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `client_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `authorId` int NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `client_notes_client_idx` (`clientId`),
  INDEX `client_notes_author_idx` (`authorId`),
  INDEX `client_notes_created_idx` (`createdAt`),
  CONSTRAINT `client_notes_clientId_fk` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_notes_authorId_fk` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `client_kpis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `metricName` varchar(120) NOT NULL,
  `metricValue` double NOT NULL,
  `date` date NOT NULL,
  `recordedById` int NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `client_kpis_client_idx` (`clientId`),
  INDEX `client_kpis_metric_idx` (`metricName`),
  INDEX `client_kpis_date_idx` (`date`),
  CONSTRAINT `client_kpis_clientId_fk` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_kpis_recordedById_fk` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
