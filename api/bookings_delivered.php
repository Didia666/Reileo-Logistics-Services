<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$currentUser = requireAuth();
$db = getDB();

$tblModels = tableName('vh_models');
$tblManufacturers = tableName('vh_manufacturers');
$tblVehicleStatuses = tableName('vehicle_statuses');
$tblAcquisition = tableName('vh_acquisition');
$tblDocuments = tableName('vh_documents');
$tblInsurance = tableName('vh_insurance');
$tblLocation = tableName('vh_location');
$tblPhotos = tableName('vh_photos');
$tblRegistrationCompliance = tableName('vh_regist_compli');
$tblSpecifications = tableName('vh_specifications');


$tblBookings = tableName('bookings');
$tblBStatuses = tableName('booking_statuses');
$tblBPersonnel= tableName('booking_personnel');
$tblPersonnel = tableName('personnel');
$tblBFuel = tableName('bk_fuel_trip');
$tblBItems = tableName('bk_items');
$tblIType = tableName('item_types');
$tblBPhotos = tableName('bk_photos');
$tblBReferences = tableName('bk_references');
$tblBTypes = tableName('booking_types');
$tblVehicles = tableName('vehicles');
$tblTypes = tableName('vh_types');
$tblCommodityTypes = tableName('commodity_type');
$tblCategoryTypes = tableName('category_types');
$tblOrigins = tableName('origin');
$tblDepots = tableName('depots');
$tblVendors = tableName('vendor');
$tblCustomers = tableName('customers');
$tblDestination = tableName('destination');
$tblBVehicles = tableName('bk_vehicles');
$tblBCCost = tableName('bk_client_cost');
$tblBPFee = tableName('bk_personnel_fee');


$tblBExpenses = tableName('bk_expenses');
$tblBPersonnelFee = tableName('bk_personnel_fee');  
$tblBClientCost = tableName('bk_client_cost');


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
    $tblDestination,
    $tblBExpenses,
) {
    return "SELECT
                    b.booking_id,
                    b.booking_no,
                    b.delivery_date,
                    b.delivered_datetime,
                    b.trips_number,
                    b.destination_id,
                    dest.destination_name,
                    COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                    r.client_ref_no,
                    f.charges,                  
                    f.trip_allowance,
                    f.fuel,
                    f.fuel_po,
                    f.fuel_amount,
                    r.remarks,
                    e.b_toll_fees,
                    e.b_extra_drop,
                    e.b_extra_helper,
                    e.b_other_fees,
                    e.nb_parking_fees,
                    e.nb_toll_fees,
                    e.nb_demurrage_fees,
                    e.nb_backload_fees,
                    e.nb_other_deduction,	
                    b.status_id,
                    bs.status_name,
                    b.created_at
            FROM `{$tblBookings}` b     
            LEFT JOIN `{$tblBStatuses}` bs ON b.status_id = bs.status_id
            LEFT JOIN `{$tblBFuel}` f ON b.booking_id = f.booking_id
            LEFT JOIN `{$tblDestination}` dest ON b.destination_id = dest.destination_id
            LEFT JOIN `{$tblBVehicles}` bv ON b.booking_id = bv.booking_id
            LEFT JOIN `{$tblVehicles}` v ON bv.vehicle_id = v.vehicle_id
            LEFT JOIN `{$tblBExpenses}` e ON b.booking_id = e.booking_id
            LEFT JOIN `{$tblBReferences}` r ON b.booking_id = r.booking_id";
}



