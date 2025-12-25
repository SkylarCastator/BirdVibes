<?php

if (!defined('__ROOT__')) {
    define('__ROOT__', dirname(dirname(__FILE__)));
}

require_once(__ROOT__ . '/scripts/common.php');
require_once(__ROOT__ . '/scripts/ebird.php');

class EBirdAPI {
  private $api_key;
  private $base_url = "https://api.ebird.org/v2";
  private $context;
  private $lat;
  private $lng;
  private $db;
  private $db_path;
  private $cache_days = 7;

  public function __construct() {
    $config = get_config();
    $this->api_key = $config['EBIRD_API_KEY'] ?? '';
    $this->lat = $config['LATITUDE'] ?? 0;
    $this->lng = $config['LONGITUDE'] ?? 0;
    $this->db_path = __ROOT__ . '/scripts/ebird_cache.db';

    $opts = [
      'http' => [
        'method' => 'GET',
        'header' => "X-eBirdApiToken: {$this->api_key}\r\nUser-Agent: BirdNET-Pi\r\n",
        'timeout' => 15
      ]
    ];
    $this->context = stream_context_create($opts);
    $this->initDb();
  }

  public function isConfigured() {
    return !empty($this->api_key);
  }

  public function getSpeciesCode($sciName) {
    global $ebirds;
    return $ebirds[$sciName] ?? null;
  }

  // Get recent observations of a species near the configured location
  public function getRecentObservations($sciName, $days = 30, $dist = 50) {
    $speciesCode = $this->getSpeciesCode($sciName);
    if (!$speciesCode || $speciesCode === 'null') {
      return ['error' => 'Species not found in eBird database'];
    }

    $cacheKey = "obs_{$speciesCode}_{$days}_{$dist}";
    $cached = $this->getFromCache($cacheKey);
    if ($cached !== null) {
      return $cached;
    }

    $endpoint = "/data/obs/geo/recent/{$speciesCode}";
    $params = [
      'lat' => $this->lat,
      'lng' => $this->lng,
      'dist' => $dist,
      'back' => $days,
      'includeProvisional' => 'true',
      'hotspot' => 'false'
    ];

    $result = $this->request($endpoint, $params);
    if ($result && !isset($result['error'])) {
      $this->saveToCache($cacheKey, $result);
    }
    return $result;
  }

  // Get notable/rare observations nearby
  public function getNotableObservations($days = 14, $dist = 50) {
    $cacheKey = "notable_{$days}_{$dist}";
    $cached = $this->getFromCache($cacheKey, 1); // Cache for 1 day only
    if ($cached !== null) {
      return $cached;
    }

    $endpoint = "/data/obs/geo/recent/notable";
    $params = [
      'lat' => $this->lat,
      'lng' => $this->lng,
      'dist' => $dist,
      'back' => $days,
      'detail' => 'full'
    ];

    $result = $this->request($endpoint, $params);
    if ($result && !isset($result['error'])) {
      $this->saveToCache($cacheKey, $result, 1);
    }
    return $result;
  }

  // Get nearby hotspots
  public function getNearbyHotspots($dist = 50) {
    $cacheKey = "hotspots_{$dist}";
    $cached = $this->getFromCache($cacheKey);
    if ($cached !== null) {
      return $cached;
    }

    $endpoint = "/ref/hotspot/geo";
    $params = [
      'lat' => $this->lat,
      'lng' => $this->lng,
      'dist' => $dist,
      'fmt' => 'json'
    ];

    $result = $this->request($endpoint, $params);
    if ($result && !isset($result['error'])) {
      $this->saveToCache($cacheKey, $result);
    }
    return $result;
  }

