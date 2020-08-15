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
    $players = $_POST['players'];

    $query = "UPDATE game SET players='$players', game_grid='$gameGrid' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    echo json_encode(true);
}
else if($_POST['data'] === 'status') {
    $gameLink = $_POST['link'];

    $query = "UPDATE game SET status='game', turn='0' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    echo json_encode(true);
}
else if($_POST['data'] === 'nextTurn') {
    $gameLink = $_POST['link'];
    $query = "SELECT turn FROM game WHERE link='$gameLink'";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    $turn = $row['turn'];
    $turn++;
    $query = "UPDATE game SET turn='$turn' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    echo json_encode(true);
}
else if($_POST['data'] === 'fillHand') {
    $gameLink = $_POST['link'];
    $player = $_POST['player'];
    $query = "SELECT items, players FROM game WHERE link='$gameLink'";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    $items = json_decode($row['items'], JSON_UNESCAPED_UNICODE);
    $players = json_decode($row['players']);
    shuffle($items);
    for($i = 0; $i < count($players); $i++) {
        if($players[$i][0] === $player) {
            $tempPlayer = $players[$i][2];
            for($j = 0; $j < count($tempPlayer); $j++) {
                if($tempPlayer[$j] === null)
                    $tempPlayer[$j] = array_pop($items);
            }
            $players[$i][2] = $tempPlayer;
            break;
        }
    }

    $players = json_encode($players, JSON_UNESCAPED_UNICODE);
    $items = json_encode($items, JSON_UNESCAPED_UNICODE);
    $query = "UPDATE game SET items='$items', players='$players' WHERE link='$gameLink'";
    mysqli_query($link, $query);
    echo json_encode($players);
}