<?php
// Creates a mock SQLite database with sample bird detections for development

$dbPath = __DIR__ . '/../scripts/birds.db';

// Remove existing dev db
if (file_exists($dbPath)) {
    unlink($dbPath);
}

$db = new SQLite3($dbPath);

// Create detections table
$db->exec("CREATE TABLE detections (
    Date TEXT,
    Time TEXT,
    Sci_Name TEXT,
    Com_Name TEXT,
    Confidence REAL,
    File_Name TEXT
)");

// Sample bird species (New Zealand)
$birds = [
    ['Turdus merula', 'Eurasian Blackbird'],
    ['Prosthemadera novaeseelandiae', 'Tui'],
    ['Anthornis melanura', 'New Zealand Bellbird'],
    ['Rhipidura fuliginosa', 'New Zealand Fantail'],
    ['Zosterops lateralis', 'Silvereye'],
    ['Gerygone igata', 'Grey Warbler'],
    ['Gymnorhina tibicen', 'Australian Magpie'],
    ['Todiramphus sanctus', 'Sacred Kingfisher'],
    ['Porphyrio melanotus', 'Australasian Swamphen'],
    ['Circus approximans', 'Swamp Harrier'],
    ['Apteryx mantelli', 'North Island Brown Kiwi'],
    ['Nestor meridionalis', 'New Zealand Kaka'],
];

// Generate detections for the past 7 days
$stmt = $db->prepare("INSERT INTO detections VALUES (:date, :time, :sci, :com, :conf, :file)");

$today = new DateTime();

for ($day = 0; $day < 7; $day++) {
    $date = clone $today;
    $date->modify("-{$day} days");
    $dateStr = $date->format('Y-m-d');

    // Random number of detections per day (20-50)
    $numDetections = rand(20, 50);

    for ($i = 0; $i < $numDetections; $i++) {
        $bird = $birds[array_rand($birds)];
        $hour = rand(5, 20);
        $min = rand(0, 59);
        $sec = rand(0, 59);
        $time = sprintf("%02d:%02d:%02d", $hour, $min, $sec);
        $confidence = rand(50, 99) / 100;
        $fileName = "StreamData/{$dateStr}-birdnet-{$time}.wav";

        $stmt->bindValue(':date', $dateStr);
        $stmt->bindValue(':time', $time);
        $stmt->bindValue(':sci', $bird[0]);
        $stmt->bindValue(':com', $bird[1]);
        $stmt->bindValue(':conf', $confidence);
        $stmt->bindValue(':file', $fileName);
        $stmt->execute();
        $stmt->reset();
    }
}

$db->close();

echo "Created mock database at: $dbPath\n";
echo "Added detections for 7 days with " . count($birds) . " species\n";
