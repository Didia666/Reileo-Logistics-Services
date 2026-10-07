<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$user = requireAuth();
$db = getDB();
ensureAuditLogTable($db);

function auditJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $module = trim((string)($input['module'] ?? 'system'));
    $action = trim((string)($input['action'] ?? 'action'));
    $reference = $input['reference'] ?? null;
    $changes = $input['changes'] ?? null;

    if ($module === '' || $action === '') {
        auditJson(['error' => 'Module and action are required'], 400);
    }

    try {
        writeAuditLog($db, $module, $action, $reference, $changes, $user);
        auditJson(['success' => true]);
    } catch (PDOException $e) {
        auditJson(['error' => 'Unable to record audit log'], 500);
    }
}

if ($method !== 'GET') {
    auditJson(['error' => 'Method not allowed'], 405);
}

$module = trim($_GET['module'] ?? '');
$action = trim($_GET['action'] ?? '');
$from = trim($_GET['from'] ?? '');
$to = trim($_GET['to'] ?? '');

$where = [];
$params = [];
if ($module !== '') {
    $where[] = 'module = ?';
    $params[] = $module;
}
if ($action !== '') {
    $where[] = 'action = ?';
    $params[] = $action;
}
if ($from !== '') {
    $where[] = 'DATE(created_at) >= ?';
    $params[] = $from;
}
if ($to !== '') {
    $where[] = 'DATE(created_at) <= ?';
    $params[] = $to;
}

$sql = 'SELECT log_id, module, action, reference, changes_made, user_id, username, created_at
        FROM audit_logs';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY created_at DESC, log_id DESC LIMIT 1000';

try {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    auditJson($stmt->fetchAll());
} catch (PDOException $e) {
    auditJson(['error' => 'Unable to load audit logs'], 500);
}
