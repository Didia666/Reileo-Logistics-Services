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
    $tblBVehicles

) {
    return "SELECT
                    b.booking_id,
                    b.booking_no,
                    b.delivery_date,
                    b.delivered_datetime,
                    bv.vehicle_id AS vehicle_id,
                    COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                    bv.odometer,
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
            LEFT JOIN `{$tblBReferences}` r ON b.booking_id = r.booking_id";
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
                $tblBVehicles
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
    
    // case 'POST':


        
    
    //     if ($delivery_datetime === '') echoJson(['error' => 'Delivery DateTime is required'], 400);

    

    //     try {
    //         $db->beginTransaction();

    //         $bCols = []; $bPh = []; $bParams = [];
    //         foreach ([
    //             'booking_no'=>generateBookingNo($db, $tblBookings),
    //             'customer_id'=>$customer_id,
    //             'booking_type_id'=>$booking_type_id,
    //             'status_id'=>1,
    //             'created_by'=>(int)$currentUser['user_id'],
    //             'delivery_date'=>$delivery_date,
    //             'depot_id'=>$depot_id,
    //             'commodity_type_id'=>$commodity_type_id,
    //             'route_code'=>$route_code,
    //             'trips_number'=>$trips_number,
    //             'drops_number'=>$drops_number,
    //             'origin_id'=>$origin_id,
    //             'destination_id'=>$destination_id,
    //         ] as $k=>$v) {
    //             $bCols[] = "`{$k}`";
    //             $bPh[]   = '?';
    //             $bParams[] = $v;
    //         }
    //         $sql = "INSERT INTO `{$tblBookings}` (" . implode(', ', $bCols) . ") VALUES (" . implode(', ', $bPh) . ")";
    //         $stmtV = $db->prepare($sql);
    //         $stmtV->execute($bParams);
    //         if ($stmtV->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Insert failed'], 500); }
    //         $booking_id = (int)$db->lastInsertId();
    //         if ($booking_id <= 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no ID'], 500); }

    //         $blCols = []; $blPh = []; $blParams = [];
    //         foreach ([
    //             'booking_id'=>$booking_id,
    //             'vehicle_id'=>$vehicle_id,
    //             'vendor_id'=>$vendor_id,
    //             'plate_no'=>$plate_no,                
    //         ] as $k=>$v) {
    //             $blCols[] = "`{$k}`";
    //             $blPh[]   = '?';
    //             $blParams[] = $v;
    //         }
    //         $sql = "INSERT INTO `{$tblBVehicles}` (" . implode(', ', $blCols) . ") VALUES (" . implode(', ', $blPh) . ")";
    //         $stmtVl = $db->prepare($sql);
    //         $stmtVl->execute($blParams);

    //         $bsCols = []; $bsPh = []; $bsParams = [];
    //         foreach ([
    //             'booking_id'=>$booking_id,
    //             'area'=>$area,
    //             'trip_allowance'=>$trip_allowance,
    //             'fuel'=>$fuel,
    //             'fuel_po'=>$fuel_po,
    //             'fuel_amount'=>$fuel_amount,
    //         ] as $k=>$v) {
    //             $bsCols[] = "`{$k}`";
    //             $bsPh[]   = '?';
    //             $bsParams[] = $v;
    //         }

    //         $sql = "INSERT INTO `{$tblBFuel}` (" . implode(', ', $bsCols) . ") VALUES (" . implode(', ', $bsPh) . ")";
    //         $stmtBs = $db->prepare($sql);
    //         $stmtBs->execute($bsParams);

    //         $roleBindings = [
    //             ['driver', $driver_id],
    //             ['helper1', $helper1_id],
    //             ['helper2', $helper2_id],
    //         ];

    //         foreach ($roleBindings as [$role, $personnelId]) {
    //             if ((int)$personnelId <= 0) {
    //                 continue;
    //             }

    //             $stmtBrc = $db->prepare(
    //                 "INSERT INTO `{$tblBPersonnel}` (booking_id, personnel_id, assignment_role) VALUES (?, ?, ?)"
    //             );
    //             $stmtBrc->execute([$booking_id, (int)$personnelId, $role]);
    //         }

    //         $rCols = []; $rPh = []; $rParams = [];
    //         foreach ([
    //             'booking_id'=>$booking_id,
    //             'client_ref_no'=>$client_ref_no,
    //             'other_ref_no'=>$other_ref_no,
    //             'remarks'=>$remarks
    //         ] as $k=>$v) {
    //             $rCols[] =  "`{$k}`";
    //             $rPh[] = '?';
    //             $rParams[] = $v;
    //         }

    //         $sql = "INSERT INTO `{$tblBReferences}` (" . implode(', ', $rCols) . ") VALUES (" . implode(', ', $rPh) . ")";
    //         $stmtR = $db->prepare($sql);
    //         $stmtR->execute($rParams);

    //         $stmtId = $db->prepare(
    //             "INSERT INTO `{$tblBItems}`
    //                 (booking_id, item_type_id, item_description, length, width, height, weight)
    //              VALUES (?, ?, ?, ?, ?, ?, ?)"
    //         );

    //         foreach ($item_details as $item) {
    //             if (!is_array($item)) {
    //                 continue;
    //             }

    //             $itemTypeId = $item['item_type_id'] ?? null;
    //             $itemDescription = trim((string)($item['item_description'] ?? ''));
    //             $length = $item['length'] ?? null;
    //             $width = $item['width'] ?? null;
    //             $height = $item['height'] ?? null;
    //             $weight = $item['weight'] ?? null;

    //             // The form keeps one blank row ready for the next item.
    //             if (($itemTypeId === null || $itemTypeId === '')
    //                 && $itemDescription === ''
    //                 && ($length === null || $length === '')
    //                 && ($width === null || $width === '')
    //                 && ($height === null || $height === '')
    //                 && ($weight === null || $weight === '')) {
    //                 continue;
    //             }

    //             $stmtId->execute([
    //                 $booking_id,
    //                 $itemTypeId !== null && $itemTypeId !== '' ? (int)$itemTypeId : null,
    //                 $itemDescription !== '' ? $itemDescription : null,
    //                 $length !== null && $length !== '' ? (float)$length : null,
    //                 $width !== null && $width !== '' ? (float)$width : null,
    //                 $height !== null && $height !== '' ? (float)$height : null,
    //                 $weight !== null && $weight !== '' ? (float)$weight : null,
    //             ]);
    //         }
        

    //         if (is_array($bk_photos)) {
    //             $stmtPhoto = $db->prepare("
    //                 INSERT INTO `{$tblBPhotos}`
    //                 (booking_id, photo_name, photo_path)
    //                 VALUES (?, ?, ?)
    //             ");

    //             foreach ($bk_photos as $row) {
    //                 $photoName = trim($row['photo_name'] ?? '');
    //                 $photoPath = trim($row['photo_path'] ?? '');

    //                 // Ignore completely empty rows
    //                 if ($photoName === '' && $photoPath === '') {
    //                     continue;
    //                 }

    //                 $stmtPhoto->execute([
    //                     $booking_id,
    //                     $photoName !== '' ? $photoName : null,
    //                     $photoPath !== '' ? $photoPath : null
    //                 ]);
    //             }
    //         }

    //         $db->commit();

    //         $stmtg = $db->prepare("SELECT * FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
    //         $stmtg->execute([$booking_id]);
    //         $saved = $stmtg->fetch();
    //         echoJson($saved, 201);

    //     } catch (PDOException $e) {
    //         if ($db->inTransaction()) $db->rollBack();
    //         echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
    //     }
    //     break;

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

                $stmt = $db->prepare("UPDATE `{$tblBReferences}` SET remarks = ? WHERE booking_id = ?");
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

