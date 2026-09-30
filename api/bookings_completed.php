<?php

require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/auth.php';

$currentUser = requireAuth();
$db = getDB();

// -----------------------------------------------------------------------------
// Tables
// -----------------------------------------------------------------------------
$tblBookings        = tableName('bookings');
$tblBStatuses       = tableName('booking_statuses');
$tblBPersonnel      = tableName('booking_personnel');
$tblPersonnel       = tableName('personnel');
$tblBVehicles       = tableName('bk_vehicles');
$tblVehicles        = tableName('vehicles');
$tblBTypes          = tableName('booking_types');
$tblCustomers       = tableName('customers');
$tblDepots          = tableName('depots');
$tblCommodityTypes  = tableName('commodity_type');
$tblOrigins         = tableName('origin');
$tblDestination     = tableName('destination');

// Completed-booking tables.
// IMPORTANT: these names match the current database dump.
$tblBClientCost     = tableName('bk_client_cost');
$tblBExpenses       = tableName('bk_expenses');


$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = (int)($_GET['id'] ?? 0);
$action = trim((string)($_GET['action'] ?? ''));

$input = [];
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $raw = file_get_contents('php://input');
    $input = $raw ? (json_decode($raw, true) ?: []) : [];
}

function echoJson($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function nullableInt($value): ?int
{
    if ($value === null || $value === '' || (int)$value <= 0) {
        return null;
    }
    return (int)$value;
}

function nullableFloat($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }
    return (float)$value;
}

function moneyValue($value): float
{
    if ($value === null || $value === '') {
        return 0.0;
    }
    return (float)$value;
}

function normalizeMysqlDateTime(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    // HTML datetime-local sends YYYY-MM-DDTHH:MM.
    $value = str_replace('T', ' ', $value);

    if (strlen($value) === 16) {
        $value .= ':00';
    }

    return $value;
}

function tableHasColumn(PDO $db, string $table, string $column): bool
{
    // Table name comes from the application's tableName() helper, not user input.
    $stmt = $db->query("SHOW COLUMNS FROM `{$table}` LIKE " . $db->quote($column));
    return (bool)$stmt->fetch();
}

// -----------------------------------------------------------------------------
// GET - Load data used by BookingCompleteModal
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    if ($id <= 0) {
        echoJson(['error' => 'Booking ID is required.'], 400);
    }

    try {
        $sql = "SELECT
                    b.booking_id,
                    b.booking_no,
                    b.delivery_date,
                    b.completed_at,
                    b.trips_number,
                    b.origin_id,
                    b.destination_id,
                    b.status_id,
                    bs.status_name,

                    c.customer_name,
                    bt.book_type,
                    d.depot_name,
                    ct.commodity_type,
                    o.origin_name,
                    dest.destination_name,

                    bv.vehicle_id,
                    COALESCE(NULLIF(bv.plate_no, ''), v.plate_no) AS plate_no,
                    vt.vehicle_type,

                    cc.client_rate,
                    cc.total_amount,
                    cc.subcon_rate,

                    ex.b_toll_fees,
                    ex.b_extra_drop,
                    ex.b_extra_helper,
                    ex.b_other_fees,
                    ex.nb_parking_fees,
                    ex.nb_toll_fees,
                    ex.nb_demurrage_fees,
                    ex.nb_backload_fees,
                    ex.nb_other_deductions

                
                FROM `{$tblBookings}` b
                LEFT JOIN `{$tblBStatuses}` bs
                    ON b.status_id = bs.status_id
                LEFT JOIN `{$tblCustomers}` c
                    ON b.customer_id = c.customer_id
                LEFT JOIN `{$tblBTypes}` bt
                    ON b.booking_type_id = bt.booking_type_id
                LEFT JOIN `{$tblDepots}` d
                    ON b.depot_id = d.depot_id
                LEFT JOIN `{$tblCommodityTypes}` ct
                    ON b.commodity_type_id = ct.commodity_type_id
                LEFT JOIN `{$tblOrigins}` o
                    ON b.origin_id = o.origin_id
                LEFT JOIN `{$tblDestination}` dest
                    ON b.destination_id = dest.destination_id
                LEFT JOIN `{$tblBVehicles}` bv
                    ON b.booking_id = bv.booking_id
                LEFT JOIN `{$tblVehicles}` v
                    ON bv.vehicle_id = v.vehicle_id
                LEFT JOIN `vh_types` vt
                    ON v.vehicle_type_id = vt.vehicle_type_id
                LEFT JOIN `{$tblBClientCost}` cc
                    ON b.booking_id = cc.booking_id
                LEFT JOIN `{$tblBExpenses}` ex
                    ON b.booking_id = ex.booking_id
                WHERE b.booking_id = ?
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            echoJson(['error' => 'Booking not found.'], 404);
        }

        // Aliases used by BookingCompleteModal.
        $row['farthest_destination_id'] = $row['destination_id'] ?? null;
        $row['no_of_trips'] = $row['trips_number'] ?? null;

        $row['toll_fees'] = $row['b_toll_fees'] ?? 0;
        $row['extra_drop'] = $row['b_extra_drop'] ?? 0;
        $row['extra_helper'] = $row['b_extra_helper'] ?? 0;
        $row['other_expenses'] = $row['b_other_fees'] ?? 0;

        $row['parking_fees'] = $row['nb_parking_fees'] ?? 0;
        $row['toll_fees_non_billable'] = $row['nb_toll_fees'] ?? 0;
        $row['demurrage_fees'] = $row['nb_demurrage_fees'] ?? 0;
        $row['backload_fees'] = $row['nb_backload_fees'] ?? 0;
        $row['other_deductions'] = $row['nb_other_deduction'] ?? 0;

        $stmtPersonnel = $db->prepare(
            "SELECT
                booking_personnel_id,
                personnel_id,
                assignment_role,
                rate,
                allowance
            FROM `{$tblBPersonnel}`
            WHERE booking_id = ?
            ORDER BY booking_personnel_id ASC"
        );

        $stmtPersonnel->execute([$id]);

        $row['personnel_assignments'] = $stmtPersonnel->fetchAll() ?: [];

        echoJson($row);
    } catch (PDOException $e) {
        echoJson(['error' => 'Failed to load completed-booking data: ' . $e->getMessage()], 500);
    }
}

