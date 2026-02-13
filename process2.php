<?php

function invertColorImg($img, $targetHex) {
    $targetRgb = hexToRgb($targetHex);
    $targetHsv = rgbToHsv($targetRgb['r'], $targetRgb['g'], $targetRgb['b']);
    
    $hueShift = ($targetHsv['h'] + 180) % 360;
    
    $w = imagesx($img);
    $h = imagesy($img);
    
    for($y = 0; $y < $h; $y++) {
        for($x = 0; $x < $w; $x++) {
            $rgb = imagecolorat($img, $x, $y);
            $a = ($rgb >> 24) & 0xFF;
            
            if($a < 127) {
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                
                $hsv = rgbToHsv($r, $g, $b);
                $hsv['h'] = ($hsv['h'] + $hueShift) % 360;
                $newRgb = hsvToRgb($hsv['h'], $hsv['s'], $hsv['v']);
                
                imagesetpixel($img, $x, $y, imagecolorallocatealpha($img, $newRgb['r'], $newRgb['g'], $newRgb['b'], $a));
            }
        }
    }
    
    return $img;
}

function hexToRgb($hex) {
    $hex = ltrim($hex, '#');
    return [
        'r' => hexdec(substr($hex, 0, 2)),
        'g' => hexdec(substr($hex, 2, 2)),
        'b' => hexdec(substr($hex, 4, 2))
    ];
}

function rgbToHsv($r, $g, $b) {
    $r = $r / 255;
    $g = $g / 255;
    $b = $b / 255;
    
    $max = max($r, $g, $b);
    $min = min($r, $g, $b);
    $delta = $max - $min;
    
    $h = 0;
    if($delta != 0) {
        if($max == $r) {
            $h = 60 * fmod((($g - $b) / $delta), 6);
        } elseif($max == $g) {
            $h = 60 * ((($b - $r) / $delta) + 2);
        } else {
            $h = 60 * ((($r - $g) / $delta) + 4);
        }
    }
    if($h < 0) $h += 360;
    
    $s = ($max == 0) ? 0 : ($delta / $max);
    $v = $max;
    
    return ['h' => $h, 's' => $s, 'v' => $v];
}

function hsvToRgb($h, $s, $v) {
    $c = $v * $s;
    $x = $c * (1 - abs(fmod(($h / 60), 2) - 1));
    $m = $v - $c;
    
    $rp = 0; $gp = 0; $bp = 0;
    
    if($h >= 0 && $h < 60) {
        $rp = $c; $gp = $x; $bp = 0;
    } elseif($h >= 60 && $h < 120) {
        $rp = $x; $gp = $c; $bp = 0;
    } elseif($h >= 120 && $h < 180) {
        $rp = 0; $gp = $c; $bp = $x;
    } elseif($h >= 180 && $h < 240) {
        $rp = 0; $gp = $x; $bp = $c;
    } elseif($h >= 240 && $h < 300) {
        $rp = $x; $gp = 0; $bp = $c;
    } else {
        $rp = $c; $gp = 0; $bp = $x;
    }
    
    return [
        'r' => round(($rp + $m) * 255),
        'g' => round(($gp + $m) * 255),
        'b' => round(($bp + $m) * 255)
    ];
}

