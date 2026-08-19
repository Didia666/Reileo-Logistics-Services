<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tbl = tableName('customers');

$stmt = $db->query("SELECT c.customer_id, c.customer_name, c.contact_number, c.e_mail_id, c.status
                    FROM `{$tbl}` c
                    ORDER BY c.customer_name ASC");
echo json_encode($stmt->fetchAll());
