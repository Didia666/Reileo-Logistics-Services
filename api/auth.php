<?php
require_once __DIR__ . '/config.php';

function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}

function currentUser() {
    startSession();
    if (isset($_SESSION['user'])) {
        return $_SESSION['user'];
    }
    return null;
}

function requireAuth($roles = null) {
    $user = currentUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized - please log in']);
        exit;
    }
    if ($roles && !in_array($user['role'], $roles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - insufficient permissions']);
        exit;
    }
    return $user;
}

function ensureAuditLogTable($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS `audit_logs` (
        `log_id` INT NOT NULL AUTO_INCREMENT,
        `module` VARCHAR(100) NOT NULL,
        `action` VARCHAR(50) NOT NULL,
        `reference` VARCHAR(255) DEFAULT NULL,
        `changes_made` TEXT DEFAULT NULL,
        `user_id` INT DEFAULT NULL,
        `username` VARCHAR(100) DEFAULT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`log_id`),
        KEY `idx_audit_created_at` (`created_at`),
        KEY `idx_audit_module` (`module`),
        KEY `idx_audit_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function writeAuditLog($db, $module, $action, $reference = null, $changes = null, $user = null) {
    ensureAuditLogTable($db);
    $user = $user ?: currentUser();
    $encodedChanges = is_string($changes) ? $changes : ($changes === null ? null : json_encode($changes));
    $stmt = $db->prepare(
        'INSERT INTO `audit_logs` (module, action, reference, changes_made, user_id, username)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $module,
        $action,
        $reference !== null ? (string)$reference : null,
        $encodedChanges,
        $user['user_id'] ?? null,
        $user['username'] ?? null,
    ]);
}

function loginUser($username, $password) {
    $db = getDB();
    $tbl = 'reileo_logistics_services_users';
    $stmt = $db->prepare("SELECT * FROM `{$tbl}` WHERE username = ? OR email = ? LIMIT 1");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'Active') {
        return ['success' => false, 'error' => 'Invalid credentials or inactive account'];
    }

    if (!password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'error' => 'Invalid credentials'];
    }

    startSession();
    $_SESSION['user'] = [
        'user_id' => $user['user_id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'personnel_id' => $user['personnel_id'],
        'customer_id' => $user['customer_id'],
    ];

    writeAuditLog($db, 'auth', 'login', $user['username'], null, $_SESSION['user']);

    return ['success' => true, 'user' => $_SESSION['user']];
}

function logoutUser() {
    startSession();
    $user = $_SESSION['user'] ?? null;
    if ($user) {
        writeAuditLog(getDB(), 'auth', 'logout', $user['username'], null, $user);
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    return true;
}
