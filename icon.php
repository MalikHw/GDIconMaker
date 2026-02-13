<?php
header('Content-Type: application/json');

$vis = true;
$url = 'https://forms.gle/YourGoogleFormsLinkHere';

echo json_encode([
    'visible' => $vis,
    'url' => $url
]);
?>
