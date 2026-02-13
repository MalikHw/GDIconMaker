<?php
header('Content-Type: application/json');

$vis = true;
$url = 'https://forms.gle/MvaJxwneRJxb7gA1A';

echo json_encode([
    'visible' => $vis,
    'url' => $url
]);
?>
