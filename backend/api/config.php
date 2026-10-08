<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_DATABASE', getenv('DB_DATABASE') ?: 'reileo_logistics_services');
define('DB_USERNAME', getenv('DB_USERNAME') ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: '');
define('DB_PREFIX', getenv('DB_PREFIX') ?: '');

function getDB() {
    $conn = null;
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_DATABASE . ";charset=utf8mb4";
        $conn = new PDO($dsn, DB_USERNAME, DB_PASSWORD);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
        http_response_code(500);
        $isDev = (DB_HOST === 'localhost');
        echo json_encode([
            'error' => $isDev
                ? 'Database connection failed: ' . $e->getMessage()
                : 'Database connection failed.'
        ]);
        exit;
    }
    return $conn;
}

function tableName($name) {
    return DB_PREFIX . $name;
}