  // Get hotspots where a species has been seen
  public function getHotspotsForSpecies($sciName, $regionCode = null) {
    $speciesCode = $this->getSpeciesCode($sciName);
    if (!$speciesCode || $speciesCode === 'null') {
      return ['error' => 'Species not found in eBird database'];
    }

    // If no region code, try to determine from lat/lng
    if (!$regionCode) {
      $regionCode = $this->getRegionCode();
    }

    $cacheKey = "hotspots_species_{$speciesCode}_{$regionCode}";
    $cached = $this->getFromCache($cacheKey);
    if ($cached !== null) {
      return $cached;
    }

    // Get recent observations and extract unique hotspots (max 50km for eBird API)
    $observations = $this->getRecentObservations($sciName, 30, 50);
    if (isset($observations['error'])) {
      return $observations;
    }

    $hotspots = [];
    $seen = [];
    foreach ($observations as $obs) {
      if (!empty($obs['locId']) && !isset($seen[$obs['locId']])) {
        $seen[$obs['locId']] = true;
        $hotspots[] = [
          'locId' => $obs['locId'],
          'locName' => $obs['locName'] ?? 'Unknown',
          'lat' => $obs['lat'] ?? null,
          'lng' => $obs['lng'] ?? null,
          'lastSeen' => $obs['obsDt'] ?? null,
          'count' => $obs['howMany'] ?? null
        ];
      }
    }

    $this->saveToCache($cacheKey, $hotspots);
    return $hotspots;
  }

  // Get frequency data combining local detections with eBird regional data
  public function getFrequencyData($sciName) {
    $speciesCode = $this->getSpeciesCode($sciName);
    if (!$speciesCode || $speciesCode === 'null') {
      return ['error' => 'Species not found in eBird database'];
    }

    // Get local frequency from our database
    $localFreq = $this->getLocalFrequency($sciName);

    // Try to get eBird bar chart data
    $ebirdFreq = $this->getEBirdBarChartData($speciesCode);

    // Combine into weekly data (52 weeks)
    $combined = [];
    for ($week = 1; $week <= 48; $week++) {
      $combined[] = [
        'week' => $week,
        'month' => $this->weekToMonth($week),
        'localFreq' => $localFreq[$week] ?? 0,
        'ebirdFreq' => $ebirdFreq[$week] ?? 0
      ];
    }

    return $combined;
  }

  // Get region code from coordinates via nearby hotspots
  public function getRegionCode() {
    $cacheKey = "region_{$this->lat}_{$this->lng}";
    $cached = $this->getFromCache($cacheKey, 30);
    if ($cached !== null) {
      return $cached;
    }

    // Get nearby hotspots which include subnational1Code
    $hotspots = $this->getNearbyHotspots(25);
    if (!empty($hotspots) && !isset($hotspots['error'])) {
      foreach ($hotspots as $hs) {
        if (!empty($hs['subnational1Code'])) {
          $regionCode = $hs['subnational1Code'];
          $this->saveToCache($cacheKey, $regionCode, 30);
          return $regionCode;
        }
      }
    }

    return null;
  }

  // Get region info for display
  public function getRegionInfo() {
    $regionCode = $this->getRegionCode();
    if (!$regionCode) {
      return ['error' => 'Could not determine region from location'];
    }

    $cacheKey = "region_info_{$regionCode}";
    $cached = $this->getFromCache($cacheKey, 30);
    if ($cached !== null) {
      return $cached;
    }

    $endpoint = "/ref/region/info/{$regionCode}";
    $result = $this->request($endpoint, ['fmt' => 'json']);

    if ($result && !isset($result['error'])) {
      $info = [
        'region_code' => $regionCode,
        'region_name' => $result['result'] ?? $regionCode
      ];
      $this->saveToCache($cacheKey, $info, 30);
      return $info;
    }

    return ['region_code' => $regionCode, 'region_name' => $regionCode];
  }

  // Get all species in region (for collection/pokedex)
  public function getRegionalSpeciesList() {
    $regionCode = $this->getRegionCode();
    if (!$regionCode) {
      return ['error' => 'Could not determine region'];
    }

    $cacheKey = "spplist_{$regionCode}";
    $cached = $this->getFromCache($cacheKey);
    if ($cached !== null) {
      return $cached;
    }

    $endpoint = "/product/spplist/{$regionCode}";
    $speciesCodes = $this->request($endpoint);

    if (isset($speciesCodes['error'])) {
      return $speciesCodes;
    }

    if (!is_array($speciesCodes)) {
      return ['error' => 'Invalid response from eBird'];
    }

    // Reverse lookup: code → scientific name
    global $ebirds;
    $codeToSci = array_flip($ebirds);

    $species = [];
    foreach ($speciesCodes as $code) {
      if (isset($codeToSci[$code])) {
        $species[] = [
          'species_code' => $code,
          'sci_name' => $codeToSci[$code]
        ];
      }
    }

    $this->saveToCache($cacheKey, $species);
    return $species;
  }

