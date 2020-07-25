<?php
require_once "connection.php";
$data = $_POST['data'];
$randomLink = $_SESSION['link'];
$randomLink = uniqid(rand(),1);
$query = "UPDATE game SET info='$data' WHERE link='$randomLink'";
mysqli_query($link, $query);
header("Location: http://localhost:8080/");
exit;