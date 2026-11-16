CREATE TABLE IF NOT EXISTS `bk_b_expenses` (
  `bk_b_ex_id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) DEFAULT NULL,
  `gas` decimal(10,2) DEFAULT NULL,
  `parking_fee` decimal(10,2) DEFAULT NULL,
  `toll_free` decimal(10,2) DEFAULT NULL,
  `entrance_fee` decimal(10,2) DEFAULT NULL,
  `mano` decimal(10,2) DEFAULT NULL,
  `sop` decimal(10,2) DEFAULT NULL,
  `demorage` decimal(10,2) DEFAULT NULL,
  `extra_drop` decimal(10,2) DEFAULT NULL,
  `backload_fee` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`bk_b_ex_id`),
  UNIQUE KEY `uq_bk_b_expenses_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bk_nb_expenses` (
  `bk_nb_ex_id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) DEFAULT NULL,
  `gas` decimal(10,2) DEFAULT NULL,
  `parking_fee` decimal(10,2) DEFAULT NULL,
  `toll_free` decimal(10,2) DEFAULT NULL,
  `entrance_fee` decimal(10,2) DEFAULT NULL,
  `mano` decimal(10,2) DEFAULT NULL,
  `sop` decimal(10,2) DEFAULT NULL,
  `demorage` decimal(10,2) DEFAULT NULL,
  `extra_drop` decimal(10,2) DEFAULT NULL,
  `backload_fee` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`bk_nb_ex_id`),
  UNIQUE KEY `uq_bk_nb_expenses_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `bk_b_expenses`
  ADD COLUMN IF NOT EXISTS `booking_id` int(11) DEFAULT NULL AFTER `bk_b_ex_id`,
  ADD UNIQUE INDEX IF NOT EXISTS `uq_bk_b_expenses_booking` (`booking_id`);

ALTER TABLE `bk_nb_expenses`
  ADD COLUMN IF NOT EXISTS `booking_id` int(11) DEFAULT NULL AFTER `bk_nb_ex_id`,
  ADD UNIQUE INDEX IF NOT EXISTS `uq_bk_nb_expenses_booking` (`booking_id`);
