<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

requireAuth();
$db = getDB();

$tblVehicles = tableName('vehicles');
$tblTypes = tableName('vh_types');
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
$tblCommodityTypes = tableName('commodity_type');
$tblCategoryTypes = tableName('category_types');
$tblOrigins = tableName('origin');
$tblDepots = tableName('depots');
$tblVendors = tableName('vendor');


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


function listSql($tblV, $tblModels, $tblManufacturers, $tblTypes, $tblCategories, $tblVendor, $tblStatuses, $tblLocation, $tblOrigins, $tblDepots) {
    return "SELECT
                    v.vehicle_id,
                    v.plate_no,
                    v.body_no,
                    v.status_id,
                    v.vehicle_type_id,
                    v.commodity_type_id,
                    vs.status_name,
                    vt.vehicle_type,
                    mf.vehicle_manufacturer,
                    m.vehicle_model,
                    v.year,
                    ct.category_type,
                    vd.vendor_id,
                    vd.vendor_name,
                    vl.origin_id,
                    o.origin_name,
                    vl.depot_id,
                    d.depot_name,
                    vl.GPS,
                    vs.sort_order
            FROM `{$tblV}` v
            LEFT JOIN `{$tblModels}` m ON v.vehicle_model_id = m.vehicle_model_id
            LEFT JOIN `{$tblManufacturers}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
            LEFT JOIN `{$tblTypes}` vt ON v.vehicle_type_id = vt.vehicle_type_id
            LEFT JOIN `{$tblVendor}` vd ON v.vendor_id = vd.vendor_id
            LEFT JOIN `{$tblCategories}` ct ON v.category_type_id = ct.category_type_id
            LEFT JOIN `{$tblStatuses}` vs ON v.status_id = vs.status_id
            LEFT JOIN `{$tblLocation}` vl ON v.vehicle_id = vl.vehicle_id
            LEFT JOIN `{$tblOrigins}` o ON vl.origin_id = o.origin_id
            LEFT JOIN `{$tblDepots}` d ON vl.depot_id = d.depot_id
            ORDER BY v.plate_no ASC";
}

function detailSql(
    $tblV,
    $tblVS,
    $tblA,
    $tblI,
    $tblL,
    $tblM,
    $tblMo,
    $tblRC,
    $tblS,
    $tblT,
    $tblCo,
    $tblCa,
    $tblO,
    $tblDe,
    $tblVendors
) {
    return "SELECT
                    v.vehicle_id,
                    v.plate_no,
                    v.body_no,
                    v.status_id,
                    vstatus.status_name,
                    v.vehicle_type_id,
                    vt.vehicle_type,
                    v.vehicle_manufacturer_id,
                    vma.vehicle_manufacturer,
                    v.vehicle_model_id,
                    vmo.vehicle_model,
                    v.year AS year_model,
                    v.commodity_type_id AS commodity_type_id,
                    vco.commodity_type,
                    v.asset_no,
                    v.category_type_id,
                    vca.category_type,
                    v.vendor_id,
                    vend.vendor_name,
                    vl.origin_id,
                    o.origin_name,
                    vl.depot_id,
                    d.depot_name,
                    vl.GPS,
                    vrc.or_date,
                    vrc.or_number,
                    vrc.cr_date,
                    vrc.cr_number,
                    vrc.ltfrb_case_no,
                    vrc.ltfrb_expiry,
                    vrc.mv_file_no,
                    vrc.pa_expiry,
                    vrc.late_renewal_date,
                    vrc.registration_type,
                    vrc.registration_date,
                    vrc.rfid_type,
                    vrc.rfid_account_no,
                    vi.insurance_provider,
                    vi.insurance_policy_no,
                    vi.insurance_expiry,
                    vi.inland_marine_policy_no,
                    vi.inland_marine_expiry,
                    va.acquisition_date,
                    va.acquisition_price,
                    va.breakdown_date,
                    va.breakdown_remarks,
                    va.remarks,
                    specs.chassis_no,
                    specs.color,
                    specs.engine_no,
                    specs.engine_size,
                    specs.fuel_type,
                    specs.transmission_type
            FROM `{$tblV}` v
            LEFT JOIN `{$tblVS}` vstatus ON v.status_id = vstatus.status_id
            LEFT JOIN `{$tblT}` vt ON v.vehicle_type_id = vt.vehicle_type_id
            LEFT JOIN `{$tblM}` vma ON v.vehicle_manufacturer_id = vma.vehicle_manufacturer_id
            LEFT JOIN `{$tblMo}` vmo ON v.vehicle_model_id = vmo.vehicle_model_id
            LEFT JOIN `{$tblCo}` vco ON v.commodity_type_id = vco.commodity_type_id
            LEFT JOIN `{$tblCa}` vca ON v.category_type_id = vca.category_type_id
            LEFT JOIN `{$tblVendors}` vend ON v.vendor_id = vend.vendor_id
            LEFT JOIN `{$tblL}` vl ON v.vehicle_id = vl.vehicle_id
            LEFT JOIN `{$tblO}` o ON vl.origin_id = o.origin_id
            LEFT JOIN `{$tblDe}` d ON vl.depot_id = d.depot_id
            LEFT JOIN `{$tblA}` va ON v.vehicle_id = va.vehicle_id
            LEFT JOIN `{$tblI}` vi ON v.vehicle_id = vi.vehicle_id
            LEFT JOIN `{$tblRC}` vrc ON v.vehicle_id = vrc.vehicle_id
            LEFT JOIN `{$tblS}` specs ON v.vehicle_id = specs.vehicle_id";
}

switch ($method) {

    case 'GET':
        try {
            if ($id > 0) {
                $detailSql = detailSql(
                    $tblVehicles,
                    $tblVehicleStatuses,
                    $tblAcquisition,
                    $tblInsurance,
                    $tblLocation,
                    $tblManufacturers,
                    $tblModels,
                    $tblRegistrationCompliance,
                    $tblSpecifications,
                    $tblTypes,
                    $tblCommodityTypes,
                    $tblCategoryTypes,
                    $tblOrigins,
                    $tblDepots,
                    $tblVendors
                );

                $detailSql .= " WHERE v.vehicle_id = ? LIMIT 1";

                $stmt = $db->prepare($detailSql);
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) echoJson(['error' => 'Vehicle not found'], 404);

                $stmtPhotos = $db->prepare("SELECT * FROM `{$tblPhotos}` WHERE vehicle_id = ? ORDER BY vh_photos_id ASC");
                $stmtPhotos->execute([$id]);
                $row['vh_photos'] = $stmtPhotos->fetchAll() ?: [];

                $stmtDocs = $db->prepare("SELECT * FROM `{$tblDocuments}` WHERE vehicle_id = ? ORDER BY vh_documents_id ASC");
                $stmtDocs->execute([$id]);
                $row['vh_documents'] = $stmtDocs->fetchAll() ?: [];

                echoJson($row);
            }

            $statusFilter = $_GET['status'] ?? 'all';
            $search = trim($_GET['search'] ?? '');
            $params = [];
            $baseSql = listSql(
                $tblVehicles,
                $tblModels,
                $tblManufacturers,
                $tblTypes,
                $tblCategoryTypes,
                $tblVendors,
                $tblVehicleStatuses,
                $tblLocation,
                $tblOrigins,
                $tblDepots
            );
            $where = " WHERE 1=1";
            if ($statusFilter && $statusFilter !== 'all') {
                $where .= " AND v.status = ?";
                $params[] = $statusFilter;
            }
            if ($search !== '') {
                $where .= " AND (v.plate_no LIKE ? OR v.body_no LIKE ?)
                            OR (v.vehicle_type LIKE ? OR v.vehicle_manufacturer LIKE ?)
                            OR (v.vehicle_model LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            $sql = listSql($tblVehicles, $tblModels, $tblManufacturers, $tblTypes, $tblCategoryTypes, $tblVendors, $tblVehicleStatuses, $tblLocation, $tblOrigins, $tblDepots);
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $rows = $stmt->fetchAll();
            echoJson($rows);

        } catch (PDOException $e) {
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;
    case 'POST':
        $vehicle_info = $input['vehicle_info'] ?? [];
        $vehicle_location = $input['vehicle_location'] ?? [];
        $vehicle_specifications = $input['vehicle_specifications'] ?? [];
        $vehicle_regist_compli = $input['vehicle_regist_compli'] ?? [];
        $vehicle_insurance = $input['vehicle_insurance'] ?? [];
        $vehicle_acquisition = $input['vehicle_acquisition'] ?? [];
        
        // vehicle_info
        $plate_no = trim($vehicle_info['plate_no'] ?? '');
        $body_no = trim($vehicle_info['body_no'] ?? '');
        $status_id = (int)($vehicle_info['status_id'] ?? 0);
        $vehicle_type_id = (int)($vehicle_info['vehicle_type_id'] ?? 0);
        $vehicle_manufacturer_id = (int)($vehicle_info['vehicle_manufacturer_id'] ?? 0);
        $vehicle_model_id = (int)($vehicle_info['vehicle_model_id'] ?? 0);
        $year_model = trim($vehicle_info['year_model'] ?? '');
        $commodityValue = $vehicle_info['commodity_type_id'] ?? null;
        $commodity_type_id = ($commodityValue === null || $commodityValue === '' || (int)$commodityValue === 0)
            ? null
            : (int)$commodityValue;
        $asset_no = trim($vehicle_info['asset_no'] ?? ''); 
        $categoryValue = $vehicle_info['category_type_id'] ?? null;
        $category_type_id = ($categoryValue === null || $categoryValue === '' || (int)$categoryValue === 0)
            ? null
            : (int)$categoryValue;

        if ($plate_no  === '') echoJson(['error' => 'Plate Number is required'], 400);
        if ($body_no === '') echoJson(['error' => 'Body Number is required'], 400);
        if ($status_id     === '') echoJson(['error' => 'Status is required'], 400);
        if ($vehicle_type_id  === '') echoJson(['error' => 'Vehicle Type is required'], 400);
        if ($vehicle_manufacturer_id === '') echoJson(['error' => 'Vehicle Manufacturer is required'], 400);
        if ($vehicle_model_id     === '') echoJson(['error' => 'Vehicle Model is required'], 400);

        // vehicle_location
        $vendorValue = $vehicle_location['vendor_id'] ?? null;
        $vendor_id = ($vendorValue === null || $vendorValue === '' || (int)$vendorValue === 0)
            ? null
            : (int)$vendorValue;
        $originValue = $vehicle_location['origin_id'] ?? null;
        $origin_id = ($originValue === null || $originValue === '' || (int)$originValue === 0)
            ? null
            : (int)$originValue;
        $depotValue = $vehicle_location['depot_id'] ?? null;
        $depot_id = ($depotValue === null || $depotValue === '' || (int)$depotValue === 0)
            ? null
            : (int)$depotValue;
        $GPS = trim($vehicle_location['GPS'] ?? '');

        // vehicle_specifications
        $chassis_no = trim($vehicle_specifications['chassis_no'] ?? '');
        $color = trim($vehicle_specifications['color'] ?? '');
        $engine_no = trim($vehicle_specifications['engine_no'] ?? '');
        $engine_no = trim($vehicle_specifications['engine_no'] ?? '');
        $engine_size = trim($vehicle_specifications['engine_size'] ?? '');
        $fuel_type = trim($vehicle_specifications['fuel_type'] ?? '');
        $transmission = trim($vehicle_specifications['transmission'] ?? '');
        
        // vehicle_regist_compli
        $or_date = trim($vehicle_regist_compli['or_date'] ?? '');
        $or_number = trim($vehicle_regist_compli['or_number'] ?? '');
        $cr_date = trim($vehicle_regist_compli['cr_date'] ?? '');
        $cr_number = trim($vehicle_regist_compli['cr_number'] ?? '');
        $ltfrb_case_no = trim($vehicle_regist_compli['ltfrb_case_no'] ?? '');
        $ltfrb_expiry = trim($vehicle_regist_compli['ltfrb_expiry'] ?? '');
        $mv_file_no = trim($vehicle_regist_compli['mv_file_no'] ?? '');
        $pa_expiry = trim($vehicle_regist_compli['pa_expiry'] ?? '');
        $late_renewal_date = trim($vehicle_regist_compli['late_renewal_date'] ?? '');
        $registration_type = trim($vehicle_regist_compli['registration_type'] ?? '');
        $registration_date = trim($vehicle_regist_compli['registration_date'] ?? '');
        $rfid_type = trim($vehicle_regist_compli['rfid_type'] ?? '');
        $rfid_account_no = trim($vehicle_regist_compli['rfid_account_no'] ?? '');

        // vehicle_insurance
        $insurance_provider = trim($vehicle_insurance['insurance_provider'] ?? '');
        $insurance_policy_no = trim($vehicle_insurance['insurance_policy_no'] ?? '');
        $insurance_expiry = trim($vehicle_insurance['insurance_expiry'] ?? '');
        $inland_marine_policy_no = trim($vehicle_insurance['inland_marine_policy_no'] ?? '');
        $inland_marine_expiry = trim($vehicle_insurance['inland_marine_expiry'] ?? '');
        
        // vehicle_acquisition
        $acquisition_date = trim($vehicle_acquisition['acquisition_date'] ?? '');
        $acquisition_price = trim($vehicle_acquisition['acquisition_price'] ?? '');
        $breakdown_date = trim($vehicle_acquisition['breakdown_date'] ?? '');
        $breakdown_remarks = trim($vehicle_acquisition['breakdown_remarks'] ?? '');
        $remarks = trim($vehicle_acquisition['remarks'] ?? '');

        // vehicle documents and photos
        $vh_documents = $input['vh_documents'] ?? [];
        $vh_photos = $input['vh_photos'] ?? [];


        try {
            $db->beginTransaction();

            $vCols = []; $vPh = []; $vParams = [];
            foreach ([
                'plate_no'=>$plate_no,
                'body_no'=>$body_no,
                'status_id'=>$status_id,
                'vehicle_type_id'=>$vehicle_type_id,
                'vehicle_manufacturer_id'=>$vehicle_manufacturer_id,
                'vehicle_model_id'=>$vehicle_model_id,
                'year'=>$year_model,
                'commodity_type_id'=>$commodity_type_id,
                'asset_no'=>$asset_no,
                'category_type_id'=>$category_type_id,
                'vendor_id'=>$vendor_id
            ] as $k=>$v) {
                $vCols[] = "`{$k}`";
                $vPh[]   = '?';
                $vParams[] = $v;
            }
            $sql = "INSERT INTO `{$tblVehicles}` (" . implode(', ', $vCols) . ") VALUES (" . implode(', ', $vPh) . ")";
            $stmtV = $db->prepare($sql);
            $stmtV->execute($vParams);
            if ($stmtV->rowCount() === 0) { $db->rollBack(); echoJson(['error' => 'Insert failed'], 500); }
            $vehicle_id = (int)$db->lastInsertId();
            if ($vehicle_id <= 0) { $db->rollBack(); echoJson(['error' => 'Insert failed: no ID'], 500); }

            $vlCols = []; $vlPh = []; $vlParams = [];
            foreach ([
                'vehicle_id'=>$vehicle_id,
                'origin_id'=>$origin_id,
                'depot_id'=>$depot_id,
                'GPS'=>$GPS
            ] as $k=>$v) {
                $vlCols[] = "`{$k}`";
                $vlPh[]   = '?';
                $vlParams[] = $v;
            }
            $sql = "INSERT INTO `{$tblLocation}` (" . implode(', ', $vlCols) . ") VALUES (" . implode(', ', $vlPh) . ")";
            $stmtVl = $db->prepare($sql);
            $stmtVl->execute($vlParams);

            $vsCols = []; $vsPh = []; $vsParams = [];
            foreach ([
                'vehicle_id'=>$vehicle_id,
                'chassis_no'=>$chassis_no,
                'engine_no'=>$engine_no,
                'engine_size'=>$engine_size,
                'color'=>$color,
                'fuel_type'=>$fuel_type,
                'transmission_type'=>$transmission
            ] as $k=>$v) {
                $vsCols[] = "`{$k}`";
                $vsPh[]   = '?';
                $vsParams[] = $v;
            }

            $sql = "INSERT INTO `{$tblSpecifications}` (" . implode(', ', $vsCols) . ") VALUES (" . implode(', ', $vsPh) . ")";
            $stmtVs = $db->prepare($sql);
            $stmtVs->execute($vsParams);

            $vrcCols = []; $vrcPh = []; $vrcParams = [];
            foreach ([
                'vehicle_id'=>$vehicle_id,
                'or_date'=>$or_date,
                'or_number'=>$or_number,
                'cr_date'=>$cr_date,
                'cr_number'=>$cr_number,
                'ltfrb_case_no'=>$ltfrb_case_no,
                'ltfrb_expiry'=>$ltfrb_expiry,
                'mv_file_no'=>$mv_file_no,
                'pa_expiry'=>$pa_expiry,
                'late_renewal_date'=>$late_renewal_date,
                'registration_type'=>$registration_type,
                'registration_date'=>$registration_date,
                'rfid_type'=>$rfid_type,
                'rfid_account_no'=>$rfid_account_no
            ] as $k=>$v) {
                $vrcCols[] =  "`{$k}`";
                $vrcPh[] = '?';
                $vrcParams[] = $v;
            }

            $sql = "INSERT INTO `{$tblRegistrationCompliance}` (" . implode(', ', $vrcCols) . ") VALUES (" . implode(', ', $vrcPh) . ")";
            $stmtVrc = $db->prepare($sql);
            $stmtVrc->execute($vrcParams);

            $viCols = []; $viPh = []; $viParams = [];
            foreach ([
                'vehicle_id'=>$vehicle_id,
                'insurance_provider'=>$insurance_provider,
                'insurance_policy_no'=>$insurance_policy_no,
                'insurance_expiry'=>$insurance_expiry,
                'inland_marine_policy_no'=>$inland_marine_policy_no,
                'inland_marine_expiry'=>$inland_marine_expiry
            ] as $k=>$v) {
                $viCols[] =  "`{$k}`";
                $viPh[] = '?';
                $viParams[] = $v;
            }

            $sql = "INSERT INTO `{$tblInsurance}` (" . implode(', ', $viCols) . ") VALUES (" . implode(', ', $viPh) . ")";
            $stmtVi = $db->prepare($sql);
            $stmtVi->execute($viParams);

            $vaCols = []; $vaPh = []; $vaParams = [];
            foreach ([
                'vehicle_id'=>$vehicle_id,
                'acquisition_date'=>$acquisition_date,
                'acquisition_price'=>$acquisition_price,
                'breakdown_date'=>$breakdown_date,
                'breakdown_remarks'=>$breakdown_remarks,
                'remarks'=>$remarks
            ] as $k=>$v) {
                $vaCols[] =  "`{$k}`";
                $vaPh[] = '?';
                $vaParams[] = $v;
            }

            $sql = "INSERT INTO `{$tblAcquisition}` (" . implode(', ', $vaCols) . ") VALUES (" . implode(', ', $vaPh) . ")";
            $stmtVa = $db->prepare($sql);
            $stmtVa->execute($vaParams);

            if (is_array($vh_documents)) {
                $stmtDoc = $db->prepare("
                    INSERT INTO `{$tblDocuments}`
                    (vehicle_id, document_name, document_path)
                    VALUES (?, ?, ?)
                ");

                foreach ($vh_documents as $row) {
                    $documentName = trim($row['document_name'] ?? '');
                    $documentPath = trim($row['document_path'] ?? '');

                    // Ignore completely empty rows
                    if ($documentName === '' && $documentPath === '') {
                        continue;
                    }

                    $stmtDoc->execute([
                        $vehicle_id,
                        $documentName !== '' ? $documentName : null,
                        $documentPath !== '' ? $documentPath : null
                    ]);
                }
            }

            if (is_array($vh_photos)) {
                $stmtPhoto = $db->prepare("
                    INSERT INTO `{$tblPhotos}`
                    (vehicle_id, photo_name, photo_path)
                    VALUES (?, ?, ?)
                ");

                foreach ($vh_photos as $row) {
                    $photoName = trim($row['photo_name'] ?? '');
                    $photoPath = trim($row['photo_path'] ?? '');

                    // Ignore completely empty rows
                    if ($photoName === '' && $photoPath === '') {
                        continue;
                    }

                    $stmtPhoto->execute([
                        $vehicle_id,
                        $photoName !== '' ? $photoName : null,
                        $photoPath !== '' ? $photoPath : null
                    ]);
                }
            }

            $db->commit();

            $stmtg = $db->prepare("SELECT * FROM `{$tblVehicles}` WHERE vehicle_id = ? LIMIT 1");
            $stmtg->execute([$vehicle_id]);
            $saved = $stmtg->fetch();
            echoJson($saved, 201);

        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
        }
        break;

        case 'PUT':
            if ($id <= 0) echoJson(['error' => 'ID is required'], 400);
            $stmtChk = $db->prepare("SELECT vehicle_id FROM `{$tblVehicles}` WHERE vehicle_id = ? LIMIT 1");
            $stmtChk->execute([$id]);
            if (!$stmtChk->fetch()) echoJson(['error' => 'Vehicle not found'], 404);

            $vehicle_info = $input['vehicle_info'] ?? [];
            $vehicle_location = $input['vehicle_location'] ?? [];
            $vehicle_specifications = $input['vehicle_specifications'] ?? [];
            $vehicle_regist_compli = $input['vehicle_regist_compli'] ?? [];
            $vehicle_insurance = $input['vehicle_insurance'] ?? [];
            $vehicle_acquisition = $input['vehicle_acquisition'] ?? [];
            
            // vehicle_info
            $plate_no = trim($vehicle_info['plate_no'] ?? '');
            $body_no = trim($vehicle_info['body_no'] ?? '');
            $status_id = (int)($vehicle_info['status_id'] ?? 0);
            $vehicle_type_id = (int)($vehicle_info['vehicle_type_id'] ?? 0);
            $vehicle_manufacturer_id = (int)($vehicle_info['vehicle_manufacturer_id'] ?? 0);
            $vehicle_model_id = (int)($vehicle_info['vehicle_model_id'] ?? 0);
            $year_model = trim($vehicle_info['year_model'] ?? '');
            $commodityValue = $vehicle_info['commodity_type_id'] ?? null;
            $commodity_type_id = ($commodityValue === null || $commodityValue === '' || (int)$commodityValue === 0)
                ? null
                : (int)$commodityValue;
            $asset_no = trim($vehicle_info['asset_no'] ?? ''); 
            $categoryValue = $vehicle_info['category_type_id'] ?? null;
            $category_type_id = ($categoryValue === null || $categoryValue === '' || (int)$categoryValue === 0)
                ? null
                : (int)$categoryValue;

            if ($plate_no  === '') echoJson(['error' => 'Plate Number is required'], 400);
            if ($body_no === '') echoJson(['error' => 'Body Number is required'], 400);
            if ($status_id     === '') echoJson(['error' => 'Status is required'], 400);
            if ($vehicle_type_id  === '') echoJson(['error' => 'Vehicle Type is required'], 400);
            if ($vehicle_manufacturer_id === '') echoJson(['error' => 'Vehicle Manufacturer is required'], 400);
            if ($vehicle_model_id     === '') echoJson(['error' => 'Vehicle Model is required'], 400);

            // vehicle_location
            $vendorValue = $vehicle_location['vendor_id'] ?? null;
            $vendor_id = ($vendorValue === null || $vendorValue === '' || (int)$vendorValue === 0)
                ? null
                : (int)$vendorValue;
            $originValue = $vehicle_location['origin_id'] ?? null;
            $origin_id = ($originValue === null || $originValue === '' || (int)$originValue === 0)
                ? null
                : (int)$originValue;
            $depotValue = $vehicle_location['depot_id'] ?? null;
            $depot_id = ($depotValue === null || $depotValue === '' || (int)$depotValue === 0)
                ? null
                : (int)$depotValue;
            $GPS = trim($vehicle_location['GPS'] ?? '');

            // vehicle_specifications
            $chassis_no = trim($vehicle_specifications['chassis_no'] ?? '');
            $color = trim($vehicle_specifications['color'] ?? '');
            $engine_no = trim($vehicle_specifications['engine_no'] ?? '');
            $engine_no = trim($vehicle_specifications['engine_no'] ?? '');
            $engine_size = trim($vehicle_specifications['engine_size'] ?? '');
            $fuel_type = trim($vehicle_specifications['fuel_type'] ?? '');
            $transmission = trim($vehicle_specifications['transmission'] ?? '');
            
            // vehicle_regist_compli
            $or_date = trim($vehicle_regist_compli['or_date'] ?? '');
            $or_number = trim($vehicle_regist_compli['or_number'] ?? '');
            $cr_date = trim($vehicle_regist_compli['cr_date'] ?? '');
            $cr_number = trim($vehicle_regist_compli['cr_number'] ?? '');
            $ltfrb_case_no = trim($vehicle_regist_compli['ltfrb_case_no'] ?? '');
            $ltfrb_expiry = trim($vehicle_regist_compli['ltfrb_expiry'] ?? '');
            $mv_file_no = trim($vehicle_regist_compli['mv_file_no'] ?? '');
            $pa_expiry = trim($vehicle_regist_compli['pa_expiry'] ?? '');
            $late_renewal_date = trim($vehicle_regist_compli['late_renewal_date'] ?? '');
            $registration_type = trim($vehicle_regist_compli['registration_type'] ?? '');
            $registration_date = trim($vehicle_regist_compli['registration_date'] ?? '');
            $rfid_type = trim($vehicle_regist_compli['rfid_type'] ?? '');
            $rfid_account_no = trim($vehicle_regist_compli['rfid_account_no'] ?? '');

            // vehicle_insurance
            $insurance_provider = trim($vehicle_insurance['insurance_provider'] ?? '');
            $insurance_policy_no = trim($vehicle_insurance['insurance_policy_no'] ?? '');
            $insurance_expiry = trim($vehicle_insurance['insurance_expiry'] ?? '');
            $inland_marine_policy_no = trim($vehicle_insurance['inland_marine_policy_no'] ?? '');
            $inland_marine_expiry = trim($vehicle_insurance['inland_marine_expiry'] ?? '');
            
            // vehicle_acquisition
            $acquisition_date = trim($vehicle_acquisition['acquisition_date'] ?? '');
            $acquisition_price = trim($vehicle_acquisition['acquisition_price'] ?? '');
            $breakdown_date = trim($vehicle_acquisition['breakdown_date'] ?? '');
            $breakdown_remarks = trim($vehicle_acquisition['breakdown_remarks'] ?? '');
            $remarks = trim($vehicle_acquisition['remarks'] ?? '');

            // vehicle documents and photos
            $vh_documents = $input['vh_documents'] ?? [];
            $vh_photos = $input['vh_photos'] ?? [];


            try {
                $db->beginTransaction();

              $vSets = []; $vParams = [];
              foreach ([
                'plate_no'=>$plate_no,
                'body_no'=>$body_no,
                'status_id'=>$status_id,
                'vehicle_type_id'=>$vehicle_type_id,
                'vehicle_manufacturer_id'=>$vehicle_manufacturer_id,
                'vehicle_model_id'=>$vehicle_model_id,
                'year'=>$year_model,
                'commodity_type_id'=>$commodity_type_id,
                'asset_no'=>$asset_no,
                'category_type_id'=>$category_type_id,
                'vendor_id'=>$vendor_id
            ] as $k=>$v) {
                $vSets[] = "`{$k}` = ?";
                $vParams[] = $v;
            }
            $vParams[] = $id;
            $sql = "UPDATE `{$tblVehicles}` SET " . implode(', ', $vSets) . " WHERE vehicle_id = ?";
            $stmtV = $db->prepare($sql);
            $stmtV->execute($vParams);

            $stmtChkVl = $db->prepare("SELECT vehicle_id FROM `{$tblLocation}` WHERE vehicle_id = ? LIMIT 1");
            $stmtChkVl->execute([$id]);
            $exV1 = $stmtChkVl->fetch();
            $VlData = [
                'vehicle_id'=>$id,
                'origin_id'=>$origin_id,
                'depot_id'=>$depot_id,
                'GPS'=>$GPS
            ];

            if ($exV1) {
                $vlSets = []; $vlParams = [];
                foreach ($VlData as $k => $v) {
                    if ($k === 'vehicle_id') continue;
                    $vlSets[] = "`{$k}` = ?";
                    $vlParams[] = $v;
                }
                $vlParams[] = $id;
                $stmtEU = $db->prepare("UPDATE `{$tblLocation}` SET " . implode(', ', $vlSets) . " WHERE vehicle_id = ?");
                $stmtEU->execute($vlParams);
            } else {
                $ek = array_keys($VlData);
                $ev = array_values($VlData);
                $ph = array_fill(0, count($ek), '?');
                $stmtEI = $db->prepare("INSERT INTO `{$tblLocation}` (" . implode(',', $ek) . ") VALUES (" . implode(',', $ph) . ")");
                $stmtEI->execute($ev);
            }

            $stmtChkVs = $db->prepare("SELECT vehicle_id FROM `{$tblSpecifications}` WHERE vehicle_id = ? LIMIT 1");
            $stmtChkVs->execute([$id]);
            $exVs = $stmtChkVs->fetch();
            $VsData = [
                'vehicle_id'=>$id,
                'chassis_no'=>$chassis_no,
                'engine_no'=>$engine_no,
                'engine_size'=>$engine_size,
                'color'=>$color,
                'fuel_type'=>$fuel_type,
                'transmission_type'=>$transmission
            ];
            if ($exVs) {
                $vsSets = []; $vsParams = [];
                foreach ($VsData as $k=>$v) {
                    if ($k === 'vehicle_id') continue;
                    $vsSets[] = "`{$k}` = ?";
                    $vsParams[] = $v;
                }
                $vsParams[] = $id;
                $stmtBU = $db->prepare("UPDATE `{$tblSpecifications}` SET " . implode(', ', $vsSets) . " WHERE vehicle_id = ?");
                $stmtBU->execute($vsParams);
            } else {
                $stmtBI = $db->prepare("INSERT INTO `{$tblSpecifications}` (vehicle_id, chassis_no, engine_no, engine_size, color, fuel_type, transmission_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmtBI->execute(array_values($VsData));
            }

            $stmtChkVrc = $db->prepare("SELECT vehicle_id FROM `{$tblRegistrationCompliance}` WHERE vehicle_id = ? LIMIT 1");
            $stmtChkVrc->execute([$id]);
            $exVrc = $stmtChkVrc->fetch();
            $VrcData = [
                'vehicle_id'=>$id,
                'or_date'=>$or_date,
                'or_number'=>$or_number,
                'cr_date'=>$cr_date,
                'cr_number'=>$cr_number,
                'ltfrb_case_no'=>$ltfrb_case_no,
                'ltfrb_expiry'=>$ltfrb_expiry,
                'mv_file_no'=>$mv_file_no,
                'pa_expiry'=>$pa_expiry,
                'late_renewal_date'=>$late_renewal_date,
                'registration_type'=>$registration_type,
                'registration_date'=>$registration_date,
                'rfid_type'=>$rfid_type,
                'rfid_account_no'=>$rfid_account_no
            ];
            if ($exVrc) {
                $vrcSets = []; $vrcParams = [];
                foreach ($VrcData as $k=>$v) {
                    if ($k === 'vehicle_id') continue;
                    $vrcSets[] = "`{$k}` = ?";
                    $vrcParams[] = $v;
                }
                $vrcParams[] = $id;
                $stmtEMU = $db->prepare("UPDATE `{$tblRegistrationCompliance}` SET " . implode(', ', $vrcSets) . " WHERE vehicle_id = ?");
                $stmtEMU->execute($vrcParams);
            } else {
                $stmtEMI = $db->prepare("INSERT INTO `{$tblRegistrationCompliance}` (vehicle_id, or_date, or_number, cr_date, cr_number, ltfrb_case_no, ltfrb_expiry, mv_file_no, pa_expiry, late_renewal_date, registration_type, registration_date, rfid_type, rfid_account_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmtEMI->execute(array_values($VrcData));
            }

            $stmtChkVi = $db->prepare("SELECT vehicle_id FROM `{$tblInsurance}` WHERE vehicle_id = ? LIMIT 1");
            $stmtChkVi->execute([$id]);
            $exVi = $stmtChkVi->fetch();
            $ViData = [
                'vehicle_id'=>$id,
                'insurance_provider'=>$insurance_provider,
                'insurance_policy_no'=>$insurance_policy_no,
                'insurance_expiry'=>$insurance_expiry,
                'inland_marine_policy_no'=>$inland_marine_policy_no,
                'inland_marine_expiry'=>$inland_marine_expiry
            ];
            if ($exVi) {
                $viSets = []; $viParams = [];
                foreach ($ViData as $k=>$v) {
                    if ($k === 'vehicle_id') continue;
                    $viSets[] = "`{$k}` = ?";
                    $viParams[] = $v;
                }
                $viParams[] = $id;
                $stmtEMU = $db->prepare("UPDATE `{$tblInsurance}` SET " . implode(', ', $viSets) . " WHERE vehicle_id = ?");
                $stmtEMU->execute($viParams);
            } else {
                $stmtEMI = $db->prepare("INSERT INTO `{$tblInsurance}` (vehicle_id, insurance_provider, insurance_policy_no, insurance_expiry, inland_marine_policy_no, inland_marine_expiry) VALUES (?, ?, ?, ?, ?, ?)");
                $stmtEMI->execute(array_values($ViData));
            }

            $stmtChkVa = $db->prepare("SELECT vehicle_id FROM `{$tblAcquisition}` WHERE vehicle_id = ? LIMIT 1");
            $stmtChkVa->execute([$id]);
            $exVa = $stmtChkVa->fetch();
            $VaData = [
                'vehicle_id'=>$id,
                'acquisition_date'=>$acquisition_date,
                'acquisition_price'=>$acquisition_price,
                'breakdown_date'=>$breakdown_date,
                'breakdown_remarks'=>$breakdown_remarks,
                'remarks'=>$remarks
            ];
            if ($exVa) {
                $vaSets = []; $vaParams = [];
                foreach ($VaData as $k=>$v) {
                    if ($k === 'vehicle_id') continue;
                    $vaSets[] = "`{$k}` = ?";
                    $vaParams[] = $v;
                }
                $vaParams[] = $id;
                $stmtEMU = $db->prepare("UPDATE `{$tblAcquisition}` SET " . implode(', ', $vaSets) . " WHERE vehicle_id = ?");
                $stmtEMU->execute($vaParams);
            } else {
                $stmtEMI = $db->prepare("INSERT INTO `{$tblAcquisition}` (vehicle_id, acquisition_date, acquisition_price, breakdown_date, breakdown_remarks, remarks) VALUES (?, ?, ?, ?, ?, ?)");
                $stmtEMI->execute(array_values($VaData));
            }

            // Replace vehicle documents
            $stmtDocDel = $db->prepare("
                DELETE FROM `{$tblDocuments}`
                WHERE vehicle_id = ?
            ");
            $stmtDocDel->execute([$id]);

            if (is_array($vh_documents)) {

                $stmtDoc = $db->prepare("
                    INSERT INTO `{$tblDocuments}`
                    (vehicle_id, document_name, document_path)
                    VALUES (?, ?, ?)
                ");

                foreach ($vh_documents as $row) {

                    $documentName = trim($row['document_name'] ?? '');
                    $documentPath = trim($row['document_path'] ?? '');

                    // Ignore completely empty rows
                    if ($documentName === '' && $documentPath === '') {
                        continue;
                    }

                    $stmtDoc->execute([
                        $id,
                        $documentName !== '' ? $documentName : null,
                        $documentPath !== '' ? $documentPath : null
                    ]);
                }
            }

            // Replace vehicle photos
            $stmtPhotoDel = $db->prepare("
                DELETE FROM `{$tblPhotos}`
                WHERE vehicle_id = ?
            ");
            $stmtPhotoDel->execute([$id]);

            if (is_array($vh_photos)) {

                $stmtPhoto = $db->prepare("
                    INSERT INTO `{$tblPhotos}`
                    (vehicle_id, photo_name, photo_path)
                    VALUES (?, ?, ?)
                ");

                foreach ($vh_photos as $row) {

                    $photoName = trim($row['photo_name'] ?? '');
                    $photoPath = trim($row['photo_path'] ?? '');

                    // Ignore completely empty rows
                    if ($photoName === '' && $photoPath === '') {
                        continue;
                    }

                    $stmtPhoto->execute([
                        $id,
                        $photoName !== '' ? $photoName : null,
                        $photoPath !== '' ? $photoPath : null
                    ]);
                }
            }

            $db->commit();
            $stmtg = $db->prepare("SELECT * FROM `{$tblVehicles}` WHERE vehicle_id = ? LIMIT 1");
            $stmtg->execute([$id]);
            $saved = $stmtg->fetch();
            echoJson($saved, 200);
            }   catch (PDOException $e) {
                if ($db->inTransaction()) $db->rollBack();
                echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
            }
    }


// $subconOnly = isset($_GET['subcon']) && $_GET['subcon'] === '1';
// $statusFilter = $_GET['status'] ?? 'Active';

// function vehiclesBaseQuery($T) {
//     return "SELECT v.vehicle_id, v.plate_no, v.body_no,
//                m.vehicle_model, mf.vehicle_manufacturer,
//                vt.vehicle_type,
//                vd.vendor_id, vd.vendor_name,
//                ct.category_type,
//                v.status_id
//         FROM `{$T['T']}` v
//         LEFT JOIN `{$T['T_models']}` m ON v.vehicle_model_id = m.vehicle_model_id
//         LEFT JOIN `{$T['T_manufactures']}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
//         LEFT JOIN `{$T['T_types']}` vt ON v.vehicle_type_id = vt.vehicle_type_id
//         LEFT JOIN `{$T['T_vendor']}` vd ON v.vendor_id = vd.vendor_id
//         LEFT JOIN `{$T['T_categories']}` ct ON v.category_type_id = ct.category_type_id
//         LEFT JOIN `{$T['ts']}` vs ON v.status_id = vs.status_id";
// }

// function fetchRows($db, $T, $filters) {
//     $sql = vehiclesBaseQuery($T) . " WHERE 1=1";
//     $params = [];
//     if (!empty($filters['status_id'])) {
//         $sql .= " AND bs.status_id = ?";
//         $params[] = $filters['status_id'];
//     }
//     if (!empty($filters['status_name'])) {
//         $sql .= " AND bs.status_name = ?";
//         $params[] = $filters['status_name'];
//     }
//     $sql .= " ORDER BY b.created_at DESC";
//     if (isset($filters['limit']) && $filters['limit'] > 0) {
//         $sql .= " LIMIT ?";
//         $params[] = (int)$filters['limit'];
//         if (isset($filters['offset'])) {
//             $sql .= " OFFSET ?";
//             $params[] = (int)$filters['offset'];
//         }
//     }
//     $stmt = $db->prepare($sql);
//     foreach ($params as $i => $p) {
//         $type = is_int($p) ? PDO::PARAM_INT : PDO::PARAM_STR;
//         $stmt->bindValue($i + 1, $p, $type);
//     }
//     $stmt->execute();
//     return $stmt->fetchAll();
// }
// $sql = "SELECT v.vehicle_id, v.plate_no, v.body_no,
//                m.vehicle_model, mf.vehicle_manufacturer,
//                vt.vehicle_type,
//                vd.vendor_id, vd.vendor_name,
//                ct.category_type,
//                v.status_id, vs.status_name, vs.sort_order
//         FROM `{$T['T']}` v
//         LEFT JOIN `{$T['T_models']}` m ON v.vehicle_model_id = m.vehicle_model_id
//         LEFT JOIN `{$T['T_manufactures']}` mf ON v.vehicle_manufacturer_id = mf.vehicle_manufacturer_id
//         LEFT JOIN `{$T['T_types']}` vt ON v.vehicle_type_id = vt.vehicle_type_id
//         LEFT JOIN `{$T['T_vendor']}` vd ON v.vendor_id = vd.vendor_id
//         LEFT JOIN `{$T['T_categories']}` ct ON v.category_type_id = ct.category_type_id
//         LEFT JOIN `{$T['ts']}` vs ON v.status_id = vs.status_id
//         WHERE 1=1";
// // $params = [];
// // if ($statusFilter && $statusFilter !== 'all') {
// //     $sql .= " AND v.status = ?";
// //     $params[] = $statusFilter;
// // }
// // if ($subconOnly) {
// //     $sql .= " AND v.asset_no = 'Subcon'";
// // }
// // $sql .= " ORDER BY v.plate_no ASC";

// $stmt = $db->prepare($sql);
// $stmt->execute();
// echo json_encode($stmt->fetchAll());
