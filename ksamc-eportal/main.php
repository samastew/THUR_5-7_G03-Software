<?php
// KSAMC E-Portal API
// System Requirement: 2.1.2 - Software interfaces
//BY SAMARA & JOSHUA

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost:8888';
$dbname = 'ksamc_portal';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'], '/'));
$endpoint = $request[0] ?? '';

// Router
switch ($endpoint) {
    case 'login':
        handleLogin($pdo);
        break;
    case 'applications':
        handleApplications($pdo, $method);
        break;
    case 'track':
        handleTracking($pdo);
        break;
    case 'admin':
        handleAdmin($pdo, $method);
        break;
    default:
        echo json_encode(['error' => 'Invalid endpoint']);
        break;
}

// Login handler
function handleLogin($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }
    
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($data['password'], $user['password'])) {
        unset($user['password']); // Don't send password back
        echo json_encode([
            'success' => true,
            'user' => $user,
            'token' => bin2hex(random_bytes(16))
        ]);
    } else {
        echo json_encode(['error' => 'Invalid username or password']);
    }
}

// Applications handler
function handleApplications($pdo, $method) {
    if ($method === 'GET') {
        // Get applications
        $stmt = $pdo->query('SELECT * FROM applications ORDER BY submission_date DESC');
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($applications);
        
    } elseif ($method === 'POST') {
        // Create new application - System Requirement: 1.1
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            echo json_encode(['error' => 'Invalid data']);
            return;
        }
        
        // Generate tracking number - System Requirement: 3.1
        $trackingNumber = 'KSAMC-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $stmt = $pdo->prepare('
            INSERT INTO applications 
            (tracking_number, applicant_id, project_name, property_address, project_type, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        try {
            $stmt->execute([
                $trackingNumber,
                $data['applicant_id'] ?? 1,
                $data['project_name'],
                $data['property_address'],
                $data['project_type'] ?? 'residential',
                $data['description'] ?? '',
                'received'
            ]);
            
            $appId = $pdo->lastInsertId();
            
            // Log status change - System Requirement: 3.3
            $stmt = $pdo->prepare('
                INSERT INTO status_history 
                (application_id, new_status, notes)
                VALUES (?, ?, ?)
            ');
            $stmt->execute([$appId, 'received', 'Application submitted']);
            
            echo json_encode([
                'success' => true,
                'tracking_number' => $trackingNumber,
                'message' => 'Application submitted successfully'
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}

// Tracking handler
function handleTracking($pdo) {
    $trackingNumber = $_GET['tracking_number'] ?? '';
    
    if (!$trackingNumber) {
        echo json_encode(['error' => 'Tracking number required']);
        return;
    }
    
    // Get application - System Requirement: 3.2
    $stmt = $pdo->prepare('SELECT * FROM applications WHERE tracking_number = ?');
    $stmt->execute([$trackingNumber]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$application) {
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    // Get status history - System Requirement: 3.3
    $stmt = $pdo->prepare('SELECT * FROM status_history WHERE application_id = ? ORDER BY changed_at');
    $stmt->execute([$application['id']]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'application' => $application,
        'history' => $history
    ]);
}

// Admin handler - RBAC SAMARA
function handleAdmin($pdo, $method) {
    if ($method === 'POST') {
        // Update application status - System Requirement: 1.2
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['tracking_number']) || !isset($data['status'])) {
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        
        try {
            $pdo->beginTransaction();
            
            // Get current status
            $stmt = $pdo->prepare('SELECT id, status FROM applications WHERE tracking_number = ?');
            $stmt->execute([$data['tracking_number']]);
            $app = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$app) {
                throw new Exception('Application not found');
            }
            
            // Update status
            $stmt = $pdo->prepare('UPDATE applications SET status = ? WHERE id = ?');
            $stmt->execute([$data['status'], $app['id']]);
            
            // Log status change
            $stmt = $pdo->prepare('
                INSERT INTO status_history 
                (application_id, old_status, new_status, notes)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([
                $app['id'],
                $app['status'],
                $data['status'],
                $data['notes'] ?? 'Status updated by admin'
            ]);
            
            // Create notification - System Requirement: 4.1
            $stmt = $pdo->prepare('
                INSERT INTO notifications 
                (application_id, recipient_email, subject, message)
                SELECT ?, u.email, ?, ?
                FROM applications a
                JOIN users u ON a.applicant_id = u.id
                WHERE a.id = ?
            ');
            
            $subject = "Application Status Update - " . $data['tracking_number'];
            $message = "Your application status has been updated to: " . $data['status'];
            if (!empty($data['notes'])) {
                $message .= "\n\nNotes: " . $data['notes'];
            }
            
            $stmt->execute([
                $app['id'],
                $subject,
                $message,
                $app['id']
            ]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Status updated successfully'
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>