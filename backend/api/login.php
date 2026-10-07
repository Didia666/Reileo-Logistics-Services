<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? 'login';
        if ($action === 'logout') {
            logoutUser();
            echo json_encode(['success' => true]);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        if ($username === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Username and password are required']);
            exit;
        }
        $result = loginUser($username, $password);
        if (!$result['success']) {
            http_response_code(401);
            echo json_encode(['error' => $result['error']]);
            exit;
        }
        echo json_encode($result);
        break;

    case 'GET':
        $user = currentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['user' => null]);
            exit;
        }
        echo json_encode(['user' => $user]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
