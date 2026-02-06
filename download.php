<?php
// Serve ZIP file and then delete it
if (!isset($_GET['file'])) {
    http_response_code(404);
    die('File not specified');
}

$filename = basename($_GET['file']); // Security: prevent directory traversal
$filepath = 'downloads/' . $filename;

// Check if file exists
if (!file_exists($filepath)) {
    http_response_code(404);
    die('File not found');
}

// Get file size
$filesize = filesize($filepath);

// Set headers for download
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . $filesize);
header('Cache-Control: no-cache, must-revalidate');
header('Expires: 0');

// Disable output buffering
if (ob_get_level()) {
    ob_end_clean();
}

// Read and output file
readfile($filepath);

// Schedule deletion after file is sent
// Delete immediately since file has been sent
unlink($filepath);

exit;
?>
