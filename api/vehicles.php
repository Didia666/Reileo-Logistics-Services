<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();

$T = [
    'T' => tableName('vehicle'),
    'T_models' => tableName('vh_models'),
    'T_manufactures' => tableName('vh_manufacturers'),
    'T_types' => tableName('vh_types'),
    'T_categories' => tableName('category_types'),
    'T_vendor' => tableName('vendor'),
    'ts' => tableName('vehicle_status')
];
    // $tbl = tableName('vehicle');
    // $modTbl = tableName('vh_models');
    // $manTbl = tableName('vh_manufactures');
    // $venTbl = tableName('vendor');
$subconOnly = isset($_GET['subcon']) && $_GET['subcon'] === '1';
$statusFilter = $_GET['status'] ?? 'Active';

function vehiclesBaseQuery($T) {
    return "SELECT v.vehicle_id, v.plate_no, v.body_no,
               m.vehicle_model, mf.vehicle_manufacturer,
               vt.vehicle_type,
               vd.vendor_id, vd.vendor_name,
               ct.category_type,
               v.status_id
        FROM `{$T['T']}` v
        LEFT JOIN `{$T['T_models']}` m ON v.vehicle_model_id = m.vehicle_model_id
        LEFT JOIN `{$T['T_manufactures']}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
        LEFT JOIN `{$T['T_types']}` vt ON v.vehicle_type_id = vt.vehicle_type_id
        LEFT JOIN `{$T['T_vendor']}` vd ON v.vendor_id = vd.vendor_id
        LEFT JOIN `{$T['T_categories']}` ct ON v.category_type_id = ct.category_type_id
        LEFT JOIN `{$T['ts']}` vs ON v.status_id = vs.status_id";
}

function fetchRows($db, $T, $filters) {
    $sql = vehiclesBaseQuery($T) . " WHERE 1=1";
    $params = [];
    if (!empty($filters['status_id'])) {
        $sql .= " AND bs.status_id = ?";
        $params[] = $filters['status_id'];
    }
    if (!empty($filters['status_name'])) {
        $sql .= " AND bs.status_name = ?";
        $params[] = $filters['status_name'];
    }
    $sql .= " ORDER BY b.created_at DESC";
    if (isset($filters['limit']) && $filters['limit'] > 0) {
        $sql .= " LIMIT ?";
        $params[] = (int)$filters['limit'];
        if (isset($filters['offset'])) {
            $sql .= " OFFSET ?";
            $params[] = (int)$filters['offset'];
        }
    }
    $stmt = $db->prepare($sql);
    foreach ($params as $i => $p) {
        $type = is_int($p) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue($i + 1, $p, $type);
    }
    $stmt->execute();
    return $stmt->fetchAll();
}
$sql = "SELECT v.vehicle_id, v.plate_no, v.body_no,
               m.vehicle_model, mf.vehicle_manufacturer,
               vt.vehicle_type,
               vd.vendor_id, vd.vendor_name,
               ct.category_type,
               v.status_id, vs.status_name, vs.sort_order
        FROM `{$T['T']}` v
        LEFT JOIN `{$T['T_models']}` m ON v.vehicle_model_id = m.vehicle_model_id
        LEFT JOIN `{$T['T_manufactures']}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
        LEFT JOIN `{$T['T_types']}` vt ON v.vehicle_type_id = vt.vehicle_type_id
        LEFT JOIN `{$T['T_vendor']}` vd ON v.vendor_id = vd.vendor_id
        LEFT JOIN `{$T['T_categories']}` ct ON v.category_type_id = ct.category_type_id
        LEFT JOIN `{$T['ts']}` vs ON v.status_id = vs.status_id
        WHERE 1=1";
// $params = [];
// if ($statusFilter && $statusFilter !== 'all') {
//     $sql .= " AND v.status = ?";
//     $params[] = $statusFilter;
// }
// if ($subconOnly) {
//     $sql .= " AND v.asset_no = 'Subcon'";
// }
// $sql .= " ORDER BY v.plate_no ASC";

$stmt = $db->prepare($sql);
$stmt->execute();
echo json_encode($stmt->fetchAll());
