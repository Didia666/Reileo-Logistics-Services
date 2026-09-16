<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$report = $_GET['report'] ?? '';

function reportJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

try {
    switch ($report) {
        case 'bookings':
            $stmt = $db->query("SELECT b.booking_id, b.booking_no, b.delivery_date,
                b.customer_id, c.customer_name, b.booking_type_id, bt.book_type AS booking_type,
                b.commodity_type_id, ct.commodity_type, bs.status_name, d.depot_id, d.depot_name,
                b.origin_id, o.origin_name, dest.destination_id, dest.destination_name,
                v.plate_no, v.vehicle_id, v.vendor_id, vd.vendor_name, r.client_ref_no, r.other_ref_no,
                r.remarks, b.route_code, b.trips_number, b.drops_number, f.area, f.trip_allowance,
                f.fuel, f.fuel_po, f.fuel_amount, b.created_at,
                u.username AS created_by,
                (SELECT GROUP_CONCAT(CONCAT_WS(' ', dp.first_name, dp.middle_name, dp.last_name) SEPARATOR ', ')
                 FROM booking_personnel dbp
                 JOIN personnel dp ON dp.personnel_id = dbp.personnel_id
                 WHERE dbp.booking_id = b.booking_id AND dbp.assignment_role = 'driver') AS driver,
                (SELECT GROUP_CONCAT(CONCAT_WS(' ', hp.first_name, hp.middle_name, hp.last_name) SEPARATOR ', ')
                 FROM booking_personnel hbp
                 JOIN personnel hp ON hp.personnel_id = hbp.personnel_id
                 WHERE hbp.booking_id = b.booking_id AND hbp.assignment_role = 'helper1') AS helper1,
                (SELECT GROUP_CONCAT(CONCAT_WS(' ', h2p.first_name, h2p.middle_name, h2p.last_name) SEPARATOR ', ')
                 FROM booking_personnel h2bp
                 JOIN personnel h2p ON h2p.personnel_id = h2bp.personnel_id
                 WHERE h2bp.booking_id = b.booking_id AND h2bp.assignment_role = 'helper2') AS helper2,
                vt.vehicle_type,
                NULL AS subcon
                FROM bookings b
                LEFT JOIN customers c ON c.customer_id = b.customer_id
                LEFT JOIN booking_types bt ON bt.booking_type_id = b.booking_type_id
                LEFT JOIN booking_statuses bs ON bs.status_id = b.status_id
                LEFT JOIN depots d ON d.depot_id = b.depot_id
                LEFT JOIN origin o ON o.origin_id = b.origin_id
                LEFT JOIN destination dest ON dest.destination_id = b.destination_id
                LEFT JOIN commodity_type ct ON ct.commodity_type_id = b.commodity_type_id
                LEFT JOIN vehicles v ON v.vehicle_id = b.vehicle_id
                LEFT JOIN vh_types vt ON vt.vehicle_type_id = v.vehicle_type_id
                LEFT JOIN vendor vd ON vd.vendor_id = v.vendor_id
                LEFT JOIN bk_references r ON r.booking_id = b.booking_id
                LEFT JOIN bk_fuel_trip f ON f.booking_id = b.booking_id
                LEFT JOIN reileo_logistics_services_users u ON u.user_id = b.created_by
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
                FROM vehicles v
                LEFT JOIN vh_types vt ON vt.vehicle_type_id = v.vehicle_type_id
                LEFT JOIN vh_manufacturers vm ON vm.vehicle_manufacturer_id = v.vehicle_manufacturer_id
                LEFT JOIN vh_models vmo ON vmo.vehicle_model_id = v.vehicle_model_id
                LEFT JOIN vehicle_statuses vs ON vs.status_id = v.status_id
                LEFT JOIN vendor vd ON vd.vendor_id = v.vendor_id
                LEFT JOIN vh_location vl ON vl.vehicle_id = v.vehicle_id
                LEFT JOIN depots d ON d.depot_id = vl.depot_id
                LEFT JOIN origin o ON o.origin_id = vl.origin_id
                LEFT JOIN commodity_type ct ON ct.commodity_type_id = v.commodity_type_id
                LEFT JOIN category_types cty ON cty.category_type_id = v.category_type_id
                LEFT JOIN vh_insurance vi ON vi.vehicle_id = v.vehicle_id
                LEFT JOIN vh_regist_compli vrc ON vrc.vehicle_id = v.vehicle_id
                LEFT JOIN vh_acquisition va ON va.vehicle_id = v.vehicle_id
                LEFT JOIN vh_specifications specs ON specs.vehicle_id = v.vehicle_id
                ORDER BY v.vehicle_id DESC");
            reportJson($stmt->fetchAll());

        case 'personnel-settlement':
            $stmt = $db->query("SELECT p.personnel_id,
                CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) AS full_name,
                pt.personnel_type, p.status, em.daily_rate, v.vendor_name
                FROM personnel p
                LEFT JOIN p_employment em ON em.personnel_id = p.personnel_id
                LEFT JOIN p_types pt ON pt.personnel_type_id = em.personnel_type_id
                LEFT JOIN vendor v ON v.vendor_id = em.vendor_id
                ORDER BY p.personnel_id DESC");
            reportJson($stmt->fetchAll());

        case 'fuel':
            $stmt = $db->query("SELECT f.bk_fuel_trip_id, f.booking_id, b.booking_no,
                f.area, f.trip_allowance, f.fuel, f.fuel_po, f.fuel_amount
                FROM bk_fuel_trip f
                LEFT JOIN bookings b ON b.booking_id = f.booking_id
                ORDER BY f.bk_fuel_trip_id DESC");
            reportJson($stmt->fetchAll());

        case 'operational-expenses':
            reportJson([]);

        default:
            reportJson(['error' => 'Unknown report'], 400);
    }
} catch (PDOException $e) {
    reportJson(['error' => 'Unable to load report'], 500);
}
