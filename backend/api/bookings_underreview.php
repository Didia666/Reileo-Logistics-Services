<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$currentUser = requireAuth();
$db = getDB();

// $tblModels = tableName('vh_models');
// $tblManufacturers = tableName('vh_manufacturers');
// $tblVehicleStatuses = tableName('vehicle_statuses');
// $tblAcquisition = tableName('vh_acquisition');
// $tblDocuments = tableName('vh_documents');
// $tblInsurance = tableName('vh_insurance');
// $tblLocation = tableName('vh_location');
// $tblPhotos = tableName('vh_photos');
// $tblRegistrationCompliance = tableName('vh_regist_compli');
// $tblSpecifications = tableName('vh_specifications');


$tblBookings = tableName('bookings');
$tblBStatuses = tableName('booking_statuses');
$tblBFuel = tableName('bk_fuel_trip');
$tblBReferences = tableName('bk_references');
$tblVehicles = tableName('vehicles');
$tblBVehicles = tableName('bk_vehicles');
$tblBExpenses = tableName('bk_expenses');


$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    $input = $raw ? (json_decode($raw, true) ?: []) : [];
}

function echoJson($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function generateBookingNo($db, $table) {
    $prefix = 'BK-' . date('Ymd') . '-';
    $stmt = $db->prepare("SELECT booking_no FROM `{$table}` WHERE booking_no LIKE ? ORDER BY booking_id DESC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $row = $stmt->fetch();
    $nextNumber = 1;

    if ($row && !empty($row['booking_no'])) {
        $parts = explode('-', $row['booking_no']);
        $nextNumber = (int)end($parts) + 1;
    }

    return $prefix . str_pad((string)$nextNumber, 4, '0', STR_PAD_LEFT);
}



function detailSql(
    $tblBookings,
    $tblBStatuses,
    $tblBFuel,
    $tblBReferences,
    $tblVehicles,
    $tblBVehicles,
    $tblBExpenses
    
) {
    return "SELECT
                    b.booking_id,
                    b.booking_no,
                    b.delivery_date,
                    b.delivered_datetime,
                    bv.vehicle_id AS vehicle_id,
                    COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                    bv.odometer,
                    e.travel_fund,
                    r.remarks,
                    f.fuel_po,
                    r.remarks,	
                    b.status_id,
                    bs.status_name,
                    b.created_at
            FROM `{$tblBookings}` b     
            LEFT JOIN `{$tblBStatuses}` bs ON b.status_id = bs.status_id
            LEFT JOIN `{$tblBFuel}` f ON b.booking_id = f.booking_id
            LEFT JOIN `{$tblBVehicles}` bv ON b.booking_id = bv.booking_id
            LEFT JOIN `{$tblVehicles}` v ON bv.vehicle_id = v.vehicle_id
            LEFT JOIN `{$tblBReferences}` r ON b.booking_id = r.booking_id
            LEFT JOIN `{$tblBExpenses}` e ON b.booking_id = e.booking_id";
            }


switch ($method) {

    case 'GET':
        try {
            if ($id <= 0) {
                echoJson(['error' => 'Booking ID is required'], 400);
            }

            $detailSql = detailSql(
                $tblBookings,
                $tblBStatuses,
                $tblBFuel,
                $tblBReferences,
                $tblVehicles,
                $tblBVehicles,
                $tblBExpenses
            ) . " WHERE b.booking_id = ? LIMIT 1";

            $stmt = $db->prepare($detailSql);
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) {
                echoJson(['error' => 'Booking not found'], 404);
            }

            echoJson($row);

        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;
    


        case 'POST':
            
            if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
            $stmtChk = $db->prepare("SELECT booking_id FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
            $stmtChk->execute([$id]);
            if (!$stmtChk->fetch()) echoJson(['error' => 'Booking not found'], 404);

            $underreview = $input['underreview'] ?? [];

            // Under Review
            $delivery_date = trim($underreview['delivery_date'] ?? '');
            $plate_no = trim($underreview['plate_no'] ?? '');
            $delivery_datetime = trim($underreview['delivery_datetime'] ?? '');
            $fuel_po = trim((string)($underreview['fuel_po'] ?? ''));
            $fuel_po = $fuel_po !== '' ? $fuel_po : null;
            $odometer = ($underreview['odometer'] ?? '') !== ''
                ? (float)$underreview['odometer']
                : null;
            $travel_fund = ($underreview['travel_fund'] ?? '') !== ''
                ? (float)$underreview['travel_fund']
                : null;
            $remarks = trim($underreview['remarks'] ?? '');


            try {
                $db->beginTransaction();

                $stmtStatus = $db->prepare(
                    "SELECT status_id, status_name FROM `{$tblBStatuses}` WHERE status_name = ? LIMIT 1"
                );
                $stmtStatus->execute(['Dispatched']);
                $dispatchStatus = $stmtStatus->fetch();
                if (!$dispatchStatus) {
                    throw new RuntimeException('Dispatched status is not configured.');
                }
                $dispatchStatusId = (int)$dispatchStatus['status_id'];

                $stmtB = $db->prepare(
                    "UPDATE `{$tblBookings}` SET
                        delivered_datetime = ?, status_id = ?
                    WHERE booking_id = ?"
                );
                $stmtB->execute([
                    $delivery_datetime ?: null, $dispatchStatusId, $id
                ]);

            
        
                $stmtFuelExists = $db->prepare(
                    "SELECT booking_id FROM `{$tblBFuel}` WHERE booking_id = ? LIMIT 1"
                );
                $stmtFuelExists->execute([$id]);
                if ($stmtFuelExists->fetch()) {
                    $stmtFO = $db->prepare(
                        "UPDATE `{$tblBFuel}` SET fuel_po = ? WHERE booking_id = ?"
                    );
                    $stmtFO->execute([$fuel_po, $id]);
                } else {
                    $stmtFO = $db->prepare(
                        "INSERT INTO `{$tblBFuel}` (booking_id, fuel_po) VALUES (?, ?)"
                    );
                    $stmtFO->execute([$id, $fuel_po]);
                }


                $stmtOdo = $db->prepare("UPDATE `{$tblBVehicles}` SET odometer = ? WHERE booking_id = ?");
                $stmtOdo->execute([$odometer, $id]);

                $stmtChkExpenses = $db->prepare("SELECT booking_id FROM `{$tblBExpenses}` WHERE booking_id = ? LIMIT 1");
                $stmtChkExpenses->execute([$id]);
                if ($stmtChkExpenses->fetch()) {
                    $stmtExpenses = $db->prepare(
                        "UPDATE `{$tblBExpenses}` SET
                            travel_fund = ?,                            
                        WHERE booking_id = ?"
                    );
                    $stmtExpenses->execute([
                        $travel_fund,
                        $id
                    ]);
                } else {
                    $stmtExpenses = $db->prepare(
                        "INSERT INTO `{$tblBExpenses}`
                            (booking_id, travel_fund)
                        VALUES (?, ?)"
                    );
                    $stmtExpenses->execute([
                        $id,
                        $travel_fund,
                    ]);
                }

                $stmt= $db->prepare("UPDATE `{$tblBReferences}` SET remarks = ? WHERE booking_id = ?");
                $stmt->execute([$remarks, $id]);
            
                $db->commit();
                echoJson([
                    'success' => true,
                    'booking_id' => $id,
                    'status_id' => $dispatchStatusId,
                    'status_name' => $dispatchStatus['status_name'],
                ], 200);
                } catch (Throwable $e) {
                    if ($db->inTransaction()) $db->rollBack();
                    error_log('Booking update failed: ' . $e->getMessage());
                    echoJson(['error' => 'Booking update failed: ' . $e->getMessage()], 500);
                }
    }

