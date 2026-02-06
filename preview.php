<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['previewOnly'])) {
    exit;
}

if (!isset($_FILES['iconImages'])) {
    echo json_encode(['success' => false]);
    exit;
}

$upldFile = $_FILES['iconImages'];
$tmpName = is_array($upldFile['tmp_name']) ? $upldFile['tmp_name'][0] : $upldFile['tmp_name'];

$imgInfo = getimagesize($tmpName);
if ($imgInfo === false) {
    echo json_encode(['success' => false]);
    exit;
}

$w = $imgInfo[0];
$h = $imgInfo[1];

$usrImg = imagecreatefromstring(file_get_contents($tmpName));
if ($usrImg === false) {
    echo json_encode(['success' => false]);
    exit;
}

$uhdBase = imagecreatefrompng('player_01-uhd.png');
if ($uhdBase === false) {
    echo json_encode(['success' => false]);
    exit;
}

imagealphablending($uhdBase, true);
imagesavealpha($uhdBase, true);

$reszd = imagecreatetruecolor(108, 108);
imagealphablending($reszd, false);
imagesavealpha($reszd, true);
$transp = imagecolorallocatealpha($reszd, 0, 0, 0, 127);
imagefill($reszd, 0, 0, $transp);
imagecopyresampled($reszd, $usrImg, 0, 0, 0, 0, 108, 108, $w, $h);

imagecopy($uhdBase, $reszd, 37, 8, 0, 0, 108, 108);

ob_start();
imagepng($uhdBase);
$pngData = ob_get_clean();

imagedestroy($reszd);
imagedestroy($uhdBase);
imagedestroy($usrImg);

echo json_encode([
    'success' => true,
    'preview' => base64_encode($pngData)
]);
?>
