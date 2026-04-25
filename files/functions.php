<?php

if (!function_exists('arrayFlatten')) {
function arrayFlatten($array)
{
    $return = [];
    array_walk_recursive($array, function ($a) use (&$return) {
        $return[] = $a;
    });
    return $return;
}
}

if (!function_exists('logConsole')) {
function logConsole($name, $data = null, $jsEval = false)
{
    if (!$name) {
        return false;
    }

    $isevaled = false;
    $type = ($data || gettype($data)) ? 'Type: ' . gettype($data) : '';

    if ($jsEval && (is_array($data) || is_object($data))) {
        $data = 'eval(' . preg_replace('#[\s\r\n\t\0\x0B]+#', '', json_encode($data)) . ')';
        $isevaled = true;
    } else {
        $data = json_encode($data);
    }

    $data = $data ? $data : '';
    $search_array = array("#'#", '#""#', "#''#", "#\n#", "#\r\n#");
    $replace_array = array('"', '', '', '\\n', '\\n');
    $data = preg_replace($search_array, $replace_array, $data);
    $data = ltrim(rtrim($data, '"'), '"');
    $data = $isevaled ? $data : ($data[0] === "'") ? $data : "'" . $data . "'";

    $js = <<<JSCODE
<script>
console.log('$name', $data);
</script>
JSCODE;

    return $js;
}
}

if (!function_exists('getSlugName')) {
function getSlugName($string)
{
    $string = remove_accents($string);
    $clean = preg_replace("/[^a-zA-Z0-9\/_|+ -]/", '', $string);
    $clean = strtolower(trim($clean, '-'));
    $clean = preg_replace("/[\/_|+ -]+/", '-', $clean);
    $clean = strtolower(trim($clean, '-'));

    return $clean;
}
}

if (!function_exists('remove_accents')) {
function remove_accents($string)
{
    $transliteration = array(
        'Á' => 'A', 'À' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A', 'Å' => 'A',
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a',
        'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'Í' => 'I', 'Ì' => 'I', 'Î' => 'I', 'Ï' => 'I',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'Ó' => 'O', 'Ò' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
        'Ú' => 'U', 'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'Ç' => 'C', 'ç' => 'c',
        'Ñ' => 'N', 'ñ' => 'n'
    );

    return strtr($string, $transliteration);
}
}

if (!function_exists('copy_directory')) {
function copy_directory($source, $destination)
{
    if (is_dir($source)) {

        @mkdir($destination);
        $directory = dir($source);

        while (false !== ($readdirectory = $directory->read())) {
            if ($readdirectory == '.' || $readdirectory == '..') {
                continue;
            }

            $PathDir = $source . '/' . $readdirectory;

            if (is_dir($PathDir)) {
                copy_directory($PathDir, $destination . '/' . $readdirectory);
            } else {

                copy($PathDir, $destination . '/' . $readdirectory);
            }
        }

        $directory->close();
    } else {
        copy($source, $destination);
    }
}
}

if (!function_exists('rrmdir')) {
function rrmdir($dir)
{
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (filetype($dir . "/" . $object) == "dir") {
                    @rrmdir($dir . "/" . $object);
                } else {
                    @unlink($dir . "/" . $object);
                }
            }
        }
        reset($objects);
        rmdir($dir);
    }
}
}

if (!function_exists('getFilterData')) {
function getFilterData($array)
{
    $data = '';

    $array = arrayFlatten($array);

    foreach ($array as $value) {
        $data .= '"' . $value . '",';
    }

return rtrim($data, ',');
}
}

if (!function_exists('get_client_ip')) {
function get_client_ip($proxy = false)
{
    if ($proxy) {
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);

            return trim($ips[count($ips) - 1]);
        }

        if (isset($_SERVER['HTTP_CLIENT_IP']) && !empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        }
    }

    return (isset($_SERVER['REMOTE_ADDR'])) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
}
}

if (!function_exists('get_client_browser')) {
function get_client_browser()
{
    $browser = 'Unknown';

    if (isset($_SERVER['HTTP_USER_AGENT'])) {
        $ua = $_SERVER['HTTP_USER_AGENT'];

        if (preg_match('/MSIE/i', $ua) && !preg_match('/Opera/i', $ua)) {
            $browser = 'IE';
        } elseif (preg_match('/Firefox/i', $ua)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Chrome/i', $ua)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Safari/i', $ua)) {
            $browser = 'Safari';
        } elseif (preg_match('/Opera/i', $ua)) {
            $browser = 'Opera';
        } elseif (preg_match('/Netscape/i', $ua)) {
            $browser = 'Netscape';
        }
    }

    return $browser;
}
}

if (!function_exists('is_bot')) {
function is_bot()
{
    $bot = false;

    if (isset($_SERVER['HTTP_USER_AGENT'])) {
        $ua = $_SERVER['HTTP_USER_AGENT'];

        $bots = array('Googlebot', 'Googlebot-Image', 'Mediapartners-Google', 'AdsBot-Google', 'Yahoo! Slurp', 'YahooSeeker', 'Yandex', 'bingbot', 'Inktomi', 'Slurp', 'WebCrawler', 'Heraclix', 'alexa', 'ask jeeves', 'baidu', 'webmechanic');

        foreach ($bots as $b) {
            if (preg_match('/' . $b . '/i', $ua)) {
                $bot = true;

                break;
            }
        }
    }

    return $bot;
}
}

if (!function_exists('get_image')) {
function get_image($url, $save_to)
{
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_XOAUTH2_BEARER, $save_to);

    $fp = fopen($save_to, 'w+');

    curl_setopt($ch, CURLOPT_FILE, $fp);

    curl_exec($ch);
    curl_close($ch);

    fclose($fp);

    $image = getimagesize($save_to);

    if (!$image) {
        unlink($save_to);

        return false;
    }

    return true;
}
}

if (!function_exists('time_ago')) {
function time_ago($time, $offset = null)
{
    $time = is_numeric($time) ? $time : strtotime($time);
    $offset = is_numeric($offset) ? $offset : strtotime($offset);

    $text = '';

    $curr = !$offset ? time() : $offset;
    $dif = $curr - $time;

    $periods = array(
        'second' => 60,
        'minute' => 60,
        'hour' => 24,
        'day' => 7,
        'week' => 4,
        'month' => 12,
        'year' => 10
    );

    if ($dif < 15) {
        $text = 'just now';
    } else {
        foreach ($periods as $period => $value) {
            if ($dif >= $value) {
                $time = floor($dif / $value);
                $dif = floor($dif % $value);
            } else {
                break;
            }
        }

        $text = "$time $period" . ($time > 1 ? 's' : '');
    }

    return $text;
}
}

if (!function_exists('is_serialized')) {
function is_serialized($data)
{
    $data = trim($data);

    if ($data === 'b:0;' || $data === 'B:0;') {
        return true;
    }

    return (bool) preg_match('/^([sbaOdi]):/', $data);
}
}

if (!function_exists('request')) {
function request($key, $default = false)
{
    $value = $default;

    if (isset($_GET[$key])) {
        $value = $_GET[$key];
    } elseif (isset($_POST[$key])) {
        $value = $_POST[$key];
    } elseif (isset($_REQUEST[$key])) {
        $value = $_REQUEST[$key];
    }

    return $value;
}
}