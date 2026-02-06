<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$file = $input['file'] ?? '';
$delay = isset($input['delay']) ? (int)$input['delay'] : 0;

if (empty($file)) {
    echo json_encode(['success' => false, 'message' => 'No file specified']);
    exit;
}

// Security: only allow deletion of files in downloads/ directory
if (strpos($file, 'downloads/') !== 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid file path']);
    exit;
}

// Check if file exists
if (!file_exists($file)) {
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

// If delay is gave, wait before deleting
if ($delay > 0) {
    // Close connection so user doesn't wait
    ignore_user_abort(true);
    set_time_limit(0);
    
    // Send response rn
    echo json_encode(['success' => true, 'message' => 'Deletion scheduled']);
    
    // Flush output
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
    flush();
    
    // Close connection
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    
    // Wait for specified delay
    sleep($delay);
}

// Delete the file
if (file_exists($file) && unlink($file)) {
    // File deleted successfully (but user already got it)
    exit;
} else {
    // Silent fail if file was already deleted or doesn't exist
    exit;
}
?>
