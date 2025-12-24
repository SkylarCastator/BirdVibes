<?php

if (!defined('__ROOT__')) {
    define('__ROOT__', dirname(dirname(__FILE__)));
}
require_once(__ROOT__ . '/scripts/common.php');

set_timezone();
$config = get_config();
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

header('Content-Type: application/json');

// CORS headers for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($requestMethod === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Route handling
try {
  // GET /api/v1/summary
  if ($requestMethod === 'GET' && $requestUri === '/api/v1/summary') {
    handleSummary();
  }
  // GET /api/v1/detections/today
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/detections/today') {
    handleTodayDetections();
  }
  // GET /api/v1/detections/recent
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/detections/recent') {
    handleRecentDetections();
  }
  // GET /api/v1/species
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/species') {
    handleSpeciesList();
  }
  // GET /api/v1/species/{sci_name}
  elseif ($requestMethod === 'GET' && preg_match('#^/api/v1/species/([^/]+)$#', $requestUri, $matches)) {
    handleSpeciesDetail(urldecode($matches[1]));
  }
  // GET /api/v1/species/{sci_name}/detections
  elseif ($requestMethod === 'GET' && preg_match('#^/api/v1/species/([^/]+)/detections$#', $requestUri, $matches)) {
    handleSpeciesDetections(urldecode($matches[1]));
  }
  // GET /api/v1/recordings/dates
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/recordings/dates') {
    handleRecordingDates();
  }
  // GET /api/v1/recordings/{date}
  elseif ($requestMethod === 'GET' && preg_match('#^/api/v1/recordings/([0-9-]+)$#', $requestUri, $matches)) {
    handleRecordingsByDate($matches[1]);
  }
  // GET /api/v1/config
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/config') {
    handleGetConfig();
  }
  // PUT /api/v1/config
  elseif ($requestMethod === 'PUT' && $requestUri === '/api/v1/config') {
    handleSaveConfig();
  }
  // GET /api/v1/image/{sci_name} (existing)
  elseif ($requestMethod === 'GET' && preg_match('#^/api/v1/image/(\S+)$#', $requestUri, $matches)) {
    handleImage(urldecode($matches[1]));
  }
  // GET /api/v1/charts/daily
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/charts/daily') {
    handleDailyChart();
  }
  // GET /api/v1/analytics/timeline
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/analytics/timeline') {
    handleAnalyticsTimeline();
  }
  // GET /api/v1/analytics/hourly
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/analytics/hourly') {
    handleAnalyticsHourly();
  }
  // GET /api/v1/analytics/top-species
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/analytics/top-species') {
    handleAnalyticsTopSpecies();
  }
  // GET /api/v1/analytics/seasonal
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/analytics/seasonal') {
    handleAnalyticsSeasonal();
  }
  // GET /api/v1/analytics/summary
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/analytics/summary') {
    handleAnalyticsSummary();
  }
  // GET /api/v1/birdweather/stats
  elseif ($requestMethod === 'GET' && $requestUri === '/api/v1/birdweather/stats') {
    handleBirdWeatherStats();
  }
  // GET /api/v1/birdweather/recordings/{sci_name}
  elseif ($requestMethod === 'GET' && preg_match('#^/api/v1/birdweather/recordings/([^/]+)$#', $requestUri, $matches)) {
    handleBirdWeatherRecordings(urldecode($matches[1]));
  }
  else {
    sendError(404, 'Route not found');
  }
} catch (Exception $e) {
  sendError(500, $e->getMessage());
}

// Response helpers
function sendSuccess($data, $meta = []) {
  http_response_code(200);
  echo json_encode([
    'status' => 'success',
    'data' => $data,
    'meta' => array_merge(['timestamp' => date('c')], $meta)
  ]);
  exit;
}

function sendError($code, $message) {
  http_response_code($code);
  echo json_encode([
    'status' => 'error',
    'message' => $message
  ]);
  exit;
}

// GET /api/v1/summary
function handleSummary() {
  $summary = get_summary();
  sendSuccess([
    'total_detections' => (int)$summary['totalcount'],
    'today_detections' => (int)$summary['todaycount'],
    'hour_detections' => (int)$summary['hourcount'],
    'today_species' => (int)$summary['speciestally'],
    'total_species' => (int)$summary['totalspeciestally']
  ]);
}

