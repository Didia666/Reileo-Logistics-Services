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
                    COALESCE(bv.vehicle_id, b.vehicle_id) AS vehicle_id,
                    COALESCE(bv.plate_no, v.plate_no) AS plate_no,
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
            LEFT JOIN `{$tblVehicles}` v ON COALESCE(bv.vehicle_id, b.vehicle_id) = v.vehicle_id
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
        

    //     $booking_info = $input['booking_info'] ?? [];
    //     $vehicle_assignment = $input['vehicle_assignment'] ?? [];
    //     $fueltrip_allowance = $input['fueltrip_allowance'] ?? [];
    //     $personnel_assignment = $input['personnel_assignment'] ?? [];
    //     $references = $input['references'] ?? [];
    //     $item_details = $input['item_details'] ?? [];

    //     //booking_info

    //     $customer_id = (int)($booking_info['customer_id'] ?? NULL);
    //     $booking_type_id = (int)($booking_info['booking_type_id'] ?? NULL);
    //     $delivery_date = trim($booking_info['delivery_date'] ?? '');
    //     $depot_id = (int)($booking_info['depot_id'] ?? NULL);
    //     $commodity_type_id = (int)($booking_info['commodity_type_id'] ?? NULL);
    //     $route_code = trim($booking_info['route_code'] ?? '');
    //     $trips_number = (int)($booking_info['trips_number'] ?? NULL);
    //     $drops_number = (int)($booking_info['drops_number'] ?? NULL);
    //     $origin_id = (int)($booking_info['origin_id'] ?? NULL);
    //     $destinationValue = $booking_info['destination_id'] ?? null;
    //     $destination_id = ($destinationValue === null || $destinationValue === '' || (int)$destinationValue === 0)
    //         ? null
    //         : (int)$destinationValue;
        
    //     //vehicle_assignment
    //     $vehicle_id = (int)($vehicle_assignment['vehicle_id'] ?? NULL);
    //     $plate_no = trim($vehicle_assignment['plate_no'] ?? '');
    //     $vehicle_type_id = (int)($vehicle_assignment['vehicle_type_id'] ?? NULL);
    //     $commodity_type_id = (int)($vehicle_assignment['commodity_type_id'] ?? NULL);
    //     $vendorValue = $vehicle_assignment['vendor_id'] ?? null;
    //     $vendor_id = ($vendorValue === null || $vendorValue === '' || (int)$vendorValue === 0)
    //         ? null
    //         : (int)$vendorValue;

    //     //personnel_assignment
    //     $driver_id = (int)($personnel_assignment['driver_id'] ?? NULL);
    //     $helper1_id = (int)($personnel_assignment['helper1_id'] ?? NULL);
    //     $helper2_id = (int)($personnel_assignment['helper2_id'] ?? NULL);

    //     $driver_source = trim($personnel_assignment['driver_source'] ?? 'direct');
    //     $helper1_source = trim($personnel_assignment['helper1_source'] ?? 'direct');
    //     $helper2_source = trim($personnel_assignment['helper2_source'] ?? 'direct');

    //     $driver_vendor_id = (int)($personnel_assignment['driver_vendor_id'] ?? NULL);
    //     $helper1_vendor_id = (int)($personnel_assignment['helper1_vendor_id'] ?? NULL);
    //     $helper2_vendor_id = (int)($personnel_assignment['helper2_vendor_id'] ?? NULL);

    //     //fueltrip_allowance
    //     $area = trim($fueltrip_allowance['area'] ?? '');
    //     $trip_allowance = trim($fueltrip_allowance['trip_allowance'] ?? '');
    //     $fuel = trim($fueltrip_allowance['fuel'] ?? '');
    //     $fuel_po = $fueltrip_allowance['fuel_po'] ?? null;
    //     $fuel_amount = $fueltrip_allowance['fuel_amount'] ?? null;

    //     //references
    //     $client_ref_no = trim($references['client_ref_no'] ?? '');
    //     $other_ref_no = trim($references['other_ref_no'] ?? '');
    //     $remarks = trim($references['remarks'] ?? '');

    //     //item_details
    //     $item_details = is_array($item_details) ? $item_details : [];

    //     // booking photos
    //     $bk_photos = $input['bk_photos'] ?? [];

    //     // if ($plate_no  === '') echoJson(['error' => 'Plate Number is required'], 400);
    //     // if ($body_no === '') echoJson(['error' => 'Body Number is required'], 400);
    //     // if ($status_id     === '') echoJson(['error' => 'Status is required'], 400);
    //     // if ($vehicle_type_id  === '') echoJson(['error' => 'Vehicle Type is required'], 400);
    //     // if ($vehicle_manufacturer_id === '') echoJson(['error' => 'Vehicle Manufacturer is required'], 400);
    //     // if ($vehicle_model_id     === '') echoJson(['error' => 'Vehicle Model is required'], 400);
       


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

        // case 'PUT':
        //     if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
        //     $stmtChk = $db->prepare("SELECT booking_id FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
        //     $stmtChk->execute([$id]);
        //     if (!$stmtChk->fetch()) echoJson(['error' => 'Booking not found'], 404);

        //     $booking_info = $input['booking_info'] ?? [];
        //     $vehicle_assignment = $input['vehicle_assignment'] ?? [];
        //     $fueltrip_allowance = $input['fueltrip_allowance'] ?? [];
        //     $personnel_assignment = $input['personnel_assignment'] ?? [];
        //     $references = $input['references'] ?? [];
        //     $item_details = $input['item_details'] ?? [];

        //     //booking_info

        //     $customer_id = (int)($booking_info['customer_id'] ?? NULL);
        //     $booking_type_id = (int)($booking_info['booking_type_id'] ?? NULL);
        //     $delivery_date = trim($booking_info['delivery_date'] ?? '');
        //     $depot_id = (int)($booking_info['depot_id'] ?? NULL);
        //     $commodity_type_id = (int)($booking_info['commodity_type_id'] ?? NULL);
        //     $route_code = trim($booking_info['route_code'] ?? '');
        //     $trips_number = (int)($booking_info['trips_number'] ?? NULL);
        //     $drops_number = (int)($booking_info['drops_number'] ?? NULL);
        //     $origin_id = (int)($booking_info['origin_id'] ?? NULL);
        //     $destinationValue = $booking_info['destination_id'] ?? null;
        //     $destination_id = ($destinationValue === null || $destinationValue === '' || (int)$destinationValue === 0)
        //         ? null
        //         : (int)$destinationValue;
            
        //     //vehicle_assignment
        //     $vehicle_id = (int)($vehicle_assignment['vehicle_id'] ?? NULL);
        //     $plate_no = trim($vehicle_assignment['plate_no'] ?? '');
        //     $vehicle_type_id = (int)($vehicle_assignment['vehicle_type_id'] ?? NULL);
        //     $commodity_type_id = (int)($vehicle_assignment['commodity_type_id'] ?? NULL);
        //     $vendorValue = $vehicle_assignment['vendor_id'] ?? null;
        //     $vendor_id = ($vendorValue === null || $vendorValue === '' || (int)$vendorValue === 0)
        //         ? null
        //         : (int)$vendorValue;

        //     //personnel_assignment
        //     $driver_id = (int)($personnel_assignment['driver_id'] ?? NULL);
        //     $helper1_id = (int)($personnel_assignment['helper1_id'] ?? NULL);
        //     $helper2_id = (int)($personnel_assignment['helper2_id'] ?? NULL);

        //     $driver_source = trim($personnel_assignment['driver_source'] ?? 'direct');
        //     $helper1_source = trim($personnel_assignment['helper1_source'] ?? 'direct');
        //     $helper2_source = trim($personnel_assignment['helper2_source'] ?? 'direct');

        //     $driver_vendor_id = (int)($personnel_assignment['driver_vendor_id'] ?? NULL);
        //     $helper1_vendor_id = (int)($personnel_assignment['helper1_vendor_id'] ?? NULL);
        //     $helper2_vendor_id = (int)($personnel_assignment['helper2_vendor_id'] ?? NULL);

        //     //fueltrip_allowance
        //     $area = trim($fueltrip_allowance['area'] ?? '');
        //     $trip_allowance = trim($fueltrip_allowance['trip_allowance'] ?? '');
        //     $fuel = trim($fueltrip_allowance['fuel'] ?? '');
        //     $fuel_po = $fueltrip_allowance['fuel_po'] ?? null;
        //     $fuel_amount = $fueltrip_allowance['fuel_amount'] ?? null;

        //     //references
        //     $client_ref_no = trim($references['client_ref_no'] ?? '');
        //     $other_ref_no = trim($references['other_ref_no'] ?? '');
        //     $remarks = trim($references['remarks'] ?? '');

        //     //item_details
        //     $item_details = is_array($item_details) ? $item_details : [];

        //     // booking photos
        //     $bk_photos = $input['bk_photos'] ?? [];


        //     try {
        //         $db->beginTransaction();

        //     $stmtB = $db->prepare(
        //         "UPDATE `{$tblBookings}` SET
        //             customer_id = ?, booking_type_id = ?, delivery_date = ?, depot_id = ?,
        //             commodity_type_id = ?, route_code = ?, trips_number = ?, drops_number = ?,
        //             origin_id = ?, destination_id = ?, updated_by = ?
        //          WHERE booking_id = ?"
        //     );
        //     $stmtB->execute([
        //         $customer_id, $booking_type_id, $delivery_date ?: null, $depot_id,
        //         $commodity_type_id, $route_code ?: null, $trips_number, $drops_number,
        //         $origin_id, $destination_id, (int)$currentUser['user_id'], $id,
        //     ]);
            

        //     $stmtChkBk = $db->prepare("SELECT booking_id FROM `{$tblBVehicles}` WHERE booking_id = ? LIMIT 1");
        //     $stmtChkBk->execute([$id]);
        //     $exBk = $stmtChkBk->fetch();
        //     $BkData = [
        //         'booking_id'=>$id,
        //         'vehicle_id'=>$vehicle_id,
        //         'vendor_id'=>$vendor_id,
        //         'plate_no'=>$plate_no,      
        //     ];

        //     if ($exBk) {
        //         $stmtEU = $db->prepare(
        //             "UPDATE `{$tblBVehicles}`
        //              SET vehicle_id = ?, vendor_id = ?, plate_no = ?
        //              WHERE booking_id = ?"
        //         );
        //         $stmtEU->execute([$vehicle_id, $vendor_id, $plate_no, $id]);
        //     } else {
        //         $ek = array_keys($BkData);
        //         $ev = array_values($BkData);
        //         $ph = array_fill(0, count($ek), '?');
        //         $stmtEI = $db->prepare("INSERT INTO `{$tblBVehicles}` (" . implode(',', $ek) . ") VALUES (" . implode(',', $ph) . ")");
        //         $stmtEI->execute($ev);
        //     }

        //     if (array_key_exists('fueltrip_allowance', $input)) {
        //         $stmtChkBf = $db->prepare("SELECT booking_id FROM `{$tblBFuel}` WHERE booking_id = ? LIMIT 1");
        //         $stmtChkBf->execute([$id]);
        //         $exBf = $stmtChkBf->fetch();
        //         $BfData = [
        //             'booking_id'=>$id,
        //             'area'=>$area,
        //             'trip_allowance'=>$trip_allowance,
        //             'fuel'=>$fuel,
        //             'fuel_po'=>$fuel_po,
        //             'fuel_amount'=>$fuel_amount,
        //         ];
        //         if ($exBf) {
        //             $stmtBU = $db->prepare(
        //                 "UPDATE `{$tblBFuel}`
        //                  SET area = ?, trip_allowance = ?, fuel = ?, fuel_po = ?, fuel_amount = ?
        //                  WHERE booking_id = ?"
        //             );
        //             $stmtBU->execute([$area, $trip_allowance, $fuel, $fuel_po, $fuel_amount, $id]);
        //         } else {
        //             $stmtBI = $db->prepare("INSERT INTO `{$tblBFuel}` (booking_id, area, trip_allowance, fuel, fuel_po, fuel_amount) VALUES (?, ?, ?, ?, ?, ?)");
        //             $stmtBI->execute(array_values($BfData));
        //         }
        //     }

        //     $roleBindings = [
        //         ['driver', $driver_id],
        //         ['helper1', $helper1_id],
        //         ['helper2', $helper2_id],
        //     ];

        //     foreach ($roleBindings as [$role, $personnelId]) {
        //         $personnelId = (int)$personnelId;

        //         $stmtChkPersonnel = $db->prepare(
        //             "SELECT booking_personnel_id
        //              FROM `{$tblBPersonnel}`
        //              WHERE booking_id = ? AND assignment_role = ?
        //              LIMIT 1"
        //         );
        //         $stmtChkPersonnel->execute([$id, $role]);
        //         $existingPersonnel = $stmtChkPersonnel->fetch();

        //         if ($personnelId > 0) {
        //             if ($existingPersonnel) {
        //                 $stmtUpdatePersonnel = $db->prepare(
        //                     "UPDATE `{$tblBPersonnel}`
        //                      SET personnel_id = ?
        //                      WHERE booking_personnel_id = ?"
        //                 );
        //                 $stmtUpdatePersonnel->execute([
        //                     $personnelId,
        //                     $existingPersonnel['booking_personnel_id'],
        //                 ]);
        //             } else {
        //                 $stmtInsertPersonnel = $db->prepare(
        //                     "INSERT INTO `{$tblBPersonnel}`
        //                         (booking_id, personnel_id, assignment_role)
        //                      VALUES (?, ?, ?)"
        //                 );
        //                 $stmtInsertPersonnel->execute([$id, $personnelId, $role]);
        //             }
        //         } elseif ($existingPersonnel) {
        //             $stmtDeletePersonnel = $db->prepare(
        //                 "DELETE FROM `{$tblBPersonnel}` WHERE booking_personnel_id = ?"
        //             );
        //             $stmtDeletePersonnel->execute([
        //                 $existingPersonnel['booking_personnel_id'],
        //             ]);
        //         }
        //     }

        //     $stmtChkR = $db->prepare("SELECT booking_id FROM `{$tblBReferences}` WHERE booking_id = ? LIMIT 1");
        //     $stmtChkR->execute([$id]);
        //     $exR = $stmtChkR->fetch();
        //     $RData = [
        //         'client_ref_no'=>$client_ref_no,
        //         'other_ref_no'=>$other_ref_no,
        //         'remarks'=>$remarks
        //     ];
        //     if ($exR) {
        //         $stmtEMU = $db->prepare(
        //             "UPDATE `{$tblBReferences}`
        //              SET client_ref_no = ?, other_ref_no = ?, remarks = ?
        //              WHERE booking_id = ?"
        //         );
        //         $stmtEMU->execute([$client_ref_no, $other_ref_no, $remarks, $id]);
        //     } else {
        //         $stmtEMI = $db->prepare("INSERT INTO `{$tblBReferences}` (booking_id, client_ref_no, other_ref_no, remarks) VALUES (?, ?, ?, ?)");
        //         $stmtEMI->execute([$id, $RData['client_ref_no'], $RData['other_ref_no'], $RData['remarks']]);
        //     }

        //     $stmtDeleteItems = $db->prepare(
        //         "DELETE FROM `{$tblBItems}` WHERE booking_id = ?"
        //     );
        //     $stmtDeleteItems->execute([$id]);

        //     $stmtInsertItem = $db->prepare(
        //         "INSERT INTO `{$tblBItems}`
        //             (booking_id, item_type_id, item_description, length, width, height, weight)
        //          VALUES (?, ?, ?, ?, ?, ?, ?)"
        //     );

        //     foreach ($item_details as $item) {
        //         if (!is_array($item)) {
        //             continue;
        //         }

        //         $itemTypeId = $item['item_type_id'] ?? null;
        //         $itemDescription = trim((string)($item['item_description'] ?? ''));
        //         $length = $item['length'] ?? null;
        //         $width = $item['width'] ?? null;
        //         $height = $item['height'] ?? null;
        //         $weight = $item['weight'] ?? null;

        //         // The form keeps one blank row ready for the next item.
        //         if (($itemTypeId === null || $itemTypeId === '')
        //             && $itemDescription === ''
        //             && ($length === null || $length === '')
        //             && ($width === null || $width === '')
        //             && ($height === null || $height === '')
        //             && ($weight === null || $weight === '')) {
        //             continue;
        //         }

        //         $stmtInsertItem->execute([
        //             $id,
        //             $itemTypeId !== null && $itemTypeId !== '' ? (int)$itemTypeId : null,
        //             $itemDescription !== '' ? $itemDescription : null,
        //             $length !== null && $length !== '' ? (float)$length : null,
        //             $width !== null && $width !== '' ? (float)$width : null,
        //             $height !== null && $height !== '' ? (float)$height : null,
        //             $weight !== null && $weight !== '' ? (float)$weight : null,
        //         ]);
        //     }



        //     // Replace vehicle photos
        //     $stmtPhotoDel = $db->prepare("
        //         DELETE FROM `{$tblBPhotos}`
        //         WHERE booking_id = ?
        //     ");
        //     $stmtPhotoDel->execute([$id]);

        //     if (is_array($bk_photos)) {

        //         $stmtPhoto = $db->prepare("
        //             INSERT INTO `{$tblBPhotos}`
        //             (booking_id, photo_name, photo_path)
        //             VALUES (?, ?, ?)
        //         ");

        //         foreach ($bk_photos as $row) {

        //             $photoName = trim($row['photo_name'] ?? '');
        //             $photoPath = trim($row['photo_path'] ?? '');

        //             // Ignore completely empty rows
        //             if ($photoName === '' && $photoPath === '') {
        //                 continue;
        //             }

        //             $stmtPhoto->execute([
        //                 $id,
        //                 $photoName !== '' ? $photoName : null,
        //                 $photoPath !== '' ? $photoPath : null
        //             ]);
        //         }
        //     }

        //     $db->commit();
        //     $stmtg = $db->prepare("SELECT * FROM `{$tblVehicles}` WHERE vehicle_id = ? LIMIT 1");
        //     $stmtg->execute([$id]);
        //     $saved = $stmtg->fetch();
        //     echoJson($saved, 200);
        //     } catch (Throwable $e) {
        //         if ($db->inTransaction()) $db->rollBack();
        //         error_log('Booking update failed: ' . $e->getMessage());
        //         echoJson(['error' => 'Booking update failed: ' . $e->getMessage()], 500);
        //     }
    }

