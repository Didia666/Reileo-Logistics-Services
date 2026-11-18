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


$tblBExpenses = tableName('bk_b_expenses');
$tblNBExpenses = tableName('bk_nb_expenses');
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
    $tblNBExpenses
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
                    bv.odometer,           
                    f.trip_allowance,
                    f.fuel,
                    f.fuel_po,
                    f.fuel_amount,
                    r.remarks,
                    be.gas,
                    be.parking_fee,
                    be.toll_fee,
                    be.entrance_fee,
                    be.mano,
                    be.sop,
                    be.demurrage_fee,
                    be.extra_drop_fee,
                    be.backload_fee,
                    nbe.gas,
                    nbe.parking_fee,
                    nbe.toll_fee,
                    nbe.entrance_fee,
                    nbe.mano,
                    nbe.sop,
                    nbe.demurrage_fee,
                    nbe.extra_drop_fee,
                    nbe.backload_fee,
                    b.status_id,
                    bs.status_name,
                    b.created_at
            FROM `{$tblBookings}` b     
            LEFT JOIN `{$tblBStatuses}` bs ON b.status_id = bs.status_id
            LEFT JOIN `{$tblBFuel}` f ON b.booking_id = f.booking_id
            LEFT JOIN `{$tblDestination}` dest ON b.destination_id = dest.destination_id
            LEFT JOIN `{$tblBVehicles}` bv ON b.booking_id = bv.booking_id
            LEFT JOIN `{$tblVehicles}` v ON bv.vehicle_id = v.vehicle_id
            LEFT JOIN `{$tblBExpenses}` be ON b.booking_id = be.booking_id
            LEFT JOIN `{$tblNBExpenses}` nbe ON b.booking_id = nbe.booking_id
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
                    $tblBExpenses,
                    $tblNBExpenses
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
    


        case 'POST':
            if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
            $stmtChk = $db->prepare("SELECT booking_id FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
            $stmtChk->execute([$id]);
            if (!$stmtChk->fetch()) echoJson(['error' => 'Booking not found'], 404);

            $booking_info = $input['booking_info'] ?? [];
            $fuel_trip = $input['fuel_trip'] ?? [];
            $references = $input['references'] ?? [];
            $b_expenses = $input['b_expenses'] ?? [];
            $nb_expenses = $input['nb_expenses'] ?? [];

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
            $client_rate = (float)($booking_info['client_rate'] ?? NULL);
            $trips_number = (float)($booking_info['trips_number'] ?? NULL);
            $total_amount = (float)($booking_info['total_amount'] ?? NULL);
            $subcon_rate = (float)($booking_info['subcon_rate'] ?? NULL);


            //fueltrip_allowance
            $charges = trim($fuel_trip['charges'] ?? '');
            $fuel = ($fuel_trip['fuel'] ?? '') !== '' ? (float)$fuel_trip['fuel'] : null;
            $fuel_po = $fuel_trip['fuel_po'] ?? null;
            $fuel_amount = ($fuel_trip['fuel_amount'] ?? '') !== '' ? (float)$fuel_trip['fuel_amount'] : null;

            //references
            $client_ref_no = trim($references['client_ref_no'] ?? '');
            $remarks = trim($references['remarks'] ?? '');

            //b_expenses
            $b_gas = ($b_expenses['b_gas'] ?? '') !== '' ? (float)$b_expenses['b_gas'] : null;
            $b_parking_fee = ($b_expenses['b_parking_fee'] ?? '') !== '' ? (float)$b_expenses['b_parking_fee'] : null;
            $b_toll_fee = ($b_expenses['b_toll_fee'] ?? '') !== '' ? (float)$b_expenses['b_toll_fee'] : null;
            $b_entrance_fee = ($b_expenses['b_entrance_fee'] ?? '') !== '' ? (float)$b_expenses['b_entrance_fee'] : null;
            $b_mano = ($b_expenses['b_mano'] ?? '') !== '' ? (float)$b_expenses['b_mano'] : null;
            $b_SOP = ($b_expenses['b_SOP'] ?? '') !== '' ? (float)$b_expenses['b_SOP'] : null;
            $b_demurrage_fee = ($b_expenses['b_demurrage_fee'] ?? '') !== '' ? (float)$b_expenses['b_demurrage_fee'] : null;
            $b_extra_drop_fee = ($b_expenses['b_extra_drop_fee'] ?? '') !== '' ? (float)$b_expenses['b_extra_drop_fee'] : null;
            $b_backload_fee = ($b_expenses['b_backload_fee'] ?? '') !== '' ? (float)$b_expenses['b_backload_fee'] : null;

            //nb expenses
            $nb_gas = ($nb_expenses['nb_gas'] ?? '') !== '' ? (float)$nb_expenses['nb_gas'] : null;
            $nb_parking_fee = ($nb_expenses['nb_parking_fee'] ?? '') !== '' ? (float)$nb_expenses['nb_parking_fee'] : null;
            $nb_toll_fee = ($nb_expenses['nb_toll_fee'] ?? '') !== '' ? (float)$nb_expenses['nb_toll_fee'] : null;
            $nb_entrance_fee = ($nb_expenses['nb_entrance_fee'] ?? '') !== '' ? (float)$nb_expenses['nb_entrance_fee'] : null;
            $nb_mano = ($nb_expenses['nb_mano'] ?? '') !== '' ? (float)$nb_expenses['nb_mano'] : null;
            $nb_SOP = ($nb_expenses['nb_SOP'] ?? '') !== '' ? (float)$nb_expenses['nb_SOP'] : null;
            $nb_demurrage_fee = ($nb_expenses['nb_demurrage_fee'] ?? '') !== '' ? (float)$nb_expenses['nb_demurrage_fee'] : null;
            $nb_extra_drop_fee = ($nb_expenses['nb_extra_drop_fee'] ?? '') !== '' ? (float)$nb_expenses['nb_extra_drop_fee'] : null;
            $nb_backload_fee = ($nb_expenses['nb_backload_fee'] ?? '') !== '' ? (float)$nb_expenses['nb_backload_fee'] : null;

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

            $stmtChkCost = $db->prepare("SELECT booking_id FROM `{$tblBClientCost}` WHERE booking_id = ? LIMIT 1");
            $stmtChkCost->execute([$id]);
            if ($stmtChkCost->fetch()) {
                $stmtCost = $db->prepare(
                    "UPDATE `{$tblBClientCost}`
                     SET client_rate = ?, total_amount = ?, subcon_rate = ?
                     WHERE booking_id = ?"
                );
                $stmtCost->execute([$client_rate, $total_amount, $subcon_rate, $id]);
            } else {
                $stmtCost = $db->prepare(
                    "INSERT INTO `{$tblBClientCost}` (booking_id, client_rate, total_amount, subcon_rate)
                     VALUES (?, ?, ?, ?)"
                );
                $stmtCost->execute([$id, $client_rate, $total_amount, $subcon_rate]);
            }

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
                    $stmtBI = $db->prepare("INSERT INTO `{$tblBFuel}` (booking_id, charges, fuel, fuel_po, fuel_amount) VALUES (?, ?, ?, ?, ?)");
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

            $stmtChkBExpenses = $db->prepare("SELECT booking_id FROM `{$tblBExpenses}` WHERE booking_id = ? LIMIT 1");
            $stmtChkBExpenses->execute([$id]);
            if ($stmtChkBExpenses->fetch()) {
                $stmtBExpenses = $db->prepare(
                    "UPDATE `{$tblBExpenses}` SET
                        gas = ?,
                        parking_fee = ?,
                        toll_fee = ?,
                        entrance_fee = ?,
                        mano = ?,
                        sop = ?,
                        demurrage_fee = ?,
                        extra_drop_fee = ?,
                        backload_fee = ?
                     WHERE booking_id = ?"
                );
                $stmtBExpenses->execute([
                    $b_gas,
                    $b_parking_fee,
                    $b_toll_fee,
                    $b_entrance_fee,
                    $b_mano,
                    $b_SOP,
                    $b_demurrage_fee,
                    $b_extra_drop_fee,
                    $b_backload_fee,
                    $id
                ]);
            } else {
                $stmtBExpenses = $db->prepare(
                    "INSERT INTO `{$tblBExpenses}`
                        (booking_id, gas, parking_fee, toll_fee, entrance_fee, mano, sop, demurrage_fee, extra_drop_fee, backload_fee)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                );
                $stmtBExpenses->execute([
                    $id,
                    $b_gas,
                    $b_parking_fee,
                    $b_toll_fee,
                    $b_entrance_fee,
                    $b_mano,
                    $b_SOP,
                    $b_demurrage_fee,
                    $b_extra_drop_fee,
                    $b_backload_fee,
                ]);
            }

            $stmtChkNBExpenses = $db->prepare("SELECT booking_id FROM `{$tblNBExpenses}` WHERE booking_id = ? LIMIT 1");
            $stmtChkNBExpenses->execute([$id]);
            if ($stmtChkNBExpenses->fetch()) {
                $stmtNBExpenses = $db->prepare(
                    "UPDATE `{$tblNBExpenses}` SET
                        gas = ?,
                        parking_fee = ?,
                        toll_fee = ?,
                        entrance_fee = ?,
                        mano = ?,
                        sop = ?,
                        demurrage_fee = ?,
                        extra_drop_fee = ?,
                        backload_fee = ?
                     WHERE booking_id = ?"
                );
                $stmtNBExpenses->execute([
                    $nb_gas,
                    $nb_parking_fee,
                    $nb_toll_fee,
                    $nb_entrance_fee,
                    $nb_mano,
                    $nb_SOP,
                    $nb_demurrage_fee,
                    $nb_extra_drop_fee,
                    $nb_backload_fee,
                    $id
                ]);
            } else {
                $stmtNBExpenses = $db->prepare(
                    "INSERT INTO `{$tblNBExpenses}`
                        (booking_id, gas, parking_fee, toll_fee, entrance_fee, mano, sop, demurrage_fee, extra_drop_fee, backload_fee)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                );
                $stmtNBExpenses->execute([
                    $id,
                    $nb_gas,
                    $nb_parking_fee,
                    $nb_toll_fee,
                    $nb_entrance_fee,
                    $nb_mano,
                    $nb_SOP,
                    $nb_demurrage_fee,
                    $nb_extra_drop_fee,
                    $nb_backload_fee,
                ]);
            }


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

