<?php
require_once "connection.php";

$gameLink = $_POST['link'];
$query = "SELECT * FROM game WHERE link='$gameLink'";
$result = mysqli_query($link, $query);
$row = mysqli_fetch_assoc($result);
if($row)
    echo json_encode($row);
else
    echo json_encode(false);