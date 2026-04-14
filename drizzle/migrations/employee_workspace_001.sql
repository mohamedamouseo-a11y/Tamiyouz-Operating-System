CREATE TABLE IF NOT EXISTS `department_workspaces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departmentId` int NULL,
  `name` varchar(191) NOT NULL,
  `trelloWorkspaceId` varchar(255) NULL,
  `apiKey` varchar(255) NOT NULL,
  `apiToken` text NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_workspaces_name_unique` (`name`),
  KEY `department_workspaces_department_idx` (`departmentId`),
  CONSTRAINT `department_workspaces_department_fk`
    FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL
);

ALTER TABLE `employees`
  ADD COLUMN IF NOT EXISTS `departmentWorkspaceId` int NULL,
  ADD CONSTRAINT `employees_department_workspace_fk`
    FOREIGN KEY (`departmentWorkspaceId`) REFERENCES `department_workspaces`(`id`) ON DELETE SET NULL;
