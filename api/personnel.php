<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('personnel');

$statusFilter = $_GET['status'] ?? 'Active';

$sql = "SELECT p.personnel_id, p.last_name, p.first_name, p.middle_name,
               p.address_text, p.contact_number, p.e_mail_id,
               p.gender, p.status, pt.personnel_type
        FROM `{$tbl}` p
        LEFT JOIN `{$tbl}_types` pt ON p.`type_id` = pt.p_type_id
        WHERE 1=1";
$params = [];
if ($statusFilter && $statusFilter !== 'all') {
    $sql .= " AND p.status = ?";
    $params[] = $statusFilter;
}
$sql .= " ORDER BY p.last_name ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);

$rows = $stmt->fetchAll();
foreach ($rows as &$r) {
    $full = trim(($r['first_name'] ?? '') . ' ' . ($r['middle_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
    $r['full_name'] = preg_replace('/\s+/', ' ', $full);
}
echo json_encode($rows);
