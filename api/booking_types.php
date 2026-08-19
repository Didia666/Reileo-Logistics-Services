<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('booking_types');

$stmt = $db->query("SELECT booking_type_id, booking_type, status FROM `{$tbl}` ORDER BY sort_order, booking_type ASC");
echo json_encode($stmt->fetchAll());
