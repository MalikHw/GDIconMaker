<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'process2.php';

function fckOff($msg) {
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

if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fckOff('Invalid request method');
}

if(!isset($_FILES['iconImages']) || !isset($_POST['packName']) || !isset($_POST['packAuthor'])) {
    fckOff('Missing required fields');
}

$pckName = trim($_POST['packName']);
$pckAuth = trim($_POST['packAuthor']);
$iconNums = isset($_POST['iconNumbers']) ? $_POST['iconNumbers'] : [];
$gifFlags = isset($_POST['gifFlags']) ? $_POST['gifFlags'] : [];
$gifFpsVals = isset($_POST['gifFps']) ? $_POST['gifFps'] : [];
$doCube = isset($_POST['doCube']) && $_POST['doCube'] === 'true';
$doWave = isset($_POST['doWave']) && $_POST['doWave'] === 'true';
$doBall = isset($_POST['doBall']) && $_POST['doBall'] === 'true';
$p1Color = isset($_POST['p1Color']) && !empty($_POST['p1Color']) ? $_POST['p1Color'] : null;
$p2Color = isset($_POST['p2Color']) && !empty($_POST['p2Color']) ? $_POST['p2Color'] : null;

if(empty($pckName) || empty($pckAuth)) {
    fckOff('All fields are required');
}

if(!$doCube && !$doWave && !$doBall) {
    fckOff('Select at least one gamemode bruh');
}

$pckId = 'gdiconmaker.' . preg_replace('/[^a-zA-Z0-9]/', '', str_replace(' ', '', $pckName));

$upldFiles = $_FILES['iconImages'];
$fileCnt = is_array($upldFiles['tmp_name']) ? count($upldFiles['tmp_name']) : 1;

if($fileCnt > 400) {
    fckOff('Maximum 400 images allowed');
}

$custPackIcon = isset($_FILES['customPackIcon']) && $_FILES['customPackIcon']['error'] === UPLOAD_ERR_OK;

$tmpDir = 'temp_' . uniqid();
if(!mkdir($tmpDir, 0755, true)) {
    fckOff('Failed to create temporary directory');
}

$icnsDir = $tmpDir . '/icons';
if(!mkdir($icnsDir, 0755, true)) {
    fckOff('Failed to create icons directory');
}

try {
    for($i = 0; $i < $fileCnt; $i++) {
        $iconIdx = isset($iconNums[$i]) ? intval($iconNums[$i]) : ($i + 1);
        $isGif = isset($gifFlags[$i]) && $gifFlags[$i] === 'true';
        $gifFps = isset($gifFpsVals[$i]) ? intval($gifFpsVals[$i]) : 30;
        
        if($iconIdx < 1) $iconIdx = 1;
        if($iconIdx > 400) $iconIdx = 400;
        
        if(is_array($upldFiles['tmp_name'])) {
            $tmpName = $upldFiles['tmp_name'][$i];
            $err = $upldFiles['error'][$i];
        } else {
            $tmpName = $upldFiles['tmp_name'];
            $err = $upldFiles['error'];
        }

        if($err !== UPLOAD_ERR_OK) {
            throw new Exception("File upload failed for image $iconIdx");
        }

        if(filesize($tmpName) > 5*1024*1024) {
            throw new Exception("Image $iconIdx exceeds 5MB limit");
        }

        $imgInfo = getimagesize($tmpName);
        if($imgInfo === false) {
            throw new Exception("Image $iconIdx is not a valid image");
        }

        $w = $imgInfo[0];
        $h = $imgInfo[1];

        if($isGif) {
            $usrImg = imagecreatefromgif($tmpName);
        } else {
            $usrImg = imagecreatefromstring(file_get_contents($tmpName));
        }
        
        if($usrImg === false) {
            throw new Exception("Failed to load image $iconIdx");
        }

        $idxStr = str_pad($iconIdx, 2, '0', STR_PAD_LEFT);

        if($doCube) {
            procCube($usrImg, $w, $h, $idxStr, $icnsDir, $p1Color);
        }
        
        if($doWave) {
            procWave($usrImg, $w, $h, $idxStr, $icnsDir, $p2Color);
        }
        
        if($doBall) {
            procBall($usrImg, $w, $h, $idxStr, $icnsDir, $p1Color);
        }

        imagedestroy($usrImg);
    }

    $pckJsonCont = file_get_contents('pack.json');
    if($pckJsonCont === false) {
        throw new Exception('Failed to read pack.json');
    }

    $pckData = json_decode($pckJsonCont, true);
    if($pckData === null) {
        throw new Exception('Invalid pack.json format');
    }

    $pckData['id'] = $pckId;
    $pckData['author'] = $pckAuth . ' (from gdiconmaker.rf.gd)';
    $pckData['name'] = $pckName;

    $modPckJson = json_encode($pckData, JSON_PRETTY_PRINT);
    file_put_contents($tmpDir . '/pack.json', $modPckJson);

    if($custPackIcon) {
        $custIconTmp = $_FILES['customPackIcon']['tmp_name'];
        $custIconInfo = getimagesize($custIconTmp);
        
        if($custIconInfo !== false) {
            $custImg = imagecreatefromstring(file_get_contents($custIconTmp));
            
            if($custImg !== false) {
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

    if(!is_dir('downloads')) {
        mkdir('downloads', 0755, true);
    }

    $zip = new ZipArchive();
    if($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new Exception('Failed to create ZIP file');
    }

    $zip->addFile($tmpDir . '/pack.json', 'pack.json');
    $zip->addFile($tmpDir . '/pack.png', 'pack.png');
    
    $iconFiles = glob($icnsDir . '/*');
    foreach($iconFiles as $fl) {
        $zip->addFile($fl, 'icons/' . basename($fl));
    }

    $zip->close();

    array_map('unlink', glob($icnsDir . '/*'));
    rmdir($icnsDir);
    array_map('unlink', glob($tmpDir . '/*'));
    rmdir($tmpDir);

    $dlUrl = 'download.php?file=' . urlencode($zipFname);
    sendSuccess("Icon pack created successfully with $fileCnt icon(s)!", $dlUrl, $zipFname);

} catch(Exception $e) {
    if(isset($icnsDir) && is_dir($icnsDir)) {
        @array_map('unlink', glob($icnsDir . '/*'));
        @rmdir($icnsDir);
    }
    if(isset($tmpDir) && is_dir($tmpDir)) {
        @array_map('unlink', glob($tmpDir . '/*'));
        @rmdir($tmpDir);
    }
    fckOff($e->getMessage());
}
?>
