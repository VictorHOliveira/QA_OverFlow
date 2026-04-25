<?php
chdir(__DIR__);

require 'vendor/autoload.php';
require 'files/functions.php';

$app = new Slim\Slim();
$app->setName('BloggerCMS');
$app->view()->setData('layoutsDir', dirname(__FILE__) . '/layouts/');

require 'config.php';

$generator = new BloggerCMS\Generator();
$generator->generateBlog();