// GET /api/v1/detections/today
function handleTodayDetections() {
  $db = get_db();
  $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 500) : 100;
  $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
  $species = isset($_GET['species']) ? $_GET['species'] : null;

  $where = "WHERE Date = DATE('now', 'localtime')";
  if ($species) {
    $where .= " AND Sci_Name = :species";
  }

  $sql = "SELECT Date, Time, Com_Name, Sci_Name, Confidence, File_Name
          FROM detections $where
          ORDER BY Time DESC
          LIMIT :limit OFFSET :offset";

  $stmt = $db->prepare($sql);
  $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
  $stmt->bindValue(':offset', $offset, SQLITE3_INTEGER);
  if ($species) {
    $stmt->bindValue(':species', $species, SQLITE3_TEXT);
  }

  $result = $stmt->execute();
  $detections = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['Confidence'] = (float)$row['Confidence'];
    $detections[] = $row;
  }

  // Get total count
  $countSql = "SELECT COUNT(*) as total FROM detections $where";
  $countStmt = $db->prepare($countSql);
  if ($species) {
    $countStmt->bindValue(':species', $species, SQLITE3_TEXT);
  }
  $countResult = $countStmt->execute();
  $total = $countResult->fetchArray(SQLITE3_ASSOC)['total'];

  sendSuccess($detections, ['total' => (int)$total, 'limit' => $limit, 'offset' => $offset]);
}

// GET /api/v1/detections/recent
function handleRecentDetections() {
  $db = get_db();
  $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;

  $stmt = $db->prepare("SELECT Date, Time, Com_Name, Sci_Name, Confidence, File_Name
                        FROM detections
                        ORDER BY Date DESC, Time DESC
                        LIMIT :limit");
  $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
  $result = $stmt->execute();

  $detections = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['Confidence'] = (float)$row['Confidence'];
    $detections[] = $row;
  }

  sendSuccess($detections);
}

// GET /api/v1/species
function handleSpeciesList() {
  $sort = isset($_GET['sort']) ? $_GET['sort'] : 'occurrences';
  $date = isset($_GET['date']) ? $_GET['date'] : null;

  $result = fetch_species_array($sort, $date);
  $species = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $species[] = [
      'sci_name' => $row['Sci_Name'],
      'com_name' => $row['Com_Name'],
      'count' => (int)$row['Count'],
      'max_confidence' => (float)$row['MaxConfidence'],
      'last_date' => $row['Date'],
      'last_time' => $row['Time']
    ];
  }

  sendSuccess($species);
}

// GET /api/v1/species/{sci_name}
function handleSpeciesDetail($sciName) {
  $config = get_config();
  $db = get_db();

  // Get species stats
  $stmt = $db->prepare("SELECT Com_Name, Sci_Name, COUNT(*) as count, MAX(Confidence) as max_confidence,
                        MIN(Date) as first_seen, MAX(Date) as last_seen
                        FROM detections WHERE Sci_Name = :sci_name");
  $stmt->bindValue(':sci_name', $sciName, SQLITE3_TEXT);
  $result = $stmt->execute();
  $row = $result->fetchArray(SQLITE3_ASSOC);

  if (!$row || !$row['Com_Name']) {
    sendError(404, 'Species not found');
  }

  // Get image
  if ($config["IMAGE_PROVIDER"] === 'FLICKR') {
    $image_provider = new Flickr();
  } else {
    $image_provider = new Wikipedia();
  }
  $image = $image_provider->get_image($sciName);

  // Get Wikipedia description
  $wikipedia = new Wikipedia();
  $wiki_info = $wikipedia->get_description($sciName);

  // Get info URL
  $info = get_info_url($sciName);

  sendSuccess([
    'sci_name' => $row['Sci_Name'],
    'com_name' => $row['Com_Name'],
    'count' => (int)$row['count'],
    'max_confidence' => (float)$row['max_confidence'],
    'first_seen' => $row['first_seen'],
    'last_seen' => $row['last_seen'],
    'image' => $image ?: null,
    'description' => $wiki_info['extract'] ?? null,
    'wikipedia_url' => $wiki_info['wikipedia_url'] ?? null,
    'info_url' => $info['URL'],
    'info_site' => $info['TITLE']
  ]);
}

// GET /api/v1/species/{sci_name}/detections
function handleSpeciesDetections($sciName) {
  $sort = isset($_GET['sort']) ? $_GET['sort'] : 'date';
  $date = isset($_GET['date']) ? $_GET['date'] : null;
  $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 50;
  $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

  $db = get_db();
  $where = "WHERE Sci_Name = :sci_name";
  if ($date) {
    $where .= " AND Date = :date";
  }

  $order = $sort === 'confidence' ? 'Confidence DESC' : 'Date DESC, Time DESC';

  $stmt = $db->prepare("SELECT Date, Time, Com_Name, Sci_Name, Confidence, File_Name
                        FROM detections $where
                        ORDER BY $order
                        LIMIT :limit OFFSET :offset");
  $stmt->bindValue(':sci_name', $sciName, SQLITE3_TEXT);
  $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
  $stmt->bindValue(':offset', $offset, SQLITE3_INTEGER);
  if ($date) {
    $stmt->bindValue(':date', $date, SQLITE3_TEXT);
  }

  $result = $stmt->execute();
  $detections = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['Confidence'] = (float)$row['Confidence'];
    $detections[] = $row;
  }

  sendSuccess($detections);
}

// GET /api/v1/recordings/dates
function handleRecordingDates() {
  $db = get_db();
  $stmt = $db->prepare("SELECT DISTINCT Date FROM detections ORDER BY Date DESC LIMIT 60");
  $result = $stmt->execute();

  $dates = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $dates[] = $row['Date'];
  }

  sendSuccess($dates);
}

