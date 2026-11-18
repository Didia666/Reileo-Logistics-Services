USE `reileo_logistics_services`;

SET @dbname = DATABASE();

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'bk_expenses'
    AND COLUMN_NAME = 'travel_fund'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE `bk_expenses` ADD COLUMN `travel_fund` DECIMAL(12,2) DEFAULT 0.00',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'bk_expenses'
    AND COLUMN_NAME = 'cash_back'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE `bk_expenses` ADD COLUMN `cash_back` DECIMAL(12,2) DEFAULT 0.00',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
