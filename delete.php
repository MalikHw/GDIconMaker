<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$file = $input['file'] ?? '';

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

// Delete the file
if (unlink($file)) {
    echo json_encode(['success' => true, 'message' => 'File deleted']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete file']);
}
?>
