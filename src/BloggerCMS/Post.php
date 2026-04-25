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
class Post
{
    const STATUS_PUBLISHED = 'published';
    const STATUS_DRAFT = 'draft';
    const STATUS_TRASH = 'trashed';

    private $metaFile = 'data/posts.json';
    private $categoriesFile = 'data/categories.json';
    private $tagsFile = 'data/tags.json';
    private $settingsFile = 'data/settings.json';

    private function getAndSortPosts()
    {
        $data = MetaDataWriter::getFileData($this->metaFile);
        $dates = [];
        foreach ($data as $key => $value) {
            $dates[] = strtotime($value['dated']);
        }
        array_multisort($dates, SORT_DESC, SORT_NUMERIC, $data);
        return $data;
    }

    private function writePosts($data)
    {
        return MetaDataWriter::writeData($this->metaFile, $data);
    }

    private function flashAndRedirect($message)
    {
        global $app;
        $app->flash('info', $message);
        $app->redirect($_SERVER['HTTP_REFERER']);
    }

    private function getCurrentId()
    {
        global $app;
        $params = $app->router()->getCurrentRoute()->getParams();
        return $params['param'];
    }

    private function preparePostData($post, $dateFormat)
    {
        return [
            'dated' => date($dateFormat),
            'slug' => getSlugName($post['title']),
            'categoryslug' => getSlugName($post['category']),
            'summary' => $this->getSummary($post['body'], 300)
        ];
    }

    private function updateCategoriesAndTags($category, $tags)
    {
        $categoryArray = arrayFlatten([MetaDataWriter::getFileData($this->categoriesFile), $category]);
        $categoryArray = array_unique($categoryArray);
        MetaDataWriter::writeData($this->categoriesFile, $categoryArray);

        $tagArray = arrayFlatten([MetaDataWriter::getFileData($this->tagsFile), $tags]);
        $tagArray = array_unique($tagArray);
        MetaDataWriter::writeData($this->tagsFile, $tagArray);
    }

    public function getAdd()
    {
        global $app;

        $data['categories'] = MetaDataWriter::getFileData($this->categoriesFile);
        sort($data['categories']);
        $data['tags'] = MetaDataWriter::getFileData($this->tagsFile);
        sort($data['tags']);

        $settings = MetaDataWriter::getFileData($this->settingsFile);
        $data['author'] = $settings['author'];

        $app->render('addpost.php', ['title' => 'Add Post', 'data' => $data]);
    }

    public function add()
    {
        global $app;
        $post = $app->request()->post();
        $status = isset($post['addpost']) ? self::STATUS_PUBLISHED : self::STATUS_DRAFT;
        $this->addPost($status);
    }

    protected function addPost($status)
    {
        global $app;
        $post = $app->request()->post();
        $dateFormat = $app->view()->getData('dateFormat');

        $postData = array_merge($post, $this->preparePostData($post, $dateFormat));
        $postData['status'] = $status;

        MetaDataWriter::updateFileData($this->metaFile, $postData, true);
        $this->updateCategoriesAndTags($post['category'], $post['tags']);

        $this->flashAndRedirect('Saved Successfully');
    }

    public function get()
    {
        global $app;

        $data = $this->getAndSortPosts();
        $data['categories'] = MetaDataWriter::getFileData($this->categoriesFile);
        sort($data['categories']);

        $app->render('posts.php', ['title' => 'View Posts', 'data' => $data]);
    }

    public function edit()
    {
        global $app;

        $data = $this->getAndSortPosts();
        $id = $this->getCurrentId();

        $data[$id]['categories'] = MetaDataWriter::getFileData($this->categoriesFile);
        sort($data['categories']);

        $allTags = MetaDataWriter::getFileData($this->tagsFile);
        $postTags = $data[$id]['tags'];

        $data[$id]['tagsAll'] = array_unique(array_merge($allTags, $postTags));
        sort($data[$id]['tagsAll']);

        $app->render('editpost.php', ['title' => 'Edit Post', 'data' => $data[$id], 'id' => $id]);
    }

    public function update()
    {
        global $app;

        $data = $this->getAndSortPosts();
        $post = $app->request()->post();
        $id = $this->getCurrentId();

        foreach ($post as $key => $value) {
            $data[$id][$key] = $value;
        }

        if ($post['status'] === self::STATUS_PUBLISHED && $post['prevStatus'] === self::STATUS_DRAFT) {
            $data[$id]['dated'] = date($app->view()->getData('dateFormat'));
        }

        $data[$id]['slug'] = getSlugName($post['title']);
        $data[$id]['categoryslug'] = getSlugName($post['category']);
        $data[$id]['summary'] = $this->getSummary($post['body'], 300);

        $this->writePosts($data);
        $this->updateCategoriesAndTags($post['category'], $post['tags']);

        $this->flashAndRedirect('Saved Successfully');
    }

    public function remove()
    {
        $data = $this->getAndSortPosts();
        $id = $this->getCurrentId();
        $data[$id]['status'] = self::STATUS_TRASH;
        $this->writePosts($data);
        $this->flashAndRedirect('Deleted Successfully');
    }

    public function restore()
    {
        $data = $this->getAndSortPosts();
        $id = $this->getCurrentId();
        $data[$id]['status'] = self::STATUS_DRAFT;
        $this->writePosts($data);
        $this->flashAndRedirect('Restored Successfully');
    }

    public function publish()
    {
        global $app;

        $data = $this->getAndSortPosts();
        $id = $this->getCurrentId();

        $data[$id]['dated'] = date($app->view()->getData('dateFormat'));
        $data[$id]['slug'] = getSlugName($data[$id]['title']);
        $data[$id]['categoryslug'] = getSlugName($data[$id]['category']);
        $data[$id]['status'] = self::STATUS_PUBLISHED;

        $this->writePosts($data);
        $this->flashAndRedirect('Restored Successfully');
    }

    public function removeTrashed()
    {
        global $app;

        $data = $this->getAndSortPosts();
        $id = $this->getCurrentId();

        $postPath = 'public/post/' . getSlugName($data[$id]['title']);
        @rrmdir($postPath);

        unset($data[$id]);
        $this->writePosts($data);

        $this->flashAndRedirect('Restored Successfully');
    }

    public function getTotalPostsCount()
    {
        $data = MetaDataWriter::getFileData($this->metaFile);
        return count($data);
    }

    public function getTotalPostsCountPublished()
    {
        $data = MetaDataWriter::getFileData($this->metaFile);
        return count(array_filter($data, fn($post) => $post['status'] === self::STATUS_PUBLISHED));
    }

    public function getTotalPostsCountDrafts()
    {
        $data = MetaDataWriter::getFileData($this->metaFile);
        return count(array_filter($data, fn($post) => $post['status'] === self::STATUS_DRAFT));
    }

    protected function getSummary($html, $maxChars)
    {
        $parser = new \Parsedown();
        $html = $parser->text($html);

        $html = mb_convert_encoding($html, 'HTML-ENTITIES', "UTF-8");
        $html = mb_substr($html, 0, $maxChars, 'UTF-8') . '...';

        libxml_use_internal_errors(TRUE);

        $dom = new \DOMDocument;
        $dom->strictErrorChecking = FALSE;
        $dom->loadHTML($html);
        $summary = $dom->saveHTML();

        return preg_replace('/^<!DOCTYPE.+?>/', '', str_replace(['<html>', '</html>', '<body>', '</body>'], ['', '', '', ''], $summary));
    }
}