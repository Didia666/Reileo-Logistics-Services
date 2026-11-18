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
    $tblBDestination = tableName('bk_destination');
    $tblBVehicles = tableName('bk_vehicles');
    $tblBCCost = tableName('bk_client_cost');
    $tblBExpenses = tableName('bk_b_expenses');
    $tblNBExpenses = tableName('bk_nb_expenses');
    $tblTravelFunds = tableName('bk_expenses');
    $tblBPFee = tableName('bk_personnel_fee');



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

    function isSupportedPhotoBinary($data) {
        return substr($data, 0, 3) === "\xFF\xD8\xFF"
            || substr($data, 0, 8) === "\x89PNG\r\n\x1A\n"
            || (substr($data, 0, 4) === 'RIFF' && substr($data, 8, 4) === 'WEBP');
    }

    function normalizeDestinationIds($bookingInfo) {
        $value = $bookingInfo['destination_ids'] ?? ($bookingInfo['destination_id'] ?? []);
        $values = is_array($value) ? $value : (($value === null || $value === '') ? [] : [$value]);
        $destinationIds = [];

        foreach ($values as $destinationId) {
            if ($destinationId === null || $destinationId === '') {
                continue;
            }

            $destinationId = filter_var($destinationId, FILTER_VALIDATE_INT);
            if ($destinationId === false || $destinationId <= 0) {
                echoJson(['error' => 'Destination IDs must be positive integers'], 400);
            }
            if (in_array($destinationId, $destinationIds, true)) {
                echoJson(['error' => 'A destination cannot be selected more than once'], 400);
            }

            $destinationIds[] = $destinationId;
        }

        return $destinationIds;
    }



    function listSql($tblBookings, $tblBStatuses, $tblCustomers, $tblBFuel, $tblBTypes, $tblDepots, $tblOrigins, $tblVehicles, $tblReferences, $tblBVehicles) {
        return "SELECT 
                        b.booking_id,
                        b.booking_no,
                        b.customer_id,
                        c.customer_name,
                        b.booking_type_id,
                        bt.book_type,
                        b.delivery_date,
                        f.fuel,
                        b.origin_id,
                        o.origin_name,
                        b.depot_id,
                        d.depot_name,
                        bv.vehicle_id AS vehicle_id,
                        COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                        r.client_ref_no,
                        b.status_id,
                        bs.status_name,
                        b.created_at
                FROM `{$tblBookings}` b     
                LEFT JOIN `{$tblBStatuses}` bs ON b.status_id = bs.status_id
                LEFT JOIN `{$tblCustomers}` c ON b.customer_id = c.customer_id
                LEFT JOIN `{$tblBFuel}` f ON b.booking_id = f.booking_id
                LEFT JOIN `{$tblBTypes}` bt ON b.booking_type_id = bt.booking_type_id
                LEFT JOIN `{$tblOrigins}` o ON b.origin_id = o.origin_id
                LEFT JOIN `{$tblDepots}` d ON b.depot_id = d.depot_id
                LEFT JOIN `{$tblBVehicles}` bv ON b.booking_id = bv.booking_id
                LEFT JOIN `{$tblVehicles}` v ON bv.vehicle_id = v.vehicle_id
                LEFT JOIN `{$tblReferences}` r ON b.booking_id = r.booking_id";
    }


    function detailSql(
        $tblBookings,
        $tblBTypes,
        $tblBStatuses,
        $tblBPersonnel,
        $tblPersonnel,
        $tblBFuel,
        $tblBItems,
        $tblIType,
        $tblBReferences,
        $tblVehicles,
        $tblTypes,
        $tblCommodityTypes,
        $tblOrigins,
        $tblDepots,
        $tblVendors, 
        $tblCustomers, 
        $tblDestination,
        $tblBVehicles,
        $tblBExpenses,
        $tblNBExpenses
    ) {
        return "SELECT
                        b.booking_id,
                        b.booking_no,
                        b.customer_id,
                        CONCAT_WS(' ', p.first_name, p.last_name) AS personnel_name,
                        b.booking_type_id,
                        bt.book_type,
                        b.delivery_date,
                        b.depot_id,
                        d.depot_name,
                        b.commodity_type_id,
                        ct.commodity_type,
                        b.route_code,
                        b.trips_number,
                        b.drops_number,                    
                        b.origin_id,
                        o.origin_name,
                        b.destination_id,
                        dest.destination_name,
                        bv.vehicle_id AS vehicle_id,
                        COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                        v.vehicle_type_id,
                        vt.vehicle_type,
                        v.commodity_type_id AS vehicle_commodity_type_id,
                        COALESCE(bv.vendor_id, v.vendor_id) AS vendor_id,
                        vd.vendor_name,
                        f.charges,                  
                        f.trip_allowance,
                        f.fuel,
                        f.fuel_po,
                        f.fuel_amount,
                        bp.personnel_id,
                        r.client_ref_no,
                        r.other_ref_no,
                        bi.item_type_id,
                        it.item_type,
                        bi.item_description,
                        bi.length,
                        bi.width,
                        bi.height,
                        bi.weight,
                        r.remarks,
                        be.gas as b_gas,
                        be.parking_fee as b_parking_fee,
                        be.toll_fee as b_toll_fee,
                        be.entrance_fee as b_entrance_fee,
                        be.mano as b_mano,
                        be.SOP as b_SOP,
                        be.demurrage_fee as b_demurrage_fee,
                        be.extra_drop_fee as b_extra_drop_fee,
                        be.backload_fee as b_backload_fee,
                        nbe.gas as nb_gas,
                        nbe.parking_fee as nb_parking_fee,
                        nbe.toll_fee as nb_toll_fee,
                        nbe.entrance_fee as nb_entrance_fee,
                        nbe.mano as nb_mano,
                        nbe.SOP as nb_SOP,
                        nbe.demurrage_fee as nb_demurrage_fee,
                        nbe.extra_drop_fee as nb_extra_drop_fee,
                        nbe.backload_fee as nb_backload_fee,
                        b.status_id,
                        bs.status_name,
                        b.created_at
                FROM `{$tblBookings}` b     
                LEFT JOIN `{$tblBStatuses}` bs ON b.status_id = bs.status_id
                LEFT JOIN `{$tblCustomers}` c ON b.customer_id = c.customer_id
                LEFT JOIN `{$tblBFuel}` f ON b.booking_id = f.booking_id
                LEFT JOIN `{$tblBTypes}` bt ON b.booking_type_id = bt.booking_type_id
                LEFT JOIN `{$tblOrigins}` o ON b.origin_id = o.origin_id
                LEFT JOIN `{$tblDepots}` d ON b.depot_id = d.depot_id
                LEFT JOIN `{$tblCommodityTypes}` ct ON b.commodity_type_id = ct.commodity_type_id
                LEFT JOIN `{$tblDestination}` dest ON b.destination_id = dest.destination_id
                LEFT JOIN `{$tblBVehicles}` bv ON b.booking_id = bv.booking_id
                LEFT JOIN `{$tblVehicles}` v ON bv.vehicle_id = v.vehicle_id
                LEFT JOIN `{$tblTypes}` vt ON v.vehicle_type_id = vt.vehicle_type_id
                LEFT JOIN `{$tblVendors}` vd ON COALESCE(bv.vendor_id, v.vendor_id) = vd.vendor_id
                LEFT JOIN `{$tblBReferences}` r ON b.booking_id = r.booking_id
                LEFT JOIN `{$tblBPersonnel}` bp ON b.booking_id = bp.booking_id
                LEFT JOIN `{$tblPersonnel}` p ON bp.personnel_id = p.personnel_id
                LEFT JOIN `{$tblBItems}` bi ON b.booking_id = bi.booking_id
                LEFT JOIN `{$tblIType}` it ON bi.item_type_id = it.item_type_id
                LEFT JOIN `{$tblBExpenses}` be ON b.booking_id = be.booking_id
                LEFT JOIN `{$tblNBExpenses}` nbe ON b.booking_id = nbe.booking_id";
    }



    switch ($method) {

        case 'GET':
            try {
                if ($id > 0) {
                    $detailSql = detailSql(
                        $tblBookings,
                        $tblBTypes,
                        $tblBStatuses,
                        $tblBPersonnel,
                        $tblPersonnel,
                        $tblBFuel,
                        $tblBItems,
                        $tblIType,
                        $tblBReferences,
                        $tblVehicles,
                        $tblTypes,
                        $tblCommodityTypes,
                        $tblOrigins,
                        $tblDepots,
                        $tblVendors,
                        $tblCustomers,
                        $tblDestination,
                        $tblBVehicles,
                        $tblBExpenses,
                        $tblNBExpenses
                    );

                    $detailSql .= " WHERE b.booking_id = ? LIMIT 1";

                    $stmt = $db->prepare($detailSql);
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    if (!$row) echoJson(['error' => 'Booking not found'], 404);

                    $stmtTravelFunds = $db->prepare(
                        "SELECT travel_fund, cash_back
                         FROM `{$tblTravelFunds}`
                         WHERE booking_id = ?
                         LIMIT 1"
                    );
                    $stmtTravelFunds->execute([$id]);
                    $travelFunds = $stmtTravelFunds->fetch() ?: [];
                    $row['travel_fund'] = $travelFunds['travel_fund'] ?? null;
                    $row['cash_back'] = $travelFunds['cash_back'] ?? null;

                    $stmtDestinations = $db->prepare("
                        SELECT bd.destination_id, bd.stop_order, dest.destination_name
                        FROM `{$tblBDestination}` bd
                        LEFT JOIN `{$tblDestination}` dest ON bd.destination_id = dest.destination_id
                        WHERE bd.booking_id = ?
                        ORDER BY bd.stop_order ASC
                    ");
                    $stmtDestinations->execute([$id]);
                    $destinations = $stmtDestinations->fetchAll() ?: [];
                    if (!$destinations && !empty($row['destination_id'])) {
                        $destinations[] = [
                            'destination_id' => $row['destination_id'],
                            'stop_order' => 1,
                            'destination_name' => $row['destination_name'] ?? null,
                        ];
                    }
                    $row['destinations'] = $destinations;
                    $row['destination_ids'] = array_column($destinations, 'destination_id');
                    if ($destinations) {
                        $row['destination_id'] = $destinations[0]['destination_id'];
                        $row['destination_name'] = $destinations[0]['destination_name'];
                    }

                    $stmtPhotos = $db->prepare("
                        SELECT
                            bk_photos_id,
                            booking_id,
                            photo_name,
                            photo_data
                        FROM `{$tblBPhotos}`
                        WHERE booking_id = ?
                        ORDER BY bk_photos_id ASC
                    ");

                    $stmtPhotos->execute([$id]);

                    $photos = $stmtPhotos->fetchAll() ?: [];

                    foreach ($photos as &$photo) {
                        if (
                            isset($photo['photo_data']) &&
                            $photo['photo_data'] !== null
                        ) {
                            $photoData = (string)$photo['photo_data'];
                            $decodedPhoto = base64_decode($photoData, true);

                            if (
                                $decodedPhoto !== false
                                && isSupportedPhotoBinary($decodedPhoto)
                                && !isSupportedPhotoBinary($photoData)
                            ) {
                                $photoData = $decodedPhoto;
                            }

                            $photo['photo_data'] =
                                base64_encode($photoData);
                        }
                    }

                    unset($photo);

                    $row['bk_photos'] = $photos;
                    $stmtItems = $db->prepare(
                        "SELECT item_type_id, item_description, length, width, height, weight
                        FROM `{$tblBItems}`
                        WHERE booking_id = ?
                        ORDER BY bk_items_id ASC"
                    );
                    $stmtItems->execute([$id]);
                    $row['item_details'] = $stmtItems->fetchAll() ?: [];

                    $stmtPersonnel = $db->prepare(
                        "SELECT personnel_id, assignment_role, rate, allowance
                        FROM `{$tblBPersonnel}`
                        WHERE booking_id = ?
                        ORDER BY booking_personnel_id ASC"
                    );
                    $stmtPersonnel->execute([$id]);
                    $row['personnel_assignments'] = $stmtPersonnel->fetchAll() ?: [];
                    $personnelByRole = [];
                    foreach ($row['personnel_assignments'] as $assignment) {
                        $personnelByRole[$assignment['assignment_role']] = $assignment;
                    }
                    $row['driver_rate'] = $personnelByRole['driver']['rate'] ?? null;
                    $row['driver_allowance'] = $personnelByRole['driver']['allowance'] ?? null;
                    $row['helper1_rate'] = $personnelByRole['helper1']['rate'] ?? null;
                    $row['helper1_allowance'] = $personnelByRole['helper1']['allowance'] ?? null;
                    $row['helper2_rate'] = $personnelByRole['helper2']['rate'] ?? null;
                    $row['helper2_allowance'] = $personnelByRole['helper2']['allowance'] ?? null;

                    $stmtClientCost = $db->prepare(
                        "SELECT client_rate, total_amount, subcon_rate
                        FROM `{$tblBCCost}`
                        WHERE booking_id = ?
                        LIMIT 1"
                    );
                    $stmtClientCost->execute([$id]);
                    $clientCost = $stmtClientCost->fetch() ?: [];
                    $row['client_rate'] = $clientCost['client_rate'] ?? null;
                    $row['total_amount'] = $clientCost['total_amount'] ?? null;
                    $row['subcon_rate'] = $clientCost['subcon_rate'] ?? null;

                    $stmtBExpenses = $db->prepare(
                        "SELECT gas, 
                                parking_fee, 
                                toll_fee, 
                                entrance_fee, 
                                mano, 
                                sop, 
                                demurrage_fee, 
                                extra_drop_fee, 
                                backload_fee
                        FROM `{$tblBExpenses}`
                        WHERE booking_id = ?
                        LIMIT 1"
                    );
                    $stmtBExpenses->execute([$id]);
                    $bookingBExpenses = $stmtBExpenses->fetch() ?: [];
                    foreach ([
                        'gas', 
                        'parking_fee', 
                        'toll_fee', 
                        'entrance_fee', 
                        'mano', 'sop', 
                        'demurrage_fee', 
                        'extra_drop_fee', 
                        'backload_fee'
                    ] as $BexpenseField) {
                        $row[$BexpenseField] = $bookingBExpenses[$BexpenseField] ?? null;
                    }

                    $stmtNBExpenses = $db->prepare(
                        "SELECT gas, 
                                parking_fee, 
                                toll_fee, 
                                entrance_fee, 
                                mano, sop, 
                                demurrage_fee, 
                                extra_drop_fee, 
                                backload_fee
                        FROM `{$tblNBExpenses}`
                        WHERE booking_id = ?
                        LIMIT 1"
                    );
                    $stmtNBExpenses->execute([$id]);
                    $bookingNBExpenses = $stmtNBExpenses->fetch() ?: [];
                    foreach ([
                        'gas', 
                        'parking_fee', 
                        'toll_fee', 
                        'entrance_fee', 
                        'mano', 'sop', 
                        'demurrage_fee', 
                        'extra_drop_fee', 
                        'backload_fee'
                    ] as $NBexpenseField) {
                        $row[$NBexpenseField] = $bookingNBExpenses[$NBexpenseField] ?? null;
                    }

                    

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
                    $where .= " AND (b.booking_no LIKE ? OR c.customer_name LIKE ? OR o.origin_name LIKE ? OR d.depot_name LIKE ? OR COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) LIKE ?)";
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
                    $tblBReferences,
                    $tblBVehicles
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
            

            $booking_info = $input['booking_info'] ?? [];
            $vehicle_assignment = $input['vehicle_assignment'] ?? [];
            $fueltrip_allowance = $input['fueltrip_allowance'] ?? [];
            $personnel_assignment = $input['personnel_assignment'] ?? [];
            $references = $input['references'] ?? [];
            $item_details = $input['item_details'] ?? [];
            $b_expenses = $input['b_expenses'] ?? [];
            if (!is_array($b_expenses)) {
                $b_expenses = [];
            }
            $hasTravelFund = array_key_exists('travel_fund', $input);
            $travelFundValue = $input['travel_fund'] ?? null;
            if ($hasTravelFund && $travelFundValue !== '' && $travelFundValue !== null && !is_numeric($travelFundValue)) {
                echoJson(['error' => 'Travel fund must be numeric.'], 400);
            }
            $travel_fund = $travelFundValue === '' || $travelFundValue === null
                ? null
                : (float)$travelFundValue;

            //booking_info

            $customer_id = (int)($booking_info['customer_id'] ?? NULL);
            $booking_type_id = (int)($booking_info['booking_type_id'] ?? NULL);
            $delivery_date = trim($booking_info['delivery_date'] ?? '');
            $depot_id = (int)($booking_info['depot_id'] ?? NULL);
            $commodity_type_id = (int)($booking_info['commodity_type_id'] ?? NULL);
            $route_code = trim($booking_info['route_code'] ?? '');
            $trips_number = (int)($booking_info['trips_number'] ?? NULL);
            $drops_number = (int)($booking_info['drops_number'] ?? NULL);
            $origin_id = (int)($booking_info['origin_id'] ?? NULL);
            $destinationIds = normalizeDestinationIds($booking_info);
            $destination_id = $destinationIds[0] ?? null;
            
            //vehicle_assignment
            $vehicle_id = (int)($vehicle_assignment['vehicle_id'] ?? NULL);
            $plate_no = trim($vehicle_assignment['plate_no'] ?? '');
            $vehicle_type_id = (int)($vehicle_assignment['vehicle_type_id'] ?? NULL);
            $commodity_type_id = (int)($vehicle_assignment['commodity_type_id'] ?? NULL);
            $vendorValue = $vehicle_assignment['vendor_id'] ?? null;
            $vendor_id = ($vendorValue === null || $vendorValue === '' || (int)$vendorValue === 0)
                ? null
                : (int)$vendorValue;

            //personnel_assignment
            $driver_id = (int)($personnel_assignment['driver_id'] ?? NULL);
            $helper1_id = (int)($personnel_assignment['helper1_id'] ?? NULL);
            $helper2_id = (int)($personnel_assignment['helper2_id'] ?? NULL);

            $driver_source = trim($personnel_assignment['driver_source'] ?? 'direct');
            $helper1_source = trim($personnel_assignment['helper1_source'] ?? 'direct');
            $helper2_source = trim($personnel_assignment['helper2_source'] ?? 'direct');

            $driver_vendor_id = (int)($personnel_assignment['driver_vendor_id'] ?? NULL);
            $helper1_vendor_id = (int)($personnel_assignment['helper1_vendor_id'] ?? NULL);
            $helper2_vendor_id = (int)($personnel_assignment['helper2_vendor_id'] ?? NULL);

            //fueltrip_allowance
            $trip_allowance = trim($fueltrip_allowance['trip_allowance'] ?? '');
            $fuel = trim($fueltrip_allowance['fuel'] ?? '');
            $fuel_po = $fueltrip_allowance['fuel_po'] ?? null;
            $fuel_amount = $fueltrip_allowance['fuel_amount'] ?? null;

            //references
            $client_ref_no = trim($references['client_ref_no'] ?? '');
            $other_ref_no = trim($references['other_ref_no'] ?? '');
            $remarks = trim($references['remarks'] ?? '');

            //item_details
            $item_details = is_array($item_details) ? $item_details : [];

            // booking photos
            $bk_photos = $input['bk_photos'] ?? [];

            if ($customer_id <= 0) echoJson(['error' => 'Customer is required'], 400);
            if ($booking_type_id <= 0) echoJson(['error' => 'Booking Type is required'], 400);
            if ($delivery_date === '') echoJson(['error' => 'Delivery Date is required'], 400);
            if ($depot_id <= 0) echoJson(['error' => 'Depot is required'], 400);
            if ($commodity_type_id <= 0) echoJson(['error' => 'Commodity Type is required'], 400);
            if ($origin_id <= 0) echoJson(['error' => 'Origin is required'], 400);
            if ($plate_no  === '') echoJson(['error' => 'Plate Number is required'], 400);
            if ($vehicle_type_id <= 0) echoJson(['error' => 'Vehicle Type is required'], 400);
            if ($driver_id <= 0) echoJson(['error' => 'Driver is required'], 400);
        


            try {
                $db->beginTransaction();

                $bCols = []; $bPh = []; $bParams = [];
                foreach ([
                    'booking_no'=>generateBookingNo($db, $tblBookings),
                    'customer_id'=>$customer_id,
                    'booking_type_id'=>$booking_type_id,
                    'status_id'=>1,
                    'created_by'=>(int)$currentUser['user_id'],
                    'delivery_date'=>$delivery_date,
                    'depot_id'=>$depot_id,
                    'commodity_type_id'=>$commodity_type_id,
                    'route_code'=>$route_code,
                    'trips_number'=>$trips_number,
                    'drops_number'=>$drops_number,
                    'origin_id'=>$origin_id,
                    'destination_id'=>$destination_id,
                ] as $k=>$v) {
                    $bCols[] = "`{$k}`";
                    $bPh[]   = '?';
                    $bParams[] = $v;
                }
                $sql = "INSERT INTO `{$tblBookings}` (" . implode(', ', $bCols) . ") VALUES (" . implode(', ', $bPh) . ")";
                $stmtV = $db->prepare($sql);
                $stmtV->execute($bParams);
                if ($stmtV->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Insert failed'], 500); }
                $booking_id = (int)$db->lastInsertId();
                if ($booking_id <= 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no ID'], 500); }

                if ($hasTravelFund) {
                    $stmtTravelFund = $db->prepare(
                        "INSERT INTO `{$tblTravelFunds}` (booking_id, travel_fund)
                         VALUES (?, ?)"
                    );
                    $stmtTravelFund->execute([$booking_id, $travel_fund]);
                }

                $stmtDestination = $db->prepare(
                    "INSERT INTO `{$tblBDestination}` (booking_id, destination_id, stop_order) VALUES (?, ?, ?)"
                );
                foreach ($destinationIds as $index => $destinationId) {
                    $stmtDestination->execute([$booking_id, $destinationId, $index + 1]);
                }

                $blCols = []; $blPh = []; $blParams = [];
                foreach ([
                    'booking_id'=>$booking_id,
                    'vehicle_id'=>$vehicle_id,
                    'vendor_id'=>$vendor_id,
                    'plate_no'=>$plate_no,                
                ] as $k=>$v) {
                    $blCols[] = "`{$k}`";
                    $blPh[]   = '?';
                    $blParams[] = $v;
                }
                $sql = "INSERT INTO `{$tblBVehicles}` (" . implode(', ', $blCols) . ") VALUES (" . implode(', ', $blPh) . ")";
                $stmtVl = $db->prepare($sql);
                $stmtVl->execute($blParams);

                // $bsCols = []; $bsPh = []; $bsParams = [];
                // foreach ([
                //     'booking_id'=>$booking_id,
                //     'trip_allowance'=>$trip_allowance,
                //     'fuel'=>$fuel,
                //     'fuel_po'=>$fuel_po,
                //     'fuel_amount'=>$fuel_amount,
                // ] as $k=>$v) {
                //     $bsCols[] = "`{$k}`";
                //     $bsPh[]   = '?';
                //     $bsParams[] = $v;
                // }

                // $sql = "INSERT INTO `{$tblBFuel}` (" . implode(', ', $bsCols) . ") VALUES (" . implode(', ', $bsPh) . ")";
                // $stmtBs = $db->prepare($sql);
                // $stmtBs->execute($bsParams);

                $roleBindings = [
                    ['driver', $driver_id],
                    ['helper1', $helper1_id],
                    ['helper2', $helper2_id],
                ];

                foreach ($roleBindings as [$role, $personnelId]) {
                    if ((int)$personnelId <= 0) {
                        continue;
                    }

                    $stmtBrc = $db->prepare(
                        "INSERT INTO `{$tblBPersonnel}` (booking_id, personnel_id, assignment_role) VALUES (?, ?, ?)"
                    );
                    $stmtBrc->execute([$booking_id, (int)$personnelId, $role]);
                }

                $rCols = []; $rPh = []; $rParams = [];
                foreach ([
                    'booking_id'=>$booking_id,
                    'client_ref_no'=>$client_ref_no,
                    'other_ref_no'=>$other_ref_no,
                    'remarks'=>$remarks
                ] as $k=>$v) {
                    $rCols[] =  "`{$k}`";
                    $rPh[] = '?';
                    $rParams[] = $v;
                }

                $sql = "INSERT INTO `{$tblBReferences}` (" . implode(', ', $rCols) . ") VALUES (" . implode(', ', $rPh) . ")";
                $stmtR = $db->prepare($sql);
                $stmtR->execute($rParams);

                $stmtId = $db->prepare(
                    "INSERT INTO `{$tblBItems}`
                        (booking_id, item_type_id, item_description, length, width, height, weight)
                    VALUES (?, ?, ?, ?, ?, ?, ?)"
                );

                foreach ($item_details as $item) {
                    if (!is_array($item)) {
                        continue;
                    }

                    $itemTypeId = $item['item_type_id'] ?? null;
                    $itemDescription = trim((string)($item['item_description'] ?? ''));
                    $length = $item['length'] ?? null;
                    $width = $item['width'] ?? null;
                    $height = $item['height'] ?? null;
                    $weight = $item['weight'] ?? null;

                    // The form keeps one blank row ready for the next item.
                    if (($itemTypeId === null || $itemTypeId === '')
                        && $itemDescription === ''
                        && ($length === null || $length === '')
                        && ($width === null || $width === '')
                        && ($height === null || $height === '')
                        && ($weight === null || $weight === '')) {
                        continue;
                    }

                    $stmtId->execute([
                        $booking_id,
                        $itemTypeId !== null && $itemTypeId !== '' ? (int)$itemTypeId : null,
                        $itemDescription !== '' ? $itemDescription : null,
                        $length !== null && $length !== '' ? (float)$length : null,
                        $width !== null && $width !== '' ? (float)$width : null,
                        $height !== null && $height !== '' ? (float)$height : null,
                        $weight !== null && $weight !== '' ? (float)$weight : null,
                    ]);
                }
            

                if (isset($input['bk_photos']) && is_array($input['bk_photos'])) {
                    $stmtPhoto = $db->prepare("
                        INSERT INTO `{$tblBPhotos}`
                        (booking_id, photo_name, photo_data)
                        VALUES (?, ?, ?)
                    ");

                    foreach ($bk_photos as $row) {
                        $photoName = trim((string)($row['photo_name'] ?? ''));
                        $photoData = trim((string)($row['photo_data'] ?? $row['photo_base64'] ?? ''));
                        // $photoPath = trim((string)($row['photo_path'] ?? ''));
                        $storedPhoto = null;

                        if ($photoData !== '') {
                            $decodedPhoto = base64_decode($photoData, true);

                            if ($decodedPhoto !== false) {
                                $storedPhoto = $decodedPhoto;
                            }
                        }

                        if ($photoName === '' || $storedPhoto === null) {
                            continue;
                        }

                        $stmtPhoto->bindValue(1, $booking_id, PDO::PARAM_INT);
                        $stmtPhoto->bindValue(2, $photoName, PDO::PARAM_STR);
                        $stmtPhoto->bindValue(3, $storedPhoto, PDO::PARAM_LOB);
                        $stmtPhoto->execute();
                    }
                }

                $db->commit();

                $stmtg = $db->prepare("SELECT * FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
                $stmtg->execute([$booking_id]);
                $saved = $stmtg->fetch();
                echoJson($saved, 201);

            } catch (PDOException $e) {
                if ($db->inTransaction()) $db->rollBack();
                echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
            }
            break;

            case 'PUT':
                if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
                $stmtChk = $db->prepare("SELECT booking_id FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
                $stmtChk->execute([$id]);
                if (!$stmtChk->fetch()) echoJson(['error' => 'Booking not found'], 404);

                $booking_info = $input['booking_info'] ?? [];
                $vehicle_assignment = $input['vehicle_assignment'] ?? [];
                $fueltrip_allowance = $input['fueltrip_allowance'] ?? [];
                $personnel_assignment = $input['personnel_assignment'] ?? [];
                $references = $input['references'] ?? [];
                $item_details = $input['item_details'] ?? [];
                $pricing_details = $input['pricing_details'] ?? [];
                $b_expenses = $input['b_expenses'] ?? [];
                if (!is_array($b_expenses)) {
                    $b_expenses = [];
                }
                $hasTravelFund = array_key_exists('travel_fund', $input);
                $travelFundValue = $input['travel_fund'] ?? null;
                if ($hasTravelFund && $travelFundValue !== '' && $travelFundValue !== null && !is_numeric($travelFundValue)) {
                    echoJson(['error' => 'Travel fund must be numeric.'], 400);
                }
                $travel_fund = $travelFundValue === '' || $travelFundValue === null
                    ? null
                    : (float)$travelFundValue;
                $nb_expenses = $input['nb_expenses'] ?? [];
                $nullableFloat = static function ($value) {
                    return $value === null || $value === '' ? null : (float)$value;
                };
                $nullableInt = static function ($value) {
                    return $value === null || $value === '' ? null : (int)$value;
                };

                //booking_info

                $customer_id = (int)($booking_info['customer_id'] ?? NULL);
                $booking_type_id = (int)($booking_info['booking_type_id'] ?? NULL);
                $delivery_date = trim($booking_info['delivery_date'] ?? '');
                $depot_id = (int)($booking_info['depot_id'] ?? NULL);
                $commodity_type_id = (int)($booking_info['commodity_type_id'] ?? NULL);
                $route_code = trim($booking_info['route_code'] ?? '');
                $trips_number = (int)($booking_info['trips_number'] ?? NULL);
                $drops_number = (int)($booking_info['drops_number'] ?? NULL);
                $origin_id = (int)($booking_info['origin_id'] ?? NULL);
                $destinationIds = normalizeDestinationIds($booking_info);
                $destination_id = $destinationIds[0] ?? null;
                
                //vehicle_assignment
                $vehicle_id = (int)($vehicle_assignment['vehicle_id'] ?? NULL);
                $plate_no = trim($vehicle_assignment['plate_no'] ?? '');
                $vehicle_type_id = (int)($vehicle_assignment['vehicle_type_id'] ?? NULL);
                $commodity_type_id = (int)($vehicle_assignment['commodity_type_id'] ?? NULL);
                $vendorValue = $vehicle_assignment['vendor_id'] ?? null;
                $vendor_id = ($vendorValue === null || $vendorValue === '' || (int)$vendorValue === 0)
                    ? null
                    : (int)$vendorValue;

                //personnel_assignment
                $driver_id = (int)($personnel_assignment['driver_id'] ?? NULL);
                $helper1_id = (int)($personnel_assignment['helper1_id'] ?? NULL);
                $helper2_id = (int)($personnel_assignment['helper2_id'] ?? NULL);

                $driver_source = trim($personnel_assignment['driver_source'] ?? 'direct');
                $helper1_source = trim($personnel_assignment['helper1_source'] ?? 'direct');
                $helper2_source = trim($personnel_assignment['helper2_source'] ?? 'direct');

                $driver_vendor_id = (int)($personnel_assignment['driver_vendor_id'] ?? NULL);
                $helper1_vendor_id = (int)($personnel_assignment['helper1_vendor_id'] ?? NULL);
                $helper2_vendor_id = (int)($personnel_assignment['helper2_vendor_id'] ?? NULL);

                //fueltrip_allowance
                $charges = $fueltrip_allowance['charges'] ?? null;
                $trip_allowance = $nullableFloat($fueltrip_allowance['trip_allowance'] ?? null);
                $fuel = $nullableInt($fueltrip_allowance['fuel'] ?? null);
                $fuel_po = $nullableInt($fueltrip_allowance['fuel_po'] ?? null);
                $fuel_amount = $nullableFloat($fueltrip_allowance['fuel_amount'] ?? null);

                //references
                $client_ref_no = trim($references['client_ref_no'] ?? '');
                $other_ref_no = trim($references['other_ref_no'] ?? '');
                $remarks = trim($references['remarks'] ?? '');

                //item_details
                $item_details = is_array($item_details) ? $item_details : [];

                // booking photos
                $bk_photos = $input['bk_photos'] ?? [];

                //pricing_details
                $client_rate = $nullableFloat($pricing_details['client_rate'] ?? null);
                $total_amount = $nullableFloat($pricing_details['total_amount'] ?? null);
                $subcon_rate = $nullableFloat($pricing_details['subcon_rate'] ?? null);
                $driver_rate = $nullableFloat($pricing_details['driver_rate'] ?? null);
                $driver_allowance = $nullableFloat($pricing_details['driver_allowance'] ?? null);
                $helper1_rate = $nullableFloat($pricing_details['helper1_rate'] ?? null);
                $helper1_allowance = $nullableFloat($pricing_details['helper1_allowance'] ?? null);
                $helper2_rate = $nullableFloat($pricing_details['helper2_rate'] ?? null);
                $helper2_allowance = $nullableFloat($pricing_details['helper2_allowance'] ?? null);

                //b_expenses
                $b_gas = $nullableFloat($b_expenses['b_gas'] ?? null);
                $b_parking_fee = $nullableFloat($b_expenses['b_parking_fee'] ?? null);
                $b_toll_fee = $nullableFloat($b_expenses['b_toll_fee'] ?? null);
                $b_entrance_fee = $nullableFloat($b_expenses['b_entrance_fee'] ?? null);
                $b_mano = $nullableFloat($b_expenses['b_mano'] ?? null);
                $b_SOP = $nullableFloat($b_expenses['b_SOP'] ?? null);
                $b_demurrage_fee = $nullableFloat($b_expenses['b_demurrage_fee'] ?? null);
                $b_extra_drop_fee = $nullableFloat($b_expenses['b_extra_drop_fee'] ?? null);
                $b_backload_fee = $nullableFloat($b_expenses['b_backload_fee'] ?? null);

                //nb expenses
                $nb_gas = $nullableFloat($nb_expenses['nb_gas'] ?? null);
                $nb_parking_fee = $nullableFloat($nb_expenses['nb_parking_fee'] ?? null);
                $nb_toll_fee = $nullableFloat($nb_expenses['nb_toll_fee'] ?? null);
                $nb_entrance_fee = $nullableFloat($nb_expenses['nb_entrance_fee'] ?? null);
                $nb_mano = $nullableFloat($nb_expenses['nb_mano'] ?? null);
                $nb_SOP = $nullableFloat($nb_expenses['nb_SOP'] ?? null);
                $nb_demurrage_fee = $nullableFloat($nb_expenses['nb_demurrage_fee'] ?? null);
                $nb_extra_drop_fee = $nullableFloat($nb_expenses['nb_extra_drop_fee'] ?? null);
                $nb_backload_fee = $nullableFloat($nb_expenses['nb_backload_fee'] ?? null);
                try {
                    $db->beginTransaction();

                $stmtB = $db->prepare(
                    "UPDATE `{$tblBookings}` SET
                        customer_id = ?, booking_type_id = ?, delivery_date = ?, depot_id = ?,
                        commodity_type_id = ?, route_code = ?, trips_number = ?, drops_number = ?,
                        origin_id = ?, destination_id = ?, updated_by = ?
                    WHERE booking_id = ?"
                );
                $stmtB->execute([
                    $customer_id, $booking_type_id, $delivery_date ?: null, $depot_id,
                    $commodity_type_id, $route_code ?: null, $trips_number, $drops_number,
                    $origin_id, $destination_id, (int)$currentUser['user_id'], $id,
                ]);

                $stmtDeleteDestinations = $db->prepare(
                    "DELETE FROM `{$tblBDestination}` WHERE booking_id = ?"
                );
                $stmtDeleteDestinations->execute([$id]);
                $stmtDestination = $db->prepare(
                    "INSERT INTO `{$tblBDestination}` (booking_id, destination_id, stop_order) VALUES (?, ?, ?)"
                );
                foreach ($destinationIds as $index => $destinationId) {
                    $stmtDestination->execute([$id, $destinationId, $index + 1]);
                }
                

                $stmtChkBk = $db->prepare("SELECT booking_id FROM `{$tblBVehicles}` WHERE booking_id = ? LIMIT 1");
                $stmtChkBk->execute([$id]);
                $exBk = $stmtChkBk->fetch();
                $BkData = [
                    'booking_id'=>$id,
                    'vehicle_id'=>$vehicle_id,
                    'vendor_id'=>$vendor_id,
                    'plate_no'=>$plate_no,
                ];

                if ($exBk) {
                    $stmtEU = $db->prepare(
                        "UPDATE `{$tblBVehicles}`
                        SET vehicle_id = ?, vendor_id = ?, plate_no = ?
                        WHERE booking_id = ?"
                    );
                    $stmtEU->execute([$vehicle_id, $vendor_id, $plate_no, $id]);
                } else {
                    $ek = array_keys($BkData);
                    $ev = array_values($BkData);
                    $ph = array_fill(0, count($ek), '?');
                    $stmtEI = $db->prepare("INSERT INTO `{$tblBVehicles}` (" . implode(',', $ek) . ") VALUES (" . implode(',', $ph) . ")");
                    $stmtEI->execute($ev);
                }

                if (array_key_exists('fueltrip_allowance', $input)) {
                    $stmtChkBf = $db->prepare("SELECT booking_id FROM `{$tblBFuel}` WHERE booking_id = ? LIMIT 1");
                    $stmtChkBf->execute([$id]);
                    $exBf = $stmtChkBf->fetch();
                    $BfData = [
                        'booking_id'=>$id,
                        'charges'=>$charges,
                        'trip_allowance'=>$trip_allowance,
                        'fuel'=>$fuel,
                        'fuel_po'=>$fuel_po,
                        'fuel_amount'=>$fuel_amount,
                    ];
                    if ($exBf) {
                        $stmtBU = $db->prepare(
                            "UPDATE `{$tblBFuel}`
                            SET charges = ?, trip_allowance = ?, fuel = ?, fuel_po = ?, fuel_amount = ?
                            WHERE booking_id = ?"
                        );
                        $stmtBU->execute([$charges, $trip_allowance, $fuel, $fuel_po, $fuel_amount, $id]);
                    } else {
                        $stmtBI = $db->prepare("INSERT INTO `{$tblBFuel}` (booking_id, charges, trip_allowance, fuel, fuel_po, fuel_amount) VALUES (?, ?, ?, ?, ?, ?)");
                        $stmtBI->execute(array_values($BfData));
                    }
                }

                $roleBindings = [
                    ['driver', $driver_id],
                    ['helper1', $helper1_id],
                    ['helper2', $helper2_id],
                ];

                foreach ($roleBindings as [$role, $personnelId]) {
                    $personnelId = (int)$personnelId;

                    $stmtChkPersonnel = $db->prepare(
                        "SELECT booking_personnel_id
                        FROM `{$tblBPersonnel}`
                        WHERE booking_id = ? AND assignment_role = ?
                        LIMIT 1"
                    );
                    $stmtChkPersonnel->execute([$id, $role]);
                    $existingPersonnel = $stmtChkPersonnel->fetch();

                    if ($personnelId > 0) {
                        if ($existingPersonnel) {
                            $stmtUpdatePersonnel = $db->prepare(
                                "UPDATE `{$tblBPersonnel}`
                                SET personnel_id = ?
                                WHERE booking_personnel_id = ?"
                            );
                            $stmtUpdatePersonnel->execute([
                                $personnelId,
                                $existingPersonnel['booking_personnel_id'],
                            ]);
                        } else {
                            $stmtInsertPersonnel = $db->prepare(
                                "INSERT INTO `{$tblBPersonnel}`
                                    (booking_id, personnel_id, assignment_role)
                                VALUES (?, ?, ?)"
                            );
                            $stmtInsertPersonnel->execute([$id, $personnelId, $role]);
                        }
                    } elseif ($existingPersonnel) {
                        $stmtDeletePersonnel = $db->prepare(
                            "DELETE FROM `{$tblBPersonnel}` WHERE booking_personnel_id = ?"
                        );
                        $stmtDeletePersonnel->execute([
                            $existingPersonnel['booking_personnel_id'],
                        ]);
                    }
                }

                $stmtChkR = $db->prepare("SELECT booking_id FROM `{$tblBReferences}` WHERE booking_id = ? LIMIT 1");
                $stmtChkR->execute([$id]);
                $exR = $stmtChkR->fetch();
                $RData = [
                    'client_ref_no'=>$client_ref_no,
                    'other_ref_no'=>$other_ref_no,
                    'remarks'=>$remarks
                ];
                if ($exR) {
                    $stmtEMU = $db->prepare(
                        "UPDATE `{$tblBReferences}`
                        SET client_ref_no = ?, other_ref_no = ?, remarks = ?
                        WHERE booking_id = ?"
                    );
                    $stmtEMU->execute([$client_ref_no, $other_ref_no, $remarks, $id]);
                } else {
                    $stmtEMI = $db->prepare("INSERT INTO `{$tblBReferences}` (booking_id, client_ref_no, other_ref_no, remarks) VALUES (?, ?, ?, ?)");
                    $stmtEMI->execute([$id, $RData['client_ref_no'], $RData['other_ref_no'], $RData['remarks']]);
                }

                $stmtDeleteItems = $db->prepare(
                    "DELETE FROM `{$tblBItems}` WHERE booking_id = ?"
                );
                $stmtDeleteItems->execute([$id]);

                $stmtInsertItem = $db->prepare(
                    "INSERT INTO `{$tblBItems}`
                        (booking_id, item_type_id, item_description, length, width, height, weight)
                    VALUES (?, ?, ?, ?, ?, ?, ?)"
                );

                foreach ($item_details as $item) {
                    if (!is_array($item)) {
                        continue;
                    }

                    $itemTypeId = $item['item_type_id'] ?? null;
                    $itemDescription = trim((string)($item['item_description'] ?? ''));
                    $length = $item['length'] ?? null;
                    $width = $item['width'] ?? null;
                    $height = $item['height'] ?? null;
                    $weight = $item['weight'] ?? null;

                    // The form keeps one blank row ready for the next item.
                    if (($itemTypeId === null || $itemTypeId === '')
                        && $itemDescription === ''
                        && ($length === null || $length === '')
                        && ($width === null || $width === '')
                        && ($height === null || $height === '')
                        && ($weight === null || $weight === '')) {
                        continue;
                    }

                    $stmtInsertItem->execute([
                        $id,
                        $itemTypeId !== null && $itemTypeId !== '' ? (int)$itemTypeId : null,
                        $itemDescription !== '' ? $itemDescription : null,
                        $length !== null && $length !== '' ? (float)$length : null,
                        $width !== null && $width !== '' ? (float)$width : null,
                        $height !== null && $height !== '' ? (float)$height : null,
                        $weight !== null && $weight !== '' ? (float)$weight : null,
                    ]);
                }



                // Replace vehicle photos
                $stmtPhotoDel = $db->prepare("
                    DELETE FROM `{$tblBPhotos}`
                    WHERE booking_id = ?
                ");
                $stmtPhotoDel->execute([$id]);

                if (
                    isset($input['bk_photos']) &&
                    is_array($input['bk_photos'])
                ) {
                    $stmtPhoto = $db->prepare("
                        INSERT INTO `{$tblBPhotos}`
                        (
                            booking_id,
                            photo_name,
                            photo_data
                        )
                        VALUES (?, ?, ?)
                    ");

                    foreach ($bk_photos as $row) {
                        $photoName = trim(
                            (string)($row['photo_name'] ?? '')
                        );

                        $photoData =
                            $row['photo_data'] ??
                            $row['photo_base64'] ??
                            '';

                        if (
                            $photoName === '' ||
                            $photoData === ''
                        ) {
                            continue;
                        }

                        $storedPhoto = base64_decode(
                            $photoData,
                            true
                        );

                        if ($storedPhoto === false) {
                            continue;
                        }

                        $stmtPhoto->bindValue(
                            1,
                            $id,
                            PDO::PARAM_INT
                        );

                        $stmtPhoto->bindValue(
                            2,
                            $photoName,
                            PDO::PARAM_STR
                        );

                        $stmtPhoto->bindValue(
                            3,
                            $storedPhoto,
                            PDO::PARAM_LOB
                        );

                        $stmtPhoto->execute();
                    }
                }

                if (array_key_exists('pricing_details', $input)) {
                    $stmtChkPd = $db->prepare("SELECT client_cost_id FROM `{$tblBCCost}` WHERE booking_id = ? LIMIT 1");
                    $stmtChkPd->execute([$id]);
                    $exPd = $stmtChkPd->fetch();
                    if ($exPd) {
                        $stmtPU = $db->prepare(
                            "UPDATE `{$tblBCCost}`
                            SET client_rate = ?, total_amount = ?, subcon_rate = ?
                            WHERE booking_id = ?"
                        );
                        $stmtPU->execute([$client_rate, $total_amount, $subcon_rate, $id]);
                    } else {
                        $stmtBI = $db->prepare(
                            "INSERT INTO `{$tblBCCost}`
                                (booking_id, client_rate, total_amount, subcon_rate)
                            VALUES (?, ?, ?, ?)"
                        );
                        $stmtBI->execute([$id, $client_rate, $total_amount, $subcon_rate]);
                    }

                    $personnelRates = [
                        ['driver', $driver_rate, $driver_allowance],
                        ['helper1', $helper1_rate, $helper1_allowance],
                        ['helper2', $helper2_rate, $helper2_allowance],
                    ];
                    $stmtPersonnelRate = $db->prepare(
                        "UPDATE `{$tblBPersonnel}`
                        SET rate = ?, allowance = ?
                        WHERE booking_id = ? AND assignment_role = ?"
                    );
                    foreach ($personnelRates as [$role, $rate, $allowance]) {
                        $stmtPersonnelRate->execute([$rate, $allowance, $id, $role]);
                    }
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

                if ($hasTravelFund) {
                    $stmtTravelFundExists = $db->prepare(
                        "SELECT booking_id
                         FROM `{$tblTravelFunds}`
                         WHERE booking_id = ?
                         LIMIT 1"
                    );
                    $stmtTravelFundExists->execute([$id]);
                    if ($stmtTravelFundExists->fetch()) {
                        $stmtTravelFund = $db->prepare(
                            "UPDATE `{$tblTravelFunds}`
                             SET travel_fund = ?
                             WHERE booking_id = ?"
                        );
                        $stmtTravelFund->execute([$travel_fund, $id]);
                    } else {
                        $stmtTravelFund = $db->prepare(
                            "INSERT INTO `{$tblTravelFunds}` (booking_id, travel_fund)
                             VALUES (?, ?)"
                        );
                        $stmtTravelFund->execute([$id, $travel_fund]);
                    }
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

            break;

        case 'DELETE':
            if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
                $stmtChk = $db->prepare("SELECT booking_id FROM `{$tblBookings}` WHERE booking_id = ? LIMIT 1");
                $stmtChk->execute([$id]);
                if (!$stmtChk->fetch()) echoJson(['error' => 'Booking not found'], 404);

            try {
                $db->beginTransaction();
                $stmtD = $db->prepare("UPDATE `{$tblBookings}` set status_id = 6 WHERE booking_id = ?");
                $stmtD->execute([$id]);
                $db->commit();
                echoJson(['message' => 'Booking cancelled successfully'], 200);
            } catch (Throwable $e) {
                if ($db->inTransaction()) $db->rollBack();
                error_log('Booking cancellation failed: ' . $e->getMessage());
                echoJson(['error' => 'Booking cancellation failed: ' . $e->getMessage()], 500);
            }
        }
