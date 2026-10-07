<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tblCustomers = tableName('customers');
$tblCEmail    = tableName('c_email');
$tblCBank     = tableName('c_bank_info');
$tblDepots    = tableName('depots');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

function echoJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function tableColumns($db, $table) {
    static $cache = [];
    if (isset($cache[$table])) return $cache[$table];
    try {
        $stmt = $db->query("DESCRIBE `{$table}`");
        $cols = array_map('strtolower', array_column($stmt->fetchAll(), 'Field'));
    } catch (PDOException $e) { $cols = []; }
    $cache[$table] = $cols;
    return $cols;
}

function columnExists($db, $table, $col) {
    return in_array(strtolower($col), tableColumns($db, $table), true);
}

$custCols = tableColumns($db, $tblCustomers);
$bankCols = tableColumns($db, $tblCBank);
$emailCols = tableColumns($db, $tblCEmail);

function detectEmailSource($db, $tblCustomers, $tblCEmail, $custCols, $emailCols) {
    $hasCEPk       = in_array('c_email_id', $emailCols, true);
    $hasCEEmail    = in_array('email', $emailCols, true);
    $hasCECustFk   = in_array('customer_id', $emailCols, true);
    $hasCustFkOld  = in_array('e_mail_id', $custCols, true);
    $hasCustFkNew  = in_array('c_email_id', $custCols, true);
    $hasCustFk     = $hasCustFkOld || $hasCustFkNew;
    $fkColName     = $hasCustFkNew ? 'c_email_id' : 'e_mail_id';

    if ($hasCustFk && $hasCEPk && $hasCEEmail) {
        return [
            'mode'      => 'fk',
            'fk'        => $fkColName,
            'joinTbl'   => $tblCEmail,
            'joinPk'    => 'c_email_id',
            'joinCol'   => 'email',
            'circular'  => $hasCECustFk,
        ];
    }
    if (in_array('email', $custCols, true)) {
        return ['mode' => 'direct', 'col' => 'email', 'circular' => false];
    }   
    if (in_array('e_mail_id', $custCols, true)) {
        return ['mode' => 'direct', 'col' => 'e_mail_id', 'circular' => false];
    }
    if (in_array('c_email_id', $custCols, true)) {
        return ['mode' => 'direct', 'col' => 'c_email_id', 'circular' => false];
    }
    return ['mode' => 'none', 'circular' => false];
}

$emailCfg = detectEmailSource($db, $tblCustomers, $tblCEmail, $custCols, $emailCols);

function detectBankInfo($db, $tblCustomers, $tblCBank, $custCols, $bankCols) {
    $hasBankTbl = !empty($bankCols);
    $hasStatusCust = in_array('status', $custCols, true);
    $hasDepotCustNew  = in_array('depot_id', $custCols, true);
    $hasDepotCustOld  = in_array('depot', $custCols, true);
    $hasDepotCust  = $hasDepotCustNew || $hasDepotCustOld;
    $custDepotCol = $hasDepotCustNew ? 'depot_id' : ($hasDepotCustOld ? 'depot' : null);
    $hasBankDepotNew = in_array('depot_id', $bankCols, true);
    $hasBankDepotOld = in_array('depot', $bankCols, true);
    $bankDepotCol = $hasBankDepotNew ? 'depot_id' : ($hasBankDepotOld ? 'depot' : null);

    $info = [
        'use_bank_table' => $hasBankTbl && in_array('customer_id', $bankCols, true),
        'cust_status' => $hasStatusCust,
        'cust_depot'  => $hasDepotCust,
        'cust_depot_col' => $custDepotCol,
        'bank_depot_col' => $bankDepotCol,
        'bank_fields' => [],
    ];

    if ($info['use_bank_table']) {
        foreach (['contact_person','tin','account_code','rate_type','status'] as $f) {
            if (in_array($f, $bankCols, true)) $info['bank_fields'][] = $f;
        }
        if ($bankDepotCol) $info['bank_fields'][] = $bankDepotCol;
    }
    return $info;
}
$bankCfg = detectBankInfo($db, $tblCustomers, $tblCBank, $custCols, $bankCols);