  // Get average frequency for rarity calculation
  public function getAverageFrequency($speciesCode) {
    $regionCode = $this->getRegionCode() ?? 'world';

    $cacheKey = "freq_avg_{$speciesCode}_{$regionCode}";
    $cached = $this->getFromCache($cacheKey, 30);
    if ($cached !== null) {
      return $cached;
    }

    $barData = $this->getEBirdBarChartData($speciesCode);
    if (empty($barData)) {
      return 0;
    }

    // Average across all weeks
    $avg = array_sum($barData) / count($barData);
    $this->saveToCache($cacheKey, $avg, 30);
    return $avg;
  }

  // Get local detection frequency by week
  private function getLocalFrequency($sciName) {
    $db = get_db();
    $stmt = $db->prepare("
      SELECT
        CAST(strftime('%W', Date) AS INTEGER) + 1 as week,
        COUNT(*) as count
      FROM detections
      WHERE Sci_Name = :sci_name
      GROUP BY week
    ");
    $stmt->bindValue(':sci_name', $sciName, SQLITE3_TEXT);
    $result = $stmt->execute();

    $freq = [];
    $maxCount = 1;

    // First pass: get counts and max
    $counts = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $week = (int)$row['week'];
      $count = (int)$row['count'];
      $counts[$week] = $count;
      if ($count > $maxCount) {
        $maxCount = $count;
      }
    }

    // Second pass: normalize to 0-1 frequency
    foreach ($counts as $week => $count) {
      $freq[$week] = round($count / $maxCount, 3);
    }

    return $freq;
  }

  // Fetch eBird bar chart data (scrape from website)
  private function getEBirdBarChartData($speciesCode) {
    $regionCode = $this->getRegionCode();
    if (!$regionCode) {
      // Use country-level if we can't determine region
      $regionCode = 'world';
    }

    $cacheKey = "barchart_{$speciesCode}_{$regionCode}";
    $cached = $this->getFromCache($cacheKey);
    if ($cached !== null) {
      return $cached;
    }

    // Try to fetch bar chart data from eBird
    $url = "https://ebird.org/barchart?r={$regionCode}&spp={$speciesCode}&fmt=tsv";
    $data = @file_get_contents($url, false, $this->context);

    if ($data === false) {
      return [];
    }

    $freq = $this->parseBarChartTsv($data, $speciesCode);
    if (!empty($freq)) {
      $this->saveToCache($cacheKey, $freq);
    }

    return $freq;
  }

  // Parse eBird bar chart TSV format
  private function parseBarChartTsv($tsv, $targetSpecies) {
    $lines = explode("\n", $tsv);
    $freq = [];

    foreach ($lines as $line) {
      $parts = explode("\t", $line);
      if (count($parts) < 49) continue;

      // First column is species code, rest are week values
      $speciesCode = trim($parts[0]);
      if ($speciesCode !== $targetSpecies) continue;

      // Weeks 1-48 are in columns 1-48
      for ($i = 1; $i <= 48; $i++) {
        $val = trim($parts[$i] ?? '');
        $freq[$i] = is_numeric($val) ? (float)$val : 0;
      }
      break;
    }

    return $freq;
  }

  private function weekToMonth($week) {
    $months = ['Jan', 'Jan', 'Jan', 'Jan', 'Feb', 'Feb', 'Feb', 'Feb',
               'Mar', 'Mar', 'Mar', 'Mar', 'Apr', 'Apr', 'Apr', 'Apr',
               'May', 'May', 'May', 'May', 'Jun', 'Jun', 'Jun', 'Jun',
               'Jul', 'Jul', 'Jul', 'Jul', 'Aug', 'Aug', 'Aug', 'Aug',
               'Sep', 'Sep', 'Sep', 'Sep', 'Oct', 'Oct', 'Oct', 'Oct',
               'Nov', 'Nov', 'Nov', 'Nov', 'Dec', 'Dec', 'Dec', 'Dec'];
    return $months[$week - 1] ?? 'Jan';
  }

