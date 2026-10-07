<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

function appMailConfig(): array
{
    $config = [
        'smtp_host' => getenv('SMTP_HOST') ?: '',
        'smtp_port' => (int)(getenv('SMTP_PORT') ?: 587),
        'smtp_username' => getenv('SMTP_USERNAME') ?: '',
        'smtp_password' => getenv('SMTP_PASSWORD') ?: '',
        'from_email' => getenv('SMTP_FROM_EMAIL') ?: '',
        'from_name' => getenv('SMTP_FROM_NAME') ?: 'Reileo Logistics Services',
        'app_url' => getenv('APP_URL') ?: 'http://localhost:5173',
    ];

    $localConfigPath = __DIR__ . '/mail_config.local.php';
    if (is_file($localConfigPath)) {
        $localConfig = require $localConfigPath;
        if (is_array($localConfig)) {
            $config = array_replace($config, $localConfig);
        }
    }

    $config['app_url'] = rtrim((string)$config['app_url'], '/');
    return $config;
}

function sendAppEmail(string $to, string $subject, string $htmlBody, string $plainBody = ''): void
{
    require_once __DIR__ . '/../PHPMailer/src/Exception.php';
    require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
    require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

    $config = appMailConfig();
    foreach (['smtp_host', 'smtp_username', 'smtp_password', 'from_email'] as $required) {
        if (trim((string)$config[$required]) === '') {
            throw new RuntimeException('SMTP is not configured.');
        }
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_username'];
    $mail->Password = $config['smtp_password'];
    $mail->Port = (int)$config['smtp_port'];
    $mail->SMTPSecure = $mail->Port === 465
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->SMTPDebug = SMTP::DEBUG_OFF;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($to);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $htmlBody;
    $mail->AltBody = $plainBody !== '' ? $plainBody : strip_tags($htmlBody);
    $mail->send();
}