<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$user = requireAuth();
$db = getDB();

$T = [
    'b'  => tableName('bookings'),
    'bp' => tableName('booking_personnel'),
    'c'  => tableName('customers'),
    'bt' => tableName('booking_types'),
    'bs' => tableName('booking_statuses'),
    'v'  => tableName('vehicle'),
    'd'  => tableName('depots'),
    'o'  => tableName('origin'),
    'dst'=> tableName('destination'),
    'p'  => tableName('personnel'),
    'ct' => tableName('commodity_type'),
    'bi' => tableName('booking_items'),
    'ph' => tableName('booking_photos'),
];

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

function bookingsBaseQuery($T) {
    return "SELECT b.booking_id, b.booking_no, b.created_at, b.updated_at,
                   b.delivery_date, b.route_code, b.no_of_trips, b.no_of_drops,
                   b.category_type, b.area, b.trip_allowance,
                   b.fuel_liters, b.fuel_po, b.fuel_amount,
                   b.remarks, b.client_ref_no, b.other_ref_no, b.remarks_2,
                   c.customer_id, c.customer_name, c.contact_number,
                   bt.booking_type_id, bt.booking_type,
                   bs.status_id, bs.status_name, bs.sort_order,
                   v.vehicle_id, v.plate_no,
                   d.depot_id, d.depot_name,
                   o.origin_id, o.origins AS origin_name,
                   dst.destination_id, dst.destination,
                   ct.commodity_type_id, ct.commodity_type
            FROM `{$T['b']}` b
            LEFT JOIN `{$T['c']}` c   ON b.customer_id = c.customer_id
            LEFT JOIN `{$T['bt']}` bt ON b.booking_type_id = bt.booking_type_id
            LEFT JOIN `{$T['bs']}` bs ON b.status_id = bs.status_id
            LEFT JOIN `{$T['v']}` v   ON b.vehicle_id = v.vehicle_id
            LEFT JOIN `{$T['d']}` d   ON b.depot_id = d.depot_id
            LEFT JOIN `{$T['o']}` o   ON b.origin_id = o.origin_id
            LEFT JOIN `{$T['dst']}` dst ON b.destination_id = dst.destination_id
            LEFT JOIN `{$T['ct']}` ct ON b.commodity_type_id = ct.commodity_type_id";
}

function fetchRows($db, $T, $filters) {
    $sql = bookingsBaseQuery($T) . " WHERE 1=1";
    $params = [];
    if (!empty($filters['status_id'])) {
        $sql .= " AND bs.status_id = ?";
        $params[] = $filters['status_id'];
    }
    if (!empty($filters['status_name'])) {
        $sql .= " AND bs.status_name = ?";
        $params[] = $filters['status_name'];
    }
    $sql .= " ORDER BY b.created_at DESC";
    if (isset($filters['limit']) && $filters['limit'] > 0) {
        $sql .= " LIMIT ?";
        $params[] = (int)$filters['limit'];
        if (isset($filters['offset'])) {
            $sql .= " OFFSET ?";
            $params[] = (int)$filters['offset'];
        }
    }
    $stmt = $db->prepare($sql);
    foreach ($params as $i => $p) {
        $type = is_int($p) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue($i + 1, $p, $type);
    }
    $stmt->execute();
    return $stmt->fetchAll();
}

function fetchPersonnelForBooking($db, $T, $bookingId) {
    $sql = "SELECT bp.booking_personnel_id, bp.booking_id, bp.personnel_id,
                   bp.assignment_role, bp.employment_type AS source,
                   CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) AS full_name,
                   p.contact_number, p.e_mail_id
            FROM `{$T['bp']}` bp
            LEFT JOIN `{$T['p']}` p ON bp.personnel_id = p.personnel_id
            WHERE bp.booking_id = ?
            ORDER BY FIELD(bp.assignment_role, 'driver','helper1','helper2')";
    $stmt = $db->prepare($sql);
    $stmt->execute([$bookingId]);
    return $stmt->fetchAll();
}

