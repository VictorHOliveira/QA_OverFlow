<?php
/**
 * BloggerCMS - Easiest Static Blog Generator
 *
 * @author      Sarfraz Ahmed <sarfraznawaz2005@gmail.com>
 * @copyright   2015 Sarfraz Ahmed
 * @link        https://bloggercms.github.io
 * @version     1.0.0
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

session_start();

require_once __DIR__ . '/vendor/autoload.php';
require_once 'config.php';
require_once 'files/functions.php';

date_default_timezone_set('Asia/Karachi');

if ($config['mode'] === 'development') {
    ini_set('display_errors', true);
    error_reporting(1);
}

$logWriter = new \Slim\LogWriter(fopen($config['log_path'] . 'applog.log', 'a+'));

$app = new \Slim\Slim([
    'debug' => $config['debug'],
    'templates.path' => 'views/',
    'mode' => $config['mode'],
    'log.writer' => $logWriter,
    'cookies.encrypt' => false,
    'cookies.secret_key' => md5('@!secret!@'),
    'cookies.lifetime' => '20 minutes'
]);

$app->setName($config['appname']);

$app->hook('slim.before.router', function () use ($app, $config) {
    $setting = new \BloggerCMS\Setting();
    $app->view()->setData('app', $app);
    $app->view()->setData('root', ltrim(dirname($_SERVER['SCRIPT_NAME']), '\\'));
    $app->view()->setData('layoutsDir', dirname(__FILE__) . '/layouts/');
    $app->view()->setData('dateFormat', $config['dateFormat']);
    $app->view()->setData('blogURL', $setting->getBlogURL());
});

$log = $app->getLog();
$log->setEnabled(false);

if ($config['mode'] === 'development') {
    $app->configureMode('development', function () use ($log) {
        // $log->setLevel(\Slim\Log::DEBUG);
        // $log->setEnabled(true);
    });
}

require_once 'routes.php';
$app->run();
