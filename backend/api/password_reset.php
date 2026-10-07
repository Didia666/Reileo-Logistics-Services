<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mailer.php';

$db = getDB();
$usersTable = tableName('reileo_logistics_services_users');
$tokensTable = tableName('password_reset_tokens');
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?: [];

function passwordResetJson(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function ensurePasswordResetTable(PDO $db, string $table): void
{
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `{$table}` (
            reset_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME NULL,
            PRIMARY KEY (reset_id),
            UNIQUE KEY uq_password_reset_token_hash (token_hash),
            KEY idx_password_reset_user_created (user_id, created_at),
            KEY idx_password_reset_expiry (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

function resetEmailMessage(string $resetUrl): array
{
    $safeUrl = htmlspecialchars($resetUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = '<p>A password reset was requested for your Reileo Logistics Services account.</p>'
        . '<p><a href="' . $safeUrl . '">Reset your password</a></p>'
        . '<p>This link expires in one hour and can only be used once. If you did not request this, ignore this email.</p>';
    $plain = "A password reset was requested for your Reileo Logistics Services account.\n\n"
        . "Reset your password: {$resetUrl}\n\n"
        . "This link expires in one hour and can only be used once. If you did not request this, ignore this email.";
    return [$html, $plain];
}

try {
    ensurePasswordResetTable($db, $tokensTable);

    if ($action === 'request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            passwordResetJson(['error' => 'Enter a valid email address.'], 422);
        }

        $mailConfig = appMailConfig();
        foreach (['smtp_host', 'smtp_username', 'smtp_password', 'from_email'] as $required) {
            if (trim((string)$mailConfig[$required]) === '') {
                error_log('Password reset is unavailable because SMTP is not configured.');
                passwordResetJson(['error' => 'Password reset email is not configured. Contact the system administrator.'], 503);
            }
        }

        $stmt = $db->prepare(
            "SELECT user_id, email FROM `{$usersTable}` WHERE email = ? AND status = 'Active' LIMIT 1"
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        $genericMessage = 'If an active account matches that email, a password reset link will be sent.';
        if (!$user) {
            passwordResetJson(['success' => true, 'message' => $genericMessage]);
        }

        $stmt = $db->prepare(
            "SELECT reset_id FROM `{$tokensTable}`
             WHERE user_id = ? AND used_at IS NULL AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
             LIMIT 1"
        );
        $stmt->execute([(int)$user['user_id']]);
        if ($stmt->fetch()) {
            passwordResetJson(['success' => true, 'message' => $genericMessage]);
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $stmt = $db->prepare("DELETE FROM `{$tokensTable}` WHERE user_id = ? AND used_at IS NULL");
        $stmt->execute([(int)$user['user_id']]);
        $stmt = $db->prepare(
            "INSERT INTO `{$tokensTable}` (user_id, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))"
        );
        $stmt->execute([(int)$user['user_id'], $tokenHash]);

        $resetUrl = $mailConfig['app_url'] . '/reset-password?token=' . rawurlencode($token);
        [$html, $plain] = resetEmailMessage($resetUrl);
        try {
            sendAppEmail($user['email'], 'Reset your Reileo Logistics Services password', $html, $plain);
        } catch (Throwable $mailError) {
            $stmt = $db->prepare("DELETE FROM `{$tokensTable}` WHERE token_hash = ?");
            $stmt->execute([$tokenHash]);
            error_log('Password reset email delivery failed: ' . $mailError->getMessage());
        }

        passwordResetJson(['success' => true, 'message' => $genericMessage]);
    }

    if ($action === 'reset' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = trim((string)($input['token'] ?? ''));
        $newPassword = (string)($input['new_password'] ?? '');
        if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
            passwordResetJson(['error' => 'This reset link is invalid or expired. Request a new one.'], 422);
        }
        if (strlen($newPassword) < 8) {
            passwordResetJson(['error' => 'Password must be at least 8 characters.'], 422);
        }

        $db->beginTransaction();
        $stmt = $db->prepare(
            "SELECT r.reset_id, r.user_id
             FROM `{$tokensTable}` r
             JOIN `{$usersTable}` u ON u.user_id = r.user_id
             WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > NOW()
               AND u.status = 'Active'
             LIMIT 1 FOR UPDATE"
        );
        $stmt->execute([hash('sha256', $token)]);
        $reset = $stmt->fetch();
        if (!$reset) {
            $db->rollBack();
            passwordResetJson(['error' => 'This reset link is invalid or expired. Request a new one.'], 422);
        }

        $stmt = $db->prepare("UPDATE `{$usersTable}` SET password_hash = ?, updated_at = NOW() WHERE user_id = ?");
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), (int)$reset['user_id']]);
        $stmt = $db->prepare("UPDATE `{$tokensTable}` SET used_at = NOW() WHERE reset_id = ?");
        $stmt->execute([(int)$reset['reset_id']]);
        $stmt = $db->prepare(
            "DELETE FROM `{$tokensTable}` WHERE user_id = ? AND reset_id <> ? AND used_at IS NULL"
        );
        $stmt->execute([(int)$reset['user_id'], (int)$reset['reset_id']]);
        $db->commit();

        passwordResetJson(['success' => true, 'message' => 'Password reset successfully.']);
    }

    passwordResetJson(['error' => 'Unsupported password reset action.'], 405);
} catch (Throwable $error) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('Password reset request failed: ' . $error->getMessage());
    passwordResetJson(['error' => 'Unable to process the password reset request right now.'], 500);
}