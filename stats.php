<?php
header('Content-Type: application/json');

$statsFile = 'stats.json';

// Initialize stats file if it doesn't exist
if (!file_exists($statsFile)) {
    file_put_contents($statsFile, json_encode(['total_visits' => 0, 'total_icons' => 0]));
}

// Read current stats
$stats = json_decode(file_get_contents($statsFile), true);

// Handle different actions
$action = $_GET['action'] ?? 'get';

switch ($action) {
    case 'visit':
        // Increment visit counter
        $stats['total_visits']++;
        file_put_contents($statsFile, json_encode($stats));
        echo json_encode(['success' => true, 'stats' => $stats]);
        break;
        
    case 'icon':
        // Increment icons created counter
        $stats['total_icons']++;
        file_put_contents($statsFile, json_encode($stats));
        echo json_encode(['success' => true, 'stats' => $stats]);
        break;
        
    case 'get':
    default:
        // Just return current stats
        echo json_encode(['success' => true, 'stats' => $stats]);
        break;
}
?>
