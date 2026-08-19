<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('vendor');

$stmt = $db->query("SELECT vendor_id, vendor_name, contact_number, status FROM `{$tbl}` ORDER BY vendor_name ASC");
echo json_encode($stmt->fetchAll());