function procCube($usrImg, $w, $h, $idxStr, $icnsDir, $p1Color = null) {
    $hdBase = imagecreatefrompng('player_01-hd.png');
    if($hdBase === false) throw new Exception('HD template missing');
    
    imagealphablending($hdBase, true);
    imagesavealpha($hdBase, true);

    $reszHd = imagecreatetruecolor(55, 56);
    imagealphablending($reszHd, false);
    imagesavealpha($reszHd, true);
    $transp = imagecolorallocatealpha($reszHd, 0, 0, 0, 127);
    imagefill($reszHd, 0, 0, $transp);
    imagecopyresampled($reszHd, $usrImg, 0, 0, 0, 0, 55, 56, $w, $h);
    
    if($p1Color) {
        $reszHd = invertColorImg($reszHd, $p1Color);
    }

    $rotHd = imagerotate($reszHd, -90, imagecolorallocatealpha($reszHd, 0, 0, 0, 127));
    imagealphablending($rotHd, false);
    imagesavealpha($rotHd, true);

    imagecopy($hdBase, $rotHd, 71, 5, 0, 0, imagesx($rotHd), imagesy($rotHd));
    imagepng($hdBase, $icnsDir . "/player_{$idxStr}-hd.png");
    
    imagedestroy($reszHd);
    imagedestroy($rotHd);
    imagedestroy($hdBase);

    $uhdBase = imagecreatefrompng('player_01-uhd.png');
    if($uhdBase === false) throw new Exception('UHD template missing');
    
    imagealphablending($uhdBase, true);
    imagesavealpha($uhdBase, true);

    $reszUhd = imagecreatetruecolor(108, 108);
    imagealphablending($reszUhd, false);
    imagesavealpha($reszUhd, true);
    $transp = imagecolorallocatealpha($reszUhd, 0, 0, 0, 127);
    imagefill($reszUhd, 0, 0, $transp);
    imagecopyresampled($reszUhd, $usrImg, 0, 0, 0, 0, 108, 108, $w, $h);
    
    if($p1Color) {
        $reszUhd = invertColorImg($reszUhd, $p1Color);
    }

    imagecopy($uhdBase, $reszUhd, 37, 8, 0, 0, 108, 108);
    imagepng($uhdBase, $icnsDir . "/player_{$idxStr}-uhd.png");
    
    imagedestroy($reszUhd);
    imagedestroy($uhdBase);

    $hdPlist = file_get_contents('player_01-hd.plist');
    $hdPlist = str_replace('player_01', 'player_' . $idxStr, $hdPlist);
    file_put_contents($icnsDir . "/player_{$idxStr}-hd.plist", $hdPlist);
    
    $uhdPlist = file_get_contents('player_01-uhd.plist');
    $uhdPlist = str_replace('player_01', 'player_' . $idxStr, $uhdPlist);
    file_put_contents($icnsDir . "/player_{$idxStr}-uhd.plist", $uhdPlist);
}

function procWave($usrImg, $w, $h, $idxStr, $icnsDir, $p2Color = null) {
    $hdBase = imagecreatefrompng('dart_01-hd.png');
    if($hdBase === false) throw new Exception('Wave HD template missing');
    
    imagealphablending($hdBase, true);
    imagesavealpha($hdBase, true);

    $waveHd = imagecreatetruecolor(24, 25);
    imagealphablending($waveHd, false);
    imagesavealpha($waveHd, true);
    $transp = imagecolorallocatealpha($waveHd, 0, 0, 0, 127);
    imagefill($waveHd, 0, 0, $transp);
    imagecopyresampled($waveHd, $usrImg, 0, 0, 0, 0, 24, 25, $w, $h);
    
    if($p2Color) {
        $waveHd = invertColorImg($waveHd, $p2Color);
    }
    
    $waveHdCirc = imagecreatetruecolor(24, 25);
    imagealphablending($waveHdCirc, false);
    imagesavealpha($waveHdCirc, true);
    imagefill($waveHdCirc, 0, 0, $transp);
    
    for($y = 0; $y < 25; $y++) {
        for($x = 0; $x < 24; $x++) {
            $dx = $x - 12;
            $dy = $y - 12.5;
            $dist = sqrt($dx*$dx + $dy*$dy);
            if($dist <= 12.5) {
                $clr = imagecolorat($waveHd, $x, $y);
                imagesetpixel($waveHdCirc, $x, $y, $clr);
            }
        }
    }
    
    imagecopy($hdBase, $waveHdCirc, 3, 102, 0, 0, 24, 25);
    imagepng($hdBase, $icnsDir . "/dart_{$idxStr}-hd.png");
    
    imagedestroy($waveHd);
    imagedestroy($waveHdCirc);
    imagedestroy($hdBase);

    $uhdBase = imagecreatefrompng('dart_01-uhd.png');
    if($uhdBase === false) throw new Exception('Wave UHD template missing');
    
    imagealphablending($uhdBase, true);
    imagesavealpha($uhdBase, true);

    $waveUhd = imagecreatetruecolor(48, 53);
    imagealphablending($waveUhd, false);
    imagesavealpha($waveUhd, true);
    $transp = imagecolorallocatealpha($waveUhd, 0, 0, 0, 127);
    imagefill($waveUhd, 0, 0, $transp);
    imagecopyresampled($waveUhd, $usrImg, 0, 0, 0, 0, 48, 53, $w, $h);
    
    if($p2Color) {
        $waveUhd = invertColorImg($waveUhd, $p2Color);
    }
    
    $waveUhdCirc = imagecreatetruecolor(48, 53);
    imagealphablending($waveUhdCirc, false);
    imagesavealpha($waveUhdCirc, true);
    imagefill($waveUhdCirc, 0, 0, $transp);
    
    for($y = 0; $y < 53; $y++) {
        for($x = 0; $x < 48; $x++) {
            $dx = $x - 24;
            $dy = $y - 26.5;
            $dist = sqrt($dx*$dx + $dy*$dy);
            if($dist <= 26.5) {
                $clr = imagecolorat($waveUhd, $x, $y);
                imagesetpixel($waveUhdCirc, $x, $y, $clr);
            }
        }
    }
    
    imagecopy($uhdBase, $waveUhdCirc, 4, 197, 0, 0, 48, 53);
    imagepng($uhdBase, $icnsDir . "/dart_{$idxStr}-uhd.png");
    
    imagedestroy($waveUhd);
    imagedestroy($waveUhdCirc);
    imagedestroy($uhdBase);

    if(file_exists('dart_01-hd.plist')) {
        $waveHdPlist = file_get_contents('dart_01-hd.plist');
        $waveHdPlist = str_replace('dart_01', 'dart_' . $idxStr, $waveHdPlist);
        file_put_contents($icnsDir . "/dart_{$idxStr}-hd.plist", $waveHdPlist);
    }
    if(file_exists('dart_01-uhd.plist')) {
        $waveUhdPlist = file_get_contents('dart_01-uhd.plist');
        $waveUhdPlist = str_replace('dart_01', 'dart_' . $idxStr, $waveUhdPlist);
        file_put_contents($icnsDir . "/dart_{$idxStr}-uhd.plist", $waveUhdPlist);
    }
}

