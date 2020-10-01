<?php
/* abcp API
$md5Pass = md5("");
$sURL = "http://id31190.public.api.abcp.ru/articles/brands?userlogin=api@id31190&userpsw=a7180f6efbdf576628074f68b234cf0a&number=TS31671&format=bnpich";
//$sURL = "http://abcp.ru/articles/brands";
//$sPD = "userlogin=admin";
$aHTTP = array(
    'http' => // Обертка, которая будет использоваться
        array(
            'method'  => 'GET', // Метод запроса
            // Ниже задаются заголовки запроса
            'header'  => 'Content-type: application/x-www-form-urlencoded'
        )
);
$context = stream_context_create($aHTTP);
$contents = file_get_contents($sURL, false, $context);
echo $contents;
*/
/*
 *
$sURL = "http://tabletop/php/apiFunction.php?userlogin=api@id31190&userpsw=a7180f6efbdf576628074f68b234cf0a&number=TS31671&format=bnpich";
$aHTTP = array(
    'http' => // Обертка, которая будет использоваться
        array(
            'method'  => 'GET', // Метод запроса
            // Ниже задаются заголовки запроса
            'header'  => 'Content-type: application/x-www-form-urlencoded'
        )
);
$context = stream_context_create($aHTTP);
$contents = file_get_contents($sURL, false, $context);
echo $contents;

*/

//$link = mysqli_connect('domavto.su', 'domavto_sto', 'KcK605%*z7', 'domavto_sto');
$link = mysqli_connect('localhost', 'shop', 'WDhRpGhyRUYrQGn8', 'domavto_shop');
if (!$link) {
    die('Ошибка соединения: ' . mysqli_error($link));
}
else {
    mysqli_set_charset($link, "utf8");
    $query = "SELECT * FROM product";
    $result = mysqli_query($link, $query);
    $row = mysqli_fetch_assoc($result);
    if($row)
        echo json_encode($row);
    else
        echo json_encode(false);
}