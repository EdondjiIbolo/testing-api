CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `assistants` (
`id` varchar(250) NOT NULL,
 `name` varchar(50) DEFAULT NULL,
 `email` varchar(100) DEFAULT NULL,
 `phone` varchar(20) DEFAULT NULL,
 `password` varchar(100) DEFAULT NULL,
  `rol_id` int(11) DEFAULT NULL,PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuarios_ass_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `usuarios` (
  `id` varchar(250) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `surename` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `rol_id` int(11) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  CONSTRAINT `usuarios_rol_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `messages` (
  `id_message` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `surename` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `fecha_message` date DEFAULT NULL,
  PRIMARY KEY (`id_message`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `orders` (
  `id` varchar(250) NOT NULL PRIMARY KEY,
  `user_id` varchar(250) DEFAULT NULL,
  `address` varchar(250) DEFAULT NULL,
  `phone` varchar(250) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `total_machines` int default null,
  `shipping_price` decimal(10,2),
  `total_price` decimal(10,2),
  CONSTRAINT `usuarios_orders_fk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `files` (
  `id` varchar(250) NOT NULL PRIMARY KEY,
  `order_id` varchar(250) DEFAULT NULL,
  `filename` varchar(250) DEFAULT NULL,
  `url_2d` varchar(250) DEFAULT NULL,
  `url_3d` varchar(250) DEFAULT NULL,
  CONSTRAINT `orders_files_fk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `files_details` (
  `id` varchar(250) NOT NULL PRIMARY KEY,
  `order_id` varchar(250) DEFAULT NULL,
  `file_id` varchar(200) DEFAULT NULL,
  `technology` varchar(100) DEFAULT NULL,
  `finishing` varchar(100) DEFAULT NULL,
  `tolerance` varchar(20) DEFAULT NULL,
  `threads` varchar(100) DEFAULT NULL,
  `notes` varchar(250) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  CONSTRAINT `orders_fd_fk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
    CONSTRAINT `files_fd_fk_1` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `payment` (
  `id_payment` int(11) NOT NULL,
  `id_user` varchar(250) DEFAULT NULL,
  `order_id` varchar(250) DEFAULT NULL,
  `total_pagado` decimal(10,2) DEFAULT NULL,
  `fecha_de_pago` date DEFAULT NULL,
  PRIMARY KEY (`id_payment`),

  CONSTRAINT `payment_user_fk_1` FOREIGN KEY (`id_user`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `payment_order_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tokens` (
  `token_id` varchar(250) NOT NULL,
  `codigo` varchar(220) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  PRIMARY KEY (`token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
