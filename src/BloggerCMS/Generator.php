<?php namespace BloggerCMS;

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
class Generator
{
    private $metaFile = 'data/blog.json';
    private $postsFile = 'data/posts.json';
    private $pagesFile = 'data/pages.json';
    private $settingsFile = 'data/settings.json';
    private $customValuesFile = 'data/customvalues.json';
    private $followFile = 'data/follow.json';
    private $publicDir = 'public/';
    private $parser = null;
    private $generateLog = [];

    public function generateBlog()
    {
        set_time_limit(0);

        global $app;

        $this->parser = new \Parsedown();
        $data = $this->getData();
        $layout = $data['settings']['layout'] ?: 'default';
        $layoutDir = $app->view->getData('layoutsDir') . $layout . '/';

        copy_directory($layoutDir, $this->publicDir);

        $mustache = new \Mustache_Engine([
            'loader' => new \Mustache_Loader_FilesystemLoader($layoutDir),
            'partials_loader' => new \Mustache_Loader_FilesystemLoader($layoutDir . '/partials')
        ]);

        $excludedFiles = ['category', 'post', 'page', 'archive', 'tag'];
        $mustacheFiles = glob($layoutDir . '/*.mustache');

        foreach ($mustacheFiles as $mustacheFile) {
            $fileName = basename($mustacheFile, '.mustache');
            if (in_array($fileName, $excludedFiles)) continue;
            $template = $mustache->loadTemplate($fileName);
            file_put_contents($this->publicDir . $fileName . '.html', $template->render($data));
        }

        $this->cleanupMustacheFiles();

        $this->generatePostPageFiles($mustache, $data, 'post');
        $this->generatePostPageFiles($mustache, $data, 'page');
        $this->generateCategoryTagFiles($mustache, $data, 'category');
        $this->generateCategoryTagFiles($mustache, $data, 'tag');
        $this->generateArchiveFiles($mustache, $data);
        $this->generateRSS($data);
        $this->generateSitemap($data);

        copy('data/blog.json', 'public/data/blog.json');

        echo 'Blog has been generated in <strong>public</strong> folder :)<br><br>';
        echo '<a id="viewGenLog" class="btn btn-primary">View Log</a><br><br>';
        echo '<div id="genlog">' . $this->getGenerateLog() . '</div>';
    }

    private function cleanupMustacheFiles()
    {
        @rrmdir($this->publicDir . 'partials/');
        $mustacheFiles = glob($this->publicDir . '/*.mustache');
        foreach ($mustacheFiles as $mustacheFile) {
            @unlink($mustacheFile);
        }
    }

    protected function getData()
    {
        $data['settings'] = MetaDataWriter::getFileData($this->settingsFile);
        if (empty($data['settings']['url'])) {
            exit('Please specify Blog URL in settings first !');
        }
        
        if (!empty($data['settings']['url_prod'])) {
            $data['settings']['url'] = rtrim($data['settings']['url_prod'], '/');
        } else {
            $data['settings']['url'] = rtrim($data['settings']['url'], '/');
        }
        
        $data['isDarkTheme'] = ($data['settings']['theme'] === 'theme.css');
        
        $data['customValues'] = MetaDataWriter::getFileData($this->customValuesFile);
        $data['pages'] = MetaDataWriter::getFileData($this->pagesFile);
        $data['follow'] = MetaDataWriter::getFileData($this->followFile);

        $posts = MetaDataWriter::getFileData($this->postsFile);
        $data['posts'] = array_filter($posts, fn($post) => $post['status'] !== 'draft' && $post['status'] !== 'trashed');

        $dates = $addedCategories = $categories = $tagsCloud = [];
        foreach ($data['posts'] as $key => $post) {
            $data['posts'][$key]['body'] = $this->parser->text($post['body']);
            $data['posts'][$key]['showbody'] = '1';
            $dates[] = strtotime($post['dated']);

            if (!in_array($post['category'], $addedCategories)) {
                $categories[] = ['category' => $post['category'], 'categoryslug' => $post['categoryslug']];
                $addedCategories[] = $post['category'];
            }
            $tagsCloud[] = $post['tags'];
        }

        array_multisort($dates, SORT_DESC, $data['posts']);
        $data['latestPosts'] = array_slice($data['posts'], 0, 5);

        $data['homePosts'] = $data['posts'];
        foreach ($data['homePosts'] as $key => $post) {
            $data['homePosts'][$key]['showbody'] = '0';
        }

        foreach ($data['posts'] as $key => $post) {
            $data['posts'][$key]['showbody'] = '1';
        }

        sort($categories);
        $data['categories'] = $categories;

        $tagsCloud = arrayFlatten($tagsCloud);
        $tagsCloud = array_unique($tagsCloud);
        natcasesort($tagsCloud);
        $tagFreq = array_count_values($tagsCloud);
        $data['tagsCloud'] = $this->generateTagCloud($tagFreq);

        foreach ($data['pages'] as $key => $page) {
            $data['pages'][$key]['body'] = $this->parser->text($page['body']);
        }

        $data['archives'] = $this->generateArchives($data['posts']);

        if (!is_dir($this->publicDir . 'data')) {
            mkdir($this->publicDir . 'data', 0755, true);
        }

        MetaDataWriter::writeData($this->metaFile, $data);
        return $data;
    }

