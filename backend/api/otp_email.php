<?php
require_once __DIR__ . '/../../api/mailer.php';

function sendOTP($email, $otp) {
    $safeOtp = htmlspecialchars((string)$otp, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = '<h3>Your OTP Code is:</h3><h1>' . $safeOtp . '</h1><p>Expires in 5 minutes.</p>';
    $plain = "Your OTP Code is: {$otp}\nExpires in 5 minutes.";

    try {
        sendAppEmail($email, 'Your OTP Code', $html, $plain);
        return true;
    } catch (Throwable $error) {
        error_log('OTP email delivery failed: ' . $error->getMessage());
        return false;
    }
}
