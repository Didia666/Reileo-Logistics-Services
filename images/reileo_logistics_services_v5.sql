-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 23, 2026 at 08:20 PM
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

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`log_id`, `module`, `action`, `reference`, `changes_made`, `user_id`, `username`, `created_at`) VALUES
(1, 'bookings', 'update', '21', '{\"booking_info\":{\"customer_id\":5,\"booking_type_id\":8,\"delivery_date\":\"2026-09-18\",\"depot_id\":4,\"commodity_type_id\":7,\"route_code\":\"123456\",\"trips_number\":12,\"drops_number\":12,\"origin_id\":1,\"destination_id\":2},\"vehicle_assignment\":{\"vehicle_id\":20,\"plate_no\":\"FRODRY123\",\"vehicle_type_id\":2,\"commodity_type_id\":7,\"vendor_id\":null},\"fueltrip_allowance\":{\"area\":\"Makati\",\"trip_allowance\":\"1000.00\",\"fuel\":50,\"fuel_po\":12,\"fuel_amount\":null},\"personnel_assignment\":{\"driver_id\":2,\"driver_source\":\"direct\",\"driver_vendor_id\":null,\"helper1_id\":6,\"helper1_source\":\"direct\",\"helper1_vendor_id\":null,\"helper2_id\":4,\"helper2_source\":\"direct\",\"helper2_vendor_id\":null,\"driver_included_h1\":false,\"driver_included_h2\":false},\"references\":{\"client_ref_no\":null,\"other_ref_no\":null,\"remarks\":null},\"item_details\":[{\"item_type_id\":4,\"item_description\":\"High Quality\",\"length\":\"50.00\",\"width\":\"50.00\",\"height\":\"50.00\",\"weight\":\"100.00\"}],\"bk_photos\":[]}', 1, 'admin', '2026-09-16 06:34:32'),
(2, 'auth', 'logout', 'admin', NULL, 1, 'admin', '2026-09-16 06:39:11'),
(3, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-16 06:39:17'),
(4, 'auth', 'logout', 'admin', NULL, 1, 'admin', '2026-09-16 08:53:37'),
(5, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-16 08:53:42'),
(6, 'vendors', 'create', NULL, '{\"vendor_name\":\"LiwayLogistics\",\"contact_number\":\"09614662426\",\"email_address\":\"Liway@gmail.com\",\"address_1\":\"Ramon Jabson\",\"address_2\":\"\",\"owner_name\":\"Lhea\",\"owner_contact_no\":\"09614662426\",\"coordinator_name\":\"Nicole\",\"coordinator_contact_no\":\"0919289345\",\"vendor_type\":\"Supplier\",\"tax_type\":\"Non-VAT\",\"term\":\"1\",\"date_started\":\"2026-09-17\",\"date_separated\":\"2026-12-16\",\"status\":\"Active\"}', 1, 'admin', '2026-09-16 09:50:08'),
(7, 'v_types', 'create', NULL, '{\"name\":\"VENDOR\",\"status\":\"Active\"}', 1, 'admin', '2026-09-16 10:06:08'),
(8, 'v_types', 'create', NULL, '{\"name\":\"MANPOWER\",\"status\":\"Active\"}', 1, 'admin', '2026-09-16 10:06:34'),
(9, 'v_types', 'create', NULL, '{\"name\":\"TRUCKER\",\"status\":\"Active\"}', 1, 'admin', '2026-09-16 10:06:44'),
(10, 'vendors', 'create', NULL, '{\"vendor_name\":\"LiwayLogistics\",\"contact_number\":\"09614662426\",\"email_address\":\"Liway@gmail.com\",\"address_one\":\"Ramon Jabson\",\"address_two\":\"\",\"owner_name\":\"Liwayway Ruiz\",\"owner_contact_no\":\"09614662426\",\"coordinator_name\":\"Nicole Cruz\",\"coordinator_contact_no\":\"09192939495\",\"term\":\"4\",\"date_started\":\"2026-09-17\",\"date_separated\":\"2026-10-07\",\"vendor_type_id\":3,\"tax_type_id\":2,\"status\":\"Active\"}', 1, 'admin', '2026-09-16 10:15:45'),
(11, 'vendors', 'update', '1', '{\"vendor_name\":\"LiwayLogisticss\",\"contact_number\":\"09614662426\",\"email_address\":\"Liway@gmail.com\",\"address_one\":\"Ramon Jabson\",\"address_two\":\"\",\"owner_name\":\"Liwayway Ruiz\",\"owner_contact_no\":\"09614662426\",\"coordinator_name\":\"Nicole Cruz\",\"coordinator_contact_no\":\"09192939495\",\"term\":\"4\",\"date_started\":\"2026-09-17\",\"date_separated\":\"2026-10-07\",\"vendor_type_id\":3,\"tax_type_id\":2,\"status\":\"Active\"}', 1, 'admin', '2026-09-16 10:17:07'),
(12, 'vehicles', 'create', '23', '{\"vehicle_info\":{\"plate_no\":\"UIO-789\",\"body_no\":\"34567\",\"status_id\":1,\"vehicle_type_id\":3,\"vehicle_manufacturer_id\":1,\"vehicle_model_id\":2,\"year_model\":\"2019\",\"commodity_type_id\":4,\"asset_no\":\"54567\",\"category_type_id\":3},\"vehicle_location\":{\"vendor_id\":1,\"origin_id\":1,\"depot_id\":2,\"GPS\":\"1\"},\"vehicle_specifications\":{\"chassis_no\":null,\"color\":null,\"engine_no\":null,\"engine_size\":null,\"fuel_type\":null,\"transmission\":null},\"vehicle_regist_compli\":{\"or_date\":null,\"or_number\":null,\"cr_date\":null,\"cr_number\":null,\"ltfrb_case_no\":null,\"ltfrb_expiry\":null,\"mv_file_no\":null,\"pa_expiry\":null,\"late_renewal_date\":null,\"registration_type\":null,\"registration_date\":null,\"rfid_type\":null,\"rfid_account_no\":null},\"vehicle_insurance\":{\"insurance_provider\":null,\"insurance_policy_no\":null,\"insurance_expiry\":null,\"inland_marine_policy_no\":null,\"inland_marine_expiry\":null},\"vehicle_acquisition\":{\"acquisition_date\":null,\"acquisition_price\":null,\"breakdown_date\":null,\"breakdown_remarks\":null,\"remarks\":null},\"vh_documents\":[],\"vh_photos\":[]}', 1, 'admin', '2026-09-16 10:22:13'),
(13, 'vehicles', 'update', '2', '{\"vehicle_info\":{\"plate_no\":\"1231245\",\"body_no\":\"12315\",\"status_id\":1,\"vehicle_type_id\":2,\"vehicle_manufacturer_id\":1,\"vehicle_model_id\":2,\"year_model\":\"0000\",\"commodity_type_id\":6,\"asset_no\":null,\"category_type_id\":3},\"vehicle_location\":{\"vendor_id\":1,\"origin_id\":1,\"depot_id\":3,\"GPS\":\"1\"},\"vehicle_specifications\":{\"chassis_no\":null,\"color\":null,\"engine_no\":null,\"engine_size\":null,\"fuel_type\":null,\"transmission\":null},\"vehicle_regist_compli\":{\"or_date\":\"0000-00-00\",\"or_number\":null,\"cr_date\":\"0000-00-00\",\"cr_number\":null,\"ltfrb_case_no\":null,\"ltfrb_expiry\":\"0000-00-00\",\"mv_file_no\":null,\"pa_expiry\":\"0000-00-00\",\"late_renewal_date\":\"0000-00-00\",\"registration_type\":null,\"registration_date\":\"0000-00-00\",\"rfid_type\":null,\"rfid_account_no\":null},\"vehicle_insurance\":{\"insurance_provider\":null,\"insurance_policy_no\":null,\"insurance_expiry\":\"0000-00-00\",\"inland_marine_policy_no\":null,\"inland_marine_expiry\":\"0000-00-00\"},\"vehicle_acquisition\":{\"acquisition_date\":\"0000-00-00\",\"acquisition_price\":\"0.00\",\"breakdown_date\":\"0000-00-00\",\"breakdown_remarks\":null,\"remarks\":null},\"vh_documents\":[],\"vh_photos\":[]}', 1, 'admin', '2026-09-16 10:22:43'),
(14, 'vehicles', 'update', '14', '{\"vehicle_info\":{\"plate_no\":\"DEMO123\",\"body_no\":\"123456\",\"status_id\":1,\"vehicle_type_id\":2,\"vehicle_manufacturer_id\":1,\"vehicle_model_id\":2,\"year_model\":\"2020\",\"commodity_type_id\":6,\"asset_no\":\"123456\",\"category_type_id\":3},\"vehicle_location\":{\"vendor_id\":1,\"origin_id\":1,\"depot_id\":3,\"GPS\":\"1\"},\"vehicle_specifications\":{\"chassis_no\":null,\"color\":null,\"engine_no\":null,\"engine_size\":null,\"fuel_type\":null,\"transmission\":null},\"vehicle_regist_compli\":{\"or_date\":\"0000-00-00\",\"or_number\":null,\"cr_date\":\"0000-00-00\",\"cr_number\":null,\"ltfrb_case_no\":null,\"ltfrb_expiry\":\"0000-00-00\",\"mv_file_no\":null,\"pa_expiry\":\"0000-00-00\",\"late_renewal_date\":\"0000-00-00\",\"registration_type\":null,\"registration_date\":\"0000-00-00\",\"rfid_type\":null,\"rfid_account_no\":null},\"vehicle_insurance\":{\"insurance_provider\":null,\"insurance_policy_no\":null,\"insurance_expiry\":\"0000-00-00\",\"inland_marine_policy_no\":null,\"inland_marine_expiry\":\"0000-00-00\"},\"vehicle_acquisition\":{\"acquisition_date\":\"0000-00-00\",\"acquisition_price\":\"0.00\",\"breakdown_date\":\"0000-00-00\",\"breakdown_remarks\":null,\"remarks\":null},\"vh_documents\":[],\"vh_photos\":[]}', 1, 'admin', '2026-09-16 10:24:02'),
(15, 'vehicles', 'update', '1', '{\"vehicle_info\":{\"plate_no\":\"62DEMO\",\"body_no\":\"123\",\"status_id\":1,\"vehicle_type_id\":1,\"vehicle_manufacturer_id\":1,\"vehicle_model_id\":1,\"year_model\":\"2017\",\"commodity_type_id\":null,\"asset_no\":\"123\",\"category_type_id\":null},\"vehicle_location\":{\"vendor_id\":null,\"origin_id\":1,\"depot_id\":3,\"GPS\":\"0\"},\"vehicle_specifications\":{\"chassis_no\":null,\"color\":null,\"engine_no\":null,\"engine_size\":null,\"fuel_type\":null,\"transmission\":null},\"vehicle_regist_compli\":{\"or_date\":\"0000-00-00\",\"or_number\":null,\"cr_date\":\"0000-00-00\",\"cr_number\":null,\"ltfrb_case_no\":null,\"ltfrb_expiry\":\"0000-00-00\",\"mv_file_no\":null,\"pa_expiry\":\"0000-00-00\",\"late_renewal_date\":\"0000-00-00\",\"registration_type\":null,\"registration_date\":\"0000-00-00\",\"rfid_type\":null,\"rfid_account_no\":null},\"vehicle_insurance\":{\"insurance_provider\":null,\"insurance_policy_no\":null,\"insurance_expiry\":\"0000-00-00\",\"inland_marine_policy_no\":null,\"inland_marine_expiry\":\"0000-00-00\"},\"vehicle_acquisition\":{\"acquisition_date\":\"0000-00-00\",\"acquisition_price\":\"0.00\",\"breakdown_date\":\"0000-00-00\",\"breakdown_remarks\":null,\"remarks\":null},\"vh_documents\":[],\"vh_photos\":[]}', 1, 'admin', '2026-09-16 10:27:06'),
(16, 'bookings', 'approve', '21', NULL, 1, 'admin', '2026-09-16 14:46:52'),
(17, 'bookings', 'dispatch', '21', NULL, 1, 'admin', '2026-09-16 14:47:07'),
(18, 'bookings', 'deliver', '21', '{\"delivered_at\":\"2026-09-16T06:56\",\"received_at\":\"2026-09-16T06:56\",\"odometer\":\"45230.4\",\"farthest_destination\":\"Tagaytay\",\"client_rate\":\"3000\",\"trips\":\"5\",\"subcon_rate\":\"0\",\"remarks\":\"good job\",\"client_ref_no\":\"876543456\",\"charges\":\"Non-Billable\",\"fuel_liters\":\"5\",\"fuel_amount\":\"5000\",\"fuel_po\":\"987654345\",\"toll_fees\":\"0.01\",\"extra_drop\":\"0.02\",\"extra_helper\":\"0.03\",\"other_expenses\":\"0.04\",\"parking_fees\":\"0.05\",\"toll_fees_non_billable\":\"0.06\",\"demurrage_fees\":\"0.07\",\"backload_fees\":\"0.08\",\"other_deductions\":\"0.09\"}', 1, 'admin', '2026-09-16 14:58:09'),
(19, 'bookings', 'approve', '20', NULL, 1, 'admin', '2026-09-16 15:00:34'),
(20, 'bookings', 'dispatch', '20', NULL, 1, 'admin', '2026-09-16 15:00:41'),
(21, 'bookings', 'approve', '19', NULL, 1, 'admin', '2026-09-16 15:07:08'),
(22, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-21 19:39:09'),
(23, 'bookings', 'dispatch', '19', NULL, 1, 'admin', '2026-09-21 19:48:35'),
(24, 'bookings', 'complete', '21', NULL, 1, 'admin', '2026-09-21 19:53:01'),
(25, 'customers', 'create', NULL, '{\"customer_name\":\"Tess Cruz\",\"contact_number\":\"09192939495\",\"email\":\"Tess@gmail.com\",\"address_one\":\"Ramon Jabson\",\"address_two\":\"\",\"contact_person\":\"Snow Cruz\",\"depot_id\":4,\"tin\":\"2356369754\",\"account_code\":\"2345677654\",\"rate_type\":\"Special\",\"status\":\"Active\"}', 1, 'admin', '2026-09-21 20:00:52'),
(26, 'personnel', 'create', '8', '{\"last_name\":\"Pascua\",\"first_name\":\"Antonio\",\"middle_name\":\"Cruz\",\"address\":\"123\",\"contact_number\":null,\"email\":null,\"birthdate\":null,\"gender\":\"Male\",\"status\":\"Active\",\"employment\":{\"personnel_type_id\":2,\"employment_type\":\"Outsourced\",\"vendor_id\":1,\"depot_id\":3,\"employee_id_number\":null,\"date_started\":null,\"date_of_separation\":null,\"reason_of_separation\":null,\"bank_account\":null,\"daily_rate\":0,\"remarks\":null},\"benefits\":{\"philhealth_no\":null,\"sss_no\":null,\"tin_no\":null,\"pag_ibig_no\":null},\"emergency\":{\"contact_person\":null,\"contact_number\":null},\"license\":{\"driver_license_no\":null,\"license_expiry\":null},\"dl_code_ids\":[]}', 1, 'admin', '2026-09-21 20:09:34'),
(27, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-21 20:36:17'),
(28, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-22 14:10:09'),
(29, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-22 18:17:27'),
(30, 'bookings', 'deliver', '20', '{\"fueltrip_allowance\":{\"trip_allowance\":null,\"fuel\":null,\"fuel_po\":null,\"fuel_amount\":null}}', 1, 'admin', '2026-09-22 18:28:07'),
(31, 'auth', 'login', 'admin', NULL, 1, 'admin', '2026-09-22 23:21:34'),
(32, 'bookings', 'update', '20', '{\"booking_info\":{\"customer_id\":5,\"booking_type_id\":4,\"delivery_date\":\"2026-09-17\",\"depot_id\":3,\"commodity_type_id\":4,\"route_code\":null,\"trips_number\":null,\"drops_number\":null,\"origin_id\":1,\"destination_id\":null},\"vehicle_assignment\":{\"vehicle_id\":19,\"plate_no\":\"FRO123\",\"vehicle_type_id\":2,\"commodity_type_id\":4,\"vendor_id\":null},\"personnel_assignment\":{\"driver_id\":5,\"driver_source\":\"direct\",\"driver_vendor_id\":null,\"helper1_id\":4,\"helper1_source\":\"direct\",\"helper1_vendor_id\":null,\"helper2_id\":7,\"helper2_source\":\"direct\",\"helper2_vendor_id\":null,\"driver_included_h1\":false,\"driver_included_h2\":false},\"references\":{\"client_ref_no\":null,\"other_ref_no\":null,\"remarks\":null},\"item_details\":[{\"item_type_id\":null,\"item_description\":null,\"length\":null,\"width\":null,\"height\":null,\"weight\":null}],\"bk_photos\":[]}', 1, 'admin', '2026-09-22 23:23:24'),
(33, 'bookings', 'update', '20', '{\"booking_info\":{\"customer_id\":5,\"booking_type_id\":4,\"delivery_date\":\"2026-09-17\",\"depot_id\":3,\"commodity_type_id\":4,\"route_code\":null,\"trips_number\":null,\"drops_number\":null,\"origin_id\":1,\"destination_id\":null},\"vehicle_assignment\":{\"vehicle_id\":19,\"plate_no\":\"FRO123\",\"vehicle_type_id\":2,\"commodity_type_id\":4,\"vendor_id\":null},\"personnel_assignment\":{\"driver_id\":2,\"driver_source\":\"direct\",\"driver_vendor_id\":null,\"helper1_id\":6,\"helper1_source\":\"direct\",\"helper1_vendor_id\":null,\"helper2_id\":3,\"helper2_source\":\"direct\",\"helper2_vendor_id\":null,\"driver_included_h1\":false,\"driver_included_h2\":false},\"references\":{\"client_ref_no\":null,\"other_ref_no\":null,\"remarks\":null},\"item_details\":[{\"item_type_id\":null,\"item_description\":null,\"length\":null,\"width\":null,\"height\":null,\"weight\":null}],\"bk_photos\":[]}', 1, 'admin', '2026-09-22 23:32:12');

-- --------------------------------------------------------

--
-- Table structure for table `bk_booking_expenses`
--

CREATE TABLE `bk_booking_expenses` (
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
  `nb_other_deduction` decimal(12,2) DEFAULT 0.00
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
-- Table structure for table `bk_fuel_trip`
--

CREATE TABLE `bk_fuel_trip` (
  `bk_fuel_trip_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `area` varchar(255) DEFAULT NULL,
  `trip_allowance` decimal(10,2) DEFAULT NULL,
  `fuel` int(11) DEFAULT NULL,
  `fuel_po` int(11) DEFAULT NULL,
  `fuel_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bk_fuel_trip`
--

INSERT INTO `bk_fuel_trip` (`bk_fuel_trip_id`, `booking_id`, `area`, `trip_allowance`, `fuel`, `fuel_po`, `fuel_amount`) VALUES
(6, 19, '', 0.00, 0, NULL, NULL),
(7, 20, NULL, NULL, NULL, NULL, NULL),
(8, 21, 'Makati', 1000.00, 50, 12, NULL);

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

--
-- Dumping data for table `bk_items`
--

INSERT INTO `bk_items` (`bk_items_id`, `booking_id`, `item_type_id`, `item_description`, `length`, `width`, `height`, `weight`) VALUES
(5, 21, 4, 'High Quality', 50.00, 50.00, 50.00, 100.00);

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
  `photo_path` varchar(255) DEFAULT NULL
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

--
-- Dumping data for table `bk_references`
--

INSERT INTO `bk_references` (`bk_references_id`, `booking_id`, `client_ref_no`, `other_ref_no`, `remarks`) VALUES
(1, 0, NULL, '', ''),
(2, 0, NULL, '', ''),
(3, 0, NULL, '1234', 'Why'),
(4, 21, '', '', ''),
(5, 20, '', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `bk_vehicles`
--

CREATE TABLE `bk_vehicles` (
  `bk_vehicle_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `plate_no` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bk_vehicles`
--

INSERT INTO `bk_vehicles` (`bk_vehicle_id`, `booking_id`, `vehicle_id`, `vendor_id`, `plate_no`) VALUES
(11, 19, 2, NULL, '1231245'),
(12, 20, 19, NULL, 'FRO123'),
(13, 21, 20, NULL, 'FRODRY123');

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
  `depot_id` int(11) NOT NULL,
  `commodity_type_id` int(11) NOT NULL,
  `route_code` varchar(255) DEFAULT NULL,
  `trips_number` int(11) DEFAULT NULL,
  `drops_number` int(11) DEFAULT NULL,
  `origin_id` int(11) NOT NULL,
  `destination_id` int(11) DEFAULT NULL,
  `client_rate_id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `status_id` tinyint(4) NOT NULL,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `booking_no`, `customer_id`, `booking_type_id`, `delivery_date`, `depot_id`, `commodity_type_id`, `route_code`, `trips_number`, `drops_number`, `origin_id`, `destination_id`, `client_rate_id`, `vehicle_id`, `status_id`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'BK-20260827-0001', 5, 4, NULL, 3, 6, NULL, NULL, NULL, 1, 1, NULL, 1, 1, 1, 1, '2026-08-27 16:21:31', '2026-08-27 16:21:52'),
(19, 'BK-20260915-0001', 5, 4, '2026-09-17', 3, 6, '', 0, 0, 1, NULL, NULL, NULL, 3, 1, 1, '2026-09-16 04:41:23', '2026-09-21 19:48:35'),
(20, 'BK-20260915-0002', 5, 4, '2026-09-17', 3, 4, NULL, 0, 0, 1, NULL, NULL, NULL, 4, 1, 1, '2026-09-16 04:41:54', '2026-09-22 23:23:21'),
(21, 'BK-20260915-0003', 5, 8, '2026-09-18', 4, 7, '123456', 12, 12, 1, 2, NULL, NULL, 5, 1, 1, '2026-09-16 05:33:01', '2026-09-21 19:53:01');

-- --------------------------------------------------------

--
-- Table structure for table `booking_personnel`
--

CREATE TABLE `booking_personnel` (
  `booking_personnel_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `assignment_role` enum('driver','helper1','helper2') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_personnel`
--

INSERT INTO `booking_personnel` (`booking_personnel_id`, `booking_id`, `personnel_id`, `assignment_role`) VALUES
(16, 19, 1, 'driver'),
(17, 19, 6, 'helper1'),
(18, 19, 4, 'helper2'),
(19, 20, 2, 'driver'),
(20, 20, 6, 'helper1'),
(21, 20, 3, 'helper2'),
(22, 21, 2, 'driver'),
(23, 21, 6, 'helper1'),
(24, 21, 4, 'helper2');

-- --------------------------------------------------------

--
-- Table structure for table `booking_statuses`
--

CREATE TABLE `booking_statuses` (
  `status_id` tinyint(4) NOT NULL,
  `status_name` varchar(50) NOT NULL,
  `sort_order` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_statuses`
--

INSERT INTO `booking_statuses` (`status_id`, `status_name`, `sort_order`) VALUES
(1, 'Under Review', 1),
(2, 'Approved', 2),
(3, 'Dispatched', 3),
(4, 'Delivered', 4),
(5, 'Completed', 5),
(6, 'Canceled', 6),
(7, 'Declined', 7);

-- --------------------------------------------------------

--
-- Table structure for table `booking_types`
--

CREATE TABLE `booking_types` (
  `booking_type_id` int(11) NOT NULL,
  `book_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_types`
--

INSERT INTO `booking_types` (`booking_type_id`, `book_type`, `status`) VALUES
(3, 'SUBCON', 'Active'),
(4, '2ND TRIP', 'Inactive'),
(5, 'MORNING CLIENT', 'Active'),
(6, 'NIGHT CLIENT', 'Active'),
(7, 'MOTORCYCLE', 'Active'),
(8, '3RD TRIP', 'Active'),
(9, '4TH TRIP', 'Active'),
(10, '5TH TRIP', 'Active'),
(11, '6TH TRIP', 'Active'),
(12, 'PINEDA', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `category_types`
--

CREATE TABLE `category_types` (
  `category_type_id` int(11) NOT NULL,
  `category_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category_types`
--

INSERT INTO `category_types` (`category_type_id`, `category_type`, `status`) VALUES
(1, 'Primary', 'Active'),
(2, 'Secondary', 'Active'),
(3, 'OTO', 'Active'),
(4, 'Rental', 'Active'),
(5, 'OTW', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `commodity_type`
--

CREATE TABLE `commodity_type` (
  `commodity_type_id` int(11) NOT NULL,
  `commodity_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `commodity_type`
--

INSERT INTO `commodity_type` (`commodity_type_id`, `commodity_type`, `status`) VALUES
(1, 'CHILLED', 'Active'),
(2, 'DRY', 'Active'),
(3, 'MOTORCYCLE', 'Active'),
(4, 'FROZEN', 'Active'),
(5, 'WET', 'Active'),
(6, 'AC', 'Active'),
(7, 'Frozen/Dry', 'Active');

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

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `customer_name`, `contact_number`, `c_email_id`, `address_one`, `address_two`, `contact_person`, `depot`, `tin`, `account_code`, `rate_type`, `status`, `created_at`, `updated_at`) VALUES
(5, 'Socrates Jerios Cruz', '09929110965', 1, 'Ramon Jabson', '', NULL, NULL, NULL, NULL, NULL, 'Active', '2026-08-26 21:10:34', '2026-08-26 21:10:34'),
(6, 'Tess Cruz', '09192939495', 2, 'Ramon Jabson', '', NULL, NULL, NULL, NULL, NULL, 'Active', '2026-09-21 20:00:52', '2026-09-21 20:00:52');

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

--
-- Dumping data for table `c_bank_info`
--

INSERT INTO `c_bank_info` (`c_bank_id`, `customer_id`, `contact_person`, `depot_id`, `tin`, `account_code`, `rate`, `status`) VALUES
(1, 5, 'Socrates Jerios Cruz', 1, '234565432', '234565432', NULL, 'Active'),
(2, 6, 'Snow Cruz', 4, '2356369754', '2345677654', NULL, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `c_email`
--

CREATE TABLE `c_email` (
  `c_email_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `c_email`
--

INSERT INTO `c_email` (`c_email_id`, `email`) VALUES
(1, 'patriciadianecruz@gmail.com'),
(2, 'Tess@gmail.com');

-- --------------------------------------------------------

--
-- Table structure for table `depots`
--

CREATE TABLE `depots` (
  `depot_id` int(11) NOT NULL,
  `depot_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `depots`
--

INSERT INTO `depots` (`depot_id`, `depot_name`, `status`) VALUES
(1, 'PASIG', 'Active'),
(2, 'PAMPANGA', 'Active'),
(3, 'BATANGAS', 'Active'),
(4, 'DAVAO', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `destination`
--

CREATE TABLE `destination` (
  `destination_id` int(11) NOT NULL,
  `destination_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `destination`
--

INSERT INTO `destination` (`destination_id`, `destination_name`, `status`) VALUES
(1, 'PASIG', 'Active'),
(2, 'VISTA MALL', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `dl_codes`
--

CREATE TABLE `dl_codes` (
  `dl_code_id` int(11) NOT NULL,
  `code` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
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

--
-- Dumping data for table `item_types`
--

INSERT INTO `item_types` (`item_type_id`, `item_type`, `status`) VALUES
(1, 'DOCUMENTS', 'Active'),
(2, 'FOOD/DRINK', 'Active'),
(3, 'MEDICAL', 'Active'),
(4, 'CLOTHING', 'Active'),
(5, 'ELECTRONICS', 'Active'),
(6, 'FRAGILE', 'Active'),
(7, 'OTHERS', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `origin`
--

CREATE TABLE `origin` (
  `origin_id` int(11) NOT NULL,
  `origin_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `origin`
--

INSERT INTO `origin` (`origin_id`, `origin_name`, `status`) VALUES
(1, 'PASIG', 'Active');

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

--
-- Dumping data for table `personnel`
--

INSERT INTO `personnel` (`personnel_id`, `last_name`, `first_name`, `middle_name`, `address`, `contact_number`, `p_email_id`, `birthdate`, `gender`, `status`) VALUES
(1, 'ASdas', 'sdad', '', '', '', NULL, '0000-00-00', 'Male', 'Active'),
(2, 'Cruz', 'Patricia Diane', 'Ruiz', '', '', NULL, '0000-00-00', NULL, 'Active'),
(3, 'Uy', 'Johanna Mariz', '', '', '', NULL, '0000-00-00', NULL, 'Active'),
(4, 'Bongolto', 'Sherwin', '', '', '', NULL, '0000-00-00', NULL, 'Active'),
(5, 'Antonio', 'Rhoanne Nicole', 'Ruiz', '', '', NULL, '0000-00-00', NULL, 'Active'),
(6, 'Pineda', 'Karl Louis', 'Miguel', '', '', NULL, '0000-00-00', NULL, 'Active'),
(7, 'Sta. Ana', 'Marc Andrew', 'Calcita', '', '', NULL, '0000-00-00', NULL, 'Active'),
(8, 'Pascua', 'Antonio', 'Cruz', '123', '', NULL, '0000-00-00', 'Male', 'Active');

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

--
-- Dumping data for table `p_benefits`
--

INSERT INTO `p_benefits` (`p_benefits_id`, `personnel_id`, `philhealth_no`, `sss_no`, `tin_no`, `pag_ibig_no`) VALUES
(1, 1, NULL, NULL, NULL, NULL),
(2, 2, NULL, NULL, NULL, NULL),
(3, 3, NULL, NULL, NULL, NULL),
(4, 4, NULL, NULL, NULL, NULL),
(5, 5, NULL, NULL, NULL, NULL),
(6, 6, NULL, NULL, NULL, NULL),
(7, 7, NULL, NULL, NULL, NULL),
(8, 8, NULL, NULL, NULL, NULL);

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

--
-- Dumping data for table `p_emergency`
--

INSERT INTO `p_emergency` (`p_emergency_id`, `personnel_id`, `contact_person`, `contact_number`) VALUES
(1, 1, NULL, NULL),
(2, 2, NULL, NULL),
(3, 3, NULL, NULL),
(4, 4, NULL, NULL),
(5, 5, NULL, NULL),
(6, 6, NULL, NULL),
(7, 7, NULL, NULL),
(8, 8, NULL, NULL);

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

--
-- Dumping data for table `p_employment`
--

INSERT INTO `p_employment` (`p_employment_id`, `personnel_id`, `personnel_type_id`, `employment_type`, `vendor_id`, `employee_id_number`, `depot_id`, `date_started`, `date_of_separation`, `reason_of_separation`, `bank_account`, `daily_rate`, `remarks`) VALUES
(1, 1, 1, 'Direct Hire', NULL, NULL, 4, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(2, 2, 1, 'Direct Hire', NULL, NULL, 3, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(3, 3, 2, 'Direct Hire', NULL, NULL, 4, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(4, 4, 4, 'Direct Hire', NULL, NULL, 2, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(5, 5, 1, 'Direct Hire', NULL, NULL, 1, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(6, 6, 4, 'Direct Hire', NULL, NULL, 4, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(7, 7, 2, 'Direct Hire', NULL, NULL, 3, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL),
(8, 8, 2, 'Outsourced', 1, NULL, 3, '0000-00-00', '0000-00-00', NULL, NULL, 0.00, NULL);

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

--
-- Dumping data for table `p_types`
--

INSERT INTO `p_types` (`personnel_type_id`, `personnel_type`, `status`) VALUES
(1, 'Driver', 'Active'),
(2, 'Coordinator', 'Active'),
(3, 'Mechanic', 'Active'),
(4, 'Helper', 'Active');

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

--
-- Dumping data for table `tax_types`
--

INSERT INTO `tax_types` (`tax_type_id`, `tax_type`, `status`) VALUES
(1, 'VAT', 'Active'),
(2, 'Non-VAT', 'Active');

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

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`vehicle_id`, `plate_no`, `body_no`, `status_id`, `vehicle_type_id`, `vehicle_manufacturer_id`, `vehicle_model_id`, `year`, `commodity_type_id`, `asset_no`, `category_type_id`, `vendor_id`) VALUES
(1, '62DEMO', '123', 1, 1, 1, 1, '2017', NULL, '123', NULL, NULL),
(2, '1231245', '12315', 1, 2, 1, 2, '0000', 6, '', 3, 1),
(14, 'DEMO123', '123456', 1, 2, 1, 2, '2020', 6, '123456', 3, 1),
(15, 'DRY123', '12456', 1, 2, 1, 2, '0000', 2, '', NULL, NULL),
(16, 'AC123', '123456', 1, 2, 1, 2, '0000', 6, '', NULL, NULL),
(18, 'CHILL123', '123456', 1, 2, 2, 1, '0000', 1, '', NULL, NULL),
(19, 'FRO123', '123456', 1, 2, 1, 2, '0000', 4, '', NULL, NULL),
(20, 'FRODRY123', '123456', 1, 2, 1, 2, '0000', 7, '', NULL, NULL),
(21, 'MOTOR123', '123456', 1, 2, 1, 2, '0000', 3, '', NULL, NULL),
(22, 'WET123', '123456', 1, 2, 1, 2, '0000', 5, '', NULL, NULL),
(23, 'UIO-789', '34567', 1, 3, 1, 2, '2019', 4, '54567', 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_statuses`
--

CREATE TABLE `vehicle_statuses` (
  `status_id` int(11) NOT NULL,
  `status_name` varchar(50) NOT NULL,
  `sort_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicle_statuses`
--

INSERT INTO `vehicle_statuses` (`status_id`, `status_name`, `sort_order`) VALUES
(1, 'Active', 1),
(2, 'Inactive', 2),
(3, 'Sold', 3),
(4, 'Archive', 4),
(5, 'Scrapped', 5),
(6, 'In-shop', 6),
(7, 'Out of Service', 7);

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

--
-- Dumping data for table `vendor`
--

INSERT INTO `vendor` (`vendor_id`, `vendor_name`, `contact_number`, `v_email_id`, `address_one`, `address_two`, `owner_name`, `owner_contact_no`, `coordinator_name`, `coordinator_contact_no`, `term`, `date_started`, `date_separated`, `vendor_type_id`, `tax_type_id`, `status`) VALUES
(1, 'LiwayLogisticss', '09614662426', 2, 'Ramon Jabson', NULL, 'Liwayway Ruiz', '09614662426', 'Nicole Cruz', '09192939495', '4', '2026-09-17', '2026-10-07', 3, 2, 'Active');

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

--
-- Dumping data for table `vh_acquisition`
--

INSERT INTO `vh_acquisition` (`vh_acquisition_id`, `vehicle_id`, `acquisition_date`, `acquisition_price`, `breakdown_date`, `breakdown_remarks`, `remarks`) VALUES
(1, 14, '0000-00-00', 0.00, '0000-00-00', '', ''),
(2, 2, '0000-00-00', 0.00, '0000-00-00', '', ''),
(3, 1, '0000-00-00', 0.00, '0000-00-00', '', ''),
(4, 15, '0000-00-00', 0.00, '0000-00-00', '', ''),
(5, 16, '0000-00-00', 0.00, '0000-00-00', '', ''),
(6, 18, '0000-00-00', 0.00, '0000-00-00', '', ''),
(7, 19, '0000-00-00', 0.00, '0000-00-00', '', ''),
(8, 20, '0000-00-00', 0.00, '0000-00-00', '', ''),
(9, 21, '0000-00-00', 0.00, '0000-00-00', '', ''),
(10, 22, '0000-00-00', 0.00, '0000-00-00', '', ''),
(11, 23, '0000-00-00', 0.00, '0000-00-00', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `vh_documents`
--

CREATE TABLE `vh_documents` (
  `vh_documents_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `document_name` varchar(255) DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL
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

--
-- Dumping data for table `vh_insurance`
--

INSERT INTO `vh_insurance` (`vh_insurance_id`, `vehicle_id`, `insurance_provider`, `insurance_policy_no`, `insurance_expiry`, `inland_marine_policy_no`, `inland_marine_expiry`) VALUES
(1, 14, '', '', '0000-00-00', '', '0000-00-00'),
(2, 2, '', '', '0000-00-00', '', '0000-00-00'),
(3, 1, '', '', '0000-00-00', '', '0000-00-00'),
(4, 15, '', '', '0000-00-00', '', '0000-00-00'),
(5, 16, '', '', '0000-00-00', '', '0000-00-00'),
(6, 18, '', '', '0000-00-00', '', '0000-00-00'),
(7, 19, '', '', '0000-00-00', '', '0000-00-00'),
(8, 20, '', '', '0000-00-00', '', '0000-00-00'),
(9, 21, '', '', '0000-00-00', '', '0000-00-00'),
(10, 22, '', '', '0000-00-00', '', '0000-00-00'),
(11, 23, '', '', '0000-00-00', '', '0000-00-00');

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

--
-- Dumping data for table `vh_location`
--

INSERT INTO `vh_location` (`vh_location_id`, `vehicle_id`, `origin_id`, `depot_id`, `GPS`) VALUES
(9, 14, 1, 3, 1),
(10, 2, 1, 3, 1),
(11, 1, 1, 3, 0),
(12, 15, NULL, NULL, 0),
(13, 16, NULL, NULL, 0),
(14, 18, NULL, NULL, 0),
(15, 19, NULL, NULL, 0),
(16, 20, NULL, NULL, 0),
(17, 21, NULL, NULL, 0),
(18, 22, NULL, NULL, 0),
(19, 23, 1, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `vh_manufacturers`
--

CREATE TABLE `vh_manufacturers` (
  `vehicle_manufacturer_id` int(11) NOT NULL,
  `vehicle_manufacturer` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vh_manufacturers`
--

INSERT INTO `vh_manufacturers` (`vehicle_manufacturer_id`, `vehicle_manufacturer`, `status`) VALUES
(1, 'TOYOTA', 'Active'),
(2, 'YAMAHA', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `vh_models`
--

CREATE TABLE `vh_models` (
  `vehicle_model_id` int(11) NOT NULL,
  `vehicle_model` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vh_models`
--

INSERT INTO `vh_models` (`vehicle_model_id`, `vehicle_model`, `status`) VALUES
(1, 'YAMAHA 2024', 'Active'),
(2, 'TOYOTA 2024', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `vh_photos`
--

CREATE TABLE `vh_photos` (
  `vh_photos_id` int(11) NOT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `photo_name` varchar(255) DEFAULT NULL,
  `photo_path` varchar(500) DEFAULT NULL
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

--
-- Dumping data for table `vh_regist_compli`
--

INSERT INTO `vh_regist_compli` (`vh_regist_compli_id`, `vehicle_id`, `or_date`, `or_number`, `cr_date`, `cr_number`, `ltfrb_case_no`, `ltfrb_expiry`, `mv_file_no`, `pa_expiry`, `late_renewal_date`, `registration_type`, `registration_date`, `rfid_type`, `rfid_account_no`) VALUES
(1, 14, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(2, 2, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(3, 1, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(4, 15, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(5, 16, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(6, 18, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(7, 19, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(8, 20, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(9, 21, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(10, 22, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', ''),
(11, 23, '0000-00-00', '', '0000-00-00', '', '', '0000-00-00', '', '0000-00-00', '0000-00-00', '', '0000-00-00', '', '');

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

--
-- Dumping data for table `vh_specifications`
--

INSERT INTO `vh_specifications` (`vh_specifications_id`, `vehicle_id`, `chassis_no`, `color`, `engine_no`, `engine_size`, `fuel_type`, `transmission_type`) VALUES
(1, 14, '', '', '', '', '', ''),
(2, 2, '', '', '', '', '', ''),
(3, 1, '', '', '', '', '', ''),
(4, 15, '', '', '', '', '', ''),
(5, 16, '', '', '', '', '', ''),
(6, 18, '', '', '', '', '', ''),
(7, 19, '', '', '', '', '', ''),
(8, 20, '', '', '', '', '', ''),
(9, 21, '', '', '', '', '', ''),
(10, 22, '', '', '', '', '', ''),
(11, 23, '', '', '', '', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `vh_types`
--

CREATE TABLE `vh_types` (
  `vehicle_type_id` int(11) NOT NULL,
  `vehicle_type` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vh_types`
--

INSERT INTO `vh_types` (`vehicle_type_id`, `vehicle_type`, `status`) VALUES
(1, '6T/6W', 'Active'),
(2, '2T/4W', 'Active'),
(3, '4T/6W', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `v_email`
--

CREATE TABLE `v_email` (
  `v_email_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `v_email`
--

INSERT INTO `v_email` (`v_email_id`, `email`) VALUES
(2, 'Liway@gmail.com');

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
-- Dumping data for table `v_types`
--

INSERT INTO `v_types` (`vendor_type_id`, `vendor_type`, `status`) VALUES
(1, 'VENDOR', 'Active'),
(2, 'MANPOWER', 'Active'),
(3, 'TRUCKER', 'Active');

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
-- Indexes for table `bk_booking_expenses`
--
ALTER TABLE `bk_booking_expenses`
  ADD PRIMARY KEY (`booking_expenses_id`),
  ADD KEY `fk_booking_expenses_booking` (`booking_id`);

--
-- Indexes for table `bk_client_cost`
--
ALTER TABLE `bk_client_cost`
  ADD PRIMARY KEY (`client_cost_id`),
  ADD KEY `fk_client_cost_booking` (`booking_id`);

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
  ADD KEY `fk_booking_vehicle` (`vehicle_id`),
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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `bk_booking_expenses`
--
ALTER TABLE `bk_booking_expenses`
  MODIFY `booking_expenses_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_client_cost`
--
ALTER TABLE `bk_client_cost`
  MODIFY `client_cost_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bk_fuel_trip`
--
ALTER TABLE `bk_fuel_trip`
  MODIFY `bk_fuel_trip_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `bk_items`
--
ALTER TABLE `bk_items`
  MODIFY `bk_items_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `bk_references_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bk_vehicles`
--
ALTER TABLE `bk_vehicles`
  MODIFY `bk_vehicle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `booking_personnel`
--
ALTER TABLE `booking_personnel`
  MODIFY `booking_personnel_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `booking_statuses`
--
ALTER TABLE `booking_statuses`
  MODIFY `status_id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `booking_types`
--
ALTER TABLE `booking_types`
  MODIFY `booking_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `category_types`
--
ALTER TABLE `category_types`
  MODIFY `category_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `commodity_type`
--
ALTER TABLE `commodity_type`
  MODIFY `commodity_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `c_bank_info`
--
ALTER TABLE `c_bank_info`
  MODIFY `c_bank_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `c_email`
--
ALTER TABLE `c_email`
  MODIFY `c_email_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `depots`
--
ALTER TABLE `depots`
  MODIFY `depot_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `destination`
--
ALTER TABLE `destination`
  MODIFY `destination_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `item_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `origin`
--
ALTER TABLE `origin`
  MODIFY `origin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `personnel`
--
ALTER TABLE `personnel`
  MODIFY `personnel_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `p_benefits`
--
ALTER TABLE `p_benefits`
  MODIFY `p_benefits_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `p_email`
--
ALTER TABLE `p_email`
  MODIFY `p_email_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_emergency`
--
ALTER TABLE `p_emergency`
  MODIFY `p_emergency_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `p_employment`
--
ALTER TABLE `p_employment`
  MODIFY `p_employment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `p_license`
--
ALTER TABLE `p_license`
  MODIFY `p_license_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `p_types`
--
ALTER TABLE `p_types`
  MODIFY `personnel_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reileo_logistics_services_users`
--
ALTER TABLE `reileo_logistics_services_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tax_types`
--
ALTER TABLE `tax_types`
  MODIFY `tax_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `vehicle_statuses`
--
ALTER TABLE `vehicle_statuses`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `vendor`
--
ALTER TABLE `vendor`
  MODIFY `vendor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vh_acquisition`
--
ALTER TABLE `vh_acquisition`
  MODIFY `vh_acquisition_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `vh_documents`
--
ALTER TABLE `vh_documents`
  MODIFY `vh_documents_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_insurance`
--
ALTER TABLE `vh_insurance`
  MODIFY `vh_insurance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `vh_location`
--
ALTER TABLE `vh_location`
  MODIFY `vh_location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `vh_manufacturers`
--
ALTER TABLE `vh_manufacturers`
  MODIFY `vehicle_manufacturer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vh_models`
--
ALTER TABLE `vh_models`
  MODIFY `vehicle_model_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vh_photos`
--
ALTER TABLE `vh_photos`
  MODIFY `vh_photos_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vh_regist_compli`
--
ALTER TABLE `vh_regist_compli`
  MODIFY `vh_regist_compli_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `vh_specifications`
--
ALTER TABLE `vh_specifications`
  MODIFY `vh_specifications_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `vh_types`
--
ALTER TABLE `vh_types`
  MODIFY `vehicle_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `v_email`
--
ALTER TABLE `v_email`
  MODIFY `v_email_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `v_owner`
--
ALTER TABLE `v_owner`
  MODIFY `v_owner_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `v_types`
--
ALTER TABLE `v_types`
  MODIFY `vendor_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bk_booking_expenses`
--
ALTER TABLE `bk_booking_expenses`
  ADD CONSTRAINT `fk_booking_expenses_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bk_client_cost`
--
ALTER TABLE `bk_client_cost`
  ADD CONSTRAINT `fk_client_cost_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_booking_type` FOREIGN KEY (`booking_type_id`) REFERENCES `booking_types` (`booking_type_id`),
  ADD CONSTRAINT `fk_booking_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

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
