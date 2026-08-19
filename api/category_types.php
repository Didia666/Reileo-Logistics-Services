<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('category_types');

$stmt = $db->query("SELECT category_type_id, category_type, status FROM `{$tbl}` ORDER BY category_type ASC");
echo json_encode($stmt->fetchAll());
