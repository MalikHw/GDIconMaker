<?php
header('Content-Type: application/json');

$vis = true;
$vid = 'SVqZWcOQ61E';

echo json_encode([
    'visible' => $vis,
    'videoId' => $vid
]);
?>