switch ($method) {

    case 'GET':
        try {
            if ($id > 0) {
                $detailSql = detailSql(
                    $tblBookings,
                    $tblBStatuses,
                    $tblBFuel,
                    $tblBReferences,
                    $tblVehicles,
                    $tblBVehicles,
                    $tblDestination,
                    $tblBExpenses
                );

                $detailSql .= " WHERE b.booking_id = ? LIMIT 1";

                $stmt = $db->prepare($detailSql);
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) echoJson(['error' => 'Booking not found'], 404);

                $stmtPhotos = $db->prepare("SELECT * FROM `{$tblBPhotos}` WHERE booking_id = ? ORDER BY bk_photos_id ASC");
                $stmtPhotos->execute([$id]);
                $row['bk_photos'] = $stmtPhotos->fetchAll() ?: [];

                $stmtItems = $db->prepare(
                    "SELECT item_type_id, item_description, length, width, height, weight
                     FROM `{$tblBItems}`
                     WHERE booking_id = ?
                     ORDER BY bk_items_id ASC"
                );
                $stmtItems->execute([$id]);
                $row['item_details'] = $stmtItems->fetchAll() ?: [];

                $stmtPersonnel = $db->prepare(
                    "SELECT personnel_id, assignment_role
                     FROM `{$tblBPersonnel}`
                     WHERE booking_id = ?
                     ORDER BY booking_personnel_id ASC"
                );
                $stmtPersonnel->execute([$id]);
                $row['personnel_assignments'] = $stmtPersonnel->fetchAll() ?: [];


                echoJson($row);
            }

            $statusFilter = $_GET['status'] ?? 'all';
            $search = trim($_GET['search'] ?? '');
            $params = [];
            $baseSql = $where = " WHERE 1=1";
            if ($statusFilter && $statusFilter !== 'all') {
                $where .= " AND b.status_id = ?";
                $params[] = $statusFilter;
            }
            if ($search !== '') {
                $where .= " AND (b.booking_no LIKE ? OR c.customer_name LIKE ? OR o.origin_name LIKE ? OR d.depot_name LIKE ? OR v.plate_no LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            $sql = listSql(
                $tblBookings,
                $tblBStatuses,
                $tblCustomers,
                $tblBFuel,
                $tblBTypes,
                $tblDepots,
                $tblOrigins,
                $tblVehicles,
                $tblBReferences
            ) . $where . " ORDER BY b.booking_id DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            echoJson($rows);

        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;
    
    // case 'POST':
        

    //     
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

            $booking_info = $input['booking_info'] ?? [];
            $fuel_trip = $input['fuel_trip'] ?? [];
            $references = $input['references'] ?? [];
            $expenses = $input['expenses'] ?? [];

            //booking_info

            $delivery_date = trim($booking_info['delivery_date'] ?? '');
            $plate_no = (int)($booking_info['plate_no'] ?? NULL);
            $delivered_datetime = trim($booking_info['delivered_datetime'] ?? NULL);
            $received_datetime = trim($booking_info['received_datetime'] ?? NULL);
            $odometer = ($booking_info['odometer'] ?? '') !== ''
                ? (int)$booking_info['odometer']
                : null;
            $destinationValue = $booking_info['destination_id'] ?? null;
            $destination_id = ($destinationValue === null || $destinationValue === '' || (int)$destinationValue === 0)
                ? null
                : (int)$destinationValue;
            $client_rate = (int)($booking_info['client_rate'] ?? NULL);
            $trips_number = (int)($booking_info['trips_number'] ?? NULL);
            $total_amount = (int)($booking_info['total_amount'] ?? NULL);
            $subcon_rate = (int)($booking_info['subcon_rate'] ?? NULL);


            //fueltrip_allowance
            $charges = trim($fuel_trip['charges'] ?? '');
            $fuel = trim($fuel_trip['fuel'] ?? '');
            $fuel_po = $fuel_trip['fuel_po'] ?? null;
            $fuel_amount = $fuel_trip['fuel_amount'] ?? null;

            //references
            $client_ref_no = trim($references['client_ref_no'] ?? '');
            $remarks = trim($references['remarks'] ?? '');

            //expenses
            $b_toll_fees = trim($expenses['b_toll_fees'] ?? '');
            $b_extra_drop = trim($expenses['b_extra_drop'] ?? '');
            $b_extra_helper = trim($expenses['b_extra_helper'] ?? '');
            $b_other_fees = trim($expenses['b_other_fees'] ?? '');
            $nb_parking_fees = trim($expenses['nb_parking_fees'] ?? '');
            $nb_toll_fees = trim($expenses['nb_toll_fees'] ?? '');
            $nb_demurrage_fees = trim($expenses['nb_demurrage_fees'] ?? '');
            $nb_backload_fees = trim($expenses['nb_backload_fees'] ?? '');
            $nb_other_deductions = trim($expenses['nb_other_deductions'] ?? '');

            if ($plate_no  === '') echoJson(['error' => 'Plate Number is required'], 400);
            if ($delivered_datetime === '') echoJson(['error' => 'Delivered Date is required'], 400);
            if ($received_datetime === '') echoJson(['error' => 'Received Date is required'], 400);
            if ($destination_id === null) echoJson(['error' => 'Destination is required'], 400);
            if ($client_rate === '') echoJson(['error' => 'Client Rate is required'], 400);
            if ($trips_number === '') echoJson(['error' => 'Trips Number is required'], 400);
    


            try {
                $db->beginTransaction();

                $stmtStatus = $db->prepare(
                    "SELECT status_id, status_name FROM `{$tblBStatuses}` WHERE status_name = ? LIMIT 1"
                );
                $stmtStatus->execute(['Delivered']);
                $deliveredStatus = $stmtStatus->fetch();
                if (!$deliveredStatus) {
                    throw new RuntimeException('Delivered status is not configured.');
                }
                $deliveredStatusId = (int)$deliveredStatus['status_id'];


            $stmtB = $db->prepare(
                "UPDATE `{$tblBookings}` SET
                    delivered_datetime = ?,
                    received_datetime = ?,
                    destination_id = ?,
                    trips_number = ?,
                    status_id = ?
                 WHERE booking_id = ?"
            );
            $stmtB->execute([
                $delivered_datetime, $received_datetime, $destination_id, $trips_number, $deliveredStatusId, $id
            ]);

            $stmtBP = $db->prepare(
                "INSERT INTO `{$tblBClientCost}` SET
                    client_rate = ?,
                    total_amount = ?,
                    subcon_rate = ?
                 WHERE booking_id = ?"
            );

            $stmtBP->execute([
                $client_rate, $total_amount, $subcon_rate, $id
            ]);

            $stmtOdo = $db->prepare("UPDATE `{$tblBVehicles}` SET odometer = ? WHERE booking_id = ?");
            $stmtOdo->execute([$odometer, $id]);
            

            if (array_key_exists('fuel_trip', $input)) {
                $stmtChkBf = $db->prepare("SELECT booking_id FROM `{$tblBFuel}` WHERE booking_id = ? LIMIT 1");
                $stmtChkBf->execute([$id]);
                $exBf = $stmtChkBf->fetch();
                $BfData = [
                    'booking_id'=>$id,
                    'charges'=>$charges,
                    'fuel'=>$fuel,
                    'fuel_po'=>$fuel_po,
                    'fuel_amount'=>$fuel_amount,
                ];
                if ($exBf) {
                    $stmtBU = $db->prepare(
                        "UPDATE `{$tblBFuel}`
                         SET charges = ?, fuel = ?, fuel_po = ?, fuel_amount = ?
                         WHERE booking_id = ?"
                    );
                    $stmtBU->execute([$charges, $fuel, $fuel_po, $fuel_amount, $id]);
                } else {
                    $stmtBI = $db->prepare("INSERT INTO `{$tblBFuel}` (booking_id, charges, fuel, fuel_po, fuel_amount) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmtBI->execute(array_values($BfData));
                }
            }

            
            $stmtChkR = $db->prepare("SELECT booking_id FROM `{$tblBReferences}` WHERE booking_id = ? LIMIT 1");
            $stmtChkR->execute([$id]);
            $exR = $stmtChkR->fetch();
            $RData = [
                'client_ref_no'=>$client_ref_no,
                'remarks'=>$remarks
            ];
            if ($exR) {
                $stmtEMU = $db->prepare(
                    "UPDATE `{$tblBReferences}`
                     SET client_ref_no = ?, remarks = ?
                     WHERE booking_id = ?"
                );
                $stmtEMU->execute([$client_ref_no, $remarks, $id]);
            } else {
                $stmtEMI = $db->prepare("INSERT INTO `{$tblBReferences}` (booking_id, client_ref_no, remarks) VALUES (?, ?, ?)");
                $stmtEMI->execute([$id, $RData['client_ref_no'], $RData['remarks']]);
            }

            $stmtBP = $db->prepare(
                "INSERT INTO `{$tblBExpenses}` SET
                    b_toll_fees = ?,
                    b_extra_drop = ?,
                    b_extra_helper = ?,
                    b_other_fees = ?,
                    nb_parking_fees = ?,
                    nb_toll_fees = ?,
                    nb_demurrage_fees = ?,
                    nb_backload_fees = ?,
                    nb_other_deductions = ?
                 WHERE booking_id = ?"
            );

            $stmtBP->execute([
                $b_toll_fees,
                $b_extra_drop,
                $b_extra_helper,
                $b_other_fees,
                $nb_parking_fees,
                $nb_toll_fees,
                $nb_demurrage_fees,
                $nb_backload_fees,
                $nb_other_deductions,
                $id
            ]);


            $db->commit();
            $stmtg = $db->prepare("SELECT * FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
            $stmtg->execute([$id]);
            $saved = $stmtg->fetch();
            echoJson($saved, 200);
            } catch (Throwable $e) {
                if ($db->inTransaction()) $db->rollBack();
                error_log('Booking update failed: ' . $e->getMessage());
                echoJson(['error' => 'Booking update failed: ' . $e->getMessage()], 500);
            }
    }