// GET /api/v1/recordings/{date}
function handleRecordingsByDate($date) {
  $db = get_db();
  $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 100;
  $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
  $species = isset($_GET['species']) ? $_GET['species'] : null;

  $where = "WHERE Date = :date";
  if ($species) {
    $where .= " AND Sci_Name = :species";
  }

  $stmt = $db->prepare("SELECT Date, Time, Com_Name, Sci_Name, Confidence, File_Name
                        FROM detections $where
                        ORDER BY Time DESC
                        LIMIT :limit OFFSET :offset");
  $stmt->bindValue(':date', $date, SQLITE3_TEXT);
  $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
  $stmt->bindValue(':offset', $offset, SQLITE3_INTEGER);
  if ($species) {
    $stmt->bindValue(':species', $species, SQLITE3_TEXT);
  }

  $result = $stmt->execute();
  $recordings = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['Confidence'] = (float)$row['Confidence'];
    $recordings[] = $row;
  }

  sendSuccess($recordings);
}

// GET /api/v1/config
function handleGetConfig() {
  $config = get_config();

  // Mask BirdWeather token for security (show only if set)
  $bwToken = $config['BIRDWEATHER_TOKEN'] ?? '';
  $bwTokenMasked = $bwToken ? '••••' . substr($bwToken, -4) : '';

  // Only expose safe/public config values
  sendSuccess([
    'site_name' => get_sitename(),
    'latitude' => (float)($config['LATITUDE'] ?? 0),
    'longitude' => (float)($config['LONGITUDE'] ?? 0),
    'model' => $config['MODEL'] ?? '',
    'database_lang' => $config['DATABASE_LANG'] ?? 'en',
    'color_scheme' => strtolower($config['COLOR_SCHEME'] ?? 'light'),
    'info_site' => $config['INFO_SITE'] ?? 'ALLABOUTBIRDS',
    'image_provider' => $config['IMAGE_PROVIDER'] ?? 'WIKIPEDIA',
    'birdweather_token' => $bwTokenMasked,
    'birdweather_enabled' => !empty($bwToken)
  ]);
}

// GET /api/v1/image/{sci_name}
function handleImage($sciName) {
  $config = get_config();

  if ($config["IMAGE_PROVIDER"] === 'FLICKR') {
    $image_provider = new Flickr();
  } else {
    $image_provider = new Wikipedia();
  }

  $result = $image_provider->get_image($sciName);

  if ($result == false) {
    sendError(404, 'No image found');
  }

  sendSuccess($result);
}

// GET /api/v1/charts/daily
function handleDailyChart() {
  $config = get_config();
  $home = get_home();
  $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

  $chartPath = "$home/BirdSongs/Extracted/Charts/$date.png";

  if (file_exists($chartPath)) {
    sendSuccess([
      'date' => $date,
      'url' => "/Charts/$date.png",
      'exists' => true
    ]);
  } else {
    sendSuccess([
      'date' => $date,
      'url' => null,
      'exists' => false
    ]);
  }
}

