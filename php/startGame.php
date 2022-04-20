<?php
require_once "connection.php";
if(isset($_POST['new_game'])) {
    $login = $_POST['new_login'];

    $gameId = 1;
    $query = "SELECT list FROM grid WHERE game_type_id='$gameId'";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    $grid = json_encode($row['list'], JSON_UNESCAPED_UNICODE);

    $query = "SELECT list FROM items WHERE game_type_id='$gameId'";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    $items = json_encode($row['list'], JSON_UNESCAPED_UNICODE);

    $players = [];
    array_push($players, [$login, false, [null, null, null, null, null, null, null], 0]);
    $players = json_encode($players, JSON_UNESCAPED_UNICODE);

    $status = "lobby";

    $gameLink = uniqid();

    $query = "INSERT INTO game (game_grid, players, status, items, link) VALUES (" . $grid .",'" .$players. "', '$status', " . $items . ", '$gameLink')";
    mysqli_query($link, $query);
    header('Location: https://ruscrabble.000webhostapp.com/game.html?' . $gameLink . ":" . $login);
    exit;
}
else {
    $gameLink = $_POST['connect_link'];
    $login = $_POST['connect_login'];

    $query = "SELECT * FROM game WHERE link='$gameLink'";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    $players = json_decode($row['players']);
    $tempLogin = $login;
    $i = 0;
    $existLogin = $players[$i][0];
    while($tempLogin === $existLogin){
        $tempLogin = $login . $i;
        $i++;
        $existLogin = $players[$i][0];
    }
    $temp = [$tempLogin, false, [null, null, null, null, null, null, null], 0];
    array_push($players, $temp);
    $players = json_encode($players);

    $query = "UPDATE game SET players='$players' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    header('Location: http://tabletop/game.html?' . $gameLink . ":" . $tempLogin);
    exit;
}