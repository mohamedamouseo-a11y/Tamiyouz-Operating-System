CREATE TABLE IF NOT EXISTS `help_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `titleAr` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `contentAr` text DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `tags` text DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 1,
  `isPinned` tinyint(1) NOT NULL DEFAULT 0,
  `version` varchar(20) DEFAULT NULL,
  `authorId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `help_articles_slug_unique` (`slug`),
  KEY `help_articles_category_idx` (`category`),
  KEY `help_articles_published_idx` (`isPublished`),
  KEY `help_articles_author_idx` (`authorId`),
  CONSTRAINT `help_articles_author_fk`
    FOREIGN KEY (`authorId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `help_article_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` int NOT NULL,
  `userId` int DEFAULT NULL,
  `viewedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `help_article_views_article_idx` (`articleId`),
  KEY `help_article_views_user_idx` (`userId`),
  CONSTRAINT `help_article_views_article_fk`
    FOREIGN KEY (`articleId`) REFERENCES `help_articles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `help_article_views_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `help_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` int NOT NULL,
  `userId` int DEFAULT NULL,
  `helpful` tinyint(1) NOT NULL,
  `comment` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `help_feedback_article_idx` (`articleId`),
  KEY `help_feedback_user_idx` (`userId`),
  CONSTRAINT `help_feedback_article_fk`
    FOREIGN KEY (`articleId`) REFERENCES `help_articles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `help_feedback_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `help_chat_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `sessionKey` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `help_chat_sessions_session_key_unique` (`sessionKey`),
  KEY `help_chat_sessions_user_idx` (`userId`),
  CONSTRAINT `help_chat_sessions_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `help_chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` int NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `sources` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `help_chat_messages_session_idx` (`sessionId`),
  CONSTRAINT `help_chat_messages_session_fk`
    FOREIGN KEY (`sessionId`) REFERENCES `help_chat_sessions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