// PUT /api/v1/config
function handleSaveConfig() {
  $input = json_decode(file_get_contents('php://input'), true);

  if (!$input) {
    sendError(400, 'Invalid JSON input');
  }

  // Allowed settings to update
  $allowed = ['SITE_NAME', 'LATITUDE', 'LONGITUDE', 'COLOR_SCHEME', 'INFO_SITE', 'IMAGE_PROVIDER', 'BIRDWEATHER_TOKEN'];
  $settings = [];

  foreach ($allowed as $key) {
    if (isset($input[$key])) {
      $settings[$key] = $input[$key];
    }
  }

  if (empty($settings)) {
    sendError(400, 'No valid settings provided');
  }

  if (save_config($settings)) {
    // Return updated config
    handleGetConfig();
  } else {
    sendError(500, 'Failed to save configuration');
  }
}

// GET /api/v1/analytics/timeline
function handleAnalyticsTimeline() {
  $db = get_db();
  $days = isset($_GET['days']) ? min((int)$_GET['days'], 365) : 30;

  $stmt = $db->prepare("
    SELECT Date as date,
           COUNT(*) as detections,
           COUNT(DISTINCT Sci_Name) as species
    FROM detections
    WHERE Date >= DATE('now', :days || ' days', 'localtime')
    GROUP BY Date
    ORDER BY Date ASC
  ");
  $stmt->bindValue(':days', -$days, SQLITE3_INTEGER);
  $result = $stmt->execute();

  $data = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['detections'] = (int)$row['detections'];
    $row['species'] = (int)$row['species'];
    $data[] = $row;
  }

  sendSuccess($data);
}

// GET /api/v1/analytics/hourly
function handleAnalyticsHourly() {
  $db = get_db();
  $days = isset($_GET['days']) ? min((int)$_GET['days'], 365) : 30;

  $stmt = $db->prepare("
    SELECT substr(Time, 1, 2) as hour,
           COUNT(*) as detections,
           COUNT(DISTINCT Sci_Name) as species
    FROM detections
    WHERE Date >= DATE('now', :days || ' days', 'localtime')
    GROUP BY hour
    ORDER BY hour ASC
  ");
  $stmt->bindValue(':days', -$days, SQLITE3_INTEGER);
  $result = $stmt->execute();

  $data = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['detections'] = (int)$row['detections'];
    $row['species'] = (int)$row['species'];
    $data[] = $row;
  }

  sendSuccess($data);
}

// GET /api/v1/analytics/top-species
function handleAnalyticsTopSpecies() {
  $db = get_db();
  $days = isset($_GET['days']) ? min((int)$_GET['days'], 365) : 30;
  $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;

  $stmt = $db->prepare("
    SELECT Sci_Name as sci_name,
           Com_Name as com_name,
           COUNT(*) as count,
           ROUND(AVG(Confidence), 3) as avg_confidence,
           COUNT(DISTINCT Date) as days_seen
    FROM detections
    WHERE Date >= DATE('now', :days || ' days', 'localtime')
    GROUP BY Sci_Name
    ORDER BY count DESC
    LIMIT :limit
  ");
  $stmt->bindValue(':days', -$days, SQLITE3_INTEGER);
  $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
  $result = $stmt->execute();

  $data = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['count'] = (int)$row['count'];
    $row['avg_confidence'] = (float)$row['avg_confidence'];
    $row['days_seen'] = (int)$row['days_seen'];
    $data[] = $row;
  }

  sendSuccess($data);
}

// GET /api/v1/analytics/seasonal
function handleAnalyticsSeasonal() {
  $db = get_db();

  $stmt = $db->prepare("
    SELECT strftime('%m', Date) as month,
           COUNT(*) as detections,
           COUNT(DISTINCT Sci_Name) as species
    FROM detections
    GROUP BY month
    ORDER BY month ASC
  ");
  $result = $stmt->execute();

  $data = [];
  while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['month'] = (int)$row['month'];
    $row['detections'] = (int)$row['detections'];
    $row['species'] = (int)$row['species'];
    $data[] = $row;
  }

  sendSuccess($data);
}

