<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require "db.php";

$tracking   = $_POST["tracking"];
$new_status = $_POST["new_status"];
$notes      = $_POST["notes"];
$changed_by = $_POST["user_id"];

// 1. Get applicant's email + application ID
$q = $db->prepare("
    SELECT a.id, a.tracking_number, u.email 
    FROM applications a
    JOIN users u ON a.applicant_id = u.id
    WHERE a.tracking_number = ?
");
$q->execute([$tracking]);
$info = $q->fetch();

if (!$info) {
    echo json_encode(["error" => "Application not found"]);
    exit;
}

$app_id  = $info["id"];
$email   = $info["email"];

// 2. Update application status
$update = $db->prepare("
    UPDATE applications 
    SET status = ?
    WHERE tracking_number = ?
");
$update->execute([$new_status, $tracking]);

// 3. Insert into status_history
$history = $db->prepare("
    INSERT INTO status_history (application_id, old_status, new_status, changed_by, notes)
    VALUES (?, NULL, ?, ?, ?)
");
$history->execute([$app_id, $new_status, $changed_by, $notes]);

// 4. Run Python email script
$python = "python3";
$script = __DIR__ . "/send_mail.py";

$cmd = "\"$python\" \"$script\" \"$email\" \"$tracking\" \"$new_status\" \"$notes\" 2>&1";
$output = shell_exec($cmd);

// 5. Insert into notifications
$notify = $db->prepare("
    INSERT INTO notifications (application_id, recipient_email, subject, message)
    VALUES (?, ?, ?, ?)
");
$notify->execute([
    $app_id,
    $email,
    "Application Update: $tracking",
    $notes
]);

echo json_encode([
    "success" => true,
    "message" => "Status updated and email sent",
    "tracking" => $tracking,
    "email_output" => trim($output)
]);
?>