// -----------------------------------------------------------------------------
// POST - Complete booking
// Expected URL: booking_completed.php?action=complete&id=33
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    if ($id <= 0) {
        echoJson(['error' => 'Booking ID is required.'], 400);
    }

    if ($action !== 'complete') {
        echoJson(['error' => 'Unsupported action. Expected action=complete.'], 400);
    }

    try {
        // Confirm booking exists before starting the transaction.
        $stmtBookingExists = $db->prepare(
            "SELECT booking_id, status_id
             FROM `{$tblBookings}`
             WHERE booking_id = ?
             LIMIT 1"
        );
        $stmtBookingExists->execute([$id]);
        $bookingRow = $stmtBookingExists->fetch();

        if (!$bookingRow) {
            echoJson(['error' => 'Booking not found.'], 404);
        }

        // completed_at is part of the Completed modal and therefore must exist.
        // We intentionally do not alter the schema from the API at runtime.
        if (!tableHasColumn($db, $tblBookings, 'completed_at')) {
            echoJson([
                'error' => "The bookings.completed_at column does not exist. Run: ALTER TABLE bookings ADD COLUMN completed_at DATETIME NULL AFTER received_datetime;"
            ], 500);
        }

        if (
            !tableHasColumn($db, $tblBPersonnel, 'rate') ||
            !tableHasColumn($db, $tblBPersonnel, 'allowance')
        ) {
            echoJson([
                'error' => 'booking_personnel must contain rate and allowance columns.'
            ], 500);
        }

        $completedAt = normalizeMysqlDateTime((string)($input['completed_at'] ?? ''));
        if ($completedAt === '') {
            echoJson(['error' => 'Completed date and time is required.'], 422);
        }

        $clientCost = $input['client_cost'] ?? [];
        $expenses = $input['expenses'] ?? [];
        $personnelData = $input['personnel'] ?? [];

        if (!is_array($clientCost)) $clientCost = [];
        if (!is_array($expenses)) $expenses = [];
        if (!is_array($personnelData)) {
        $personnelData = [];
        }

        // ---------------------------------------------------------------------
        // Client Cost
        // client_rate and subcon_rate are intentionally NOT written to bookings.
        // ---------------------------------------------------------------------
        $farthestDestinationId = nullableInt($clientCost['farthest_destination_id'] ?? null);
        $noOfTrips = nullableInt($clientCost['no_of_trips'] ?? null);
        $clientRate = nullableFloat($clientCost['client_rate'] ?? null);
        $subconRate = nullableFloat($clientCost['subcon_rate'] ?? null);

        if ($clientRate === null) {
            echoJson(['error' => 'Client rate is required.'], 422);
        }
        if ($noOfTrips === null || $noOfTrips <= 0) {
            echoJson(['error' => 'No. of Trips must be greater than 0.'], 422);
        }
        if ($farthestDestinationId === null) {
            echoJson(['error' => 'Farthest destination is required.'], 422);
        }

        $totalAmount = nullableFloat($clientCost['total_amount'] ?? null);
        if ($totalAmount === null) {
            $totalAmount = $clientRate * $noOfTrips;
        }
        if ($subconRate === null) {
            $subconRate = 0.0;
        }

        // ---------------------------------------------------------------------
        // Expenses
        // Maps modal names -> actual bk_expenses columns.
        // ---------------------------------------------------------------------
        $tollFees = moneyValue($expenses['toll_fees'] ?? 0);
        $extraDrop = moneyValue($expenses['extra_drop'] ?? 0);
        $extraHelper = moneyValue($expenses['extra_helper'] ?? 0);
        $otherExpenses = moneyValue($expenses['other_expenses'] ?? 0);
        $parkingFees = moneyValue($expenses['parking_fees'] ?? 0);
        $tollFeesNonBillable = moneyValue($expenses['toll_fees_non_billable'] ?? 0);
        $demurrageFees = moneyValue($expenses['demurrage_fees'] ?? 0);
        $backloadFees = moneyValue($expenses['backload_fees'] ?? 0);
        $otherDeductions = moneyValue($expenses['other_deductions'] ?? 0);

        // ---------------------------------------------------------------------
        // Personnel Fee
        // ---------------------------------------------------------------------
        // $driverId = nullableInt($personnelFee['driver_id'] ?? null);
        // $driverRate = moneyValue($personnelFee['driver_rate'] ?? 0);
        // $driverAllowance = moneyValue($personnelFee['driver_allowance'] ?? 0);

        // $helper1Id = nullableInt($personnelFee['helper1_id'] ?? null);
        // $helper1Rate = moneyValue($personnelFee['helper1_rate'] ?? 0);
        // $helper1Allowance = moneyValue($personnelFee['helper1_allowance'] ?? 0);

        // $helper2Id = nullableInt($personnelFee['helper2_id'] ?? null);
        // $helper2Rate = moneyValue($personnelFee['helper2_rate'] ?? 0);
        // $helper2Allowance = moneyValue($personnelFee['helper2_allowance'] ?? 0);

        // Get the real Completed status ID from booking_statuses.
        $stmtCompletedStatus = $db->prepare(
            "SELECT status_id
             FROM `{$tblBStatuses}`
             WHERE status_name = ?
             LIMIT 1"
        );
        $stmtCompletedStatus->execute(['Completed']);
        $completedStatus = $stmtCompletedStatus->fetch();

        if (!$completedStatus) {
            echoJson(['error' => 'Completed status was not found in booking_statuses.'], 500);
        }

        $completedStatusId = (int)$completedStatus['status_id'];

        $db->beginTransaction();

        // ---------------------------------------------------------------------
        // 1) Operational booking values only.
        // No client_rate / subcon_rate here.
        // ---------------------------------------------------------------------
        $stmtBooking = $db->prepare(
            "UPDATE `{$tblBookings}`
             SET completed_at = ?,
                 destination_id = ?,
                 trips_number = ?,
                 updated_by = ?,
                 updated_at = NOW()
             WHERE booking_id = ?"
        );
        $stmtBooking->execute([
            $completedAt,
            $farthestDestinationId,
            $noOfTrips,
            (int)$currentUser['user_id'],
            $id
        ]);

        // ---------------------------------------------------------------------
        // 2) Client Cost UPSERT
        // Current schema:
        // client_cost_id, booking_id, client_rate, total_amount, subcon_rate
        // ---------------------------------------------------------------------
        $stmtCCExists = $db->prepare(
            "SELECT client_cost_id
             FROM `{$tblBClientCost}`
             WHERE booking_id = ?
             LIMIT 1"
        );
        $stmtCCExists->execute([$id]);

        if ($stmtCCExists->fetch()) {
            $stmtCC = $db->prepare(
                "UPDATE `{$tblBClientCost}`
                 SET client_rate = ?,
                     total_amount = ?,
                     subcon_rate = ?
                 WHERE booking_id = ?"
            );
            $stmtCC->execute([$clientRate, $totalAmount, $subconRate, $id]);
        } else {
            $stmtCC = $db->prepare(
                "INSERT INTO `{$tblBClientCost}`
                    (booking_id, client_rate, total_amount, subcon_rate)
                 VALUES (?, ?, ?, ?)"
            );
            $stmtCC->execute([$id, $clientRate, $totalAmount, $subconRate]);
        }

        // ---------------------------------------------------------------------
        // 3) Expenses UPSERT
        // Current DB table is bk_expenses, not bk_booking_expenses.
        // ---------------------------------------------------------------------
        $stmtExpExists = $db->prepare(
            "SELECT booking_expenses_id
             FROM `{$tblBExpenses}`
             WHERE booking_id = ?
             LIMIT 1"
        );
        $stmtExpExists->execute([$id]);

        if ($stmtExpExists->fetch()) {
            $stmtExp = $db->prepare(
                "UPDATE `{$tblBExpenses}`
                 SET b_toll_fees = ?,
                     b_extra_drop = ?,
                     b_extra_helper = ?,
                     b_other_fees = ?,
                     nb_parking_fees = ?,
                     nb_toll_fees = ?,
                     nb_demurrage_fees = ?,
                     nb_backload_fees = ?,
                     nb_other_deduction = ?
                 WHERE booking_id = ?"
            );
            $stmtExp->execute([
                $tollFees,
                $extraDrop,
                $extraHelper,
                $otherExpenses,
                $parkingFees,
                $tollFeesNonBillable,
                $demurrageFees,
                $backloadFees,
                $otherDeductions,
                $id
            ]);
        } else {
            $stmtExp = $db->prepare(
                "INSERT INTO `{$tblBExpenses}`
                    (booking_id,
                     b_toll_fees,
                     b_extra_drop,
                     b_extra_helper,
                     b_other_fees,
                     nb_parking_fees,
                     nb_toll_fees,
                     nb_demurrage_fees,
                     nb_backload_fees,
                     nb_other_deduction)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmtExp->execute([
                $id,
                $tollFees,
                $extraDrop,
                $extraHelper,
                $otherExpenses,
                $parkingFees,
                $tollFeesNonBillable,
                $demurrageFees,
                $backloadFees,
                $otherDeductions
            ]);
        }
        // ---------------------------------------------------------------------
        // Personnel Rate / Allowance
        // ---------------------------------------------------------------------

        if (array_key_exists('personnel', $input)) {

            $personnelData = $input['personnel'];

            if (!is_array($personnelData)) {
                $personnelData = [];
            }

            $allowedRoles = ['driver', 'helper1', 'helper2'];

            foreach ($personnelData as $person) {

                $personnelId = nullableInt($person['personnel_id'] ?? null);
                $role = trim((string)($person['assignment_role'] ?? ''));

                $rate = nullableFloat($person['rate'] ?? null);
                $allowance = nullableFloat($person['allowance'] ?? null);

                // Ignore invalid personnel / roles
                if (
                    $personnelId === null ||
                    !in_array($role, $allowedRoles, true)
                ) {
                    continue;
                }

                // If blank, allowance becomes 0
                if ($allowance === null) {
                    $allowance = 0.00;
                }

                // Check whether this role already exists for this booking
                $stmtChkPersonnel = $db->prepare(
                    "SELECT booking_personnel_id
                    FROM `{$tblBPersonnel}`
                    WHERE booking_id = ?
                    AND assignment_role = ?
                    LIMIT 1"
                );

                $stmtChkPersonnel->execute([
                    $id,
                    $role
                ]);

                $existingPersonnel = $stmtChkPersonnel->fetch();

                if ($existingPersonnel) {

                    // Existing driver/helper -> update rate and allowance
                    $stmtPersonnelUpdate = $db->prepare(
                        "UPDATE `{$tblBPersonnel}`
                        SET personnel_id = ?,
                            rate = ?,
                            allowance = ?
                        WHERE booking_id = ?
                        AND assignment_role = ?"
                    );

                    $stmtPersonnelUpdate->execute([
                        $personnelId,
                        $rate,
                        $allowance,
                        $id,
                        $role
                    ]);

                } else {

                    // Role doesn't exist yet -> create it
                    $stmtPersonnelInsert = $db->prepare(
                        "INSERT INTO `{$tblBPersonnel}`
                            (
                                booking_id,
                                personnel_id,
                                assignment_role,
                                rate,
                                allowance
                            )
                        VALUES (?, ?, ?, ?, ?)"
                    );

                    $stmtPersonnelInsert->execute([
                        $id,
                        $personnelId,
                        $role,
                        $rate,
                        $allowance
                    ]);
                }
            }
        }

        // ---------------------------------------------------------------------
        // 5) Finally mark booking COMPLETED.
        // This happens last so any failed detail insert rolls back the status too.
        // ---------------------------------------------------------------------
        $stmtStatusUpdate = $db->prepare(
            "UPDATE `{$tblBookings}`
             SET status_id = ?,
                 updated_by = ?,
                 updated_at = NOW()
             WHERE booking_id = ?"
        );
        $stmtStatusUpdate->execute([
            $completedStatusId,
            (int)$currentUser['user_id'],
            $id
        ]);

        $db->commit();

        echoJson([
            'success' => true,
            'booking_id' => $id,
            'status_id' => $completedStatusId,
            'status_name' => 'Completed',
            'message' => 'Booking completed successfully.'
        ]);

    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        echoJson([
            'error' => 'Booking completion failed: ' . $e->getMessage()
        ], 500);

    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        echoJson([
            'error' => 'Booking completion failed: ' . $e->getMessage()
        ], 500);
    }
}

echoJson(['error' => 'Method not allowed.'], 405);
