<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('destination');

$stmt = $db->query("SELECT destination_id, destination, status FROM `{$tbl}` ORDER BY destination ASC");
echo json_encode($stmt->fetchAll());
