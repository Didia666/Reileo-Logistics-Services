<?php
return [
    'smtp_host'     => getenv('SMTP_HOST')     ?: 'smtp.gmail.com',
    'smtp_port'     => (int)(getenv('SMTP_PORT') ?: 587),
    'smtp_username' => getenv('SMTP_USERNAME') ?: '',
    'smtp_password' => getenv('SMTP_PASSWORD') ?: '',
    'from_email'    => getenv('MAIL_FROM_EMAIL') ?: '',
    'from_name'     => getenv('MAIL_FROM_NAME')  ?: 'Reileo Logistics Services',
    'app_url'       => getenv('APP_URL')         ?: 'http://localhost:5173',
];
