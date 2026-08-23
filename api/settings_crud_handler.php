<?php
function describeSettingsTable($db, $tbl) {
    $sql = "DESCRIBE `{$tbl}`";
    $stmt = $db->query($sql);
    $cols = $stmt->fetchAll();
    if (!$cols) return false;

    $idField = null;
    $nameField = null;
    $statusField = null;
    $allowedFields = [];

    $nameHints = ['name','type','origin','destination','depot','origins','category','commodity','item','booking'];
    $skipPatterns = ['_at','_by','_date','_no','_number','_path','_text','_code','remarks','notes','info','address','email','phone','contact','tin','account','rate'];

    foreach ($cols as $c) {
        $field = $c['Field'];
        $type = strtolower($c['Type']);
        $allowedFields[] = $field;
        if ($c['Key'] === 'PRI' || (strpos($field, '_id') !== false && $idField === null)) {
            if ($idField === null) $idField = $field;
        }
        if ($field === 'status' && $statusField === null) {
            $statusField = $field;
        }
        if ($nameField === null
            && $field !== 'status'
            && strpos($field, '_id') === false
            && (strpos($type, 'varchar') !== false || strpos($type, 'char') !== false || $type === 'text')) {
            $fl = strtolower($field);
            $skip = false;
            foreach ($skipPatterns as $sp) {
                if (strpos($fl, $sp) !== false) { $skip = true; break; }
            }
            if (!$skip) {
                foreach ($nameHints as $nh) {
                    if (strpos($fl, $nh) !== false) {
                        $nameField = $field;
                        break;
                    }
                }
                if ($nameField === null) $nameField = $field;
            }
        }
    }

    if ($nameField === null) {
        foreach ($cols as $c) {
            $field = $c['Field'];
            if (strpos($field, '_id') === false && $field !== 'status') {
                $nameField = $field;
                break;
            }
        }
    }
    if ($statusField === null) $statusField = 'status';

    return [
        'idField'     => $idField,
        'nameField'   => $nameField,
        'statusField' => $statusField,
        'allowedFields' => $allowedFields,
    ];
}

