

USE `reileo_logistics_services`;


SET @dbname = DATABASE();

-- delivery_date
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='delivery_date');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `delivery_date` DATE NULL AFTER `status_id`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='route_code');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `route_code` VARCHAR(100) NULL AFTER `delivery_date`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='no_of_trips');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `no_of_trips` INT NULL AFTER `route_code`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='no_of_drops');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `no_of_drops` INT NULL AFTER `no_of_trips`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='category_type');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `category_type` VARCHAR(100) NULL AFTER `no_of_drops`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='area');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `area` VARCHAR(100) NULL AFTER `category_type`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='trip_allowance');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `trip_allowance` DECIMAL(15,2) NULL AFTER `area`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='fuel_liters');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `fuel_liters` DECIMAL(10,2) NULL AFTER `trip_allowance`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='fuel_po');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `fuel_po` VARCHAR(100) NULL AFTER `fuel_liters`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='fuel_amount');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `fuel_amount` DECIMAL(15,2) NULL DEFAULT 0.00 AFTER `fuel_po`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='remarks');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `remarks` VARCHAR(255) NULL AFTER `fuel_amount`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='client_ref_no');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `client_ref_no` VARCHAR(255) NULL AFTER `remarks`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='other_ref_no');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `other_ref_no` VARCHAR(255) NULL AFTER `client_ref_no`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_bookings' AND COLUMN_NAME='remarks_2');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `reileo_logistics_services_bookings` ADD COLUMN `remarks_2` TEXT NULL AFTER `other_ref_no`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
--  2. booking_personnel: add employment_type (Direct / Outsourced)
-- --------------------------------------------------------
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='reileo_logistics_services_booking_personnel' AND COLUMN_NAME='employment_type');
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `reileo_logistics_services_booking_personnel` ADD COLUMN `employment_type` ENUM('direct','outsource') NOT NULL DEFAULT 'direct' AFTER `assignment_role`",
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
--  3. booking_items table (dynamic rows in "Item Details")
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reileo_logistics_services_booking_items` (
  `booking_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `item_type_id` INT(11) NULL,
  `item_description` VARCHAR(255) NULL,
  `length_cm` DECIMAL(10,2) NULL,
  `width_cm`  DECIMAL(10,2) NULL,
  `height_cm` DECIMAL(10,2) NULL,
  `weight_kg` DECIMAL(12,2) NULL,
  PRIMARY KEY (`booking_item_id`),
  KEY `idx_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
--  4. booking_photos table (3 upload slots in Booking Photos section)
--     Data is stored as base64 data URL (MEDIUMTEXT = ~16MB, enough for photos)
--     OR swap photo_path + filesystem store if you prefer
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reileo_logistics_services_booking_photos` (
  `booking_photo_id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `photo_name` VARCHAR(255) NULL,
  `photo_path` VARCHAR(500) NULL,
  `photo_data` MEDIUMTEXT NULL,
  PRIMARY KEY (`booking_photo_id`),
  KEY `idx_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