    protected function generatePostPageFiles($mustache, $data, $type)
    {
        $dir = $this->publicDir . $type . '/';
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            echo "Error: could not make $type directory";
            return false;
        }

        foreach ($data[$type . 's'] as $item) {
            $data[$type] = $item;
            $template = $mustache->loadTemplate($type);
            $folderPath = $dir . $item['slug'];
            
            if (!is_dir($folderPath) && !mkdir($folderPath, 0755, true)) {
                echo "Error: could not make $folderPath directory";
                continue;
            }
            
            if (file_put_contents($folderPath . '/index.html', $template->render($data))) {
                $this->generateLog[$type . 's'][] = $folderPath . '/index.html';
            }
        }
        return true;
    }

    protected function generateCategoryTagFiles($mustache, $data, $type)
    {
        $dir = $this->publicDir . $type . '/';
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            echo "Error: could not make $type directory";
            return false;
        }

        if ($type === 'category') {
            foreach ($data['categories'] as $item) {
                $itemData = array_filter($data['posts'], fn($post) => $post[$type] === $item['category']);
                $data['categoryPosts'] = array_values($itemData);
                $folderPath = $dir . getSlugName($item['category']);
                
                if (!is_dir($folderPath) && !mkdir($folderPath, 0755, true)) continue;
                
                if (file_put_contents($folderPath . "/index.html", $mustache->loadTemplate($type)->render($data))) {
                    $this->generateLog['categories'][] = $folderPath . "/index.html";
                }
            }
        } else {
            $items = array_unique(arrayFlatten(array_column($data['posts'], 'tags')));
            
            foreach ($items as $item) {
                $itemData = [];
                foreach ($data['posts'] as $post) {
                    if (in_array($item, $post['tags'])) {
                        $itemData[] = $post;
                    }
                }
                $data['tagPosts'] = $itemData;
                $folderPath = $dir . getSlugName($item);
                
                if (!is_dir($folderPath) && !mkdir($folderPath, 0755, true)) continue;
                
                if (file_put_contents($folderPath . "/index.html", $mustache->loadTemplate($type)->render($data))) {
                    $this->generateLog['tags'][] = $folderPath . "/index.html";
                }
            }
        }
    }

    protected function generateTagCloud($data = [], $minFontSize = 12, $maxFontSize = 30)
    {
        $minimumCount = min($data ?: [0]);
        $maximumCount = max($data ?: [0]);
        $spread = $maximumCount - $minimumCount ?: 1;

        $settings = MetaDataWriter::getFileData($this->settingsFile);
        $base = rtrim($settings['url_prod'] ?? $settings['url'], '/');

        $cloudTags = [];
        foreach ($data as $tag => $count) {
            $size = $minFontSize + ($count - $minimumCount) * ($maxFontSize - $minFontSize) / $spread;
            $cloudTags[] = '<a style="font-size: ' . floor($size) . 'px" class="tag_cloud" href="' . $base . '/tag/' . getSlugName($tag) . '" title="' . ($count + 1) . ' total posts">' . htmlspecialchars(stripslashes($tag)) . '</a>';
        }

        return implode("\n", $cloudTags) . "\n";
    }

    protected function generateArchives($posts)
    {
        $archives = '<ul class="archives list-group">';
        $datesSorted = [];

        foreach ($posts as $post) {
            if (!$post['title']) continue;
            $key = date('yyyy-mm-dd', strtotime($post['dated']));
            $datesSorted[$key] = date('F Y', strtotime($post['dated']));
        }

        $datesSorted = array_unique($datesSorted);
        usort($datesSorted, fn($a, $b) => strtotime($a) < strtotime($b));

        $settings = MetaDataWriter::getFileData($this->settingsFile);
        $base = rtrim($settings['url_prod'] ?? $settings['url'], '/');

        foreach ($datesSorted as $date) {
            $archives .= '<li class="list-group-item archive_link"><a href="' . $base . '/archive/' . getSlugName($date) . '">' . $date . '</a></li>';
        }

        return $archives . '</ul>';
    }

    protected function generateArchiveFiles($mustache, $data)
    {
        $archivesDir = $this->publicDir . 'archive/';
        if (!is_dir($archivesDir) && !mkdir($archivesDir, 0755, true)) {
            echo "Error: could not make archives directory";
            return false;
        }

        $processedArchives = [];
        foreach ($data['posts'] as $postItem) {
            $archiveName = getSlugName(date('F Y', strtotime($postItem['dated'])));
            if (in_array($archiveName, $processedArchives)) continue;
            $processedArchives[] = $archiveName;

            $archivesData = array_filter($data['posts'], fn($p) => getSlugName(date('F Y', strtotime($p['dated']))) === $archiveName);
            $data['archivePosts'] = array_values($archivesData);

            $folderPath = $archivesDir . $archiveName;
            if (!is_dir($folderPath) && !mkdir($folderPath, 0755, true)) continue;

            if (file_put_contents($folderPath . "/index.html", $mustache->loadTemplate('archive')->render($data))) {
                $this->generateLog['arhives'][] = $folderPath . "/index.html";
            }
        }
    }

    protected function generateRSS($data)
    {
        $newline = PHP_EOL;
        $rssfeed = '<?xml version="1.0" encoding="ISO-8859-1"?>' . $newline;
        $rssfeed .= '<rss version="2.0"><channel>' . $newline;
        $rssfeed .= '<title>' . $data['settings']['title'] . '</title>' . $newline;
        $rssfeed .= '<link>' . $data['settings']['url'] . '</link>' . $newline;
        $rssfeed .= '<description>' . $data['settings']['tagline'] . '</description>' . $newline;
        $rssfeed .= '<language>en-us</language>' . $newline;

        foreach ($data['posts'] as $post) {
            $rssfeed .= '<item>' . $newline;
            $rssfeed .= '<title>' . $post['title'] . '</title>' . $newline;
            $rssfeed .= '<description><![CDATA[' . $post['body'] . ']]></description>' . $newline;
            $rssfeed .= '<link>' . $data['settings']['url'] . '/post/' . getSlugName($post['title']) . '</link>' . $newline;
            $rssfeed .= '<pubDate>' . date("D, d M Y H:i:s O", strtotime($post['dated'])) . '</pubDate>' . $newline;
            $rssfeed .= '</item>' . $newline;
        }

        $rssfeed .= '</channel></rss>' . $newline;
        file_put_contents($this->publicDir . 'rss.xml', $rssfeed);
    }

    protected function generateSitemap($data)
    {
        $newline = PHP_EOL;
        $sitemap = '<?xml version="1.0" encoding="UTF-8"?>' . $newline;
        $sitemap .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . $newline;

        foreach ($data['posts'] as $post) {
            $postURL = rtrim($data['settings']['url'], '/') . '/post/' . getSlugName($post['title']);
            $datetime = new \DateTime($post['dated']);
            $sitemap .= '<url><loc>' . $postURL . '/</loc><lastmod>' . $datetime->format('Y-m-d\TH:i:sP') . '</lastmod><changefreq>daily</changefreq><priority>1.00</priority></url>' . $newline;
        }

        foreach ($data['pages'] as $page) {
            $pageURL = rtrim($data['settings']['url'], '/') . '/page/' . getSlugName($page['title']);
            $sitemap .= '<url><loc>' . $pageURL . '/</loc><changefreq>weekly</changefreq><priority>1.00</priority></url>' . $newline;
        }

        $sitemap .= '</urlset>';
        file_put_contents($this->publicDir . 'sitemap.xml', $sitemap);
    }

    protected function getGenerateLog()
    {
        $output = '';
        $sections = ['posts', 'pages', 'categories', 'tags', 'arhives'];
        
        foreach ($sections as $section) {
            if (!empty($this->generateLog[$section])) {
                $output .= '<strong>' . ucfirst($section) . ':</strong><br>' . implode('<br>', array_unique($this->generateLog[$section])) . '<hr>';
            }
        }
        
        return $output;
    }
}
