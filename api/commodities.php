<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('commodity_type');

$stmt = $db->query("SELECT commodity_type_id, commodity_type, status FROM `{$tbl}` ORDER BY commodity_type ASC");
echo json_encode($stmt->fetchAll());