function procBall($usrImg, $w, $h, $idxStr, $icnsDir, $p1Color = null) {
    $ballHdBase = imagecreatefrompng('player_ball_01-hd.png');
    if($ballHdBase === false) throw new Exception('Ball HD template missing');
    
    imagealphablending($ballHdBase, true);
    imagesavealpha($ballHdBase, true);

    $ballHd = imagecreatetruecolor(65, 66);
    imagealphablending($ballHd, false);
    imagesavealpha($ballHd, true);
    $transp = imagecolorallocatealpha($ballHd, 0, 0, 0, 127);
    imagefill($ballHd, 0, 0, $transp);
    imagecopyresampled($ballHd, $usrImg, 0, 0, 0, 0, 65, 66, $w, $h);
    
    if($p1Color) {
        $ballHd = invertColorImg($ballHd, $p1Color);
    }
    
    $ballHdCirc = imagecreatetruecolor(65, 66);
    imagealphablending($ballHdCirc, false);
    imagesavealpha($ballHdCirc, true);
    imagefill($ballHdCirc, 0, 0, $transp);
    
    for($y = 0; $y < 66; $y++) {
        for($x = 0; $x < 65; $x++) {
            $dx = $x - 32;
            $dy = $y - 33;
            $dist = sqrt($dx*$dx + $dy*$dy);
            if($dist <= 32.5) {
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

    $ballUhdBase = imagecreatefrompng('player_ball_01-uhd.png');
    if($ballUhdBase === false) throw new Exception('Ball UHD template missing');
    
    imagealphablending($ballUhdBase, true);
    imagesavealpha($ballUhdBase, true);

    $ballUhd = imagecreatetruecolor(130, 130);
    imagealphablending($ballUhd, false);
    imagesavealpha($ballUhd, true);
    $transp = imagecolorallocatealpha($ballUhd, 0, 0, 0, 127);
    imagefill($ballUhd, 0, 0, $transp);
    imagecopyresampled($ballUhd, $usrImg, 0, 0, 0, 0, 130, 130, $w, $h);
    
    if($p1Color) {
        $ballUhd = invertColorImg($ballUhd, $p1Color);
    }
    
    $ballUhdCirc = imagecreatetruecolor(130, 130);
    imagealphablending($ballUhdCirc, false);
    imagesavealpha($ballUhdCirc, true);
    imagefill($ballUhdCirc, 0, 0, $transp);
    
    for($y = 0; $y < 130; $y++) {
        for($x = 0; $x < 130; $x++) {
            $dx = $x - 65;
            $dy = $y - 65;
            $dist = sqrt($dx*$dx + $dy*$dy);
            if($dist <= 65) {
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

    if(file_exists('player_ball_01-hd.plist')) {
        $ballHdPlist = file_get_contents('player_ball_01-hd.plist');
        $ballHdPlist = str_replace('player_ball_01', 'player_ball_' . $idxStr, $ballHdPlist);
        file_put_contents($icnsDir . "/player_ball_{$idxStr}-hd.plist", $ballHdPlist);
    }
    if(file_exists('player_ball_01-uhd.plist')) {
        $ballUhdPlist = file_get_contents('player_ball_01-uhd.plist');
        $ballUhdPlist = str_replace('player_ball_01', 'player_ball_' . $idxStr, $ballUhdPlist);
        file_put_contents($icnsDir . "/player_ball_{$idxStr}-uhd.plist", $ballUhdPlist);
    }
}
?>
