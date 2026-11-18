<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$report = $_GET['report'] ?? '';
$tables = [
    'bookings' => tableName('bookings'),
    'customers' => tableName('customers'),
    'booking_types' => tableName('booking_types'),
    'booking_statuses' => tableName('booking_statuses'),
    'depots' => tableName('depots'),
    'origin' => tableName('origin'),
    'destination' => tableName('destination'),
    'commodity_type' => tableName('commodity_type'),
    'bk_vehicles' => tableName('bk_vehicles'),
    'vehicles' => tableName('vehicles'),
    'vh_types' => tableName('vh_types'),
    'category_types' => tableName('category_types'),
    'vendor' => tableName('vendor'),
    'bk_references' => tableName('bk_references'),
    'bk_client_cost' => tableName('bk_client_cost'),
    'bk_fuel_trip' => tableName('bk_fuel_trip'),
    'bk_b_expenses' => tableName('bk_b_expenses'),
    'bk_nb_expenses' => tableName('bk_nb_expenses'),
    'users' => tableName('reileo_logistics_services_users'),
    'booking_personnel' => tableName('booking_personnel'),
    'personnel' => tableName('personnel'),
    'p_employment' => tableName('p_employment'),
    'vh_manufacturers' => tableName('vh_manufacturers'),
    'vh_models' => tableName('vh_models'),
    'vehicle_statuses' => tableName('vehicle_statuses'),
    'vh_location' => tableName('vh_location'),
    'vh_insurance' => tableName('vh_insurance'),
    'vh_regist_compli' => tableName('vh_regist_compli'),
    'vh_acquisition' => tableName('vh_acquisition'),
    'vh_specifications' => tableName('vh_specifications'),
    'p_types' => tableName('p_types'),
];
$fuelTripTable = $tables['bk_fuel_trip'];
$fuelAreaSelect = $db->query("SHOW COLUMNS FROM `{$fuelTripTable}` LIKE 'area'")->fetch()
    ? 'f.area'
    : 'NULL AS area';

function reportJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

