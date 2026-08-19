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

function loginUser($username, $password) {
    $db = getDB();
    $tbl = tableName('users');
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

    return ['success' => true, 'user' => $_SESSION['user']];
}

function logoutUser() {
    startSession();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    return true;
}