function selectSql($db, $tblCustomers, $tblCBank, $tblDepots, $tblCEmail, $emailCfg, $bankCfg, $custCols, $bankCols) {
    $cFields = ['c.customer_id'];
    foreach (['customer_name','contact_number','address_one','address_two','created_at','updated_at'] as $f) {
        if (in_array($f, $custCols, true)) $cFields[] = "c.{$f}";
    }
    $aliases = [];
    if ($emailCfg['mode'] === 'fk') {
        $cFields[] = "c.{$emailCfg['fk']}";
        $aliases[] = "ce.email AS email";
    } elseif ($emailCfg['mode'] === 'direct') {
        if ($emailCfg['col'] !== 'email') {
            $aliases[] = "c.{$emailCfg['col']} AS email";
        } else {
            $cFields[] = 'c.email';
        }
        if (in_array('e_mail_id', $custCols, true) && !in_array('c.e_mail_id', $cFields, true)) {
            $cFields[] = 'c.e_mail_id';
        }
        if (in_array('c_email_id', $custCols, true) && !in_array('c.c_email_id', $cFields, true)) {
            $cFields[] = 'c.c_email_id';
        }
    } else {
        $aliases[] = "NULL AS email";
        if (in_array('e_mail_id', $custCols, true)) $cFields[] = 'c.e_mail_id';
        if (in_array('c_email_id', $custCols, true)) $cFields[] = 'c.c_email_id';
    }

    $bankSel = [];
    $custDepotCol = $bankCfg['cust_depot_col'] ?? null;
    $bankDepotCol = $bankCfg['bank_depot_col'] ?? null;
    if ($bankCfg['use_bank_table']) {
        $bankSel[] = "bi.c_bank_id";
        foreach ($bankCfg['bank_fields'] as $f) $bankSel[] = "bi.{$f}";
        if ($bankDepotCol && $bankDepotCol === 'depot_id') {
            $bankSel[] = "d.depot_name";
        } else {
            $bankSel[] = "NULL AS depot_name";
        }
    } else {
        if (in_array('contact_person', $custCols, true)) $cFields[] = "c.contact_person";
        if ($custDepotCol) {
            $cFields[] = "c.{$custDepotCol}";
            if ($custDepotCol !== 'depot_id') {
                $aliases[] = "NULL AS depot_name";
            }
        }
        if (in_array('tin', $custCols, true)) $cFields[] = "c.tin";
        if (in_array('account_code', $custCols, true)) $cFields[] = "c.account_code";
        if (in_array('rate_type', $custCols, true)) $cFields[] = "c.rate_type";
        if (in_array('status', $custCols, true)) {
            $cFields[] = "c.status";
            if (!$custDepotCol || $custDepotCol === 'depot_id') {
                $bankSel[] = "NULL AS depot_name";
            }
        } else {
            $bankSel[] = "NULL AS status";
            if (!$custDepotCol || $custDepotCol === 'depot_id') {
                $bankSel[] = "NULL AS depot_name";
            }
        }
    }

    $fields = array_merge($cFields, $aliases, $bankSel);
    $sql = "SELECT " . implode(', ', $fields) . " FROM `{$tblCustomers}` c";
    if ($emailCfg['mode'] === 'fk') {
        $sql .= " LEFT JOIN `{$tblCEmail}` ce ON c.{$emailCfg['fk']} = ce.c_email_id";
    }
    if ($bankCfg['use_bank_table']) {
        $sql .= " LEFT JOIN `{$tblCBank}` bi ON c.customer_id = bi.customer_id";
        if ($bankDepotCol === 'depot_id') {
            $sql .= " LEFT JOIN `{$tblDepots}` d ON bi.depot_id = d.depot_id";
        }
    } elseif ($custDepotCol === 'depot_id') {
        $sql .= " LEFT JOIN `{$tblDepots}` d ON c.depot_id = d.depot_id";
        if (stripos($sql, 'depot_name') === false) {
            $sql = preg_replace('/^SELECT /', 'SELECT d.depot_name, ', $sql, 1);
        }
    }
    return $sql;
}

$selectBase = selectSql($db, $tblCustomers, $tblCBank, $tblDepots, $tblCEmail, $emailCfg, $bankCfg, $custCols, $bankCols);

switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $search = trim($_GET['search'] ?? '');
        $status = $_GET['status'] ?? 'all';

        $sql = $selectBase . " WHERE 1=1";
        $params = [];
        if ($id > 0) { $sql .= " AND c.customer_id = ?"; $params[] = $id; }
        if ($search !== '') {
            $like = "%{$search}%";
            $sql .= " AND (c.customer_name LIKE ? OR c.contact_number LIKE ? OR c.address_one LIKE ?";
            $params[] = $like; $params[] = $like; $params[] = $like;
            if ($emailCfg['mode'] === 'fk') { $sql .= " OR ce.email LIKE ?"; $params[] = $like; }
            elseif ($emailCfg['mode'] === 'direct') { $sql .= " OR c.{$emailCfg['col']} LIKE ?"; $params[] = $like; }
            $sql .= ")";
        }
        if ($status !== 'all') {
            if ($bankCfg['use_bank_table'] && in_array('status', $bankCfg['bank_fields'], true)) {
                $sql .= " AND bi.status = ?";
            } elseif (in_array('status', $custCols, true)) {
                $sql .= " AND c.status = ?";
            }
            $params[] = $status;
        }
        $sql .= " ORDER BY c.customer_name ASC";

        try {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            if ($id > 0) {
                if (!$rows) echoJson(['error' => 'Customer not found'], 404);
                echoJson($rows[0]);
            }
            echoJson($rows);
        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $customer_name  = trim($input['customer_name']  ?? '');
        $contact_number = trim($input['contact_number'] ?? '');
        $emailVal       = trim($input['email']          ?? ($input['c_email_id'] ?? ($input['e_mail_id'] ?? '')));
        $address_one    = trim($input['address_one']    ?? '');
        $address_two    = trim($input['address_two']    ?? '');
        $contact_person = trim($input['contact_person'] ?? '');
        $depotVal       = isset($input['depot_id']) ? $input['depot_id'] : ($input['depot'] ?? null);
        $depot_id       = !empty($depotVal) ? (int)$depotVal : null;
        $depotText      = is_string($depotVal) ? trim($depotVal) : (string)$depotVal;
        $tin            = trim($input['tin']            ?? '');
        $account_code   = trim($input['account_code']   ?? '');
        $rate_type      = $input['rate_type']           ?? 'Standard';
        $status         = $input['status']              ?? 'Active';
        $custDepotCol   = $bankCfg['cust_depot_col'] ?? null;
        $bankDepotCol   = $bankCfg['bank_depot_col'] ?? null;
        $isCircularFk   = !empty($emailCfg['circular']);
        $fkMode         = $emailCfg['mode'] === 'fk';
        $fkCol          = $fkMode ? $emailCfg['fk'] : null;

        if ($customer_name  === '') echoJson(['error' => 'Customer Name is required'], 400);
        if ($contact_number === '') echoJson(['error' => 'Contact Number is required'], 400);
        if ($emailVal       === '') echoJson(['error' => 'Email Address is required'], 400);
        if ($address_one    === '') echoJson(['error' => 'Address 1 is required'], 400);
        if ($contact_person === '') echoJson(['error' => 'Contact Person is required'], 400);

        try {
            $db->beginTransaction();

            $c_email_id = null;
            if ($fkMode && !$isCircularFk) {
                $stmtE = $db->prepare("INSERT INTO `{$tblCEmail}` (email) VALUES (?)");
                $stmtE->execute([$emailVal]);
                $c_email_id = (int)$db->lastInsertId();
                if ($c_email_id <= 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no email ID generated'], 500); }
            }
            if ($fkMode && $isCircularFk) {
                $db->exec("SET FOREIGN_KEY_CHECKS=0");
            }

            $insCols = []; $insPh = []; $insParams = [];
            foreach ([
                'customer_name'  => $customer_name,
                'contact_number' => $contact_number,
                'address_one'    => $address_one,
                'address_two'    => $address_two,
            ] as $k => $v) {
                if (in_array($k, $custCols, true)) { $insCols[] = $k; $insPh[] = '?'; $insParams[] = $v; }
            }
            if ($fkMode && !$isCircularFk && $fkCol && in_array($fkCol, $custCols, true)) {
                $insCols[] = $fkCol; $insPh[] = '?'; $insParams[] = $c_email_id;
            }
            if ($emailCfg['mode'] === 'direct') {
                $insCols[] = $emailCfg['col']; $insPh[] = '?'; $insParams[] = $emailVal;
            }
            if (in_array('created_at', $custCols, true)) { $insCols[] = 'created_at'; $insPh[] = 'NOW()'; }
            if (in_array('updated_at', $custCols, true)) { $insCols[] = 'updated_at'; $insPh[] = 'NOW()'; }
            if ($bankCfg['use_bank_table'] === false) {
                $custMap = [
                    'contact_person' => $contact_person,
                    'tin'            => $tin,
                    'account_code'   => $account_code,
                    'rate_type'      => $rate_type,
                    'status'         => $status,
                ];
                if ($custDepotCol) {
                    $custMap[$custDepotCol] = ($custDepotCol === 'depot_id') ? $depot_id : $depotText;
                }
                foreach ($custMap as $k => $v) {
                    if (in_array($k, $custCols, true)) { $insCols[] = $k; $insPh[] = '?'; $insParams[] = $v; }
                }
            }

            $sql = "INSERT INTO `{$tblCustomers}` (" . implode(',', $insCols) . ") VALUES (" . implode(',', $insPh) . ")";
            $stmt = $db->prepare($sql);
            $stmt->execute($insParams);
            if ($stmt->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no rows written'], 500); }
            $customer_id = (int)$db->lastInsertId();
            if ($customer_id <= 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no ID generated'], 500); }

            if ($fkMode && $isCircularFk) {
                $stmtE = $db->prepare("INSERT INTO `{$tblCEmail}` (customer_id, email) VALUES (?, ?)");
                $stmtE->execute([$customer_id, $emailVal]);
                $c_email_id = (int)$db->lastInsertId();
                if ($fkCol && in_array($fkCol, $custCols, true)) {
                    $stmtU = $db->prepare("UPDATE `{$tblCustomers}` SET {$fkCol} = ? WHERE customer_id = ?");
                    $stmtU->execute([$c_email_id, $customer_id]);
                }
                $db->exec("SET FOREIGN_KEY_CHECKS=1");
            }

            if ($bankCfg['use_bank_table']) {
                $bCols = ['customer_id']; $bPh = ['?']; $bParams = [$customer_id];
                $bankMap = [
                    'contact_person' => $contact_person,
                    'tin'            => $tin,
                    'account_code'   => $account_code,
                    'rate_type'      => $rate_type,
                    'status'         => $status,
                ];
                if ($bankDepotCol) {
                    $bankMap[$bankDepotCol] = ($bankDepotCol === 'depot_id') ? $depot_id : $depotText;
                }
                foreach ($bankMap as $k => $v) {
                    if (in_array($k, $bankCfg['bank_fields'], true)) { $bCols[] = $k; $bPh[] = '?'; $bParams[] = $v; }
                }
                $stmtB = $db->prepare("INSERT INTO `{$tblCBank}` (" . implode(',', $bCols) . ") VALUES (" . implode(',', $bPh) . ")");
                $stmtB->execute($bParams);
                if ($stmtB->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Bank info insert failed'], 500); }
            }

            $db->commit();
            $sqlR = $selectBase . " WHERE c.customer_id = ?";
            $stmtR = $db->prepare($sqlR);
            $stmtR->execute([$customer_id]);
            $row = $stmtR->fetch();
            echoJson(['success' => true, 'data' => $row]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $customer_id = (int)($_GET['id'] ?? 0);
        if (!$customer_id) echoJson(['error' => 'ID is required'], 400);

        $customer_name  = trim($input['customer_name']  ?? '');
        $contact_number = trim($input['contact_number'] ?? '');
        $emailVal       = trim($input['email']          ?? ($input['c_email_id'] ?? ($input['e_mail_id'] ?? '')));
        $address_one    = trim($input['address_one']    ?? '');
        $address_two    = trim($input['address_two']    ?? '');
        $contact_person = trim($input['contact_person'] ?? '');
        $depotVal       = isset($input['depot_id']) ? $input['depot_id'] : ($input['depot'] ?? null);
        $depot_id       = !empty($depotVal) ? (int)$depotVal : null;
        $depotText      = is_string($depotVal) ? trim($depotVal) : (string)$depotVal;
        $tin            = trim($input['tin']            ?? '');
        $account_code   = trim($input['account_code']   ?? '');
        $rate_type      = $input['rate_type']           ?? 'Standard';
        $status         = $input['status']              ?? 'Active';
        $custDepotCol   = $bankCfg['cust_depot_col'] ?? null;
        $bankDepotCol   = $bankCfg['bank_depot_col'] ?? null;
        $isCircularFk   = !empty($emailCfg['circular']);
        $fkMode         = $emailCfg['mode'] === 'fk';
        $fkCol          = $fkMode ? $emailCfg['fk'] : null;

        if ($customer_name  === '') echoJson(['error' => 'Customer Name is required'], 400);
        if ($contact_number === '') echoJson(['error' => 'Contact Number is required'], 400);
        if ($emailVal       === '') echoJson(['error' => 'Email Address is required'], 400);
        if ($address_one    === '') echoJson(['error' => 'Address 1 is required'], 400);
        if ($contact_person === '') echoJson(['error' => 'Contact Person is required'], 400);

        try {
            $db->beginTransaction();

            $c_email_id = null;
            if ($fkMode && $isCircularFk) {
                $db->exec("SET FOREIGN_KEY_CHECKS=0");
            }

            $updSets = []; $updParams = [];
            foreach ([
                'customer_name'  => $customer_name,
                'contact_number' => $contact_number,
                'address_one'    => $address_one,
                'address_two'    => $address_two,
            ] as $k => $v) {
                if (in_array($k, $custCols, true)) { $updSets[] = "{$k} = ?"; $updParams[] = $v; }
            }
            if ($emailCfg['mode'] === 'direct') {
                $updSets[] = "{$emailCfg['col']} = ?"; $updParams[] = $emailVal;
            }
            if (in_array('updated_at', $custCols, true)) { $updSets[] = "updated_at = NOW()"; }
            if ($bankCfg['use_bank_table'] === false) {
                $custMap = [
                    'contact_person' => $contact_person,
                    'tin'            => $tin,
                    'account_code'   => $account_code,
                    'rate_type'      => $rate_type,
                    'status'         => $status,
                ];
                if ($custDepotCol) {
                    $custMap[$custDepotCol] = ($custDepotCol === 'depot_id') ? $depot_id : $depotText;
                }
                foreach ($custMap as $k => $v) {
                    if (in_array($k, $custCols, true)) { $updSets[] = "{$k} = ?"; $updParams[] = $v; }
                }
            }
            if ($updSets) {
                $updParams[] = $customer_id;
                $stmtC = $db->prepare("UPDATE `{$tblCustomers}` SET " . implode(', ', $updSets) . " WHERE customer_id = ?");
                $stmtC->execute($updParams);
            }

            if ($fkMode) {
                $existingEmailId = null;
                if ($isCircularFk) {
                    $stmtChk = $db->prepare("SELECT c_email_id FROM `{$tblCEmail}` WHERE customer_id = ? ORDER BY c_email_id ASC LIMIT 1");
                    $stmtChk->execute([$customer_id]);
                    $ex = $stmtChk->fetch();
                    if ($ex) {
                        $stmtEU = $db->prepare("UPDATE `{$tblCEmail}` SET email = ? WHERE c_email_id = ?");
                        $stmtEU->execute([$emailVal, $ex['c_email_id']]);
                        $existingEmailId = (int)$ex['c_email_id'];
                    } else {
                        $stmtEI = $db->prepare("INSERT INTO `{$tblCEmail}` (customer_id, email) VALUES (?, ?)");
                        $stmtEI->execute([$customer_id, $emailVal]);
                        $existingEmailId = (int)$db->lastInsertId();
                    }
                } else {
                    $stmtChk = $db->prepare("SELECT ce.c_email_id FROM `{$tblCustomers}` c JOIN `{$tblCEmail}` ce ON c.{$fkCol} = ce.c_email_id WHERE c.customer_id = ? LIMIT 1");
                    $stmtChk->execute([$customer_id]);
                    $ex = $stmtChk->fetch();
                    if ($ex) {
                        $stmtEU = $db->prepare("UPDATE `{$tblCEmail}` SET email = ? WHERE c_email_id = ?");
                        $stmtEU->execute([$emailVal, $ex['c_email_id']]);
                        $existingEmailId = (int)$ex['c_email_id'];
                    } else {
                        $stmtEI = $db->prepare("INSERT INTO `{$tblCEmail}` (email) VALUES (?)");
                        $stmtEI->execute([$emailVal]);
                        $existingEmailId = (int)$db->lastInsertId();
                    }
                }
                if ($fkCol && in_array($fkCol, $custCols, true)) {
                    $stmtCU = $db->prepare("UPDATE `{$tblCustomers}` SET {$fkCol} = ? WHERE customer_id = ?");
                    $stmtCU->execute([$existingEmailId, $customer_id]);
                }
                if ($isCircularFk) {
                    $db->exec("SET FOREIGN_KEY_CHECKS=1");
                }
            }

            if ($bankCfg['use_bank_table']) {
                $stmtChkB = $db->prepare("SELECT c_bank_id FROM `{$tblCBank}` WHERE customer_id = ?");
                $stmtChkB->execute([$customer_id]);
                $exB = $stmtChkB->fetch();
                if ($exB) {
                    $bsets = []; $bparams = [];
                    $bankMapUpd = [
                        'contact_person' => $contact_person,
                        'tin'            => $tin,
                        'account_code'   => $account_code,
                        'rate_type'      => $rate_type,
                        'status'         => $status,
                    ];
                    if ($bankDepotCol) {
                        $bankMapUpd[$bankDepotCol] = ($bankDepotCol === 'depot_id') ? $depot_id : $depotText;
                    }
                    foreach ($bankMapUpd as $k => $v) {
                        if (in_array($k, $bankCfg['bank_fields'], true)) { $bsets[] = "{$k} = ?"; $bparams[] = $v; }
                    }
                    if ($bsets) {
                        $bparams[] = $customer_id;
                        $stmtBU = $db->prepare("UPDATE `{$tblCBank}` SET " . implode(', ', $bsets) . " WHERE customer_id = ?");
                        $stmtBU->execute($bparams);
                    }
                } else {
                    $bCols = ['customer_id']; $bPh = ['?']; $bParams = [$customer_id];
                    $bankMapIns = [
                        'contact_person' => $contact_person,
                        'tin'            => $tin,
                        'account_code'   => $account_code,
                        'rate_type'      => $rate_type,
                        'status'         => $status,
                    ];
                    if ($bankDepotCol) {
                        $bankMapIns[$bankDepotCol] = ($bankDepotCol === 'depot_id') ? $depot_id : $depotText;
                    }
                    foreach ($bankMapIns as $k => $v) {
                        if (in_array($k, $bankCfg['bank_fields'], true)) { $bCols[] = $k; $bPh[] = '?'; $bParams[] = $v; }
                    }
                    $stmtBI = $db->prepare("INSERT INTO `{$tblCBank}` (" . implode(',', $bCols) . ") VALUES (" . implode(',', $bPh) . ")");
                    $stmtBI->execute($bParams);
                }
            }

            $db->commit();
            $sqlR = $selectBase . " WHERE c.customer_id = ?";
            $stmtR = $db->prepare($sqlR);
            $stmtR->execute([$customer_id]);
            $row = $stmtR->fetch();
            if (!$row) echoJson(['error' => 'Customer not found after update'], 404);
            echoJson(['success' => true, 'data' => $row]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $customer_id = (int)($_GET['id'] ?? 0);
        if (!$customer_id) echoJson(['error' => 'ID is required'], 400);
        try {
            $db->beginTransaction();
            $isCircularFkD = !empty($emailCfg['circular']);
            $fkModeD       = $emailCfg['mode'] === 'fk';
            $fkColD        = $fkModeD ? $emailCfg['fk'] : null;
            if ($fkModeD) {
                $db->exec("SET FOREIGN_KEY_CHECKS=0");
            }
            if ($bankCfg['use_bank_table']) {
                $stmt1 = $db->prepare("DELETE FROM `{$tblCBank}` WHERE customer_id = ?");
                $stmt1->execute([$customer_id]);
            }
            if ($fkModeD) {
                if ($isCircularFkD) {
                    $stmt2 = $db->prepare("DELETE FROM `{$tblCEmail}` WHERE customer_id = ?");
                    $stmt2->execute([$customer_id]);
                } else {
                    if ($fkColD) {
                        $stmt2 = $db->prepare("DELETE FROM `{$tblCEmail}` WHERE c_email_id = (SELECT {$fkColD} FROM `{$tblCustomers}` WHERE customer_id = ?)");
                        $stmt2->execute([$customer_id]);
                    }
                }
            }
            $stmt3 = $db->prepare("DELETE FROM `{$tblCustomers}` WHERE customer_id = ?");
            $stmt3->execute([$customer_id]);
            if ($stmt3->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Delete failed: customer not found'], 404); }
            if ($fkModeD) {
                $db->exec("SET FOREIGN_KEY_CHECKS=1");
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
