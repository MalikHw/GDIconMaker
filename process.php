<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

function sendError($message) {
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function sendSuccess($message, $downloadUrl, $filename) {
    echo json_encode([
        'success' => true,
        'message' => $message,
        'downloadUrl' => $downloadUrl,
        'filename' => $filename
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Invalid request method');
}

if (!isset($_FILES['iconImages']) || !isset($_POST['packName']) || !isset($_POST['packAuthor'])) {
    sendError('Missing required fields');
}

$packName = trim($_POST['packName']);
$packAuthor = trim($_POST['packAuthor']);

if (empty($packName) || empty($packAuthor)) {
    sendError('All fields are required');
}

$packId = 'gdiconmaker.' . preg_replace('/[^a-zA-Z0-9]/', '', str_replace(' ', '', $packName));

$uploadedFiles = $_FILES['iconImages'];
$fileCount = is_array($uploadedFiles['tmp_name']) ? count($uploadedFiles['tmp_name']) : 1;

if ($fileCount > 99) {
    sendError('Maximum 99 images allowed');
}

$tempDir = 'temp_' . uniqid();
if (!mkdir($tempDir, 0755, true)) {
    sendError('Failed to create temporary directory');
}

$iconsDir = $tempDir . '/icons';
if (!mkdir($iconsDir, 0755, true)) {
    sendError('Failed to create icons directory');
}

try {
    // Process each uploaded image
    for ($i = 0; $i < $fileCount; $i++) {
        $imageIndex = $i + 1; // Start from 1 (player_01, player_02, etc.)
        
        if (is_array($uploadedFiles['tmp_name'])) {
            $tmpName = $uploadedFiles['tmp_name'][$i];
            $error = $uploadedFiles['error'][$i];
        } else {
            $tmpName = $uploadedFiles['tmp_name'];
            $error = $uploadedFiles['error'];
        }

        if ($error !== UPLOAD_ERR_OK) {
            throw new Exception("File upload failed for image $imageIndex");
        }

        $imageInfo = getimagesize($tmpName);
        if ($imageInfo === false) {
            throw new Exception("Image $imageIndex is not a valid image");
        }

        $width = $imageInfo[0];
        $height = $imageInfo[1];

        $userImage = imagecreatefromstring(file_get_contents($tmpName));
        if ($userImage === false) {
            throw new Exception("Failed to load image $imageIndex");
        }

        // Format index with leading zero (01, 02, ..., 99)
        $indexStr = str_pad($imageIndex, 2, '0', STR_PAD_LEFT);

        // Process HD version
        $hdBase = imagecreatefrompng('player_01-hd.png');
        if ($hdBase === false) {
            throw new Exception('Failed to load player_01-hd.png template');
        }
        
        imagealphablending($hdBase, true);
        imagesavealpha($hdBase, true);

        $resizedHd = imagecreatetruecolor(55, 56);
        imagealphablending($resizedHd, false);
        imagesavealpha($resizedHd, true);
        $transparent = imagecolorallocatealpha($resizedHd, 0, 0, 0, 127);
        imagefill($resizedHd, 0, 0, $transparent);
        imagecopyresampled($resizedHd, $userImage, 0, 0, 0, 0, 55, 56, $width, $height);

        $rotatedHd = imagerotate($resizedHd, -90, imagecolorallocatealpha($resizedHd, 0, 0, 0, 127));
        imagealphablending($rotatedHd, false);
        imagesavealpha($rotatedHd, true);

        imagecopy($hdBase, $rotatedHd, 71, 5, 0, 0, imagesx($rotatedHd), imagesy($rotatedHd));
        imagepng($hdBase, $iconsDir . "/player_{$indexStr}-hd.png");
        
        imagedestroy($resizedHd);
        imagedestroy($rotatedHd);
        imagedestroy($hdBase);

        // Process UHD version
        $uhdBase = imagecreatefrompng('player_01-uhd.png');
        if ($uhdBase === false) {
            throw new Exception('Failed to load player_01-uhd.png template');
        }
        
        imagealphablending($uhdBase, true);
        imagesavealpha($uhdBase, true);

        $resizedUhd = imagecreatetruecolor(108, 108);
        imagealphablending($resizedUhd, false);
        imagesavealpha($resizedUhd, true);
        $transparent = imagecolorallocatealpha($resizedUhd, 0, 0, 0, 127);
        imagefill($resizedUhd, 0, 0, $transparent);
        imagecopyresampled($resizedUhd, $userImage, 0, 0, 0, 0, 108, 108, $width, $height);

        imagecopy($uhdBase, $resizedUhd, 37, 8, 0, 0, 108, 108);
        imagepng($uhdBase, $iconsDir . "/player_{$indexStr}-uhd.png");
        
        imagedestroy($resizedUhd);
        imagedestroy($uhdBase);
        imagedestroy($userImage);

        // Copy .plist files (use player_01 plist as template for all)
        copy('player_01-hd.plist', $iconsDir . "/player_{$indexStr}-hd.plist");
        copy('player_01-uhd.plist', $iconsDir . "/player_{$indexStr}-uhd.plist");
    }

    // Read and modify pack.json
    $packJsonContent = file_get_contents('pack.json');
    if ($packJsonContent === false) {
        throw new Exception('Failed to read pack.json');
    }

    $packData = json_decode($packJsonContent, true);
    if ($packData === null) {
        throw new Exception('Invalid pack.json format');
    }

    $packData['id'] = $packId;
    $packData['author'] = $packAuthor . ' (from gdiconmaker.rf.gd)';
    $packData['name'] = $packName;

    $modifiedPackJson = json_encode($packData, JSON_PRETTY_PRINT);
    file_put_contents($tempDir . '/pack.json', $modifiedPackJson);

    copy('pack.png', $tempDir . '/pack.png');

    // Create ZIP file
    $zipFilename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $packName) . '.zip';
    $zipPath = 'downloads/' . $zipFilename;

    if (!is_dir('downloads')) {
        mkdir('downloads', 0755, true);
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new Exception('Failed to create ZIP file');
    }

    $zip->addFile($tempDir . '/pack.json', 'pack.json');
    $zip->addFile($tempDir . '/pack.png', 'pack.png');
    
    // Add all generated icon files
    $iconFiles = glob($iconsDir . '/*');
    foreach ($iconFiles as $file) {
        $zip->addFile($file, 'icons/' . basename($file));
    }

    $zip->close();

    // Clean up temporary directory
    array_map('unlink', glob($iconsDir . '/*'));
    rmdir($iconsDir);
    array_map('unlink', glob($tempDir . '/*'));
    rmdir($tempDir);

    // Return download.php URL instead of direct file path
    $downloadUrl = 'download.php?file=' . urlencode($zipFilename);
    sendSuccess("Icon pack created successfully with $fileCount icon(s)!", $downloadUrl, $zipFilename);

} catch (Exception $e) {
    if (isset($iconsDir) && is_dir($iconsDir)) {
        @array_map('unlink', glob($iconsDir . '/*'));
        @rmdir($iconsDir);
    }
    if (isset($tempDir) && is_dir($tempDir)) {
        @array_map('unlink', glob($tempDir . '/*'));
        @rmdir($tempDir);
    }
    sendError($e->getMessage());
}
?>
