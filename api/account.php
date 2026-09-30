<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$currentUser = requireAuth();
$db = getDB();
$usersTable = tableName('reileo_logistics_services_users');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = $rawInput ? (json_decode($rawInput, true) ?: []) : [];

function accountJson($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function loadAccountDetails(PDO $db, string $usersTable, int $userId): array
{
    $stmt = $db->prepare(
        "SELECT user_id, username, email, role, personnel_id, customer_id, status
         FROM `{$usersTable}` WHERE user_id = ? LIMIT 1"
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        accountJson(['error' => 'Account not found.'], 404);
    }

    $displayName = $user['username'];
    $depotName = 'N/A';

    if (!empty($user['personnel_id'])) {
        $personnelTable = tableName('personnel');
        $employmentTable = tableName('p_employment');
        $depotsTable = tableName('depots');
        $stmt = $db->prepare(
            "SELECT p.first_name, p.middle_name, p.last_name, d.depot_name
             FROM `{$personnelTable}` p
             LEFT JOIN `{$employmentTable}` e ON e.personnel_id = p.personnel_id
             LEFT JOIN `{$depotsTable}` d ON d.depot_id = e.depot_id
             WHERE p.personnel_id = ? LIMIT 1"
        );
        $stmt->execute([(int)$user['personnel_id']]);
        $profile = $stmt->fetch();
        if ($profile) {
            $displayName = trim(implode(' ', array_filter([
                $profile['first_name'] ?? '',
                $profile['middle_name'] ?? '',
                $profile['last_name'] ?? '',
            ]))) ?: $displayName;
            $depotName = $profile['depot_name'] ?: 'N/A';
        }
    } elseif (!empty($user['customer_id'])) {
        $customersTable = tableName('customers');
        $stmt = $db->prepare(
            "SELECT customer_name FROM `{$customersTable}` WHERE customer_id = ? LIMIT 1"
        );
        $stmt->execute([(int)$user['customer_id']]);
        $customer = $stmt->fetch();
        if ($customer) $displayName = $customer['customer_name'];
    }

    $user['display_name'] = $displayName;
    $user['depot_name'] = $depotName;
    $user['user_type'] = [
        'admin' => 'COMPANY ADMIN',
        'employee' => 'EMPLOYEE',
        'customer' => 'CUSTOMER',
    ][$user['role']] ?? strtoupper($user['role']);

    return $user;
}

$userId = (int)$currentUser['user_id'];

try {
    if ($method === 'GET') {
        accountJson(['user' => loadAccountDetails($db, $usersTable, $userId)]);
    }

    if ($method === 'PUT') {
        $username = trim((string)($input['username'] ?? ''));
        $email = trim((string)($input['email'] ?? ''));

        if ($username === '') accountJson(['error' => 'Username is required.'], 422);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            accountJson(['error' => 'Enter a valid email address.'], 422);
        }

        $stmt = $db->prepare(
            "SELECT user_id FROM `{$usersTable}`
             WHERE user_id <> ? AND (username = ? OR email = ?) LIMIT 1"
        );
        $stmt->execute([$userId, $username, $email]);
        if ($stmt->fetch()) {
            accountJson(['error' => 'That username or email is already in use.'], 409);
        }

        $stmt = $db->prepare(
            "UPDATE `{$usersTable}` SET username = ?, email = ?, updated_at = NOW() WHERE user_id = ?"
        );
        $stmt->execute([$username, $email, $userId]);
        $_SESSION['user']['username'] = $username;
        $_SESSION['user']['email'] = $email;

        accountJson([
            'success' => true,
            'user' => loadAccountDetails($db, $usersTable, $userId),
        ]);
    }

    if ($method === 'POST' && $action === 'password') {
        $currentPassword = (string)($input['current_password'] ?? '');
        $newPassword = (string)($input['new_password'] ?? '');
        if ($currentPassword === '' || $newPassword === '') {
            accountJson(['error' => 'Current and new passwords are required.'], 422);
        }
        if (strlen($newPassword) < 8) {
            accountJson(['error' => 'New password must be at least 8 characters.'], 422);
        }

        $stmt = $db->prepare("SELECT password_hash FROM `{$usersTable}` WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $account = $stmt->fetch();
        if (!$account || !password_verify($currentPassword, $account['password_hash'])) {
            accountJson(['error' => 'Current password is incorrect.'], 422);
        }

        $stmt = $db->prepare(
            "UPDATE `{$usersTable}` SET password_hash = ?, updated_at = NOW() WHERE user_id = ?"
        );
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $userId]);
        accountJson(['success' => true, 'message' => 'Password changed successfully.']);
    }

    accountJson(['error' => 'Method not allowed.'], 405);
} catch (PDOException $error) {
    accountJson(['error' => 'Unable to access account information right now.'], 500);
}