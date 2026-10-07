-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 06, 2026 at 02:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `reileo_logistics_services`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` int(11) NOT NULL,
  `module` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `changes_made` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_client_cost`
--

CREATE TABLE `bk_client_cost` (
  `client_cost_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `client_rate` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `subcon_rate` decimal(12,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_destination`
--

CREATE TABLE `bk_destination` (
  `bk_destination_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `destination_id` int(11) NOT NULL,
  `stop_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_expenses`
--

CREATE TABLE `bk_expenses` (
  `booking_expenses_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `b_toll_fees` decimal(12,2) DEFAULT 0.00,
  `b_extra_drop` decimal(12,2) DEFAULT 0.00,
  `b_extra_helper` decimal(12,2) DEFAULT 0.00,
  `b_other_fees` decimal(12,2) DEFAULT 0.00,
  `nb_parking_fees` decimal(12,2) DEFAULT 0.00,
  `nb_toll_fees` decimal(12,2) DEFAULT 0.00,
  `nb_demurrage_fees` decimal(12,2) DEFAULT 0.00,
  `nb_backload_fees` decimal(12,2) DEFAULT 0.00,
  `nb_other_deductions` decimal(12,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_fuel_trip`
--

CREATE TABLE `bk_fuel_trip` (
  `bk_fuel_trip_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `charges` enum('NO CHARGES','CHARGES RECORDED') DEFAULT NULL,
  `trip_allowance` decimal(10,2) DEFAULT NULL,
  `fuel` decimal(10,2) DEFAULT NULL,
  `fuel_po` varchar(255) DEFAULT NULL,
  `fuel_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_items`
--

CREATE TABLE `bk_items` (
  `bk_items_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `item_type_id` int(11) DEFAULT NULL,
  `item_description` varchar(255) DEFAULT NULL,
  `length` decimal(10,2) DEFAULT NULL,
  `width` decimal(10,2) DEFAULT NULL,
  `height` decimal(10,2) DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_personnel_fee`
--

CREATE TABLE `bk_personnel_fee` (
  `personnel_fee_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `driver_rate` decimal(12,2) DEFAULT 0.00,
  `driver_allowance` decimal(12,2) DEFAULT 0.00,
  `helper_rate` decimal(12,2) DEFAULT 0.00,
  `helper_allowance` decimal(12,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_photos`
--

CREATE TABLE `bk_photos` (
  `bk_photos_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `photo_name` varchar(255) DEFAULT NULL,
  `photo_data` mediumblob DEFAULT NULL,
  `photo_type` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_references`
--

CREATE TABLE `bk_references` (
  `bk_references_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `client_ref_no` varchar(255) DEFAULT NULL,
  `other_ref_no` varchar(255) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bk_vehicles`
--

CREATE TABLE `bk_vehicles` (
  `bk_vehicle_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `plate_no` varchar(255) NOT NULL,
  `odometer` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL,
  `booking_no` varchar(50) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `booking_type_id` int(11) NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `delivered_datetime` datetime DEFAULT NULL,
  `received_datetime` datetime DEFAULT NULL,
  `depot_id` int(11) NOT NULL,
  `commodity_type_id` int(11) NOT NULL,
  `route_code` varchar(255) DEFAULT NULL,
  `trips_number` int(11) DEFAULT NULL,
  `drops_number` int(11) DEFAULT NULL,
  `origin_id` int(11) NOT NULL,
  `destination_id` int(11) DEFAULT NULL,
  `client_rate` decimal(10,2) DEFAULT NULL,
  `subcon_rate` decimal(10,2) DEFAULT NULL,
  `status_id` tinyint(4) NOT NULL,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_personnel`
--

CREATE TABLE `booking_personnel` (
  `booking_personnel_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `assignment_role` enum('driver','helper1','helper2') NOT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `allowance` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_statuses`
--

CREATE TABLE `booking_statuses` (
  `status_id` tinyint(4) NOT NULL,
  `status_name` varchar(50) NOT NULL,
  `sort_order` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_types`
--

CREATE TABLE `booking_types` (
  `booking_type_id` int(11) NOT NULL,
  `book_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `category_types`
--

CREATE TABLE `category_types` (
  `category_type_id` int(11) NOT NULL,
  `category_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commodity_type`
--

CREATE TABLE `commodity_type` (
  `commodity_type_id` int(11) NOT NULL,
  `commodity_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `c_email_id` int(11) NOT NULL,
  `address_one` text NOT NULL,
  `address_two` text DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `depot` varchar(255) DEFAULT NULL,
  `tin` varchar(100) DEFAULT NULL,
  `account_code` varchar(100) DEFAULT NULL,
  `rate_type` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `c_bank_info`
--

CREATE TABLE `c_bank_info` (
  `c_bank_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `depot_id` int(11) DEFAULT NULL,
  `tin` varchar(255) DEFAULT NULL,
  `account_code` varchar(255) DEFAULT NULL,
  `rate` enum('Special','Standard') DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `c_email`
--

CREATE TABLE `c_email` (
  `c_email_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `depots`
--

CREATE TABLE `depots` (
  `depot_id` int(11) NOT NULL,
  `depot_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `destination`
--

CREATE TABLE `destination` (
  `destination_id` int(11) NOT NULL,
  `destination_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dl_codes`
--

CREATE TABLE `dl_codes` (
  `dl_code_id` int(11) NOT NULL,
  `dl_code` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fuel_types`
--

CREATE TABLE `fuel_types` (
  `fuel_type_id` int(11) NOT NULL,
  `fuel_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_types`
--

CREATE TABLE `item_types` (
  `item_type_id` int(11) NOT NULL,
  `item_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `origin`
--

CREATE TABLE `origin` (
  `origin_id` int(11) NOT NULL,
  `origin_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personnel`
--

CREATE TABLE `personnel` (
  `personnel_id` int(11) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `p_email_id` int(11) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_benefits`
--

CREATE TABLE `p_benefits` (
  `p_benefits_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `philhealth_no` varchar(255) DEFAULT NULL,
  `sss_no` varchar(255) DEFAULT NULL,
  `tin_no` varchar(255) DEFAULT NULL,
  `pag_ibig_no` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_email`
--

CREATE TABLE `p_email` (
  `p_email_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_emergency`
--

CREATE TABLE `p_emergency` (
  `p_emergency_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_employment`
--

CREATE TABLE `p_employment` (
  `p_employment_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `personnel_type_id` int(11) NOT NULL,
  `employment_type` enum('Direct Hire','Outsourced') NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `employee_id_number` varchar(50) DEFAULT NULL,
  `depot_id` int(11) NOT NULL,
  `date_started` date DEFAULT NULL,
  `date_of_separation` date DEFAULT NULL,
  `reason_of_separation` text DEFAULT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `daily_rate` decimal(15,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_license`
--

CREATE TABLE `p_license` (
  `p_license_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `driver_license_no` varchar(255) NOT NULL,
  `license_expiry` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_license_dl_codes`
--

CREATE TABLE `p_license_dl_codes` (
  `p_license_id` int(11) NOT NULL,
  `dl_code_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `p_types`
--

CREATE TABLE `p_types` (
  `personnel_type_id` int(11) NOT NULL,
  `personnel_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reileo_logistics_services_users`
--

CREATE TABLE `reileo_logistics_services_users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','employee','customer') NOT NULL DEFAULT 'employee',
  `personnel_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reileo_logistics_services_users`
--

INSERT INTO `reileo_logistics_services_users` (`user_id`, `username`, `email`, `password_hash`, `role`, `personnel_id`, `customer_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@smartfleet.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL, NULL, 'Active', '2026-08-27 07:06:01', '2026-08-27 07:06:01'),
(2, 'employee', 'employee@smartfleet.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', NULL, NULL, 'Active', '2026-08-27 07:06:01', '2026-08-27 07:06:01'),
(3, 'customer', 'customer@smartfleet.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', NULL, NULL, 'Active', '2026-08-27 07:06:01', '2026-08-27 07:06:01');

-- --------------------------------------------------------

--
-- Table structure for table `tax_types`
--

CREATE TABLE `tax_types` (
  `tax_type_id` int(11) NOT NULL,
  `tax_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `vehicle_id` int(11) NOT NULL,
  `plate_no` varchar(255) NOT NULL,
  `body_no` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  `vehicle_type_id` int(11) NOT NULL,
  `vehicle_manufacturer_id` int(11) NOT NULL,
  `vehicle_model_id` int(11) NOT NULL,
  `year` year(4) DEFAULT NULL,
  `commodity_type_id` int(11) DEFAULT NULL,
  `asset_no` varchar(255) DEFAULT NULL,
  `category_type_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_statuses`
--

CREATE TABLE `vehicle_statuses` (
  `status_id` int(11) NOT NULL,
  `status_name` varchar(50) NOT NULL,
  `sort_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor`
--

CREATE TABLE `vendor` (
  `vendor_id` int(11) NOT NULL,
  `vendor_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `v_email_id` int(11) NOT NULL,
  `address_one` varchar(255) NOT NULL,
  `address_two` varchar(255) DEFAULT NULL,
  `owner_name` varchar(150) DEFAULT NULL,
  `owner_contact_no` varchar(50) DEFAULT NULL,
  `coordinator_name` varchar(150) DEFAULT NULL,
  `coordinator_contact_no` varchar(50) DEFAULT NULL,
  `term` varchar(100) DEFAULT NULL,
  `date_started` date DEFAULT NULL,
  `date_separated` date DEFAULT NULL,
  `vendor_type_id` int(11) NOT NULL,
  `tax_type_id` int(11) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_acquisition`
--

CREATE TABLE `vh_acquisition` (
  `vh_acquisition_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_price` decimal(15,2) DEFAULT NULL,
  `breakdown_date` date DEFAULT NULL,
  `breakdown_remarks` text DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_documents`
--

CREATE TABLE `vh_documents` (
  `vh_documents_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `document_name` varchar(255) DEFAULT NULL,
  `document_data` mediumblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_insurance`
--

CREATE TABLE `vh_insurance` (
  `vh_insurance_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `insurance_provider` varchar(255) DEFAULT NULL,
  `insurance_policy_no` varchar(255) DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `inland_marine_policy_no` varchar(255) DEFAULT NULL,
  `inland_marine_expiry` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_location`
--

CREATE TABLE `vh_location` (
  `vh_location_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `origin_id` int(11) DEFAULT NULL,
  `depot_id` int(11) DEFAULT NULL,
  `GPS` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_manufacturers`
--

CREATE TABLE `vh_manufacturers` (
  `vehicle_manufacturer_id` int(11) NOT NULL,
  `vehicle_manufacturer` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_models`
--

CREATE TABLE `vh_models` (
  `vehicle_model_id` int(11) NOT NULL,
  `vehicle_model` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_photos`
--

CREATE TABLE `vh_photos` (
  `vh_photos_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `photo_name` varchar(255) DEFAULT NULL,
  `photo_data` mediumblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_regist_compli`
--

CREATE TABLE `vh_regist_compli` (
  `vh_regist_compli_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `or_date` date DEFAULT NULL,
  `or_number` varchar(255) DEFAULT NULL,
  `cr_date` date DEFAULT NULL,
  `cr_number` varchar(255) DEFAULT NULL,
  `ltfrb_case_no` varchar(255) DEFAULT NULL,
  `ltfrb_expiry` date DEFAULT NULL,
  `mv_file_no` varchar(255) DEFAULT NULL,
  `pa_expiry` date DEFAULT NULL,
  `late_renewal_date` date DEFAULT NULL,
  `registration_type` enum('For Hire','Private') DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `rfid_type` enum('Auto Sweep','Easy Trip','None') DEFAULT NULL,
  `rfid_account_no` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_specifications`
--

CREATE TABLE `vh_specifications` (
  `vh_specifications_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `chassis_no` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `engine_no` varchar(255) DEFAULT NULL,
  `engine_size` varchar(255) DEFAULT NULL,
  `fuel_type` varchar(20) DEFAULT NULL,
  `transmission_type` enum('Manual','Automatic') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vh_types`
--

CREATE TABLE `vh_types` (
  `vehicle_type_id` int(11) NOT NULL,
  `vehicle_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `v_email`
--

CREATE TABLE `v_email` (
  `v_email_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `v_owner`
--

CREATE TABLE `v_owner` (
  `v_owner_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `owner_name` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `coordinator_name` varchar(100) NOT NULL,
  `coordinator_contact` varchar(20) NOT NULL,
  `term` varchar(255) DEFAULT NULL,
  `date_started` datetime DEFAULT NULL,
  `date_separated` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `v_types`
--

CREATE TABLE `v_types` (
  `vendor_type_id` int(11) NOT NULL,
  `vendor_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_audit_created_at` (`created_at`),
  ADD KEY `idx_audit_module` (`module`),
  ADD KEY `idx_audit_user` (`user_id`);

--
-- Indexes for table `bk_client_cost`
--
ALTER TABLE `bk_client_cost`
  ADD PRIMARY KEY (`client_cost_id`),
  ADD KEY `fk_client_cost_booking` (`booking_id`);

--
-- Indexes for table `bk_destination`
--
ALTER TABLE `bk_destination`
  ADD KEY `fk_booking_id_destination` (`booking_id`),
  ADD KEY `fk_destination_id_booking` (`destination_id`);

--
-- Indexes for table `bk_expenses`
--
ALTER TABLE `bk_expenses`
  ADD PRIMARY KEY (`booking_expenses_id`),
  ADD KEY `fk_booking_expenses_booking` (`booking_id`);

--
-- Indexes for table `bk_fuel_trip`
--
ALTER TABLE `bk_fuel_trip`
  ADD PRIMARY KEY (`bk_fuel_trip_id`);

--
-- Indexes for table `bk_items`
--
ALTER TABLE `bk_items`
  ADD PRIMARY KEY (`bk_items_id`),
  ADD KEY `fk_item_type_id` (`item_type_id`);

--
-- Indexes for table `bk_personnel_fee`
--
ALTER TABLE `bk_personnel_fee`
  ADD PRIMARY KEY (`personnel_fee_id`),
  ADD KEY `fk_personnel_fee_personnel` (`personnel_id`);

--
-- Indexes for table `bk_photos`
--
ALTER TABLE `bk_photos`
  ADD PRIMARY KEY (`bk_photos_id`);

--
-- Indexes for table `bk_references`
--
ALTER TABLE `bk_references`
  ADD PRIMARY KEY (`bk_references_id`);

--
-- Indexes for table `bk_vehicles`
--
ALTER TABLE `bk_vehicles`
  ADD PRIMARY KEY (`bk_vehicle_id`),
  ADD KEY `fk_booking_id` (`booking_id`),
  ADD KEY `fk_vehicle_id` (`vehicle_id`),
  ADD KEY `fk_bk_vendor_id` (`vendor_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `fk_booking_customer` (`customer_id`),
  ADD KEY `fk_booking_type` (`booking_type_id`),
  ADD KEY `fk_booking_depot` (`depot_id`),
  ADD KEY `fk_booking_commodity` (`commodity_type_id`),
  ADD KEY `fk_booking_origin` (`origin_id`),
  ADD KEY `fk_booking_destination` (`destination_id`),
  ADD KEY `fk_booking_status` (`status_id`);

--
-- Indexes for table `booking_personnel`
--
ALTER TABLE `booking_personnel`
  ADD PRIMARY KEY (`booking_personnel_id`),
  ADD KEY `fk_booking_personnel_booking` (`booking_id`),
  ADD KEY `fk_booking_personnel_personnel` (`personnel_id`);

--
-- Indexes for table `booking_statuses`
--
ALTER TABLE `booking_statuses`
  ADD PRIMARY KEY (`status_id`);

--
-- Indexes for table `booking_types`
--
ALTER TABLE `booking_types`
  ADD PRIMARY KEY (`booking_type_id`);

--
-- Indexes for table `category_types`
--
ALTER TABLE `category_types`
  ADD PRIMARY KEY (`category_type_id`);

--
-- Indexes for table `commodity_type`
--
ALTER TABLE `commodity_type`
  ADD PRIMARY KEY (`commodity_type_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `fk_customer_email` (`c_email_id`);

--
-- Indexes for table `c_bank_info`
--
ALTER TABLE `c_bank_info`
  ADD PRIMARY KEY (`c_bank_id`),
  ADD KEY `fk_bank_customer` (`customer_id`),
  ADD KEY `fk_bank_depot` (`depot_id`);

--
-- Indexes for table `c_email`
--
ALTER TABLE `c_email`
  ADD PRIMARY KEY (`c_email_id`);

--
-- Indexes for table `depots`
--
ALTER TABLE `depots`
  ADD PRIMARY KEY (`depot_id`);

--
-- Indexes for table `destination`
--
ALTER TABLE `destination`
  ADD PRIMARY KEY (`destination_id`);

--
-- Indexes for table `dl_codes`
--
ALTER TABLE `dl_codes`
  ADD PRIMARY KEY (`dl_code_id`);

--
-- Indexes for table `fuel_types`
--
ALTER TABLE `fuel_types`
  ADD PRIMARY KEY (`fuel_type_id`);

--
-- Indexes for table `item_types`
--
ALTER TABLE `item_types`
  ADD PRIMARY KEY (`item_type_id`);

--
-- Indexes for table `origin`
--
ALTER TABLE `origin`
  ADD PRIMARY KEY (`origin_id`);

--
-- Indexes for table `personnel`
--
ALTER TABLE `personnel`
  ADD PRIMARY KEY (`personnel_id`),
  ADD KEY `fk_personnel_email` (`p_email_id`);

--
-- Indexes for table `p_benefits`
--
ALTER TABLE `p_benefits`
  ADD PRIMARY KEY (`p_benefits_id`),
  ADD KEY `fk_benefits_personnel` (`personnel_id`);

--
-- Indexes for table `p_email`
--
ALTER TABLE `p_email`
  ADD PRIMARY KEY (`p_email_id`);

--
-- Indexes for table `p_emergency`
--
ALTER TABLE `p_emergency`
  ADD PRIMARY KEY (`p_emergency_id`),
  ADD KEY `fk_emergency_personnel` (`personnel_id`);

--
-- Indexes for table `p_employment`
--
ALTER TABLE `p_employment`
  ADD PRIMARY KEY (`p_employment_id`),
  ADD KEY `fk_employment_personnel` (`personnel_id`),
  ADD KEY `fk_employment_personnel_type` (`personnel_type_id`),
  ADD KEY `fk_employment_vendor` (`vendor_id`),
  ADD KEY `fk_employment_depot` (`depot_id`);

--
-- Indexes for table `p_license`
--
ALTER TABLE `p_license`
  ADD PRIMARY KEY (`p_license_id`),
  ADD KEY `fk_license_personnel` (`personnel_id`);

--
-- Indexes for table `p_license_dl_codes`
--
ALTER TABLE `p_license_dl_codes`
  ADD PRIMARY KEY (`p_license_id`,`dl_code_id`),
  ADD KEY `fk_license_dl_code` (`dl_code_id`);

--
-- Indexes for table `p_types`
--
ALTER TABLE `p_types`
  ADD PRIMARY KEY (`personnel_type_id`);

--
-- Indexes for table `reileo_logistics_services_users`
--
ALTER TABLE `reileo_logistics_services_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_personnel` (`personnel_id`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Indexes for table `tax_types`
--
ALTER TABLE `tax_types`
  ADD PRIMARY KEY (`tax_type_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD KEY `fk_vehicle_type` (`vehicle_type_id`),
  ADD KEY `fk_vehicle_maker` (`vehicle_manufacturer_id`),
  ADD KEY `fk_vehicle_model` (`vehicle_model_id`),
  ADD KEY `fk_commodity_type` (`commodity_type_id`),
  ADD KEY `fk_category_type` (`category_type_id`),
  ADD KEY `fk_vendor_id` (`vendor_id`),
  ADD KEY `fk_status` (`status_id`);

--
-- Indexes for table `vehicle_statuses`
--
ALTER TABLE `vehicle_statuses`
  ADD PRIMARY KEY (`status_id`);

--
-- Indexes for table `vendor`
--
ALTER TABLE `vendor`
  ADD PRIMARY KEY (`vendor_id`),
  ADD KEY `fk_vendor_email` (`v_email_id`),
  ADD KEY `fk_vendor_type` (`vendor_type_id`),
  ADD KEY `fk_vendor_tax` (`tax_type_id`);

--
-- Indexes for table `vh_acquisition`
--
ALTER TABLE `vh_acquisition`
  ADD PRIMARY KEY (`vh_acquisition_id`),
  ADD KEY `fk_acquisition_vehicle` (`vehicle_id`);

--
-- Indexes for table `vh_documents`
--
ALTER TABLE `vh_documents`
  ADD PRIMARY KEY (`vh_documents_id`),
  ADD KEY `fk_documents_vehicle` (`vehicle_id`);

--
-- Indexes for table `vh_insurance`
--
ALTER TABLE `vh_insurance`
  ADD PRIMARY KEY (`vh_insurance_id`),
  ADD KEY `fk_insurance_vehicle` (`vehicle_id`);

--
-- Indexes for table `vh_location`
--
ALTER TABLE `vh_location`
  ADD PRIMARY KEY (`vh_location_id`),
  ADD KEY `fk_location_vehicle` (`vehicle_id`),
  ADD KEY `fk_location_origin` (`origin_id`),
  ADD KEY `fk_location_depot` (`depot_id`);

--
-- Indexes for table `vh_manufacturers`
--
ALTER TABLE `vh_manufacturers`
  ADD PRIMARY KEY (`vehicle_manufacturer_id`);

--
-- Indexes for table `vh_models`
--
ALTER TABLE `vh_models`
  ADD PRIMARY KEY (`vehicle_model_id`);

--
-- Indexes for table `vh_photos`
--
ALTER TABLE `vh_photos`
  ADD PRIMARY KEY (`vh_photos_id`),
  ADD KEY `fk_photos_vehicle` (`vehicle_id`);

--
-- Indexes for table `vh_regist_compli`
--
ALTER TABLE `vh_regist_compli`
  ADD PRIMARY KEY (`vh_regist_compli_id`),
  ADD KEY `fk_regist_vehicle` (`vehicle_id`);

--
-- Indexes for table `vh_specifications`
--
ALTER TABLE `vh_specifications`
  ADD PRIMARY KEY (`vh_specifications_id`),
  ADD KEY `fk_specifications_vehicle` (`vehicle_id`);

--
-- Indexes for table `vh_types`
--
ALTER TABLE `vh_types`
  ADD PRIMARY KEY (`vehicle_type_id`);

--
-- Indexes for table `v_email`
--
ALTER TABLE `v_email`
  ADD PRIMARY KEY (`v_email_id`);

--
-- Indexes for table `v_owner`
--
ALTER TABLE `v_owner`
  ADD PRIMARY KEY (`v_owner_id`),
  ADD KEY `fk_owner_vendor` (`vendor_id`);

--
-- Indexes for table `v_types`
--
ALTER TABLE `v_types`
  ADD PRIMARY KEY (`vendor_type_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_client_cost`
--
ALTER TABLE `bk_client_cost`
  MODIFY `client_cost_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_expenses`
--
ALTER TABLE `bk_expenses`
  MODIFY `booking_expenses_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_fuel_trip`
--
ALTER TABLE `bk_fuel_trip`
  MODIFY `bk_fuel_trip_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_items`
--
ALTER TABLE `bk_items`
  MODIFY `bk_items_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_personnel_fee`
--
ALTER TABLE `bk_personnel_fee`
  MODIFY `personnel_fee_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_photos`
--
ALTER TABLE `bk_photos`
  MODIFY `bk_photos_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_references`
--
ALTER TABLE `bk_references`
  MODIFY `bk_references_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_vehicles`
--
ALTER TABLE `bk_vehicles`
  MODIFY `bk_vehicle_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_personnel`
--
ALTER TABLE `booking_personnel`
  MODIFY `booking_personnel_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_statuses`
--
ALTER TABLE `booking_statuses`
  MODIFY `status_id` tinyint(4) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_types`
--
ALTER TABLE `booking_types`
  MODIFY `booking_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `category_types`
--
ALTER TABLE `category_types`
  MODIFY `category_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `commodity_type`
--
ALTER TABLE `commodity_type`
  MODIFY `commodity_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c_bank_info`
--
ALTER TABLE `c_bank_info`
  MODIFY `c_bank_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c_email`
--
ALTER TABLE `c_email`
  MODIFY `c_email_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `depots`
--
ALTER TABLE `depots`
  MODIFY `depot_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `destination`
--
ALTER TABLE `destination`
  MODIFY `destination_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dl_codes`
--
ALTER TABLE `dl_codes`
  MODIFY `dl_code_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fuel_types`
--
ALTER TABLE `fuel_types`
  MODIFY `fuel_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_types`
--
ALTER TABLE `item_types`
  MODIFY `item_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `origin`
--
ALTER TABLE `origin`
  MODIFY `origin_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personnel`
--
ALTER TABLE `personnel`
  MODIFY `personnel_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_benefits`
--
ALTER TABLE `p_benefits`
  MODIFY `p_benefits_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_email`
--
ALTER TABLE `p_email`
  MODIFY `p_email_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_emergency`
--
ALTER TABLE `p_emergency`
  MODIFY `p_emergency_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_employment`
--
ALTER TABLE `p_employment`
  MODIFY `p_employment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_license`
--
ALTER TABLE `p_license`
  MODIFY `p_license_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_types`
--
ALTER TABLE `p_types`
  MODIFY `personnel_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reileo_logistics_services_users`
--
ALTER TABLE `reileo_logistics_services_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tax_types`
--
ALTER TABLE `tax_types`
  MODIFY `tax_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicle_statuses`
--
ALTER TABLE `vehicle_statuses`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vendor`
--
ALTER TABLE `vendor`
  MODIFY `vendor_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_acquisition`
--
ALTER TABLE `vh_acquisition`
  MODIFY `vh_acquisition_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_documents`
--
ALTER TABLE `vh_documents`
  MODIFY `vh_documents_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_insurance`
--
ALTER TABLE `vh_insurance`
  MODIFY `vh_insurance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_location`
--
ALTER TABLE `vh_location`
  MODIFY `vh_location_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_manufacturers`
--
ALTER TABLE `vh_manufacturers`
  MODIFY `vehicle_manufacturer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_models`
--
ALTER TABLE `vh_models`
  MODIFY `vehicle_model_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_photos`
--
ALTER TABLE `vh_photos`
  MODIFY `vh_photos_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_regist_compli`
--
ALTER TABLE `vh_regist_compli`
  MODIFY `vh_regist_compli_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_specifications`
--
ALTER TABLE `vh_specifications`
  MODIFY `vh_specifications_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_types`
--
ALTER TABLE `vh_types`
  MODIFY `vehicle_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `v_email`
--
ALTER TABLE `v_email`
  MODIFY `v_email_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `v_owner`
--
ALTER TABLE `v_owner`
  MODIFY `v_owner_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `v_types`
--
ALTER TABLE `v_types`
  MODIFY `vendor_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bk_client_cost`
--
ALTER TABLE `bk_client_cost`
  ADD CONSTRAINT `fk_client_cost_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bk_destination`
--
ALTER TABLE `bk_destination`
  ADD CONSTRAINT `fk_booking_id_destination` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  ADD CONSTRAINT `fk_destination_id_booking` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`destination_id`);

--
-- Constraints for table `bk_expenses`
--
ALTER TABLE `bk_expenses`
  ADD CONSTRAINT `fk_booking_expenses_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bk_items`
--
ALTER TABLE `bk_items`
  ADD CONSTRAINT `fk_item_type_id` FOREIGN KEY (`item_type_id`) REFERENCES `item_types` (`item_type_id`);

--
-- Constraints for table `bk_personnel_fee`
--
ALTER TABLE `bk_personnel_fee`
  ADD CONSTRAINT `fk_personnel_fee_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bk_vehicles`
--
ALTER TABLE `bk_vehicles`
  ADD CONSTRAINT `fk_bk_vendor_id` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`vendor_id`),
  ADD CONSTRAINT `fk_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  ADD CONSTRAINT `fk_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_booking_commodity` FOREIGN KEY (`commodity_type_id`) REFERENCES `commodity_type` (`commodity_type_id`),
  ADD CONSTRAINT `fk_booking_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  ADD CONSTRAINT `fk_booking_depot` FOREIGN KEY (`depot_id`) REFERENCES `depots` (`depot_id`),
  ADD CONSTRAINT `fk_booking_destination` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`destination_id`),
  ADD CONSTRAINT `fk_booking_origin` FOREIGN KEY (`origin_id`) REFERENCES `origin` (`origin_id`),
  ADD CONSTRAINT `fk_booking_status` FOREIGN KEY (`status_id`) REFERENCES `booking_statuses` (`status_id`),
  ADD CONSTRAINT `fk_booking_type` FOREIGN KEY (`booking_type_id`) REFERENCES `booking_types` (`booking_type_id`);

--
-- Constraints for table `booking_personnel`
--
ALTER TABLE `booking_personnel`
  ADD CONSTRAINT `fk_booking_personnel_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_booking_personnel_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`);

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_customer_email` FOREIGN KEY (`c_email_id`) REFERENCES `c_email` (`c_email_id`);

--
-- Constraints for table `c_bank_info`
--
ALTER TABLE `c_bank_info`
  ADD CONSTRAINT `fk_bank_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  ADD CONSTRAINT `fk_bank_depot` FOREIGN KEY (`depot_id`) REFERENCES `depots` (`depot_id`);

--
-- Constraints for table `personnel`
--
ALTER TABLE `personnel`
  ADD CONSTRAINT `fk_personnel_email` FOREIGN KEY (`p_email_id`) REFERENCES `p_email` (`p_email_id`);

--
-- Constraints for table `p_benefits`
--
ALTER TABLE `p_benefits`
  ADD CONSTRAINT `fk_benefits_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`);

--
-- Constraints for table `p_emergency`
--
ALTER TABLE `p_emergency`
  ADD CONSTRAINT `fk_emergency_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`);

--
-- Constraints for table `p_employment`
--
ALTER TABLE `p_employment`
  ADD CONSTRAINT `fk_employment_depot` FOREIGN KEY (`depot_id`) REFERENCES `depots` (`depot_id`),
  ADD CONSTRAINT `fk_employment_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`),
  ADD CONSTRAINT `fk_employment_personnel_type` FOREIGN KEY (`personnel_type_id`) REFERENCES `p_types` (`personnel_type_id`),
  ADD CONSTRAINT `fk_employment_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`vendor_id`);

--
-- Constraints for table `p_license`
--
ALTER TABLE `p_license`
  ADD CONSTRAINT `fk_license_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`);

--
-- Constraints for table `p_license_dl_codes`
--
ALTER TABLE `p_license_dl_codes`
  ADD CONSTRAINT `fk_license_dl_code` FOREIGN KEY (`dl_code_id`) REFERENCES `dl_codes` (`dl_code_id`),
  ADD CONSTRAINT `fk_license_dl_license` FOREIGN KEY (`p_license_id`) REFERENCES `p_license` (`p_license_id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_category_type` FOREIGN KEY (`category_type_id`) REFERENCES `category_types` (`category_type_id`),
  ADD CONSTRAINT `fk_commodity_type` FOREIGN KEY (`commodity_type_id`) REFERENCES `commodity_type` (`commodity_type_id`),
  ADD CONSTRAINT `fk_status` FOREIGN KEY (`status_id`) REFERENCES `vehicle_statuses` (`status_id`),
  ADD CONSTRAINT `fk_vehicle_maker` FOREIGN KEY (`vehicle_manufacturer_id`) REFERENCES `vh_manufacturers` (`vehicle_manufacturer_id`),
  ADD CONSTRAINT `fk_vehicle_model` FOREIGN KEY (`vehicle_model_id`) REFERENCES `vh_models` (`vehicle_model_id`),
  ADD CONSTRAINT `fk_vehicle_type` FOREIGN KEY (`vehicle_type_id`) REFERENCES `vh_types` (`vehicle_type_id`),
  ADD CONSTRAINT `fk_vendor_id` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`vendor_id`);

--
-- Constraints for table `vendor`
--
ALTER TABLE `vendor`
  ADD CONSTRAINT `fk_vendor_email` FOREIGN KEY (`v_email_id`) REFERENCES `v_email` (`v_email_id`),
  ADD CONSTRAINT `fk_vendor_tax` FOREIGN KEY (`tax_type_id`) REFERENCES `tax_types` (`tax_type_id`),
  ADD CONSTRAINT `fk_vendor_type` FOREIGN KEY (`vendor_type_id`) REFERENCES `v_types` (`vendor_type_id`);

--
-- Constraints for table `vh_acquisition`
--
ALTER TABLE `vh_acquisition`
  ADD CONSTRAINT `fk_acquisition_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `vh_documents`
--
ALTER TABLE `vh_documents`
  ADD CONSTRAINT `fk_documents_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `vh_insurance`
--
ALTER TABLE `vh_insurance`
  ADD CONSTRAINT `fk_insurance_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `vh_location`
--
ALTER TABLE `vh_location`
  ADD CONSTRAINT `fk_location_depot` FOREIGN KEY (`depot_id`) REFERENCES `depots` (`depot_id`),
  ADD CONSTRAINT `fk_location_origin` FOREIGN KEY (`origin_id`) REFERENCES `origin` (`origin_id`),
  ADD CONSTRAINT `fk_location_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `vh_photos`
--
ALTER TABLE `vh_photos`
  ADD CONSTRAINT `fk_photos_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `vh_regist_compli`
--
ALTER TABLE `vh_regist_compli`
  ADD CONSTRAINT `fk_regist_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `vh_specifications`
--
ALTER TABLE `vh_specifications`
  ADD CONSTRAINT `fk_specifications_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `v_owner`
--
ALTER TABLE `v_owner`
  ADD CONSTRAINT `fk_owner_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`vendor_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
