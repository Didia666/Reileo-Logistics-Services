<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'reileo_logistics_services');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PREFIX', 'reileo_logistics_services_');

function getDB() {
    $conn = null;
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $conn = new PDO($dsn, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
    return $conn;
}

function tableName($name) {
    return DB_PREFIX . $name;
}
