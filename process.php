<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

function sendError($msg) {
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

function sendSuccess($msg, $dlUrl, $fname) {
    echo json_encode([
        'success' => true,
        'message' => $msg,
        'downloadUrl' => $dlUrl,
        'filename' => $fname
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Invalid request method');
}

if (!isset($_FILES['iconImages']) || !isset($_POST['packName']) || !isset($_POST['packAuthor'])) {
    sendError('Missing required fields');
}

$pckName = trim($_POST['packName']);
$pckAuth = trim($_POST['packAuthor']);
$iconNums = isset($_POST['iconNumbers']) ? $_POST['iconNumbers'] : [];

if (empty($pckName) || empty($pckAuth)) {
    sendError('All fields are required');
}

$pckId = 'gdiconmaker.' . preg_replace('/[^a-zA-Z0-9]/', '', str_replace(' ', '', $pckName));

$upldFiles = $_FILES['iconImages'];
$fileCnt = is_array($upldFiles['tmp_name']) ? count($upldFiles['tmp_name']) : 1;

if ($fileCnt > 99) {
    sendError('Maximum 99 images allowed');
}

$custPackIcon = isset($_FILES['customPackIcon']) && $_FILES['customPackIcon']['error'] === UPLOAD_ERR_OK;

$tmpDir = 'temp_' . uniqid();
if (!mkdir($tmpDir, 0755, true)) {
    sendError('Failed to create temporary directory');
}

$icnsDir = $tmpDir . '/icons';
if (!mkdir($icnsDir, 0755, true)) {
    sendError('Failed to create icons directory');
}

try {
    for ($i = 0; $i < $fileCnt; $i++) {
        $iconIdx = isset($iconNums[$i]) ? intval($iconNums[$i]) : ($i + 1);
        
        if ($iconIdx < 1) $iconIdx = 1;
        if ($iconIdx > 99) $iconIdx = 99;
        
        if (is_array($upldFiles['tmp_name'])) {
            $tmpName = $upldFiles['tmp_name'][$i];
            $err = $upldFiles['error'][$i];
        } else {
            $tmpName = $upldFiles['tmp_name'];
            $err = $upldFiles['error'];
        }

        if ($err !== UPLOAD_ERR_OK) {
            throw new Exception("File upload failed for image $iconIdx");
        }

        $imgInfo = getimagesize($tmpName);
        if ($imgInfo === false) {
            throw new Exception("Image $iconIdx is not a valid image");
        }

        $w = $imgInfo[0];
        $h = $imgInfo[1];

        $usrImg = imagecreatefromstring(file_get_contents($tmpName));
        if ($usrImg === false) {
            throw new Exception("Failed to load image $iconIdx");
        }

        $idxStr = str_pad($iconIdx, 2, '0', STR_PAD_LEFT);

        $hdBase = imagecreatefrompng('player_01-hd.png');
        if ($hdBase === false) {
            throw new Exception('Failed to load player_01-hd.png template');
        }
        
        imagealphablending($hdBase, true);
        imagesavealpha($hdBase, true);

        $reszHd = imagecreatetruecolor(55, 56);
        imagealphablending($reszHd, false);
        imagesavealpha($reszHd, true);
        $transp = imagecolorallocatealpha($reszHd, 0, 0, 0, 127);
        imagefill($reszHd, 0, 0, $transp);
        imagecopyresampled($reszHd, $usrImg, 0, 0, 0, 0, 55, 56, $w, $h);

        $rotHd = imagerotate($reszHd, -90, imagecolorallocatealpha($reszHd, 0, 0, 0, 127));
        imagealphablending($rotHd, false);
        imagesavealpha($rotHd, true);

        imagecopy($hdBase, $rotHd, 71, 5, 0, 0, imagesx($rotHd), imagesy($rotHd));
        imagepng($hdBase, $icnsDir . "/player_{$idxStr}-hd.png");
        
        imagedestroy($reszHd);
        imagedestroy($rotHd);
        imagedestroy($hdBase);

        $uhdBase = imagecreatefrompng('player_01-uhd.png');
        if ($uhdBase === false) {
            throw new Exception('Failed to load player_01-uhd.png template');
        }
        
        imagealphablending($uhdBase, true);
        imagesavealpha($uhdBase, true);

        $reszUhd = imagecreatetruecolor(108, 108);
        imagealphablending($reszUhd, false);
        imagesavealpha($reszUhd, true);
        $transp = imagecolorallocatealpha($reszUhd, 0, 0, 0, 127);
        imagefill($reszUhd, 0, 0, $transp);
        imagecopyresampled($reszUhd, $usrImg, 0, 0, 0, 0, 108, 108, $w, $h);

        imagecopy($uhdBase, $reszUhd, 37, 8, 0, 0, 108, 108);
        imagepng($uhdBase, $icnsDir . "/player_{$idxStr}-uhd.png");
        
        imagedestroy($reszUhd);
        imagedestroy($uhdBase);
        imagedestroy($usrImg);

        copy('player_01-hd.plist', $icnsDir . "/player_{$idxStr}-hd.plist");
        copy('player_01-uhd.plist', $icnsDir . "/player_{$idxStr}-uhd.plist");
    }

    $pckJsonCont = file_get_contents('pack.json');
    if ($pckJsonCont === false) {
        throw new Exception('Failed to read pack.json');
    }

    $pckData = json_decode($pckJsonCont, true);
    if ($pckData === null) {
        throw new Exception('Invalid pack.json format');
    }

    $pckData['id'] = $pckId;
    $pckData['author'] = $pckAuth . ' (from gdiconmaker.rf.gd)';
    $pckData['name'] = $pckName;

    $modPckJson = json_encode($pckData, JSON_PRETTY_PRINT);
    file_put_contents($tmpDir . '/pack.json', $modPckJson);

    if ($custPackIcon) {
        $custIconTmp = $_FILES['customPackIcon']['tmp_name'];
        $custIconInfo = getimagesize($custIconTmp);
        
        if ($custIconInfo !== false) {
            $custImg = imagecreatefromstring(file_get_contents($custIconTmp));
            
            if ($custImg !== false) {
                $fnlIcon = imagecreatetruecolor(336, 336);
                imagealphablending($fnlIcon, false);
                imagesavealpha($fnlIcon, true);
                $transp = imagecolorallocatealpha($fnlIcon, 0, 0, 0, 127);
                imagefill($fnlIcon, 0, 0, $transp);
                imagecopyresampled($fnlIcon, $custImg, 0, 0, 0, 0, 336, 336, $custIconInfo[0], $custIconInfo[1]);
                
                $txtColor = imagecolorallocatealpha($fnlIcon, 255, 255, 255, 30);
                $txtBg = imagecolorallocatealpha($fnlIcon, 0, 0, 0, 80);
                imagefilledrectangle($fnlIcon, 0, 300, 336, 336, $txtBg);
                imagestring($fnlIcon, 3, 60, 312, 'GDIconMaker.rf.gd', $txtColor);
                
                imagepng($fnlIcon, $tmpDir . '/pack.png');
                imagedestroy($fnlIcon);
                imagedestroy($custImg);
            } else {
                copy('pack.png', $tmpDir . '/pack.png');
            }
        } else {
            copy('pack.png', $tmpDir . '/pack.png');
        }
    } else {
        copy('pack.png', $tmpDir . '/pack.png');
    }

    $zipFname = preg_replace('/[^a-zA-Z0-9_-]/', '_', $pckName) . '.zip';
    $zipPath = 'downloads/' . $zipFname;

    if (!is_dir('downloads')) {
        mkdir('downloads', 0755, true);
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new Exception('Failed to create ZIP file');
    }

    $zip->addFile($tmpDir . '/pack.json', 'pack.json');
    $zip->addFile($tmpDir . '/pack.png', 'pack.png');
    
    $iconFiles = glob($icnsDir . '/*');
    foreach ($iconFiles as $fl) {
        $zip->addFile($fl, 'icons/' . basename($fl));
    }

    $zip->close();

    array_map('unlink', glob($icnsDir . '/*'));
    rmdir($icnsDir);
    array_map('unlink', glob($tmpDir . '/*'));
    rmdir($tmpDir);

    $dlUrl = 'download.php?file=' . urlencode($zipFname);
    sendSuccess("Icon pack created successfully with $fileCnt icon(s)!", $dlUrl, $zipFname);

} catch (Exception $e) {
    if (isset($icnsDir) && is_dir($icnsDir)) {
        @array_map('unlink', glob($icnsDir . '/*'));
        @rmdir($icnsDir);
    }
    if (isset($tmpDir) && is_dir($tmpDir)) {
        @array_map('unlink', glob($tmpDir . '/*'));
        @rmdir($tmpDir);
    }
    sendError($e->getMessage());
}
?>
