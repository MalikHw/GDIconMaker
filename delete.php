<?php
header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$file = $input['file'] ?? '';
$delay = isset($input['delay']) ? (int)$input['delay'] : 0;

if(empty($file)) {
    echo json_encode(['success' => false, 'message' => 'No file specified']);
    exit;
}

$filename = basename($file);

if(!preg_match('/\.zip$/', $filename)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type']);
    exit;
}

$filepath = 'downloads/' . $filename;

if(!file_exists($filepath)) {
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

if($delay > 0) {
    ignore_user_abort(true);
    set_time_limit(0);
    
    echo json_encode(['success' => true, 'message' => 'Deletion scheduled']);
    
    if(ob_get_level() > 0) {
        ob_end_flush();
    }
    flush();
    
    if(function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    
    sleep($delay);
}

if(file_exists($filepath) && unlink($filepath)) {
    exit;
} else {
    exit;
}
?>
