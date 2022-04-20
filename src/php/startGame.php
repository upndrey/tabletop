<?php
require_once "connection.php";
$data = $_POST['data'];
$link = uniqid(rand(),1);
$query = "INSERT INTO game (data, link) VALUES '$data', '$link'";
mysqli_query($link, $query);
exit;