<?php
require_once "connection.php";
$data = [];
$data = json_encode($data);
$players = [];
array_push($players, $_POST['login']);
$players = json_encode($players);
$gameLink = $_POST['link'];
$query = "SELECT * FROM game WHERE link='$gameLink'";
$result = mysqli_query($link, $query);
$row = mysqli_fetch_assoc($result);
if($row)
    echo json_encode($row);
else
    echo json_encode(false);