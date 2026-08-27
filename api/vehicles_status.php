<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('vehicles_status');

$stmt = $db->query("SELECT status_id, status_name, sort_order FROM `{$tbl}` ORDER BY sort_order ASC");
echo json_encode($stmt->fetchAll());
