<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('item_types');

$stmt = $db->query("SELECT item_type_id, item_type, status FROM `{$tbl}` ORDER BY item_type ASC");
echo json_encode($stmt->fetchAll());
