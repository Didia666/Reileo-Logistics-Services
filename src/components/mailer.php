<?php
require_once __DIR__ . '/../../api/mailer.php';

function sendEmail($to, $subject, $body) {
    try {
        sendAppEmail($to, $subject, nl2br($body), $body);
        return true;
    } catch (Throwable $error) {
        error_log('Email delivery failed: ' . $error->getMessage());
        return false;
    }
}