  private function request($endpoint, $params = []) {
    if (!$this->isConfigured()) {
      return ['error' => 'eBird API key not configured'];
    }

    $url = $this->base_url . $endpoint;
    if (!empty($params)) {
      $url .= '?' . http_build_query($params);
    }

    $response = @file_get_contents($url, false, $this->context);

    if ($response === false) {
      $error = error_get_last();
      return ['error' => 'Failed to connect to eBird API: ' . ($error['message'] ?? 'Unknown error')];
    }

    $data = json_decode($response, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
      return ['error' => 'Invalid JSON response from eBird'];
    }

    return $data;
  }

  // SQLite cache methods
  private function initDb() {
    try {
      $this->db = new SQLite3($this->db_path, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
      $this->db->exec("
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        )
      ");
      $this->db->busyTimeout(1000);
    } catch (Exception $e) {
      // Cache unavailable, continue without caching
      $this->db = null;
    }
  }

  private function getFromCache($key, $days = null) {
    if (!$this->db) return null;
    if ($days === null) $days = $this->cache_days;

    try {
      $stmt = $this->db->prepare("SELECT data FROM cache WHERE key = :key AND expires_at > :now");
      $stmt->bindValue(':key', $key, SQLITE3_TEXT);
      $stmt->bindValue(':now', time(), SQLITE3_INTEGER);
      $result = $stmt->execute();
      $row = $result->fetchArray(SQLITE3_ASSOC);

      if ($row) {
        return json_decode($row['data'], true);
      }
    } catch (Exception $e) {
      // Cache read failed
    }

    return null;
  }

  private function saveToCache($key, $data, $days = null) {
    if (!$this->db) return;
    if ($days === null) $days = $this->cache_days;

    try {
      $stmt = $this->db->prepare("INSERT OR REPLACE INTO cache (key, data, expires_at) VALUES (:key, :data, :expires)");
      $stmt->bindValue(':key', $key, SQLITE3_TEXT);
      $stmt->bindValue(':data', json_encode($data), SQLITE3_TEXT);
      $stmt->bindValue(':expires', time() + ($days * 86400), SQLITE3_INTEGER);
      $stmt->execute();
    } catch (Exception $e) {
      // Cache write failed
    }
  }

  // Clean expired cache entries
  public function cleanCache() {
    if (!$this->db) return;
    try {
      $this->db->exec("DELETE FROM cache WHERE expires_at < " . time());
    } catch (Exception $e) {
      // Cleanup failed
    }
  }

  // Get cached collection (1 hour cache)
  public function getCachedCollection() {
    return $this->getFromCache('collection_full', 1/24); // 1 hour = 1/24 days
  }

  // Cache the full collection
  public function cacheCollection($collection) {
    $this->saveToCache('collection_full', $collection, 1/24); // 1 hour
  }

  // Get cached rarity for a species (if pre-computed)
  public function getCachedRarity($speciesCode) {
    $regionCode = $this->getRegionCode() ?? 'world';
    $cacheKey = "rarity_{$speciesCode}_{$regionCode}";
    $cached = $this->getFromCache($cacheKey, 30);
    if ($cached !== null) {
      return $cached;
    }
    return null;
  }

  // Pre-compute and cache rarity for all regional species (for cron job)
  public function precomputeAllRarity() {
    $species = $this->getRegionalSpeciesList();
    if (isset($species['error'])) {
      return $species;
    }

    $regionCode = $this->getRegionCode() ?? 'world';
    $results = [];

    foreach ($species as $sp) {
      $speciesCode = $sp['species_code'];
      $frequency = $this->getAverageFrequency($speciesCode);

      $rarity = 'unknown';
      if ($frequency > 0.20) $rarity = 'common';
      elseif ($frequency > 0.05) $rarity = 'uncommon';
      elseif ($frequency > 0.01) $rarity = 'rare';
      elseif ($frequency > 0) $rarity = 'ultra_rare';

      $data = ['frequency' => $frequency, 'rarity' => $rarity];
      $cacheKey = "rarity_{$speciesCode}_{$regionCode}";
      $this->saveToCache($cacheKey, $data, 30); // 30 days

      $results[$speciesCode] = $data;
    }

    return $results;
  }
}
