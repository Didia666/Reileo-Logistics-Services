<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();
$tblBookings = tableName('bookings');
$tblBClientCost = tableName('bk_client_cost');
$tblStatuses = tableName('booking_statuses');
$tblCustomers = tableName('customers');

function dashboardJson($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

$selectedDate = trim((string)($_GET['date'] ?? date('Y-m-d')));
$date = DateTimeImmutable::createFromFormat('!Y-m-d', $selectedDate);
$dateErrors = DateTimeImmutable::getLastErrors();

if (
    !$date ||
    ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) ||
    $date->format('Y-m-d') !== $selectedDate
) {
    dashboardJson(['error' => 'A valid date in YYYY-MM-DD format is required.'], 400);
}

$weekStart = $date->modify('monday this week')->format('Y-m-d');
$weekEnd = $date->modify('sunday this week')->format('Y-m-d');

try {
    $stmt = $db->prepare(
        "SELECT
            COALESCE(SUM(CASE WHEN b.delivery_date = ? THEN COALESCE(b.trips_number, 0) ELSE 0 END), 0) AS daily_trips,
            COALESCE(SUM(CASE WHEN b.delivery_date BETWEEN ? AND ? THEN COALESCE(b.trips_number, 0) ELSE 0 END), 0) AS weekly_trips,
            COALESCE(SUM(CASE WHEN b.delivery_date = ? THEN COALESCE(cc.total_amount, 0) ELSE 0 END), 0) AS daily_total_rates,
            COALESCE(SUM(CASE WHEN b.delivery_date BETWEEN ? AND ? THEN COALESCE(cc.total_amount, 0) ELSE 0 END), 0) AS weekly_total_rates
        FROM `{$tblBookings}` b
        LEFT JOIN `{$tblBClientCost}` cc ON cc.booking_id = b.booking_id
        WHERE b.delivery_date BETWEEN ? AND ?"
    );
    $stmt->execute([
        $selectedDate,
        $weekStart,
        $weekEnd,
        $selectedDate,
        $weekStart,
        $weekEnd,
        $weekStart,
        $weekEnd,
    ]);
    $summary = $stmt->fetch();

    $statusStmt = $db->query(
        "SELECT bs.status_name, COUNT(b.booking_id) AS booking_count
        FROM `{$tblStatuses}` bs
        LEFT JOIN `{$tblBookings}` b ON b.status_id = bs.status_id
        GROUP BY bs.status_id, bs.status_name
        ORDER BY bs.status_name"
    );
    $statusCounts = $statusStmt->fetchAll();

    $attentionStmt = $db->prepare(
        "SELECT
            COALESCE(SUM(CASE
                WHEN b.delivery_date < ? AND (bs.status_name IS NULL OR bs.status_name NOT IN ('Delivered', 'Completed', 'Cancelled', 'Declined'))
                THEN 1 ELSE 0
            END), 0) AS overdue_count,
            COALESCE(SUM(CASE
                WHEN b.delivery_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)
                    AND (bs.status_name IS NULL OR bs.status_name NOT IN ('Delivered', 'Completed', 'Cancelled', 'Declined'))
                THEN 1 ELSE 0
            END), 0) AS upcoming_count,
            COALESCE(SUM(CASE WHEN bs.status_name = 'Under Review' THEN 1 ELSE 0 END), 0) AS pending_approval_count
        FROM `{$tblBookings}` b
        LEFT JOIN `{$tblStatuses}` bs ON bs.status_id = b.status_id"
    );
    $attentionStmt->execute([$selectedDate, $selectedDate, $selectedDate]);
    $attentionCounts = $attentionStmt->fetch();

    $deliveryListSql = "SELECT b.booking_id, b.booking_no, b.delivery_date, bs.status_name, c.customer_name
        FROM `{$tblBookings}` b
        LEFT JOIN `{$tblStatuses}` bs ON bs.status_id = b.status_id
        LEFT JOIN `{$tblCustomers}` c ON c.customer_id = b.customer_id";
    $activeBookingsSql = " AND (bs.status_name IS NULL OR bs.status_name NOT IN ('Delivered', 'Completed', 'Cancelled', 'Declined'))";

    $overdueStmt = $db->prepare(
        $deliveryListSql . " WHERE b.delivery_date < ?" . $activeBookingsSql .
        " ORDER BY b.delivery_date ASC, b.booking_id DESC LIMIT 5"
    );
    $overdueStmt->execute([$selectedDate]);

    $upcomingStmt = $db->prepare(
        $deliveryListSql . " WHERE b.delivery_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)" . $activeBookingsSql .
        " ORDER BY b.delivery_date ASC, b.booking_id DESC LIMIT 5"
    );
    $upcomingStmt->execute([$selectedDate, $selectedDate]);

    $pendingStmt = $db->prepare(
        "SELECT b.booking_id, b.booking_no, b.delivery_date, bs.status_name, c.customer_name
        FROM `{$tblBookings}` b
        JOIN `{$tblStatuses}` bs ON bs.status_id = b.status_id
        LEFT JOIN `{$tblCustomers}` c ON c.customer_id = b.customer_id
        WHERE bs.status_name = 'Under Review'
        ORDER BY b.created_at DESC, b.booking_id DESC
        LIMIT 5"
    );
    $pendingStmt->execute();

    dashboardJson([
        'selected_date' => $selectedDate,
        'week_start' => $weekStart,
        'week_end' => $weekEnd,
        'daily_trips' => (float)$summary['daily_trips'],
        'weekly_trips' => (float)$summary['weekly_trips'],
        'daily_total_rates' => (float)$summary['daily_total_rates'],
        'weekly_total_rates' => (float)$summary['weekly_total_rates'],
        'status_counts' => array_map(static function ($row) {
            return [
                'status_name' => $row['status_name'],
                'booking_count' => (int)$row['booking_count'],
            ];
        }, $statusCounts),
        'overdue_count' => (int)$attentionCounts['overdue_count'],
        'overdue_bookings' => $overdueStmt->fetchAll(),
        'upcoming_count' => (int)$attentionCounts['upcoming_count'],
        'upcoming_bookings' => $upcomingStmt->fetchAll(),
        'pending_approval_count' => (int)$attentionCounts['pending_approval_count'],
        'pending_approvals' => $pendingStmt->fetchAll(),
    ]);
} catch (PDOException $e) {
    error_log('Dashboard summary error: ' . $e->getMessage());
    dashboardJson(['error' => 'Unable to load dashboard summary.'], 500);
}
