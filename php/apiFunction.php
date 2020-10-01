<?php
$params = $_SERVER['argv'][0];
$paramsArray = preg_split('/&/', $params);
foreach ($paramsArray as &$param) {
    $param = preg_split('/=/', $param);
}
echo json_encode($paramsArray);


