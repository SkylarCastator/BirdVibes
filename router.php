<?php
// Development router for PHP built-in server
// Routes API requests to api.php, serves static files otherwise

define('__ROOT__', __DIR__);
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// API routes -> api.php
if (preg_match('#^/api/#', $uri)) {
    require __DIR__ . '/scripts/api.php';
    return true;
}

// Let PHP serve static files
if (file_exists(__DIR__ . '/homepage' . $uri)) {
    if (is_dir(__DIR__ . '/homepage' . $uri)) {
        return false; // Let server handle directory listing
    }
    // Serve PHP files
    if (pathinfo($uri, PATHINFO_EXTENSION) === 'php') {
        require __DIR__ . '/homepage' . $uri;
        return true;
    }
    return false; // Let server handle static files
}

// Default to index.php
if ($uri === '/') {
    require __DIR__ . '/homepage/index.php';
    return true;
}

// 404
http_response_code(404);
echo "Not found: $uri";
return true;
