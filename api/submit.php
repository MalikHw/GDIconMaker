<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'process2.php';

function fckOff($msg) {
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fckOff('POST only bro');
}

if (!isset($_FILES['image']) || !isset($_POST['name']) || !isset($_POST['author'])) {
    fckOff('Missing shit: image, name, author required');
}

$img = $_FILES['image'];
$nm = trim($_POST['name']);
$auth = trim($_POST['author']);
$noBall = isset($_POST['noBall']) && $_POST['noBall'] === 'true';
$ballOnly = isset($_POST['ballOnly']) && $_POST['ballOnly'] === 'true';
$noWave = isset($_POST['noWave']) && $_POST['noWave'] === 'true';
$waveOnly = isset($_POST['waveOnly']) && $_POST['waveOnly'] === 'true';
$noCube = isset($_POST['noCube']) && $_POST['noCube'] === 'true';
$cubeOnly = isset($_POST['cubeOnly']) && $_POST['cubeOnly'] === 'true';
$p1Color = isset($_POST['p1Color']) && !empty($_POST['p1Color']) ? $_POST['p1Color'] : null;
$p2Color = isset($_POST['p2Color']) && !empty($_POST['p2Color']) ? $_POST['p2Color'] : null;

if (empty($nm) || empty($auth)) {
    fckOff('Name and author cant be empty');
}

if ($img['error'] !== UPLOAD_ERR_OK) {
    fckOff('Image upload failed');
}

$imgInfo = getimagesize($img['tmp_name']);
if ($imgInfo === false) {
    fckOff('Not a valid image');
}

$w = $imgInfo[0];
$h = $imgInfo[1];

if ($w !== $h) {
    fckOff('Image must be 1:1 (square) ratio');
}

$usrImg = imagecreatefromstring(file_get_contents($img['tmp_name']));
if ($usrImg === false) {
    fckOff('Failed to load image');
}

$pckId = 'gdiconmaker.' . preg_replace('/[^a-zA-Z0-9]/', '', str_replace(' ', '', $nm));

$tmpDir = '../temp_' . uniqid();
if (!mkdir($tmpDir, 0755, true)) {
    fckOff('Temp dir failed');
}

$icnsDir = $tmpDir . '/icons';
if (!mkdir($icnsDir, 0755, true)) {
    fckOff('Icons dir failed');
}

try {
    $idxStr = '01';
    
    $doCube = !$noCube && (!$ballOnly && !$waveOnly || $cubeOnly);
    $doWave = !$noWave && (!$ballOnly && !$cubeOnly || $waveOnly);
    $doBall = !$noBall && (!$cubeOnly && !$waveOnly || $ballOnly);
    
    if (!$doCube && !$doWave && !$doBall) {
        $doCube = true;
    }
    
    if ($doCube) {
        procCube($usrImg, $w, $h, $idxStr, $icnsDir, $p1Color);
    }
    
    if ($doWave) {
        procWave($usrImg, $w, $h, $idxStr, $icnsDir, $p2Color);
    }
    
    if ($doBall) {
        procBall($usrImg, $w, $h, $idxStr, $icnsDir, $p1Color);
    }

    $pckJsonCont = file_get_contents('../pack.json');
    if ($pckJsonCont === false) throw new Exception('pack.json missing');

    $pckData = json_decode($pckJsonCont, true);
    if ($pckData === null) throw new Exception('pack.json broken');

    $pckData['id'] = $pckId;
    $pckData['author'] = $auth . ' (from gdiconmaker.rf.gd)';
    $pckData['name'] = $nm;

    $modPckJson = json_encode($pckData, JSON_PRETTY_PRINT);
    file_put_contents($tmpDir . '/pack.json', $modPckJson);

    $custPackIcon = isset($_FILES['packIcon']) && $_FILES['packIcon']['error'] === UPLOAD_ERR_OK;

    if ($custPackIcon) {
        $custIconTmp = $_FILES['packIcon']['tmp_name'];
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
                copy('../pack.png', $tmpDir . '/pack.png');
            }
        } else {
            copy('../pack.png', $tmpDir . '/pack.png');
        }
    } else {
        copy('../pack.png', $tmpDir . '/pack.png');
    }

    $zipFname = preg_replace('/[^a-zA-Z0-9_-]/', '_', $nm) . '.zip';
    $zipPath = '../downloads/' . $zipFname;

    if (!is_dir('../downloads')) {
        mkdir('../downloads', 0755, true);
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new Exception('ZIP creation failed');
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
    
    imagedestroy($usrImg);

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipFname . '"');
    header('Content-Length: ' . filesize($zipPath));
    readfile($zipPath);
    unlink($zipPath);
    exit;

} catch (Exception $e) {
    if (isset($icnsDir) && is_dir($icnsDir)) {
        @array_map('unlink', glob($icnsDir . '/*'));
        @rmdir($icnsDir);
    }
    if (isset($tmpDir) && is_dir($tmpDir)) {
        @array_map('unlink', glob($tmpDir . '/*'));
        @rmdir($tmpDir);
    }
    fckOff($e->getMessage());
}
?>