try {
    switch ($report) {
        case 'payroll-summary':
            $year = (string)($_GET['year'] ?? date('Y'));
            if (!preg_match('/^\d{4}$/', $year) || (int)$year < 2000 || (int)$year > (int)date('Y')) {
                reportJson(['error' => 'Invalid payroll year'], 400);
            }

            $stmt = $db->prepare("SELECT
                p.personnel_id,
                UPPER(TRIM(CONCAT_WS(' ', p.last_name, p.first_name, NULLIF(p.middle_name, '')))) AS employee_name,
                COUNT(DISTINCT b.booking_id) AS completed_bookings,
                COALESCE(SUM(bp.rate), 0) AS base_earnings,
                COALESCE(SUM(bp.allowance), 0) AS allowances,
                COALESCE(SUM(COALESCE(bp.rate, 0) + COALESCE(bp.allowance, 0)), 0) AS total_earnings,
                0.00 AS total_deductions,
                COALESCE(SUM(COALESCE(bp.rate, 0) + COALESCE(bp.allowance, 0)), 0) AS net_pay
                FROM `{$tables['booking_personnel']}` bp
                JOIN `{$tables['bookings']}` b ON b.booking_id = bp.booking_id
                JOIN `{$tables['booking_statuses']}` bs ON bs.status_id = b.status_id
                JOIN `{$tables['personnel']}` p ON p.personnel_id = bp.personnel_id
                WHERE LOWER(bs.status_name) = 'completed'
                  AND b.completed_at >= ?
                  AND b.completed_at < ?
                GROUP BY p.personnel_id, p.last_name, p.first_name, p.middle_name
                ORDER BY employee_name ASC");
            $stmt->execute([
                "{$year}-01-01 00:00:00",
                ((int)$year + 1) . "-01-01 00:00:00",
            ]);
            reportJson($stmt->fetchAll());

        case 'payroll-periods':
            $year = (string)($_GET['year'] ?? date('Y'));
            $personnelId = filter_var($_GET['personnel_id'] ?? null, FILTER_VALIDATE_INT);
            if (!preg_match('/^\d{4}$/', $year) || (int)$year < 2000 || (int)$year > (int)date('Y')) {
                reportJson(['error' => 'Invalid payroll year'], 400);
            }
            if ($personnelId === false || $personnelId === null || $personnelId < 1) {
                reportJson(['error' => 'Invalid personnel ID'], 400);
            }

            $periodStart = "DATE_SUB(DATE(b.completed_at), INTERVAL WEEKDAY(b.completed_at) DAY)";
            $stmt = $db->prepare("SELECT
                p.personnel_id,
                UPPER(TRIM(CONCAT_WS(' ', p.last_name, p.first_name, NULLIF(p.middle_name, '')))) AS employee_name,
                MAX(pt.personnel_type) AS personnel_type,
                MAX(d.depot_name) AS depot_name,
                {$periodStart} AS period_start,
                DATE_ADD({$periodStart}, INTERVAL 6 DAY) AS period_end,
                COUNT(DISTINCT b.booking_id) AS completed_bookings,
                COALESCE(SUM(bp.rate), 0) AS base_earnings,
                COALESCE(SUM(bp.allowance), 0) AS allowances,
                COALESCE(SUM(COALESCE(bp.rate, 0) + COALESCE(bp.allowance, 0)), 0) AS total_earnings,
                0.00 AS total_deductions,
                COALESCE(SUM(COALESCE(bp.rate, 0) + COALESCE(bp.allowance, 0)), 0) AS net_pay
                FROM `{$tables['booking_personnel']}` bp
                JOIN `{$tables['bookings']}` b ON b.booking_id = bp.booking_id
                JOIN `{$tables['booking_statuses']}` bs ON bs.status_id = b.status_id
                JOIN `{$tables['personnel']}` p ON p.personnel_id = bp.personnel_id
                LEFT JOIN `{$tables['p_employment']}` em ON em.personnel_id = p.personnel_id
                LEFT JOIN `{$tables['p_types']}` pt ON pt.personnel_type_id = em.personnel_type_id
                LEFT JOIN `{$tables['depots']}` d ON d.depot_id = em.depot_id
                WHERE LOWER(bs.status_name) = 'completed'
                  AND b.completed_at >= ?
                  AND b.completed_at < ?
                  AND p.personnel_id = ?
                GROUP BY p.personnel_id, p.last_name, p.first_name, p.middle_name, period_start
                ORDER BY period_start DESC");
            $stmt->execute([
                "{$year}-01-01 00:00:00",
                ((int)$year + 1) . "-01-01 00:00:00",
                $personnelId,
            ]);
            reportJson($stmt->fetchAll());

        case 'bookings':
            $stmt = $db->query("SELECT b.booking_id, b.booking_no, b.delivery_date,
                b.customer_id, c.customer_name, b.booking_type_id, bt.book_type AS booking_type,
                b.commodity_type_id, ct.commodity_type, bs.status_name, d.depot_id, d.depot_name,
                b.origin_id, o.origin_name, dest.destination_id, dest.destination_name,
                COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                bv.vehicle_id, COALESCE(bv.vendor_id, v.vendor_id) AS vendor_id,
                vd.vendor_name, r.client_ref_no, r.other_ref_no, cc.client_rate, cc.subcon_rate,
                r.remarks, b.route_code, b.trips_number, b.drops_number,
                {$fuelAreaSelect}, f.charges, f.trip_allowance, f.fuel, f.fuel_po, f.fuel_amount,
                be.toll_fee AS b_toll_fees,
                COALESCE(be.gas, 0) + COALESCE(be.parking_fee, 0) +
                    COALESCE(be.entrance_fee, 0) + COALESCE(be.mano, 0) +
                    COALESCE(be.sop, 0) + COALESCE(be.demurrage_fee, 0) +
                    COALESCE(be.backload_fee, 0) AS b_other_fees,
                be.extra_drop_fee AS b_extra_drop, NULL AS b_extra_helper,
                nbe.parking_fee AS nb_parking_fees, nbe.backload_fee AS nb_backload_fees,
                nbe.demurrage_fee AS nb_demurrage_fees, nbe.toll_fee AS nb_toll_fees,
                bv.odometer AS odometer_delivered,
                b.delivered_datetime, b.received_datetime, b.completed_at, b.created_at,
                CASE WHEN COALESCE(bv.vendor_id, v.vendor_id) IS NULL THEN 'No' ELSE 'Yes' END AS subcon,
                NULL AS agency, NULL AS fuel_price, NULL AS billing_invoice, NULL AS billed,
                NULL AS dispatch_date, NULL AS odometer_dispatched, NULL AS remarks_2,
                NULL AS billing_date, NULL AS aging,
                u.username AS created_by,
                (SELECT GROUP_CONCAT(CONCAT_WS(' ', dp.first_name, dp.middle_name, dp.last_name) SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` dbp
                 JOIN `{$tables['personnel']}` dp ON dp.personnel_id = dbp.personnel_id
                 WHERE dbp.booking_id = b.booking_id AND dbp.assignment_role = 'driver') AS driver,
                (SELECT GROUP_CONCAT(dv.vendor_name SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` dbp
                 JOIN `{$tables['p_employment']}` de ON de.personnel_id = dbp.personnel_id
                 JOIN `{$tables['vendor']}` dv ON dv.vendor_id = de.vendor_id
                 WHERE dbp.booking_id = b.booking_id AND dbp.assignment_role = 'driver') AS driver_agency,
                (SELECT GROUP_CONCAT(dp.contact_number SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` dbp
                 JOIN `{$tables['personnel']}` dp ON dp.personnel_id = dbp.personnel_id
                 WHERE dbp.booking_id = b.booking_id AND dbp.assignment_role = 'driver') AS driver_contact,
                (SELECT GROUP_CONCAT(dbp.allowance SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` dbp
                 WHERE dbp.booking_id = b.booking_id AND dbp.assignment_role = 'driver') AS driver_allowance,
                (SELECT GROUP_CONCAT(CONCAT_WS(' ', hp.first_name, hp.middle_name, hp.last_name) SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` hbp
                 JOIN `{$tables['personnel']}` hp ON hp.personnel_id = hbp.personnel_id
                 WHERE hbp.booking_id = b.booking_id AND hbp.assignment_role = 'helper1') AS helper1,
                (SELECT GROUP_CONCAT(hp.contact_number SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` hbp
                 JOIN `{$tables['personnel']}` hp ON hp.personnel_id = hbp.personnel_id
                 WHERE hbp.booking_id = b.booking_id AND hbp.assignment_role = 'helper1') AS helper1_contact,
                (SELECT GROUP_CONCAT(hbp.allowance SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` hbp
                 WHERE hbp.booking_id = b.booking_id AND hbp.assignment_role = 'helper1') AS helper1_allowance,
                (SELECT GROUP_CONCAT(hv.vendor_name SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` hbp
                 JOIN `{$tables['p_employment']}` he ON he.personnel_id = hbp.personnel_id
                 JOIN `{$tables['vendor']}` hv ON hv.vendor_id = he.vendor_id
                 WHERE hbp.booking_id = b.booking_id AND hbp.assignment_role = 'helper1') AS helper1_agency,
                (SELECT GROUP_CONCAT(CONCAT_WS(' ', h2p.first_name, h2p.middle_name, h2p.last_name) SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` h2bp
                 JOIN `{$tables['personnel']}` h2p ON h2p.personnel_id = h2bp.personnel_id
                 WHERE h2bp.booking_id = b.booking_id AND h2bp.assignment_role = 'helper2') AS helper2,
                (SELECT GROUP_CONCAT(h2p.contact_number SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` h2bp
                 JOIN `{$tables['personnel']}` h2p ON h2p.personnel_id = h2bp.personnel_id
                 WHERE h2bp.booking_id = b.booking_id AND h2bp.assignment_role = 'helper2') AS helper2_contact,
                (SELECT GROUP_CONCAT(h2bp.allowance SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` h2bp
                 WHERE h2bp.booking_id = b.booking_id AND h2bp.assignment_role = 'helper2') AS helper2_allowance,
                (SELECT GROUP_CONCAT(hv.vendor_name SEPARATOR ', ')
                 FROM `{$tables['booking_personnel']}` h2bp
                 JOIN `{$tables['p_employment']}` he ON he.personnel_id = h2bp.personnel_id
                 JOIN `{$tables['vendor']}` hv ON hv.vendor_id = he.vendor_id
                 WHERE h2bp.booking_id = b.booking_id AND h2bp.assignment_role = 'helper2') AS helper2_agency,
                vt.vehicle_type,
                cty.category_type AS truck_category
                FROM `{$tables['bookings']}` b
                LEFT JOIN `{$tables['customers']}` c ON c.customer_id = b.customer_id
                LEFT JOIN `{$tables['booking_types']}` bt ON bt.booking_type_id = b.booking_type_id
                LEFT JOIN `{$tables['booking_statuses']}` bs ON bs.status_id = b.status_id
                LEFT JOIN `{$tables['depots']}` d ON d.depot_id = b.depot_id
                LEFT JOIN `{$tables['origin']}` o ON o.origin_id = b.origin_id
                LEFT JOIN `{$tables['destination']}` dest ON dest.destination_id = b.destination_id
                LEFT JOIN `{$tables['commodity_type']}` ct ON ct.commodity_type_id = b.commodity_type_id
                LEFT JOIN `{$tables['bk_vehicles']}` bv ON bv.booking_id = b.booking_id
                LEFT JOIN `{$tables['vehicles']}` v ON v.vehicle_id = bv.vehicle_id
                LEFT JOIN `{$tables['vh_types']}` vt ON vt.vehicle_type_id = v.vehicle_type_id
                LEFT JOIN `{$tables['category_types']}` cty ON cty.category_type_id = v.category_type_id
                LEFT JOIN `{$tables['vendor']}` vd ON vd.vendor_id = COALESCE(bv.vendor_id, v.vendor_id)
                LEFT JOIN `{$tables['bk_references']}` r ON r.booking_id = b.booking_id
                LEFT JOIN `{$tables['bk_client_cost']}` cc ON cc.booking_id = b.booking_id
                LEFT JOIN `{$tables['bk_fuel_trip']}` f ON f.booking_id = b.booking_id
                LEFT JOIN `{$tables['bk_b_expenses']}` be ON be.booking_id = b.booking_id
                LEFT JOIN `{$tables['bk_nb_expenses']}` nbe ON nbe.booking_id = b.booking_id
                LEFT JOIN `{$tables['users']}` u ON u.user_id = b.created_by
                ORDER BY b.booking_id DESC");
            reportJson($stmt->fetchAll());

        case 'vehicles':
            $stmt = $db->query("SELECT
                    v.vehicle_id,
                    v.body_no,
                    v.plate_no,
                    vm.vehicle_manufacturer AS vehicle_manufacturer,
                    vmo.vehicle_model AS vehicle_model,
                    vs.status_name,
                    d.depot_name,
                    vt.vehicle_type,
                    CASE
                        WHEN v.vendor_id IS NULL OR v.vendor_id = '' THEN 'Yes'
                        ELSE 'No'
                    END AS company_owned,
                    CASE
                        WHEN v.vendor_id IS NULL OR v.vendor_id = '' THEN 'No'
                        ELSE 'Yes'
                    END AS subcon,
                    vd.vendor_name,
                    vrc.registration_date,
                    v.year AS year_model,
                    vrc.mv_file_no,
                    vi.insurance_provider,
                    vi.insurance_policy_no,
                    vi.insurance_expiry,
                    vi.inland_marine_policy_no,
                    vi.inland_marine_expiry,
                    vrc.ltfrb_case_no,
                    vrc.ltfrb_expiry,
                    vrc.cr_number,
                    vrc.cr_date,
                    vrc.or_number,
                    vrc.or_date,
                    specs.engine_no,
                    specs.chassis_no,
                    specs.engine_size,
                    specs.color,
                    specs.fuel_type,
                    specs.transmission_type,
                    ct.commodity_type,
                    vrc.registration_type,
                    o.origin_name,
                    v.asset_no,
                    va.acquisition_price,
                    va.acquisition_date,
                    NULL AS transfer_date,
                    va.breakdown_date,
                    va.breakdown_remarks,
                    NULL AS project,
                    va.remarks,
                    CASE
                        WHEN vl.GPS IS NULL OR vl.GPS = '' THEN NULL
                        WHEN vl.GPS IN ('1', 1, 'Yes', 'yes', 'TRUE', 'true') THEN 'Yes'
                        ELSE 'No'
                    END AS with_gps,
                    NULL AS odometer,
                    vrc.rfid_type,
                    vrc.rfid_account_no,
                    cty.category_type
                FROM `{$tables['vehicles']}` v
                LEFT JOIN `{$tables['vh_types']}` vt ON vt.vehicle_type_id = v.vehicle_type_id
                LEFT JOIN `{$tables['vh_manufacturers']}` vm ON vm.vehicle_manufacturer_id = v.vehicle_manufacturer_id
                LEFT JOIN `{$tables['vh_models']}` vmo ON vmo.vehicle_model_id = v.vehicle_model_id
                LEFT JOIN `{$tables['vehicle_statuses']}` vs ON vs.status_id = v.status_id
                LEFT JOIN `{$tables['vendor']}` vd ON vd.vendor_id = v.vendor_id
                LEFT JOIN `{$tables['vh_location']}` vl ON vl.vehicle_id = v.vehicle_id
                LEFT JOIN `{$tables['depots']}` d ON d.depot_id = vl.depot_id
                LEFT JOIN `{$tables['origin']}` o ON o.origin_id = vl.origin_id
                LEFT JOIN `{$tables['commodity_type']}` ct ON ct.commodity_type_id = v.commodity_type_id
                LEFT JOIN `{$tables['category_types']}` cty ON cty.category_type_id = v.category_type_id
                LEFT JOIN `{$tables['vh_insurance']}` vi ON vi.vehicle_id = v.vehicle_id
                LEFT JOIN `{$tables['vh_regist_compli']}` vrc ON vrc.vehicle_id = v.vehicle_id
                LEFT JOIN `{$tables['vh_acquisition']}` va ON va.vehicle_id = v.vehicle_id
                LEFT JOIN `{$tables['vh_specifications']}` specs ON specs.vehicle_id = v.vehicle_id
                ORDER BY v.vehicle_id DESC");
            reportJson($stmt->fetchAll());

        case 'personnel-settlement':
            $stmt = $db->query("SELECT b.booking_no, c.customer_name, b.delivery_date,
                COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                bt.book_type AS booking_type, d.depot_name, o.origin_name,
                dest.destination_name, p.personnel_id,
                CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) AS full_name,
                pt.personnel_type, agency.vendor_name AS agency, bp.rate AS personnel_rate,
                bs.status_name
                FROM `{$tables['booking_personnel']}` bp
                JOIN `{$tables['bookings']}` b ON b.booking_id = bp.booking_id
                LEFT JOIN `{$tables['customers']}` c ON c.customer_id = b.customer_id
                LEFT JOIN `{$tables['booking_types']}` bt ON bt.booking_type_id = b.booking_type_id
                LEFT JOIN `{$tables['bk_vehicles']}` bv ON bv.booking_id = b.booking_id
                LEFT JOIN `{$tables['vehicles']}` v ON v.vehicle_id = bv.vehicle_id
                LEFT JOIN `{$tables['depots']}` d ON d.depot_id = b.depot_id
                LEFT JOIN `{$tables['origin']}` o ON o.origin_id = b.origin_id
                LEFT JOIN `{$tables['destination']}` dest ON dest.destination_id = b.destination_id
                LEFT JOIN `{$tables['booking_statuses']}` bs ON bs.status_id = b.status_id
                LEFT JOIN `{$tables['personnel']}` p ON p.personnel_id = bp.personnel_id
                LEFT JOIN `{$tables['p_employment']}` em ON em.personnel_id = p.personnel_id
                LEFT JOIN `{$tables['p_types']}` pt ON pt.personnel_type_id = em.personnel_type_id
                LEFT JOIN `{$tables['vendor']}` agency ON agency.vendor_id = em.vendor_id
                WHERE LOWER(bs.status_name) = 'completed'
                ORDER BY b.booking_id DESC, bp.booking_personnel_id ASC");
            reportJson($stmt->fetchAll());

        case 'fuel':
            $stmt = $db->query("SELECT f.bk_fuel_trip_id, f.booking_id, b.booking_no,
                bv.plate_no, vm.vehicle_manufacturer, vt.vehicle_type,
                f.charges, f.trip_allowance, f.fuel, f.fuel_po, f.fuel_amount,
                bv.odometer, b.delivery_date AS record_date, r.remarks
                FROM `{$tables['bk_fuel_trip']}` f
                LEFT JOIN `{$tables['bookings']}` b ON b.booking_id = f.booking_id
                LEFT JOIN `{$tables['bk_vehicles']}` bv ON bv.booking_id = b.booking_id
                LEFT JOIN `{$tables['vehicles']}` v ON v.vehicle_id = bv.vehicle_id
                LEFT JOIN `{$tables['vh_manufacturers']}` vm ON vm.vehicle_manufacturer_id = v.vehicle_manufacturer_id
                LEFT JOIN `{$tables['vh_types']}` vt ON vt.vehicle_type_id = v.vehicle_type_id
                LEFT JOIN `{$tables['bk_references']}` r ON r.booking_id = b.booking_id
                ORDER BY f.bk_fuel_trip_id DESC");
            reportJson($stmt->fetchAll());

        case 'operational-expenses':
            reportJson([]);

        default:
            reportJson(['error' => 'Unknown report'], 400);
    }
} catch (PDOException $e) {
    error_log('Report query failed: ' . $e->getMessage());
    reportJson(['error' => 'Unable to load report'], 500);
}
