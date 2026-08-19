<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('origin');

$stmt = $db->query("SELECT origin_id, origins AS origin_name, status FROM `{$tbl}` ORDER BY origins ASC");
echo json_encode($stmt->fetchAll());
