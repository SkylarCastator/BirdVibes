<?php
// Development router for PHP built-in server
// Routes API requests to api.php, serves React frontend otherwise

define('__ROOT__', __DIR__);
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$frontendDir = __DIR__ . '/frontend/dist';

// API routes -> api.php
if (preg_match('#^/api/#', $uri)) {
    require __DIR__ . '/scripts/api.php';
    return true;
}

// Serve React frontend static files (JS, CSS, images, etc.)
if (file_exists($frontendDir . $uri) && !is_dir($frontendDir . $uri)) {
    $ext = pathinfo($uri, PATHINFO_EXTENSION);
    $mimeTypes = [
        'js' => 'application/javascript',
        'css' => 'text/css',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'ico' => 'image/x-icon',
        'json' => 'application/json',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
    ];
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    readfile($frontendDir . $uri);
    return true;
}

// React SPA fallback - serve index.html for all other routes
if (file_exists($frontendDir . '/index.html')) {
    require $frontendDir . '/index.html';
    return true;
}

// 404
http_response_code(404);
echo "Not found: $uri";
return true;
