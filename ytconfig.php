<?php
header('Content-Type: application/json');

$vis = false;
$vid = '';

echo json_encode([
    'visible' => $vis,
    'videoId' => $vid
]);
?>
