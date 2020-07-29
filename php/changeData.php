<?php
require_once "connection.php";

if($_POST['data'] === 'players') {
    $gameLink = $_POST['link'];
    $login = $_POST['login'];

    $query = "SELECT * FROM game WHERE link='$gameLink'";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    $players = json_decode($row['players']);
    $temp = [$login, false, [null, null, null, null, null, null, null], 0];
    $playerId = array_search($temp, $players, true);
    if($playerId !== false){
        if($players[$playerId][1] === true) {
            echo json_encode(false);
            exit;
        }
        $players[$playerId][1] = true;
        $players = json_encode($players, JSON_UNESCAPED_UNICODE);
        $query = "UPDATE game SET players='$players' WHERE link='$gameLink'";
        mysqli_query($link, $query);
        echo json_encode(true);
    }
    else
        echo json_encode(false);
}
else if($_POST['data'] === 'position') {
    $gameLink = $_POST['link'];
    $gameGrid = $_POST['grid'];

    $query = "UPDATE game SET game_grid='$gameGrid' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    echo json_encode(true);
}
else if($_POST['data'] === 'moveInHand') {
    $gameLink = $_POST['link'];
    $gameGrid = $_POST['grid'];
    $players = $_POST['players'];

    $query = "UPDATE game SET players='$players', game_grid='$gameGrid' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    echo json_encode($players);
}