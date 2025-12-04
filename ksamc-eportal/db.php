<?php
// Database settings for XAMPP
// by joshua 12/3/2025 protoype
$host = "localhost";
$user = "root";       // this is the MySQL user
$pass = "";           
$dbname = "ksamc_portal";   

try {
    
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);

    // this is for error reporting
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch (PDOException $e) {
    // and this kills everything if the connection fails
    die("Database connection failed: " . $e->getMessage());
}
?>
