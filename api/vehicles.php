<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();

$tblVehicles = tableName('vehicles');
$tblTypes = tableName('vh_types');
$tblModels = tableName('vh_models');
$tblManufacturers = tableName('vh_manufacturers');
$tblVehicleStatuses = tableName('vehicle_statuses');
$tblAcquisition = tableName('vh_acquisition');
$tblDocuments = tableName('vh_documents');
$tblInsurance = tableName('vh_insurance');
$tblLocation = tableName('vh_location');
$tblPhotos = tableName('vh_photos');
$tblRegistrationCompliance = tableName('vh_regist_compli');
$tblSpecifications = tableName('vh_specifications');
$tblCommodityTypes = tableName('commodity_type');
$tblCategoryTypes = tableName('category_types');
$tblOrigins = tableName('origin');
$tblDepots = tableName('depots');
$tblVendors = tableName('vendor');


$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    $input = $raw ? (json_decode($raw, true) ?: []) : [];
}

function echoJson($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}


function listSql($tblV, $tblModels, $tblManufacturers, $tblTypes, $tblCategories, $tblVendor, $tblStatuses, $tblLocation, $tblOrigins, $tblDepots) {
    return "SELECT
                    v.vehicle_id,
                    v.plate_no,
                    v.body_no,
                    v.status_id,
                    vs.status_name,
                    vt.vehicle_type,
                    mf.vehicle_manufacturer,
                    m.vehicle_model,
                    v.year,
                    ct.category_type,
                    vd.vendor_id,
                    vd.vendor_name,
                    vl.origin_id,
                    o.origin_name,
                    vl.depot_id,
                    d.depot_name,
                    vl.GPS,
                    vs.sort_order
            FROM `{$tblV}` v
            LEFT JOIN `{$tblModels}` m ON v.vehicle_model_id = m.vehicle_model_id
            LEFT JOIN `{$tblManufacturers}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
            LEFT JOIN `{$tblTypes}` vt ON v.vehicle_type_id = vt.vehicle_type_id
            LEFT JOIN `{$tblVendor}` vd ON v.vendor_id = vd.vendor_id
            LEFT JOIN `{$tblCategories}` ct ON v.category_type_id = ct.category_type_id
            LEFT JOIN `{$tblStatuses}` vs ON v.status_id = vs.status_id
            LEFT JOIN `{$tblLocation}` vl ON v.vehicle_id = vl.vehicle_id
            LEFT JOIN `{$tblOrigins}` o ON vl.origin_id = o.origin_id
            LEFT JOIN `{$tblDepots}` d ON vl.depot_id = d.depot_id
            ORDER BY v.plate_no ASC";
}

function detailSql(
    $tblV,
    $tblVS,
    $tblA,
    $tblI,
    $tblL,
    $tblM,
    $tblMo,
    $tblRC,
    $tblS,
    $tblT,
    $tblCo,
    $tblCa,
    $tblO,
    $tblDe,
    $tblVendors
) {
    return "SELECT
                    v.vehicle_id,
                    v.plate_no,
                    v.body_no,
                    v.status_id,
                    vstatus.status_name,
                    v.vehicle_type_id,
                    vt.vehicle_type,
                    v.vehicle_manufacturer_id,
                    vma.vehicle_manufacturer,
                    v.vehicle_model_id,
                    vmo.vehicle_model,
                    v.year AS year_model,
                    v.commodity_type_id AS commodity_id,
                    vco.commodity_type,
                    v.asset_no,
                    v.category_type_id,
                    vca.category_type,
                    v.vendor_id,
                    vend.vendor_name,
                    vl.origin_id,
                    o.origin_name,
                    vl.depot_id,
                    d.depot_name,
                    vl.GPS,
                    vrc.or_date,
                    vrc.or_number,
                    vrc.cr_date,
                    vrc.cr_number,
                    vrc.ltfrb_case_no,
                    vrc.ltfrb_expiry,
                    vrc.mv_file_no,
                    vrc.pa_expiry,
                    vrc.late_renewal_date,
                    vrc.registration_type,
                    vrc.registration_date,
                    vrc.rfid_type,
                    vrc.rfid_account_no,
                    vi.insurance_provider,
                    vi.insurance_policy_no,
                    vi.insurance_expiry,
                    vi.inland_marine_policy_no,
                    vi.inland_marine_expiry,
                    va.acquisition_date,
                    va.acquisition_price,
                    va.breakdown_date,
                    va.breakdown_remarks,
                    va.remarks,
                    specs.chassis_no,
                    specs.color,
                    specs.engine_no,
                    specs.engine_size,
                    specs.fuel_type_id,
                    specs.transmission_type
            FROM `{$tblV}` v
            LEFT JOIN `{$tblVS}` vstatus ON v.status_id = vstatus.status_id
            LEFT JOIN `{$tblT}` vt ON v.vehicle_type_id = vt.vehicle_type_id
            LEFT JOIN `{$tblM}` vma ON v.vehicle_manufacturer_id = vma.vehicle_manufacturer_id
            LEFT JOIN `{$tblMo}` vmo ON v.vehicle_model_id = vmo.vehicle_model_id
            LEFT JOIN `{$tblCo}` vco ON v.commodity_type_id = vco.commodity_id
            LEFT JOIN `{$tblCa}` vca ON v.category_type_id = vca.category_type_id
            LEFT JOIN `{$tblVendors}` vend ON v.vendor_id = vend.vendor_id
            LEFT JOIN `{$tblL}` vl ON v.vehicle_id = vl.vehicle_id
            LEFT JOIN `{$tblO}` o ON vl.origin_id = o.origin_id
            LEFT JOIN `{$tblDe}` d ON vl.depot_id = d.depot_id
            LEFT JOIN `{$tblA}` va ON v.vehicle_id = va.vehicle_id
            LEFT JOIN `{$tblI}` vi ON v.vehicle_id = vi.vehicle_id
            LEFT JOIN `{$tblRC}` vrc ON v.vehicle_id = vrc.vehicle_id
            LEFT JOIN `{$tblS}` specs ON v.vehicle_id = specs.vehicle_id";
}

switch ($method) {

    case 'GET':
        try {
            if ($id > 0) {
                $detailSql = detailSql(
                    $tblVehicles,
                    $tblVehicleStatuses,
                    $tblAcquisition,
                    $tblInsurance,
                    $tblLocation,
                    $tblManufacturers,
                    $tblModels,
                    $tblRegistrationCompliance,
                    $tblSpecifications,
                    $tblTypes,
                    $tblCommodityTypes,
                    $tblCategoryTypes,
                    $tblOrigins,
                    $tblDepots,
                    $tblVendors
                );

                $detailSql .= " WHERE v.vehicle_id = ? LIMIT 1";

                $stmt = $db->prepare($detailSql);
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) echoJson(['error' => 'Vehicle not found'], 404);

                $stmtPhotos = $db->prepare("SELECT * FROM `{$tblPhotos}` WHERE vehicle_id = ? ORDER BY vh_photos_id ASC");
                $stmtPhotos->execute([$id]);
                $row['vh_photos'] = $stmtPhotos->fetchAll() ?: [];

                $stmtDocs = $db->prepare("SELECT * FROM `{$tblDocuments}` WHERE vehicle_id = ? ORDER BY vh_documents_id ASC");
                $stmtDocs->execute([$id]);
                $row['vh_documents'] = $stmtDocs->fetchAll() ?: [];

                echoJson($row);
            }

            $statusFilter = $_GET['status'] ?? 'all';
            $search = trim($_GET['search'] ?? '');
            $params = [];
            $baseSql = listSql(
                $tblVehicles,
                $tblModels,
                $tblManufacturers,
                $tblTypes,
                $tblCategoryTypes,
                $tblVendors,
                $tblVehicleStatuses,
                $tblLocation,
                $tblOrigins,
                $tblDepots
            );
            $where = " WHERE 1=1";
            if ($statusFilter && $statusFilter !== 'all') {
                $where .= " AND v.status = ?";
                $params[] = $statusFilter;
            }
            if ($search !== '') {
                $where .= " AND (v.plate_no LIKE ? OR v.body_no LIKE ?)
                            OR (v.vehicle_type LIKE ? OR v.vehicle_manufacturer LIKE ?)
                            OR (v.vehicle_model LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            $sql = listSql($tblVehicles, $tblModels, $tblManufacturers, $tblTypes, $tblCategoryTypes, $tblVendors, $tblVehicleStatuses, $tblLocation, $tblOrigins, $tblDepots);
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $rows = $stmt->fetchAll();
            echoJson($rows);

        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;
    // case 'POST':
    //     $
}

// $subconOnly = isset($_GET['subcon']) && $_GET['subcon'] === '1';
// $statusFilter = $_GET['status'] ?? 'Active';

// function vehiclesBaseQuery($T) {
//     return "SELECT v.vehicle_id, v.plate_no, v.body_no,
//                m.vehicle_model, mf.vehicle_manufacturer,
//                vt.vehicle_type,
//                vd.vendor_id, vd.vendor_name,
//                ct.category_type,
//                v.status_id
//         FROM `{$T['T']}` v
//         LEFT JOIN `{$T['T_models']}` m ON v.vehicle_model_id = m.vehicle_model_id
//         LEFT JOIN `{$T['T_manufactures']}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
//         LEFT JOIN `{$T['T_types']}` vt ON v.vehicle_type_id = vt.vehicle_type_id
//         LEFT JOIN `{$T['T_vendor']}` vd ON v.vendor_id = vd.vendor_id
//         LEFT JOIN `{$T['T_categories']}` ct ON v.category_type_id = ct.category_type_id
//         LEFT JOIN `{$T['ts']}` vs ON v.status_id = vs.status_id";
// }

// function fetchRows($db, $T, $filters) {
//     $sql = vehiclesBaseQuery($T) . " WHERE 1=1";
//     $params = [];
//     if (!empty($filters['status_id'])) {
//         $sql .= " AND bs.status_id = ?";
//         $params[] = $filters['status_id'];
//     }
//     if (!empty($filters['status_name'])) {
//         $sql .= " AND bs.status_name = ?";
//         $params[] = $filters['status_name'];
//     }
//     $sql .= " ORDER BY b.created_at DESC";
//     if (isset($filters['limit']) && $filters['limit'] > 0) {
//         $sql .= " LIMIT ?";
//         $params[] = (int)$filters['limit'];
//         if (isset($filters['offset'])) {
//             $sql .= " OFFSET ?";
//             $params[] = (int)$filters['offset'];
//         }
//     }
//     $stmt = $db->prepare($sql);
//     foreach ($params as $i => $p) {
//         $type = is_int($p) ? PDO::PARAM_INT : PDO::PARAM_STR;
//         $stmt->bindValue($i + 1, $p, $type);
//     }
//     $stmt->execute();
//     return $stmt->fetchAll();
// }
// $sql = "SELECT v.vehicle_id, v.plate_no, v.body_no,
//                m.vehicle_model, mf.vehicle_manufacturer,
//                vt.vehicle_type,
//                vd.vendor_id, vd.vendor_name,
//                ct.category_type,
//                v.status_id, vs.status_name, vs.sort_order
//         FROM `{$T['T']}` v
//         LEFT JOIN `{$T['T_models']}` m ON v.vehicle_model_id = m.vehicle_model_id
//         LEFT JOIN `{$T['T_manufactures']}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
//         LEFT JOIN `{$T['T_types']}` vt ON v.vehicle_type_id = vt.vehicle_type_id
//         LEFT JOIN `{$T['T_vendor']}` vd ON v.vendor_id = vd.vendor_id
//         LEFT JOIN `{$T['T_categories']}` ct ON v.category_type_id = ct.category_type_id
//         LEFT JOIN `{$T['ts']}` vs ON v.status_id = vs.status_id
//         WHERE 1=1";
// // $params = [];
// // if ($statusFilter && $statusFilter !== 'all') {
// //     $sql .= " AND v.status = ?";
// //     $params[] = $statusFilter;
// // }
// // if ($subconOnly) {
// //     $sql .= " AND v.asset_no = 'Subcon'";
// // }
// // $sql .= " ORDER BY v.plate_no ASC";

// $stmt = $db->prepare($sql);
// $stmt->execute();
// echo json_encode($stmt->fetchAll());
