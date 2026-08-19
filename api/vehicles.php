<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('vehicle');
$modTbl = tableName('vh_models');
$manTbl = tableName('vh_manufactures');
$venTbl = tableName('vendor');

$subconOnly = isset($_GET['subcon']) && $_GET['subcon'] === '1';
$statusFilter = $_GET['status'] ?? 'Active';

$sql = "SELECT v.vehicle_id, v.plate_no, v.body_no, v.status,
               m.vehicle_model, mf.vehicle_manufacturer,
               vd.vendor_id, vd.vendor_name,
               ct.category_type
        FROM `{$tbl}` v
        LEFT JOIN `{$modTbl}` m ON v.vehicle_model_id = m.vehicle_model_id
        LEFT JOIN `{$manTbl}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
        LEFT JOIN `{$venTbl}` vd ON v.fuel_type_id = vd.vendor_id
        LEFT JOIN `{$tbl}_category_types` ct ON v.category_type_id = ct.category_type_id
        WHERE 1=1";
$params = [];
if ($statusFilter && $statusFilter !== 'all') {
    $sql .= " AND v.status = ?";
    $params[] = $statusFilter;
}
if ($subconOnly) {
    $sql .= " AND v.asset_no = 'Subcon'";
}
$sql .= " ORDER BY v.plate_no ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
echo json_encode($stmt->fetchAll());
