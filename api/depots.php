<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('depots');

$stmt = $db->query("SELECT depot_id, depot_name, status FROM `{$tbl}` ORDER BY depot_name ASC");
echo json_encode($stmt->fetchAll());
