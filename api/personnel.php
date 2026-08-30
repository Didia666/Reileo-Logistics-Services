<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();

$tblPersonnel = tableName('personnel');
$tblPEmail    = tableName('p_email');
$tblPEmploy   = tableName('p_employment');
$tblPBenefits = tableName('p_benefits');
$tblPEmer     = tableName('p_emergency');
$tblPLicense  = tableName('p_license');
$tblPDLCodes  = tableName('p_dl_codes');
$tblPTypes    = tableName('p_types');
$tblDepots    = tableName('depots');
$tblVendors   = tableName('vendor');
$tblDLCodes   = tableName('dl_codes');

$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    $input = $raw ? (json_decode($raw, true) ?: []) : [];
}

function echoJson($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function listSql($tblP, $tblE, $tblEm, $tblPT, $tblD, $tblV, $tblLic, $tblDLC) {
    return "SELECT
        p.personnel_id,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.address,
        p.contact_number,
        p.p_email_id,
        pe.email,
        p.birthdate,
        p.gender,
        p.status,
        em.p_employment_id,
        em.personnel_type_id,
        pt.personnel_type,
        em.employment_type,
        em.vendor_id,
        v.vendor_name,
        em.employee_id_number,
        em.depot_id,
        d.depot_name,
        em.date_started,
        em.date_of_separation,
        em.reason_of_separation,
        em.bank_account,
        em.daily_rate,
        em.remarks,
        l.p_license_id,
        l.driver_license_no,
        l.license_expiry
      FROM `{$tblP}` p
      LEFT JOIN `{$tblE}`  pe ON p.p_email_id = pe.p_email_id
      LEFT JOIN `{$tblEm}` em ON p.personnel_id = em.personnel_id
      LEFT JOIN `{$tblPT}` pt ON em.personnel_type_id = pt.personnel_type_id
      LEFT JOIN `{$tblD}`  d  ON em.depot_id = d.depot_id
      LEFT JOIN `{$tblV}`  v  ON em.vendor_id = v.vendor_id
      LEFT JOIN `{$tblLic}` l  ON p.personnel_id = l.personnel_id";
}

switch ($method) {

    case 'GET':
        try {
            if ($id > 0) {
                $baseSql = listSql($tblPersonnel, $tblPEmail, $tblPEmploy, $tblPTypes, $tblDepots, $tblVendors, $tblPLicense, $tblDLCodes);
                $stmt = $db->prepare($baseSql . " WHERE p.personnel_id = ? GROUP BY p.personnel_id LIMIT 1");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) echoJson(['error' => 'Personnel not found'], 404);

                $row['full_name'] = trim(($row['first_name'] ?? '') . ' ' . ($row['middle_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
                $row['full_name'] = preg_replace('/\s+/', ' ', $row['full_name']);

                $stmtB = $db->prepare("SELECT * FROM `{$tblPBenefits}` WHERE personnel_id = ? LIMIT 1");
                $stmtB->execute([$id]);
                $row['benefits'] = $stmtB->fetch() ?: null;

                $stmtEM = $db->prepare("SELECT * FROM `{$tblPEmer}` WHERE personnel_id = ? LIMIT 1");
                $stmtEM->execute([$id]);
                $row['emergency'] = $stmtEM->fetch() ?: null;

                if (!empty($row['p_license_id'])) {
                    $stmtDC = $db->prepare(
                        "SELECT dc.dl_code_id, dc.dl_code
                           FROM `{$tblPDLCodes}` pdc
                           JOIN `{$tblDLCodes}` dc ON pdc.dl_code_id = dc.dl_code_id
                          WHERE pdc.p_license_id = ?"
                    );
                    $stmtDC->execute([$row['p_license_id']]);
                    $row['dl_code_ids'] = array_map('intval', array_column($stmtDC->fetchAll(), 'dl_code_id'));
                } else {
                    $row['dl_code_ids'] = [];
                }

                echoJson($row);
            }

            $statusFilter = $_GET['status'] ?? 'all';
            $search = trim($_GET['search'] ?? '');
            $params = [];
            $baseSql = listSql($tblPersonnel, $tblPEmail, $tblPEmploy, $tblPTypes, $tblDepots, $tblVendors, $tblPLicense, $tblDLCodes);
            $where = " WHERE 1=1";
            if ($statusFilter && $statusFilter !== 'all') {
                $where .= " AND p.status = ?";
                $params[] = $statusFilter;
            }
            if ($search !== '') {
                $where .= " AND (p.first_name LIKE ? OR p.middle_name LIKE ? OR p.last_name LIKE ? OR p.contact_number LIKE ? OR pe.email LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            $sql = $baseSql . $where . " GROUP BY p.personnel_id ORDER BY p.last_name ASC, p.first_name ASC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $full = trim(($r['first_name'] ?? '') . ' ' . ($r['middle_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
                $r['full_name'] = preg_replace('/\s+/', ' ', $full);
                $r['display_name'] = strtoupper(trim(($r['last_name'] ?? '') . ', ' . ($r['first_name'] ?? '') . ' ' . ($r['middle_name'] ?? '')));
                $r['display_name'] = preg_replace('/\s+/', ' ', $r['display_name']);
            }
            echoJson($rows);
        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $last_name      = trim($input['last_name']       ?? '');
        $first_name     = trim($input['first_name']      ?? '');
        $middle_name    = trim($input['middle_name']     ?? '');
        $address        = trim($input['address']         ?? '');
        $contact_number = trim($input['contact_number']  ?? '');
        $emailVal       = trim($input['email']           ?? '');
        $birthdate      = trim($input['birthdate']       ?: null);
        $gender         = $input['gender']               ?? null;
        $status         = trim($input['status']          ?? 'Active');

        if ($last_name  === '') echoJson(['error' => 'Last Name is required'], 400);
        if ($first_name === '') echoJson(['error' => 'First Name is required'], 400);
        if ($status     === '') echoJson(['error' => 'Status is required'], 400);
        if (!in_array($status, ['Active','Inactive'], true)) echoJson(['error' => 'Invalid Status'], 400);
        if ($gender !== null && !in_array($gender, ['Male','Female'], true)) echoJson(['error' => 'Invalid Gender'], 400);
        if ($birthdate !== '' && $birthdate !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthdate)) {
            $t = strtotime($birthdate);
            if ($t) $birthdate = date('Y-m-d', $t);
            else echoJson(['error' => 'Invalid birthdate format (use YYYY-MM-DD)'], 400);
        }

        $employment = $input['employment'] ?? [];
        $benefits   = $input['benefits']   ?? [];
        $emergency  = $input['emergency']  ?? [];
        $license    = $input['license']    ?? [];
        $dlCodeIds  = isset($input['dl_code_ids']) ? array_map('intval', (array)$input['dl_code_ids']) : [];

        $personnel_type_id = (int)($employment['personnel_type_id'] ?? 0);
        $employment_type   = trim($employment['employment_type']    ?? 'Direct Hire');
        $vendor_id         = !empty($employment['vendor_id'])       ? (int)$employment['vendor_id']       : null;
        $depot_id          = (int)($employment['depot_id']          ?? 0);
        $employee_id_number= trim($employment['employee_id_number'] ?? '');
        $date_started      = trim($employment['date_started']       ?: null);
        $date_of_separation= trim($employment['date_of_separation'] ?: null);
        $reason_of_separation = trim($employment['reason_of_separation'] ?? '');
        $bank_account      = trim($employment['bank_account']       ?? '');
        $daily_rate        = isset($employment['daily_rate'])       ? (float)$employment['daily_rate']      : 0;
        $remarks           = trim($employment['remarks']            ?? '');

        if ($personnel_type_id <= 0) echoJson(['error' => 'Personnel Type is required'], 400);
        if ($depot_id <= 0)          echoJson(['error' => 'Depot is required'], 400);
        if (!in_array($employment_type, ['Direct Hire','Outsourced'], true)) echoJson(['error' => 'Invalid Employment Type'], 400);
        if ($date_started && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_started)) {
            $t = strtotime($date_started);
            if ($t) $date_started = date('Y-m-d', $t);
            else echoJson(['error' => 'Invalid Date Started format'], 400);
        }
        if ($date_of_separation && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_of_separation)) {
            $t = strtotime($date_of_separation);
            if ($t) $date_of_separation = date('Y-m-d', $t);
            else echoJson(['error' => 'Invalid Date of Separation format'], 400);
        }

        try {
            $db->beginTransaction();

            $p_email_id = null;
            if ($emailVal !== '') {
                $stmtE = $db->prepare("SELECT p_email_id FROM `{$tblPEmail}` WHERE email = ? LIMIT 1");
                $stmtE->execute([$emailVal]);
                $ex = $stmtE->fetch();
                if ($ex) {
                    $p_email_id = (int)$ex['p_email_id'];
                } else {
                    $stmtEI = $db->prepare("INSERT INTO `{$tblPEmail}` (email) VALUES (?)");
                    $stmtEI->execute([$emailVal]);
                    $p_email_id = (int)$db->lastInsertId();
                }
            }

            $pCols = []; $pPh = []; $pParams = [];
            foreach (['last_name'=>$last_name,'first_name'=>$first_name,'middle_name'=>$middle_name,
                      'address'=>$address,'contact_number'=>$contact_number,'p_email_id'=>$p_email_id,
                      'birthdate'=>$birthdate,'gender'=>$gender,'status'=>$status] as $k=>$v) {
                $pCols[] = "`{$k}`";
                $pPh[]   = '?';
                $pParams[] = $v;
            }
            $sql = "INSERT INTO `{$tblPersonnel}` (" . implode(', ', $pCols) . ") VALUES (" . implode(', ', $pPh) . ")";
            $stmt = $db->prepare($sql);
            $stmt->execute($pParams);
            if ($stmt->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Insert failed'], 500); }
            $personnel_id = (int)$db->lastInsertId();
            if ($personnel_id <= 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no ID'], 500); }

            $eCols = ['personnel_id','personnel_type_id','employment_type','vendor_id','depot_id',
                      'employee_id_number','date_started','date_of_separation','reason_of_separation',
                      'bank_account','daily_rate','remarks'];
            $ePh = array_fill(0, count($eCols), '?');
            $eParams = [
                $personnel_id, $personnel_type_id, $employment_type, $vendor_id, $depot_id,
                $employee_id_number ?: null, $date_started, $date_of_separation,
                $reason_of_separation ?: null, $bank_account ?: null, $daily_rate, $remarks ?: null,
            ];
            $stmtEM = $db->prepare("INSERT INTO `{$tblPEmploy}` (" . implode(',', $eCols) . ") VALUES (" . implode(',', $ePh) . ")");
            $stmtEM->execute($eParams);

            $stmtB = $db->prepare(
                "INSERT INTO `{$tblPBenefits}` (personnel_id, philhealth_no, sss_no, tin_no, pag_ibig_no)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmtB->execute([
                $personnel_id,
                trim($benefits['philhealth_no'] ?? '') ?: null,
                trim($benefits['sss_no']        ?? '') ?: null,
                trim($benefits['tin_no']        ?? '') ?: null,
                trim($benefits['pag_ibig_no']    ?? '') ?: null,
            ]);

            $stmtEMC = $db->prepare(
                "INSERT INTO `{$tblPEmer}` (personnel_id, contact_person, contact_number) VALUES (?, ?, ?)"
            );
            $stmtEMC->execute([
                $personnel_id,
                trim($emergency['contact_person'] ?? '') ?: null,
                trim($emergency['contact_number'] ?? '') ?: null,
            ]);

            $p_license_id = null;
            $licNo = trim($license['driver_license_no'] ?? '');
            $licExp= trim($license['license_expiry']     ?? '');
            if ($licNo !== '' || $licExp !== '') {
                if ($licNo === '')  { $db->rollBack(); echoJson(['error' => 'Driver License Number is required when providing license info'], 400); }
                if ($licExp === '') { $db->rollBack(); echoJson(['error' => 'License Expiry is required when providing license info'], 400); }
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $licExp)) {
                    $t = strtotime($licExp);
                    if ($t) $licExp = date('Y-m-d', $t);
                    else { $db->rollBack(); echoJson(['error' => 'Invalid License Expiry format'], 400); }
                }
                $stmtL = $db->prepare(
                    "INSERT INTO `{$tblPLicense}` (personnel_id, driver_license_no, license_expiry) VALUES (?, ?, ?)"
                );
                $stmtL->execute([$personnel_id, $licNo, $licExp]);
                $p_license_id = (int)$db->lastInsertId();
            }

            if ($p_license_id && count($dlCodeIds)) {
                $stmtDC = $db->prepare("INSERT INTO `{$tblPDLCodes}` (p_license_id, dl_code_id) VALUES (?, ?)");
                foreach ($dlCodeIds as $dcid) {
                    if ($dcid > 0) $stmtDC->execute([$p_license_id, $dcid]);
                }
            }

            $db->commit();

            $stmtG = $db->prepare(listSql($tblPersonnel, $tblPEmail, $tblPEmploy, $tblPTypes, $tblDepots, $tblVendors, $tblPLicense, $tblDLCodes)
                                 . " WHERE p.personnel_id = ? GROUP BY p.personnel_id LIMIT 1");
            $stmtG->execute([$personnel_id]);
            $saved = $stmtG->fetch();
            $saved['full_name'] = trim(($saved['first_name'] ?? '') . ' ' . ($saved['middle_name'] ?? '') . ' ' . ($saved['last_name'] ?? ''));
            $saved['full_name'] = preg_replace('/\s+/', ' ', $saved['full_name']);
            $saved['display_name'] = strtoupper(trim(($saved['last_name'] ?? '') . ', ' . ($saved['first_name'] ?? '') . ' ' . ($saved['middle_name'] ?? '')));
            $saved['display_name'] = preg_replace('/\s+/', ' ', $saved['display_name']);
            echoJson($saved);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        if ($id <= 0) echoJson(['error' => 'ID is required'], 400);

        $stmtChk = $db->prepare("SELECT personnel_id FROM `{$tblPersonnel}` WHERE personnel_id = ? LIMIT 1");
        $stmtChk->execute([$id]);
        if (!$stmtChk->fetch()) echoJson(['error' => 'Personnel not found'], 404);

        $last_name      = trim($input['last_name']       ?? '');
        $first_name     = trim($input['first_name']      ?? '');
        $middle_name    = trim($input['middle_name']     ?? '');
        $address        = trim($input['address']         ?? '');
        $contact_number = trim($input['contact_number']  ?? '');
        $emailVal       = trim($input['email']           ?? '');
        $birthdate      = trim($input['birthdate']       ?: null);
        $gender         = $input['gender']               ?? null;
        $status         = trim($input['status']          ?? 'Active');

        if ($last_name  === '') echoJson(['error' => 'Last Name is required'], 400);
        if ($first_name === '') echoJson(['error' => 'First Name is required'], 400);
        if ($status     === '') echoJson(['error' => 'Status is required'], 400);
        if (!in_array($status, ['Active','Inactive'], true)) echoJson(['error' => 'Invalid Status'], 400);
        if ($gender !== null && $gender !== '' && !in_array($gender, ['Male','Female'], true)) echoJson(['error' => 'Invalid Gender'], 400);
        if ($birthdate !== '' && $birthdate !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthdate)) {
            $t = strtotime($birthdate);
            if ($t) $birthdate = date('Y-m-d', $t);
            else echoJson(['error' => 'Invalid birthdate format (use YYYY-MM-DD)'], 400);
        }

        $employment = $input['employment'] ?? [];
        $benefits   = $input['benefits']   ?? [];
        $emergency  = $input['emergency']  ?? [];
        $license    = $input['license']    ?? [];
        $dlCodeIds  = isset($input['dl_code_ids']) ? array_map('intval', (array)$input['dl_code_ids']) : [];

        $personnel_type_id = (int)($employment['personnel_type_id'] ?? 0);
        $employment_type   = trim($employment['employment_type']    ?? 'Direct Hire');
        $vendor_id         = !empty($employment['vendor_id'])       ? (int)$employment['vendor_id']       : null;
        $depot_id          = (int)($employment['depot_id']          ?? 0);
        $employee_id_number= trim($employment['employee_id_number'] ?? '');
        $date_started      = trim($employment['date_started']       ?: null);
        $date_of_separation= trim($employment['date_of_separation'] ?: null);
        $reason_of_separation = trim($employment['reason_of_separation'] ?? '');
        $bank_account      = trim($employment['bank_account']       ?? '');
        $daily_rate        = isset($employment['daily_rate'])       ? (float)$employment['daily_rate']      : 0;
        $remarks           = trim($employment['remarks']            ?? '');

        if ($personnel_type_id <= 0) echoJson(['error' => 'Personnel Type is required'], 400);
        if ($depot_id <= 0)          echoJson(['error' => 'Depot is required'], 400);
        if (!in_array($employment_type, ['Direct Hire','Outsourced'], true)) echoJson(['error' => 'Invalid Employment Type'], 400);
        if ($date_started && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_started)) {
            $t = strtotime($date_started);
            if ($t) $date_started = date('Y-m-d', $t);
            else echoJson(['error' => 'Invalid Date Started format'], 400);
        }
        if ($date_of_separation && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_of_separation)) {
            $t = strtotime($date_of_separation);
            if ($t) $date_of_separation = date('Y-m-d', $t);
            else echoJson(['error' => 'Invalid Date of Separation format'], 400);
        }

        try {
            $db->beginTransaction();

            $p_email_id = null;
            if ($emailVal !== '') {
                $stmtE = $db->prepare("SELECT p_email_id FROM `{$tblPEmail}` WHERE email = ? LIMIT 1");
                $stmtE->execute([$emailVal]);
                $ex = $stmtE->fetch();
                if ($ex) {
                    $p_email_id = (int)$ex['p_email_id'];
                } else {
                    $stmtEI = $db->prepare("INSERT INTO `{$tblPEmail}` (email) VALUES (?)");
                    $stmtEI->execute([$emailVal]);
                    $p_email_id = (int)$db->lastInsertId();
                }
            }

            $pSets = []; $pParams = [];
            foreach (['last_name'=>$last_name,'first_name'=>$first_name,'middle_name'=>$middle_name,
                      'address'=>$address,'contact_number'=>$contact_number,'p_email_id'=>$p_email_id,
                      'birthdate'=>$birthdate,'gender'=>$gender,'status'=>$status] as $k=>$v) {
                $pSets[] = "`{$k}` = ?";
                $pParams[] = $v;
            }
            $pParams[] = $id;
            $stmt = $db->prepare("UPDATE `{$tblPersonnel}` SET " . implode(', ', $pSets) . " WHERE personnel_id = ?");
            $stmt->execute($pParams);

            $stmtChkE = $db->prepare("SELECT p_employment_id FROM `{$tblPEmploy}` WHERE personnel_id = ? LIMIT 1");
            $stmtChkE->execute([$id]);
            $exE = $stmtChkE->fetch();
            $eData = [
                'personnel_type_id'   => $personnel_type_id,
                'employment_type'     => $employment_type,
                'vendor_id'           => $vendor_id,
                'depot_id'            => $depot_id,
                'employee_id_number'  => $employee_id_number ?: null,
                'date_started'        => $date_started,
                'date_of_separation'  => $date_of_separation,
                'reason_of_separation'=> $reason_of_separation ?: null,
                'bank_account'        => $bank_account ?: null,
                'daily_rate'          => $daily_rate,
                'remarks'             => $remarks ?: null,
            ];
            if ($exE) {
                $uSets = []; $uParams = [];
                foreach ($eData as $k => $v) { $uSets[] = "`{$k}` = ?"; $uParams[] = $v; }
                $uParams[] = $id;
                $stmtEU = $db->prepare("UPDATE `{$tblPEmploy}` SET " . implode(', ', $uSets) . " WHERE personnel_id = ?");
                $stmtEU->execute($uParams);
            } else {
                $ek = array_keys($eData);
                $ek[] = 'personnel_id';
                $ev = array_values($eData);
                $ev[] = $id;
                $ph = array_fill(0, count($ek), '?');
                $stmtEI = $db->prepare("INSERT INTO `{$tblPEmploy}` (" . implode(',', $ek) . ") VALUES (" . implode(',', $ph) . ")");
                $stmtEI->execute($ev);
            }

            $stmtChkB = $db->prepare("SELECT p_benefits_id FROM `{$tblPBenefits}` WHERE personnel_id = ? LIMIT 1");
            $stmtChkB->execute([$id]);
            $exB = $stmtChkB->fetch();
            $bData = [
                'philhealth_no' => trim($benefits['philhealth_no'] ?? '') ?: null,
                'sss_no'        => trim($benefits['sss_no']        ?? '') ?: null,
                'tin_no'        => trim($benefits['tin_no']        ?? '') ?: null,
                'pagibig_no'    => trim($benefits['pagibig_no']    ?? '') ?: null,
            ];
            if ($exB) {
                $bSets = []; $bParams = [];
                foreach ($bData as $k=>$v) { $bSets[] = "`{$k}` = ?"; $bParams[] = $v; }
                $bParams[] = $id;
                $stmtBU = $db->prepare("UPDATE `{$tblPBenefits}` SET " . implode(', ', $bSets) . " WHERE personnel_id = ?");
                $stmtBU->execute($bParams);
            } else {
                $stmtBI = $db->prepare("INSERT INTO `{$tblPBenefits}` (personnel_id, philhealth_no, sss_no, tin_no, pagibig_no) VALUES (?, ?, ?, ?, ?)");
                $stmtBI->execute(array_merge([$id], array_values($bData)));
            }

            $stmtChkEM = $db->prepare("SELECT p_emergency_id FROM `{$tblPEmer}` WHERE personnel_id = ? LIMIT 1");
            $stmtChkEM->execute([$id]);
            $exEM = $stmtChkEM->fetch();
            $emData = [
                'contact_person' => trim($emergency['contact_person'] ?? '') ?: null,
                'contact_number' => trim($emergency['contact_number'] ?? '') ?: null,
            ];
            if ($exEM) {
                $emSets = []; $emParams = [];
                foreach ($emData as $k=>$v) { $emSets[] = "`{$k}` = ?"; $emParams[] = $v; }
                $emParams[] = $id;
                $stmtEMU = $db->prepare("UPDATE `{$tblPEmer}` SET " . implode(', ', $emSets) . " WHERE personnel_id = ?");
                $stmtEMU->execute($emParams);
            } else {
                $stmtEMI = $db->prepare("INSERT INTO `{$tblPEmer}` (personnel_id, contact_person, contact_number) VALUES (?, ?, ?)");
                $stmtEMI->execute(array_merge([$id], array_values($emData)));
            }

            $stmtChkL = $db->prepare("SELECT p_license_id FROM `{$tblPLicense}` WHERE personnel_id = ? LIMIT 1");
            $stmtChkL->execute([$id]);
            $exL = $stmtChkL->fetch();
            $p_license_id = $exL ? (int)$exL['p_license_id'] : null;
            $licNo = trim($license['driver_license_no'] ?? '');
            $licExp= trim($license['license_expiry']     ?? '');
            if ($licNo !== '' && $licExp !== '') {
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $licExp)) {
                    $t = strtotime($licExp);
                    if ($t) $licExp = date('Y-m-d', $t);
                    else { $db->rollBack(); echoJson(['error' => 'Invalid License Expiry format'], 400); }
                }
                if ($p_license_id) {
                    $stmtLU = $db->prepare("UPDATE `{$tblPLicense}` SET driver_license_no = ?, license_expiry = ? WHERE p_license_id = ?");
                    $stmtLU->execute([$licNo, $licExp, $p_license_id]);
                } else {
                    $stmtLI = $db->prepare("INSERT INTO `{$tblPLicense}` (personnel_id, driver_license_no, license_expiry) VALUES (?, ?, ?)");
                    $stmtLI->execute([$id, $licNo, $licExp]);
                    $p_license_id = (int)$db->lastInsertId();
                }
            } elseif ($p_license_id) {
                $stmtDel = $db->prepare("DELETE FROM `{$tblPLicense}` WHERE p_license_id = ?");
                $stmtDel->execute([$p_license_id]);
                $p_license_id = null;
            }

            if ($p_license_id) {
                $stmtDCDel = $db->prepare("DELETE FROM `{$tblPDLCodes}` WHERE p_license_id = ?");
                $stmtDCDel->execute([$p_license_id]);
                if (count($dlCodeIds)) {
                    $stmtDCI = $db->prepare("INSERT INTO `{$tblPDLCodes}` (p_license_id, dl_code_id) VALUES (?, ?)");
                    foreach ($dlCodeIds as $dcid) {
                        if ($dcid > 0) $stmtDCI->execute([$p_license_id, $dcid]);
                    }
                }
            }

            $db->commit();

            $stmtG = $db->prepare(listSql($tblPersonnel, $tblPEmail, $tblPEmploy, $tblPTypes, $tblDepots, $tblVendors, $tblPLicense, $tblDLCodes)
                                 . " WHERE p.personnel_id = ? GROUP BY p.personnel_id LIMIT 1");
            $stmtG->execute([$id]);
            $saved = $stmtG->fetch();
            $saved['full_name'] = trim(($saved['first_name'] ?? '') . ' ' . ($saved['middle_name'] ?? '') . ' ' . ($saved['last_name'] ?? ''));
            $saved['full_name'] = preg_replace('/\s+/', ' ', $saved['full_name']);
            $saved['display_name'] = strtoupper(trim(($saved['last_name'] ?? '') . ', ' . ($saved['first_name'] ?? '') . ' ' . ($saved['middle_name'] ?? '')));
            $saved['display_name'] = preg_replace('/\s+/', ' ', $saved['display_name']);
            echoJson($saved);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
        try {
            $db->beginTransaction();
            $stmtDel = $db->prepare("DELETE FROM `{$tblPersonnel}` WHERE personnel_id = ?");
            $stmtDel->execute([$id]);
            if ($stmtDel->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Personnel not found'], 404); }
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