function fetchItems($db, $T, $bookingId) {
    $tbl = $T['bi'];
    try {
        $stmt = $db->prepare("SELECT booking_item_id, item_type_id, item_description,
                                      length_cm, width_cm, height_cm, weight_kg
                               FROM `{$tbl}` WHERE booking_id = ? ORDER BY booking_item_id ASC");
        $stmt->execute([$bookingId]);
        return $stmt->fetchAll();
    } catch (Exception $e) { return []; }
}

function fetchPhotos($db, $T, $bookingId) {
    $tbl = $T['ph'];
    try {
        $stmt = $db->prepare("SELECT booking_photo_id, photo_name, photo_path, photo_data
                               FROM `{$tbl}` WHERE booking_id = ? ORDER BY booking_photo_id ASC LIMIT 3");
        $stmt->execute([$bookingId]);
        return $stmt->fetchAll();
    } catch (Exception $e) { return []; }
}

function setBookingPersonnel($db, $T, $bookingId, $assignments) {
    $stmt = $db->prepare("DELETE FROM `{$T['bp']}` WHERE booking_id = ?");
    $stmt->execute([$bookingId]);
    if (empty($assignments)) return;
    $ins = $db->prepare("INSERT INTO `{$T['bp']}` (booking_id, personnel_id, assignment_role, employment_type)
                         VALUES (?, ?, ?, ?)");
    foreach ($assignments as $a) {
        $pid = intval($a['personnel_id'] ?? 0);
        $role = $a['assignment_role'] ?? 'driver';
        $src  = $a['source'] ?? 'direct';
        if ($pid > 0) {
            $ins->execute([$bookingId, $pid, $role, $src]);
        }
    }
}

function setBookingItems($db, $T, $bookingId, $items) {
    $tbl = $T['bi'];
    try {
        $db->prepare("DELETE FROM `{$tbl}` WHERE booking_id = ?")->execute([$bookingId]);
    } catch (Exception $e) { return; }
    if (empty($items)) return;
    try {
        $ins = $db->prepare("INSERT INTO `{$tbl}`
            (booking_id, item_type_id, item_description, length_cm, width_cm, height_cm, weight_kg)
            VALUES (?,?,?,?,?,?,?)");
        foreach ($items as $i) {
            $ins->execute([
                $bookingId,
                !empty($i['item_type_id']) ? intval($i['item_type_id']) : null,
                $i['item_description'] ?? null,
                isset($i['length_cm']) ? $i['length_cm'] + 0 : null,
                isset($i['width_cm'])  ? $i['width_cm']  + 0 : null,
                isset($i['height_cm']) ? $i['height_cm'] + 0 : null,
                isset($i['weight_kg']) ? $i['weight_kg'] + 0 : null,
            ]);
        }
    } catch (Exception $e) { /* ignore - table may not exist yet */ }
}

function setBookingPhotos($db, $T, $bookingId, $photos) {
    $tbl = $T['ph'];
    try {
        $db->prepare("DELETE FROM `{$tbl}` WHERE booking_id = ?")->execute([$bookingId]);
    } catch (Exception $e) { return; }
    if (empty($photos)) return;
    try {
        $ins = $db->prepare("INSERT INTO `{$tbl}` (booking_id, photo_name, photo_path, photo_data)
                             VALUES (?, ?, ?, ?)");
        foreach ($photos as $ph) {
            $name = $ph['name'] ?? 'photo.png';
            $path = $ph['path'] ?? null;
            $data = $ph['data'] ?? null;
            $ins->execute([$bookingId, $name, $path, is_string($data) ? $data : null]);
        }
    } catch (Exception $e) { /* ignore - table may not exist yet */ }
}

function generateBookingNo($db, $T) {
    $prefix = 'BK-' . date('Ymd') . '-';
    $stmt = $db->prepare("SELECT booking_no FROM `{$T['b']}` WHERE booking_no LIKE ? ORDER BY booking_id DESC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $row = $stmt->fetch();
    $num = 1;
    if ($row) {
        $parts = explode('-', $row['booking_no']);
        $num = intval(end($parts)) + 1;
    }
    return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
}

function bookingHasColumn($db, $table, $col) {
    try {
        $stmt = $db->query("SHOW COLUMNS FROM `{$table}` LIKE '{$col}'");
        return $stmt->fetch() ? true : false;
    } catch (Exception $e) { return false; }
}

switch ($method) {
    case 'GET':
        if ($id) {
            $list = fetchRows($db, $T, []);
            $found = null;
            foreach ($list as $r) {
                if ($r['booking_id'] == $id) { $found = $r; break; }
            }
            if (!$found) {
                http_response_code(404);
                echo json_encode(['error' => 'Booking not found']);
                exit;
            }
            $found['personnel'] = fetchPersonnelForBooking($db, $T, $id);
            $found['items'] = fetchItems($db, $T, $id);
            $found['photos'] = fetchPhotos($db, $T, $id);
            echo json_encode($found);
        } else {
            $filters = [
                'status_id'   => $_GET['status_id'] ?? null,
                'status_name' => $_GET['status_name'] ?? null,
                'limit'       => isset($_GET['limit']) ? (int)$_GET['limit'] : 1000,
                'offset'      => isset($_GET['offset']) ? (int)$_GET['offset'] : 0,
            ];
            $rows = fetchRows($db, $T, $filters);
            $ids = array_column($rows, 'booking_id');
            $personnelMap = [];
            if (!empty($ids)) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $sql = "SELECT bp.booking_id, bp.personnel_id, bp.assignment_role, bp.employment_type AS source,
                               CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) AS full_name
                        FROM `{$T['bp']}` bp
                        LEFT JOIN `{$T['p']}` p ON bp.personnel_id = p.personnel_id
                        WHERE bp.booking_id IN ({$placeholders})";
                $stmt = $db->prepare($sql);
                $stmt->execute($ids);
                foreach ($stmt->fetchAll() as $pr) {
                    $personnelMap[$pr['booking_id']][] = $pr;
                }
            }
            foreach ($rows as &$r) {
                $r['personnel'] = $personnelMap[$r['booking_id']] ?? [];
            }
            $countStmt = $db->query("SELECT COUNT(*) AS total FROM `{$T['b']}`");
            $total = $countStmt->fetch()['total'];
            echo json_encode(['data' => $rows, 'total' => (int)$total]);
        }
        break;

    case 'POST':
        if ($action === 'cancel' && $id) {
            $stmt = $db->prepare("SELECT status_id FROM `{$T['b']}` WHERE booking_id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Booking not found']); exit;
            }
            $cancelStatus = $db->prepare("SELECT status_id FROM `{$T['bs']}` WHERE status_name IN ('Cancelled','Declined') LIMIT 1");
            $cancelStatus->execute();
            $cs = $cancelStatus->fetch();
            $sid = $cs ? $cs['status_id'] : 8;
            $upd = $db->prepare("UPDATE `{$T['b']}` SET status_id = ?, updated_by = ?, updated_at = NOW() WHERE booking_id = ?");
            $upd->execute([$sid, $user['user_id'], $id]);
            echo json_encode(['success' => true, 'booking_id' => (int)$id]);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $db->beginTransaction();
        try {
            $bookingNo = !empty($input['booking_no']) ? $input['booking_no'] : generateBookingNo($db, $T);

            $bCols = bookingHasColumn($db, $T['b'], 'delivery_date');

            $cols = ["booking_no","customer_id","booking_type_id","depot_id","commodity_type_id",
                     "origin_id","destination_id","vehicle_id","status_id",
                     "created_by","updated_by","created_at","updated_at"];
            $placeholders = ["?","?","?","?","?","?","?","?","?","?","?","NOW()","NOW()"];
            $vals = [
                $bookingNo,
                empty($input['customer_id']) ? null : (int)$input['customer_id'],
                empty($input['booking_type_id']) ? null : (int)$input['booking_type_id'],
                empty($input['depot_id']) ? null : (int)$input['depot_id'],
                empty($input['commodity_type_id']) ? null : (int)$input['commodity_type_id'],
                empty($input['origin_id']) ? null : (int)$input['origin_id'],
                empty($input['destination_id']) ? null : (int)$input['destination_id'],
                empty($input['vehicle_id']) ? null : (int)$input['vehicle_id'],
                empty($input['status_id']) ? 1 : (int)$input['status_id'],
                (int)$user['user_id'],
                (int)$user['user_id'],
            ];

            $extras = ['delivery_date','route_code','no_of_trips','no_of_drops','category_type',
                       'area','trip_allowance','fuel_liters','fuel_po','fuel_amount',
                       'remarks','client_ref_no','other_ref_no','remarks_2'];
            foreach ($extras as $k) {
                if (bookingHasColumn($db, $T['b'], $k) && array_key_exists($k, $input)) {
                    $cols[] = $k;
                    $placeholders[] = '?';
                    $v = $input[$k];
                    if (in_array($k, ['no_of_trips','no_of_drops']) && $v !== null && $v !== '') {
                        $v = (int)$v;
                    } elseif (in_array($k, ['trip_allowance','fuel_liters','fuel_amount']) && $v !== null && $v !== '') {
                        $v = (float)$v;
                    }
                    $vals[] = ($v === '' || $v === null) ? null : $v;
                }
            }

            $sql = "INSERT INTO `{$T['b']}` (" . implode(',', $cols) . ")
                    VALUES (" . implode(',', $placeholders) . ")";
            $ins = $db->prepare($sql);
            $ins->execute($vals);
            $newId = (int)$db->lastInsertId();
            setBookingPersonnel($db, $T, $newId, $input['personnel'] ?? []);
            setBookingItems($db, $T, $newId, $input['items'] ?? []);
            setBookingPhotos($db, $T, $newId, $input['photos'] ?? []);
            $db->commit();
            echo json_encode(['success' => true, 'booking_id' => $newId, 'booking_no' => $bookingNo]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create booking: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Booking id required']); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $db->beginTransaction();
        try {
            $sets = [
                "customer_id = ?",
                "booking_type_id = ?",
                "depot_id = ?",
                "commodity_type_id = ?",
                "origin_id = ?",
                "destination_id = ?",
                "vehicle_id = ?",
                "status_id = ?",
                "updated_by = ?",
                "updated_at = NOW()",
            ];
            $vals = [
                empty($input['customer_id']) ? null : (int)$input['customer_id'],
                empty($input['booking_type_id']) ? null : (int)$input['booking_type_id'],
                empty($input['depot_id']) ? null : (int)$input['depot_id'],
                empty($input['commodity_type_id']) ? null : (int)$input['commodity_type_id'],
                empty($input['origin_id']) ? null : (int)$input['origin_id'],
                empty($input['destination_id']) ? null : (int)$input['destination_id'],
                empty($input['vehicle_id']) ? null : (int)$input['vehicle_id'],
                empty($input['status_id']) ? 1 : (int)$input['status_id'],
                (int)$user['user_id'],
            ];

            $extras = ['delivery_date','route_code','no_of_trips','no_of_drops','category_type',
                       'area','trip_allowance','fuel_liters','fuel_po','fuel_amount',
                       'remarks','client_ref_no','other_ref_no','remarks_2'];
            foreach ($extras as $k) {
                if (bookingHasColumn($db, $T['b'], $k) && array_key_exists($k, $input)) {
                    $sets[] = "{$k} = ?";
                    $v = $input[$k];
                    if (in_array($k, ['no_of_trips','no_of_drops']) && $v !== null && $v !== '') {
                        $v = (int)$v;
                    } elseif (in_array($k, ['trip_allowance','fuel_liters','fuel_amount']) && $v !== null && $v !== '') {
                        $v = (float)$v;
                    }
                    $vals[] = ($v === '' || $v === null) ? null : $v;
                }
            }
            $vals[] = (int)$id;

            $sql = "UPDATE `{$T['b']}` SET " . implode(', ', $sets) . " WHERE booking_id = ?";
            $upd = $db->prepare($sql);
            $upd->execute($vals);
            setBookingPersonnel($db, $T, $id, $input['personnel'] ?? []);
            setBookingItems($db, $T, $id, $input['items'] ?? []);
            setBookingPhotos($db, $T, $id, $input['photos'] ?? []);
            $db->commit();
            echo json_encode(['success' => true, 'booking_id' => (int)$id]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update booking: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400); echo json_encode(['error'=>'id required']); exit;
        }
        $db->beginTransaction();
        try {
            try { $db->prepare("DELETE FROM `{$T['ph']}` WHERE booking_id = ?")->execute([$id]); } catch (Exception $e) {}
            try { $db->prepare("DELETE FROM `{$T['bi']}` WHERE booking_id = ?")->execute([$id]); } catch (Exception $e) {}
            try { $db->prepare("DELETE FROM `{$T['bp']}` WHERE booking_id = ?")->execute([$id]); } catch (Exception $e) {}
            $db->prepare("DELETE FROM `{$T['b']}` WHERE booking_id = ?")->execute([$id]);
            $db->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
