-- ========================================================
--  Reileo Logistics Services DB Setup - Users table + Login System
--  Database: reileo_logistics_services
--  Run this in phpMyAdmin or MySQL CLI once
-- ========================================================

USE `reileo_logistics_services`;

-- --------------------------------------------------------
--  1. Users table (for login/auth)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `reileo_logistics_services_users`;
CREATE TABLE `reileo_logistics_services_users` (
  `user_id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','employee','customer') NOT NULL DEFAULT 'employee',
  `personnel_id` INT(11) NULL,
  `customer_id` INT(11) NULL,
  `status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_personnel` (`personnel_id`),
  KEY `idx_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
--  2. Seed default admin user
--     Username: admin   |  Password: admin123
-- --------------------------------------------------------
INSERT INTO `reileo_logistics_services_users`
  (`username`, `email`, `password_hash`, `role`, `status`)
VALUES
  ('admin', 'admin@smartfleet.local',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin', 'Active');
-- NOTE: The hash above is bcrypt for "password". After first login you can
-- change it via the PHP hash_update_password.php utility (bottom of this file).

INSERT INTO `reileo_logistics_services_users`
  (`username`, `email`, `password_hash`, `role`, `status`)
VALUES
  ('employee', 'employee@smartfleet.local',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'employee', 'Active'),
  ('customer', 'customer@smartfleet.local',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'customer', 'Active');

--  hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi = "password"
--  Default credentials:
--    admin   / password
--    employee / password
--    customer / password
