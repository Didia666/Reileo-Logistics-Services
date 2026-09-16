<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';
requireAuth();

$db = getDB();
$tblVendor = tableName('vendor');
$tblEmail = tableName('v_email');
$tblType = tableName('v_types');
$tblTax = tableName('tax_types');

function echoJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function normalizeVendorRow($row) {
    if (!is_array($row)) return $row;
    $row['vendor_id'] = (int)($row['vendor_id'] ?? 0);
    $row['vendor_type_id'] = isset($row['vendor_type_id']) ? (int)$row['vendor_type_id'] : null;
    $row['tax_type_id'] = isset($row['tax_type_id']) ? (int)$row['tax_type_id'] : null;
    $row['status'] = $row['status'] ?? 'Active';
    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

if (isset($_GET['schema']) || isset($_GET['describe'])) {
    echoJson([
        'success' => true,
        'table' => $tblVendor,
        'idField' => 'vendor_id',
        'nameField' => 'vendor_name',
        'statusField' => 'status',
        'allowedFields' => ['vendor_id', 'vendor_name', 'contact_number', 'v_email_id', 'address_one', 'address_two', 'owner_name', 'owner_contact_no', 'coordinator_name', 'coordinator_contact_no', 'term', 'date_started', 'date_separated', 'vendor_type_id', 'tax_type_id', 'status']
    ]);
}

function resolveLookupId($db, $table, $nameCol, $idCol, $value, $label, $status = 'Active') {
    $value = trim((string)$value);
    if ($value === '') return null;

    $stmt = $db->prepare("SELECT `{$idCol}` FROM `{$table}` WHERE `{$nameCol}` = ? LIMIT 1");
    $stmt->execute([$value]);
    $row = $stmt->fetch();
    if ($row) return (int)$row[$idCol];

    $stmt = $db->prepare("INSERT INTO `{$table}` (`{$nameCol}`, `status`) VALUES (?, ?)");
    $stmt->execute([$value, $status]);
    return (int)$db->lastInsertId();
}

switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $search = trim($_GET['search'] ?? '');
        $status = $_GET['status'] ?? 'all';

        $sql = "SELECT v.vendor_id, v.vendor_name, v.contact_number, ve.email AS email_address, v.address_one, v.address_two, v.owner_name, v.owner_contact_no, v.coordinator_name, v.coordinator_contact_no, v.term, v.date_started, v.date_separated, v.vendor_type_id, vt.vendor_type, v.tax_type_id, tt.tax_type, v.status
                FROM `{$tblVendor}` v
                LEFT JOIN `{$tblEmail}` ve ON ve.v_email_id = v.v_email_id
                LEFT JOIN `{$tblType}` vt ON vt.vendor_type_id = v.vendor_type_id
                LEFT JOIN `{$tblTax}` tt ON tt.tax_type_id = v.tax_type_id
                WHERE 1=1";
        $params = [];

        if ($id > 0) {
            $sql .= ' AND v.vendor_id = ?';
            $params[] = $id;
        }

        if ($search !== '') {
            $like = "%{$search}%";
            $sql .= ' AND (v.vendor_name LIKE ? OR v.contact_number LIKE ? OR v.address_one LIKE ? OR ve.email LIKE ?)';
            $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like;
        }

        if ($status !== 'all') {
            $sql .= ' AND v.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY v.vendor_name ASC';

        try {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            $rows = array_map('normalizeVendorRow', $rows);
            if ($id > 0) {
                if (!$rows) echoJson(['error' => 'Vendor not found'], 404);
                echoJson($rows[0]);
            }
            echoJson($rows);
        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $vendor_name = trim((string)($input['vendor_name'] ?? ''));
        $contact_number = trim((string)($input['contact_number'] ?? ''));
        $email_address = trim((string)($input['email_address'] ?? ($input['email'] ?? '')));
        $address_one = trim((string)($input['address_one'] ?? ($input['address_1'] ?? '')));
        $address_two = trim((string)($input['address_two'] ?? ($input['address_2'] ?? '')));
        $owner_name = trim((string)($input['owner_name'] ?? ''));
        $owner_contact_no = trim((string)($input['owner_contact_no'] ?? ''));
        $coordinator_name = trim((string)($input['coordinator_name'] ?? ''));
        $coordinator_contact_no = trim((string)($input['coordinator_contact_no'] ?? ''));
        $term = trim((string)($input['term'] ?? ''));
        $date_started = !empty($input['date_started']) ? $input['date_started'] : null;
        $date_separated = !empty($input['date_separated']) ? $input['date_separated'] : null;
        $vendor_type_id = isset($input['vendor_type_id']) ? (int)$input['vendor_type_id'] : 0;
        $tax_type_id = isset($input['tax_type_id']) ? (int)$input['tax_type_id'] : 0;
        $status = $input['status'] ?? 'Active';

        if ($vendor_name === '') echoJson(['error' => 'Vendor Name is required'], 400);
        if ($contact_number === '') echoJson(['error' => 'Contact Number is required'], 400);
        if ($address_one === '') echoJson(['error' => 'Address 1 is required'], 400);
        if ($coordinator_name === '') echoJson(["error" => "Coordinator's Name is required"], 400);
        if ($coordinator_contact_no === '') echoJson(["error" => "Coordinator's Contact No. is required"], 400);
        if ($vendor_type_id <= 0) echoJson(['error' => 'Vendor Type is required'], 400);
        if ($tax_type_id <= 0) echoJson(['error' => 'Tax Type is required'], 400);

        try {
            $db->beginTransaction();

            $email_id = null;
            if ($email_address !== '') {
                $stmt = $db->prepare("SELECT v_email_id FROM `{$tblEmail}` WHERE email = ? LIMIT 1");
                $stmt->execute([$email_address]);
                $existing = $stmt->fetch();
                if ($existing) {
                    $email_id = (int)$existing['v_email_id'];
                } else {
                    $stmt = $db->prepare("INSERT INTO `{$tblEmail}` (email) VALUES (?)");
                    $stmt->execute([$email_address]);
                    $email_id = (int)$db->lastInsertId();
                }
            }

            if ($email_id === null) {
                $stmt = $db->prepare("SELECT v_email_id FROM `{$tblEmail}` ORDER BY v_email_id DESC LIMIT 1");
                $stmt->execute();
                $existing = $stmt->fetch();
                $email_id = $existing ? (int)$existing['v_email_id'] : null;
            }

            $stmt = $db->prepare("INSERT INTO `{$tblVendor}` (vendor_name, contact_number, v_email_id, address_one, address_two, owner_name, owner_contact_no, coordinator_name, coordinator_contact_no, term, date_started, date_separated, vendor_type_id, tax_type_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $vendor_name,
                $contact_number,
                $email_id,
                $address_one,
                $address_two !== '' ? $address_two : null,
                $owner_name !== '' ? $owner_name : null,
                $owner_contact_no !== '' ? $owner_contact_no : null,
                $coordinator_name !== '' ? $coordinator_name : null,
                $coordinator_contact_no !== '' ? $coordinator_contact_no : null,
                $term !== '' ? $term : null,
                $date_started,
                $date_separated,
                $vendor_type_id,
                $tax_type_id,
                $status,
            ]);

            $vendor_id = (int)$db->lastInsertId();
            $db->commit();

            $stmt = $db->prepare("SELECT v.vendor_id, v.vendor_name, v.contact_number, ve.email AS email_address, v.address_one, v.address_two, v.owner_name, v.owner_contact_no, v.coordinator_name, v.coordinator_contact_no, v.term, v.date_started, v.date_separated, v.vendor_type_id, vt.vendor_type, v.tax_type_id, tt.tax_type, v.status
                FROM `{$tblVendor}` v
                LEFT JOIN `{$tblEmail}` ve ON ve.v_email_id = v.v_email_id
                LEFT JOIN `{$tblType}` vt ON vt.vendor_type_id = v.vendor_type_id
                LEFT JOIN `{$tblTax}` tt ON tt.tax_type_id = v.tax_type_id
                WHERE v.vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $row = $stmt->fetch();
            echoJson(['success' => true, 'data' => normalizeVendorRow($row)]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) echoJson(['error' => 'Vendor ID is required'], 400);

        $vendor_name = trim((string)($input['vendor_name'] ?? ''));
        $contact_number = trim((string)($input['contact_number'] ?? ''));
        $email_address = trim((string)($input['email_address'] ?? ($input['email'] ?? '')));
        $address_one = trim((string)($input['address_one'] ?? ($input['address_1'] ?? '')));
        $address_two = trim((string)($input['address_two'] ?? ($input['address_2'] ?? '')));
        $owner_name = trim((string)($input['owner_name'] ?? ''));
        $owner_contact_no = trim((string)($input['owner_contact_no'] ?? ''));
        $coordinator_name = trim((string)($input['coordinator_name'] ?? ''));
        $coordinator_contact_no = trim((string)($input['coordinator_contact_no'] ?? ''));
        $term = trim((string)($input['term'] ?? ''));
        $date_started = !empty($input['date_started']) ? $input['date_started'] : null;
        $date_separated = !empty($input['date_separated']) ? $input['date_separated'] : null;
        $vendor_type_id = isset($input['vendor_type_id']) ? (int)$input['vendor_type_id'] : 0;
        $tax_type_id = isset($input['tax_type_id']) ? (int)$input['tax_type_id'] : 0;
        $status = $input['status'] ?? 'Active';

        if ($vendor_name === '') echoJson(['error' => 'Vendor Name is required'], 400);
        if ($contact_number === '') echoJson(['error' => 'Contact Number is required'], 400);
        if ($address_one === '') echoJson(['error' => 'Address 1 is required'], 400);
        if ($coordinator_name === '') echoJson(["error" => "Coordinator's Name is required"], 400);
        if ($coordinator_contact_no === '') echoJson(["error" => "Coordinator's Contact No. is required"], 400);
        if ($vendor_type_id <= 0) echoJson(['error' => 'Vendor Type is required'], 400);
        if ($tax_type_id <= 0) echoJson(['error' => 'Tax Type is required'], 400);

        try {
            $db->beginTransaction();

            $email_id = null;
            if ($email_address !== '') {
                $stmt = $db->prepare("SELECT v_email_id FROM `{$tblEmail}` WHERE email = ? LIMIT 1");
                $stmt->execute([$email_address]);
                $existing = $stmt->fetch();
                if ($existing) {
                    $email_id = (int)$existing['v_email_id'];
                } else {
                    $stmt = $db->prepare("INSERT INTO `{$tblEmail}` (email) VALUES (?)");
                    $stmt->execute([$email_address]);
                    $email_id = (int)$db->lastInsertId();
                }
            }

            $setParts = [
                '`vendor_name` = ?',
                '`contact_number` = ?',
                '`address_one` = ?',
                '`address_two` = ?',
                '`owner_name` = ?',
                '`owner_contact_no` = ?',
                '`coordinator_name` = ?',
                '`coordinator_contact_no` = ?',
                '`term` = ?',
                '`date_started` = ?',
                '`date_separated` = ?',
                '`vendor_type_id` = ?',
                '`tax_type_id` = ?',
                '`status` = ?'
            ];
            $values = [$vendor_name, $contact_number, $address_one, ($address_two !== '' ? $address_two : null), ($owner_name !== '' ? $owner_name : null), ($owner_contact_no !== '' ? $owner_contact_no : null), ($coordinator_name !== '' ? $coordinator_name : null), ($coordinator_contact_no !== '' ? $coordinator_contact_no : null), ($term !== '' ? $term : null), $date_started, $date_separated, $vendor_type_id, $tax_type_id, $status];

            if ($email_id !== null) {
                $setParts[] = '`v_email_id` = ?';
                $values[] = $email_id;
            }

            $values[] = $id;
            $sql = "UPDATE `{$tblVendor}` SET " . implode(', ', $setParts) . " WHERE `vendor_id` = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($values);

            $db->commit();

            $stmt = $db->prepare("SELECT v.vendor_id, v.vendor_name, v.contact_number, ve.email AS email_address, v.address_one, v.address_two, v.owner_name, v.owner_contact_no, v.coordinator_name, v.coordinator_contact_no, v.term, v.date_started, v.date_separated, v.vendor_type_id, vt.vendor_type, v.tax_type_id, tt.tax_type, v.status
                FROM `{$tblVendor}` v
                LEFT JOIN `{$tblEmail}` ve ON ve.v_email_id = v.v_email_id
                LEFT JOIN `{$tblType}` vt ON vt.vendor_type_id = v.vendor_type_id
                LEFT JOIN `{$tblTax}` tt ON tt.tax_type_id = v.tax_type_id
                WHERE v.vendor_id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) echoJson(['error' => 'Vendor not found'], 404);
            echoJson(['success' => true, 'data' => normalizeVendorRow($row)]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) echoJson(['error' => 'Vendor ID is required'], 400);

        try {
            $db->beginTransaction();
            $stmt = $db->prepare("DELETE FROM `{$tblVendor}` WHERE `vendor_id` = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() === 0) {
                $db->rollBack();
                echoJson(['error' => 'Delete failed: vendor not found'], 404);
            }
            $db->commit();
            echoJson(['success' => true]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    default:
        echoJson(['error' => 'Method not allowed'], 405);
}