// GET /api/v1/analytics/summary
function handleAnalyticsSummary() {
  $db = get_db();

  // Total unique species
  $totalSpecies = $db->querySingle("SELECT COUNT(DISTINCT Sci_Name) FROM detections");

  // New species this week
  $newThisWeek = $db->querySingle("
    SELECT COUNT(DISTINCT d1.Sci_Name)
    FROM detections d1
    WHERE d1.Date >= DATE('now', '-7 days', 'localtime')
    AND NOT EXISTS (
      SELECT 1 FROM detections d2
      WHERE d2.Sci_Name = d1.Sci_Name
      AND d2.Date < DATE('now', '-7 days', 'localtime')
    )
  ");

  // Streak days (consecutive days with detections)
  $streakDays = $db->querySingle("
    WITH RECURSIVE dates AS (
      SELECT DATE('now', 'localtime') as d
      UNION ALL
      SELECT DATE(d, '-1 day') FROM dates
      WHERE EXISTS (SELECT 1 FROM detections WHERE Date = DATE(d, '-1 day'))
    )
    SELECT COUNT(*) FROM dates
    WHERE EXISTS (SELECT 1 FROM detections WHERE Date = d)
  ");

  // Busiest hour
  $busiestHour = $db->querySingle("
    SELECT substr(Time, 1, 2)
    FROM detections
    GROUP BY substr(Time, 1, 2)
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ");

  // First detection date
  $firstDetection = $db->querySingle("SELECT MIN(Date) FROM detections");

  // Total detections
  $totalDetections = $db->querySingle("SELECT COUNT(*) FROM detections");

  sendSuccess([
    'total_species' => (int)$totalSpecies,
    'total_detections' => (int)$totalDetections,
    'new_this_week' => (int)$newThisWeek,
    'streak_days' => (int)$streakDays,
    'busiest_hour' => $busiestHour,
    'first_detection' => $firstDetection
  ]);
}

// GET /api/v1/birdweather/stats
function handleBirdWeatherStats() {
  $config = get_config();
  $token = $config['BIRDWEATHER_TOKEN'] ?? '';

  if (empty($token)) {
    sendError(400, 'BirdWeather token not configured');
  }

  // Fetch station stats from BirdWeather API
  $opts = [
    'http' => [
      'method' => 'GET',
      'header' => "Authorization: $token\r\nUser-Agent: BirdNET-Pi\r\n",
      'timeout' => 10
    ]
  ];
  $context = stream_context_create($opts);

  // Get station stats
  $statsUrl = "https://app.birdweather.com/api/v1/stations/$token/stats";
  $statsResponse = @file_get_contents($statsUrl, false, $context);

  if ($statsResponse === false) {
    sendError(500, 'Failed to connect to BirdWeather');
  }

  $stats = json_decode($statsResponse, true);
  if (!$stats || isset($stats['error'])) {
    sendError(400, $stats['error'] ?? 'Invalid BirdWeather response');
  }

  // Get top species
  $speciesUrl = "https://app.birdweather.com/api/v1/stations/$token/species?limit=10";
  $speciesResponse = @file_get_contents($speciesUrl, false, $context);
  $species = $speciesResponse ? json_decode($speciesResponse, true) : null;

  sendSuccess([
    'connected' => true,
    'stats' => $stats,
    'top_species' => $species['species'] ?? []
  ]);
}

// GET /api/v1/birdweather/recordings/{sci_name}
function handleBirdWeatherRecordings($sciName) {
  $config = get_config();
  $token = $config['BIRDWEATHER_TOKEN'] ?? '';
  $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 20) : 5;

  if (empty($token)) {
    sendError(400, 'BirdWeather token not configured');
  }

  $opts = [
    'http' => [
      'method' => 'GET',
      'header' => "User-Agent: BirdNET-Pi\r\n",
      'timeout' => 15
    ]
  ];
  $context = stream_context_create($opts);

  // Search BirdWeather for detections of this species
  $query = urlencode($sciName);
  $url = "https://app.birdweather.com/api/v1/stations/$token/detections?limit=$limit&query=$query";
  $response = @file_get_contents($url, false, $context);

  if ($response === false) {
    sendError(500, 'Failed to fetch from BirdWeather');
  }

  $data = json_decode($response, true);
  if (!$data || isset($data['error'])) {
    sendError(400, $data['error'] ?? 'Invalid BirdWeather response');
  }

  // Extract recordings with audio URLs
  $recordings = [];
  foreach (($data['detections'] ?? []) as $detection) {
    if (!empty($detection['soundscape']['url'])) {
      $recordings[] = [
        'id' => $detection['id'] ?? null,
        'timestamp' => $detection['timestamp'] ?? null,
        'confidence' => $detection['confidence'] ?? null,
        'species' => [
          'commonName' => $detection['species']['commonName'] ?? null,
          'scientificName' => $detection['species']['scientificName'] ?? null,
        ],
        'audio_url' => $detection['soundscape']['url'] ?? null,
        'spectrogram_url' => $detection['soundscape']['spectrogramUrl'] ?? null,
        'duration' => $detection['soundscape']['duration'] ?? null,
        'source' => 'birdweather'
      ];
    }
  }

  sendSuccess([
    'recordings' => $recordings,
    'species' => $sciName,
    'source' => 'birdweather'
  ]);
}