function handleSettingsCrud($baseName) {
    require_once __DIR__ . '/headers.php';
    require_once __DIR__ . '/auth.php';
    requireAuth();

    $db = getDB();
    $tbl = tableName($baseName);

    $desc = describeSettingsTable($db, $tbl);
    if (!$desc) {
        http_response_code(500);
        echo json_encode(['error' => "Failed to introspect table `{$tbl}`"]);
        exit;
    }
    extract($desc); // idField, nameField, statusField, allowedFields

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    if (isset($_GET['schema']) || isset($_GET['describe'])) {
        cs_echoJson([
            'success' => true,
            'table' => $tbl,
            'idField' => $idField,
            'nameField' => $nameField,
            'statusField' => $statusField,
            'allowedFields' => $allowedFields,
        ]);
    }

    function cs_echoJson($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    function cs_resolveFieldValue($input, $realField, $allowFallbackText = true) {
        if ($realField && isset($input[$realField]) && (is_int($input[$realField]) || is_float($input[$realField]) || trim((string)$input[$realField]) !== '')) {
            return $input[$realField];
        }
        // Accept the canonical API field first, then generic aliases.
        $candidates = ['booking_type','book_type','name','type','label','title','description'];
        foreach ($candidates as $c) {
            if (isset($input[$c]) && is_scalar($input[$c]) && trim((string)$input[$c]) !== '') {
                return $input[$c];
            }
        }
        if ($allowFallbackText) {
            $skip = ['status','sort_order','active','inactive','id'];
            foreach ($input as $k => $v) {
                if (in_array(strtolower((string)$k), $skip, true)) continue;
                if (strpos($k, '_id') !== false || strpos($k, '_at') !== false || strpos($k, '_date') !== false) continue;
                if (is_scalar($v) && trim((string)$v) !== '') return $v;
            }
        }
        return null;
    }

    function cs_resolveStatusValue($input, $realField) {
        if ($realField && isset($input[$realField]) && is_scalar($input[$realField]) && trim((string)$input[$realField]) !== '') {
            return $input[$realField];
        }
        if (isset($input['status']) && is_scalar($input['status']) && trim((string)$input['status']) !== '') {
            return $input['status'];
        }
        return 'Active';
    }

    function cs_aliasMapForBase($baseName) {
        static $map = [
            'booking_types'   => ['id' => 'booking_type_id',   'name' => 'book_type', 'api_name' => 'booking_type'],
            'item_types'      => ['id' => 'item_type_id',      'name' => 'item_type'],
            'commodity_type'  => ['id' => 'commodity_type_id', 'name' => 'commodity_type'],
            'category_types'  => ['id' => 'category_type_id',  'name' => 'category_type'],
            'depots'          => ['id' => 'depot_id',          'name' => 'depot_name'],
            'destination'     => ['id' => 'destination_id',    'name' => 'destination'],
            'origin'          => ['id' => 'origin_id',         'name' => 'origin_name'],
            'booking_statuses'=> ['id' => 'status_id',         'name' => 'status_name'],
        ];
        return $map[$baseName] ?? null;
    }

    function cs_enrichRow($row, $idField, $nameField, $statusField, $baseName) {
        if (!is_array($row)) return $row;
        $row['id']     = $idField     && isset($row[$idField])     ? $row[$idField]     : ($row['id'] ?? null);
        $row['name']   = $nameField   && isset($row[$nameField])   ? $row[$nameField]   : ($row['name'] ?? '');
        $row['status'] = $statusField && isset($row[$statusField]) ? $row[$statusField] : ($row['status'] ?? 'Active');
        $alias = cs_aliasMapForBase($baseName);
        if ($alias) {
            // Always expose the frontend's canonical ID/name fields.
            if (!isset($row[$alias['id']])) {
                $row[$alias['id']] = $row['id'];
            }

            // The database may use a different physical column name.
            // For booking_types, DB = book_type, API = booking_type.
            $apiName = $alias['api_name'] ?? $alias['name'];
            if (!isset($row[$apiName])) {
                $row[$apiName] = $row['name'];
            }

            // Keep the real DB column available for backwards compatibility.
            if (!isset($row[$alias['name']])) {
                $row[$alias['name']] = $row['name'];
            }
        }
        return $row;
    }

    switch ($method) {
        case 'GET':
            $search = trim($_GET['search'] ?? '');
            $status = $_GET['status'] ?? 'all';

            $selectable = [$idField, $nameField, $statusField];
            $selectable = array_intersect($selectable, $allowedFields);
            $selectList = '`' . implode('`, `', $selectable) . '`';

            $sql = "SELECT {$selectList} FROM `{$tbl}` WHERE 1=1";
            $params = [];
            if ($search !== '' && $nameField) {
                $sql .= " AND `{$nameField}` LIKE ?";
                $params[] = "%{$search}%";
            }
            if ($status !== 'all' && $statusField) {
                $sql .= " AND `{$statusField}` = ?";
                $params[] = $status;
            }
            if ($nameField) {
                $sql .= " ORDER BY `{$nameField}` ASC";
            }

            try {
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    $r = cs_enrichRow($r, $idField, $nameField, $statusField, $baseName);
                }
                unset($r);
                cs_echoJson($rows);
            } catch (PDOException $e) {
                cs_echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
            }
            break;

        case 'POST':
            $nameVal = $nameField ? cs_resolveFieldValue($input, $nameField) : null;
            $statusVal = $statusField ? cs_resolveStatusValue($input, $statusField) : null;
            if ($nameField && ($nameVal === null || trim((string)$nameVal) === '')) cs_echoJson(['error' => 'Name is required'], 400);

            $fields = [];
            $placeholders = [];
            $vals = [];
            if ($nameField && $nameVal !== null) { $fields[] = "`{$nameField}`"; $placeholders[] = '?'; $vals[] = (string)$nameVal; }
            if ($statusField) { $fields[] = "`{$statusField}`"; $placeholders[] = '?'; $vals[] = (string)$statusVal; }

            if (empty($fields)) cs_echoJson(['error' => 'No writable fields available'], 500);

            try {
                $db->beginTransaction();
                $sql = "INSERT INTO `{$tbl}` (" . implode(',', $fields) . ") VALUES (" . implode(',', $placeholders) . ")";
                $stmt = $db->prepare($sql);
                $stmt->execute($vals);
                if ($stmt->rowCount() === 0) { $db->rollBack(); cs_echoJson(['error' => 'Insert failed: no rows written'], 500); }
                $id = (int)$db->lastInsertId();
                if ($idField && $id <= 0 && !empty($vals)) { $db->rollBack(); cs_echoJson(['error' => 'Insert failed: no ID generated'], 500); }
                $db->commit();

                if ($idField && $id > 0) {
                    $selectable = [$idField, $nameField, $statusField];
                    $selectable = array_values(array_filter(array_intersect($selectable, $allowedFields)));
                    $selectList = empty($selectable) ? '*' : ('`' . implode('`, `', $selectable) . '`');
                    $stmt = $db->prepare("SELECT {$selectList} FROM `{$tbl}` WHERE `{$idField}` = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                } else {
                    $row = array_filter([$nameField => $nameVal, $statusField => $statusVal]);
                }
                cs_echoJson(['success' => true, 'data' => cs_enrichRow($row, $idField, $nameField, $statusField, $baseName)]);
            } catch (PDOException $e) {
                if ($db->inTransaction()) $db->rollBack();
                cs_echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
            }
            break;

        case 'PUT':
            $id = (int)($_GET['id'] ?? 0);
            if (!$idField || !$id) cs_echoJson(['error' => 'ID is required'], 400);

            $nameVal = $nameField ? cs_resolveFieldValue($input, $nameField) : null;
            $statusVal = $statusField ? cs_resolveStatusValue($input, $statusField) : null;
            if ($nameField && ($nameVal === null || trim((string)$nameVal) === '')) cs_echoJson(['error' => 'Name is required'], 400);

            $sets = [];
            $vals = [];
            if ($nameField && $nameVal !== null) { $sets[] = "`{$nameField}` = ?"; $vals[] = (string)$nameVal; }
            if ($statusField) { $sets[] = "`{$statusField}` = ?"; $vals[] = (string)$statusVal; }
            if (empty($sets)) cs_echoJson(['error' => 'No writable fields available'], 500);
            $vals[] = $id;

            try {
                $db->beginTransaction();
                $sql = "UPDATE `{$tbl}` SET " . implode(', ', $sets) . " WHERE `{$idField}` = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($vals);
                $db->commit();

                $selectable = [$idField, $nameField, $statusField];
                $selectable = array_values(array_filter(array_intersect($selectable, $allowedFields)));
                $selectList = empty($selectable) ? '*' : ('`' . implode('`, `', $selectable) . '`');
                $stmt = $db->prepare("SELECT {$selectList} FROM `{$tbl}` WHERE `{$idField}` = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) cs_echoJson(['error' => 'Record not found after update'], 404);
                cs_echoJson(['success' => true, 'data' => cs_enrichRow($row, $idField, $nameField, $statusField, $baseName)]);
            } catch (PDOException $e) {
                if ($db->inTransaction()) $db->rollBack();
                cs_echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
            }
            break;

        case 'DELETE':
            $id = (int)($_GET['id'] ?? 0);
            if (!$idField || !$id) cs_echoJson(['error' => 'ID is required'], 400);

            try {
                $db->beginTransaction();
                $stmt = $db->prepare("DELETE FROM `{$tbl}` WHERE `{$idField}` = ?");
                $stmt->execute([$id]);
                if ($stmt->rowCount() === 0) { $db->rollBack(); cs_echoJson(['error' => 'Delete failed: row not found'], 404); }
                $db->commit();
                cs_echoJson(['success' => true]);
            } catch (PDOException $e) {
                if ($db->inTransaction()) $db->rollBack();
                cs_echoJson(['error' => 'DB error: ' . $e->getMessage()], 500);
            }
            break;

        default:
            cs_echoJson(['error' => 'Method not allowed'], 405);
    }
}