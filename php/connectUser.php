<?php
require_once "connection.php";
$gameLink = $_POST['link'];
$login = $_POST['login'];

$query = "SELECT * FROM game WHERE link='$gameLink'";
$result = mysqli_query($link, $query);
$row = mysqli_fetch_assoc($result);
$players = json_decode($row['players']);
array_push($players, $login);
$players = json_encode($players);

$query = "UPDATE game SET players='$players' WHERE link='$gameLink'";
mysqli_query($link, $query);
echo $players;