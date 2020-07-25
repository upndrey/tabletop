<?php
require_once "connection.php";
$data = [];
$data = json_encode($data);
$players = [];
array_push($players, $_POST['login']);
$players = json_encode($players);
$randomLink = uniqid(rand(), 1);
$query = "INSERT INTO game (info, players, link) VALUES ('$data', '$players', '$randomLink')";
mysqli_query($link, $query);
header('Location: http://tabletop/game.html?' . $randomLink);
exit;