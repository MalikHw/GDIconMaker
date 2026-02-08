<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

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
    
    if (!$ballOnly) {
        $hdBase = imagecreatefrompng('../player_01-hd.png');
        if ($hdBase === false) throw new Exception('HD template missing');
        
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

        $uhdBase = imagecreatefrompng('../player_01-uhd.png');
        if ($uhdBase === false) throw new Exception('UHD template missing');
        
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

        $hdPlist = file_get_contents('../player_01-hd.plist');
        $hdPlist = str_replace('player_01', 'player_' . $idxStr, $hdPlist);
        file_put_contents($icnsDir . "/player_{$idxStr}-hd.plist", $hdPlist);
        
        $uhdPlist = file_get_contents('../player_01-uhd.plist');
        $uhdPlist = str_replace('player_01', 'player_' . $idxStr, $uhdPlist);
        file_put_contents($icnsDir . "/player_{$idxStr}-uhd.plist", $uhdPlist);
    }
    
    if (!$noBall) {
        $ballHdBase = imagecreatefrompng('../player_ball_01-hd.png');
        if ($ballHdBase === false) throw new Exception('Ball HD template missing');
        
        imagealphablending($ballHdBase, true);
        imagesavealpha($ballHdBase, true);

        $ballHd = imagecreatetruecolor(65, 66);
        imagealphablending($ballHd, false);
        imagesavealpha($ballHd, true);
        $transp = imagecolorallocatealpha($ballHd, 0, 0, 0, 127);
        imagefill($ballHd, 0, 0, $transp);
        imagecopyresampled($ballHd, $usrImg, 0, 0, 0, 0, 65, 66, $w, $h);
        
        $ballHdCirc = imagecreatetruecolor(65, 66);
        imagealphablending($ballHdCirc, false);
        imagesavealpha($ballHdCirc, true);
        imagefill($ballHdCirc, 0, 0, $transp);
        
        for ($y = 0; $y < 66; $y++) {
            for ($x = 0; $x < 65; $x++) {
                $dx = $x - 32;
                $dy = $y - 33;
                $dist = sqrt($dx*$dx + $dy*$dy);
                if ($dist <= 32.5) {
                    $clr = imagecolorat($ballHd, $x, $y);
                    imagesetpixel($ballHdCirc, $x, $y, $clr);
                }
            }
        }
        
        imagecopy($ballHdBase, $ballHdCirc, 83, 4, 0, 0, 65, 66);
        imagepng($ballHdBase, $icnsDir . "/player_ball_{$idxStr}-hd.png");
        
        imagedestroy($ballHd);
        imagedestroy($ballHdCirc);
        imagedestroy($ballHdBase);

        $ballUhdBase = imagecreatefrompng('../player_ball_01-uhd.png');
        if ($ballUhdBase === false) throw new Exception('Ball UHD template missing');
        
        imagealphablending($ballUhdBase, true);
        imagesavealpha($ballUhdBase, true);

        $ballUhd = imagecreatetruecolor(130, 130);
        imagealphablending($ballUhd, false);
        imagesavealpha($ballUhd, true);
        $transp = imagecolorallocatealpha($ballUhd, 0, 0, 0, 127);
        imagefill($ballUhd, 0, 0, $transp);
        imagecopyresampled($ballUhd, $usrImg, 0, 0, 0, 0, 130, 130, $w, $h);
        
        $ballUhdCirc = imagecreatetruecolor(130, 130);
        imagealphablending($ballUhdCirc, false);
        imagesavealpha($ballUhdCirc, true);
        imagefill($ballUhdCirc, 0, 0, $transp);
        
        for ($y = 0; $y < 130; $y++) {
            for ($x = 0; $x < 130; $x++) {
                $dx = $x - 65;
                $dy = $y - 65;
                $dist = sqrt($dx*$dx + $dy*$dy);
                if ($dist <= 65) {
                    $clr = imagecolorat($ballUhd, $x, $y);
                    imagesetpixel($ballUhdCirc, $x, $y, $clr);
                }
            }
        }
        
        imagecopy($ballUhdBase, $ballUhdCirc, 162, 8, 0, 0, 130, 130);
        imagepng($ballUhdBase, $icnsDir . "/player_ball_{$idxStr}-uhd.png");
        
        imagedestroy($ballUhd);
        imagedestroy($ballUhdCirc);
        imagedestroy($ballUhdBase);

        if (file_exists('../player_ball_01-hd.plist')) {
            $ballHdPlist = file_get_contents('../player_ball_01-hd.plist');
            $ballHdPlist = str_replace('player_ball_01', 'player_ball_' . $idxStr, $ballHdPlist);
            file_put_contents($icnsDir . "/player_ball_{$idxStr}-hd.plist", $ballHdPlist);
        }
        if (file_exists('../player_ball_01-uhd.plist')) {
            $ballUhdPlist = file_get_contents('../player_ball_01-uhd.plist');
            $ballUhdPlist = str_replace('player_ball_01', 'player_ball_' . $idxStr, $ballUhdPlist);
            file_put_contents($icnsDir . "/player_ball_{$idxStr}-uhd.plist", $ballUhdPlist);
        }
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
