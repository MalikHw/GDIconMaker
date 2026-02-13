<?php

define('CLEANUP_SECRET', 'MIKUMIKUMIKUMIKU' . md5(__DIR__));

if (!isset($_GET['token']) || $_GET['token'] !== CLEANUP_SECRET) {
    http_response_code(403);
    die('nah bro, access denied');
}

$downloadsDir = __DIR__ . '/downloads';

if (!is_dir($downloadsDir)) {
    echo "downloads folder dont exist bro\n";
    exit;
}

$files = glob($downloadsDir . '/*.zip');

if (empty($files)) {
    echo "no zip files found, all good\n";
    exit;
}

$now = time();
$deleted = 0;

foreach ($files as $file) {
    if (!file_exists($file)) {
        continue;
    }
    
    $fileTime = filemtime($file);
    $age = $now - $fileTime;
    
    if ($age > 30) {
        if (unlink($file)) {
            echo "deleted: " . basename($file) . " (age: {$age}s)\n";
            $deleted++;
        } else {
            echo "failed to delete: " . basename($file) . "\n";
        }
    } else {
        echo "skipped: " . basename($file) . " (age: {$age}s, too fresh)\n";
    }
}

echo "\ntotal deleted: $deleted files\n";
?>