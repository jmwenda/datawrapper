<?php

require_once '../templates/imported/pages.inc.php';

function add_docs_vars(&$page, $active_url) {
    global $docs_pages;
    $page['navigation'] = array();
    foreach ($docs_pages[$page['language']] as $url => $p) {
        if ($p['show']) {
            $page['navigation'][] = array('url' => '/'.$url, 'title' => $p['title'], 'active' => $active_url == $url);
        }
    }
}

$urls = array();

foreach ($docs_pages as $lang => $pages) {
    foreach ($pages as $url => $p) {
        if (!in_array($url, $urls)) $urls[] = $url;
    }
}

foreach ($urls as $url) {
    $app->get('/' . $url .'/?', function() use ($app, $url, $docs_pages) {
        $page = array();
        add_header_vars($page, 'about');
        $lang = $page['language'];
        $tpl_path = 'imported/' . $lang . '/' . str_replace('/', '-', $url) . '.twig';
        if (!empty($docs_pages[$lang]) && !empty($docs_pages[$lang][$url])) {
            $page['title'] = $docs_pages[$lang][$url]['title'];
            if ($app->request()->get('popup') == 1) $page['xhr'] = true;
            add_docs_vars($page, $url);
            $app->render($tpl_path, $page);
        } else {
            error_page('about', _('Not found'), _('Sorry, but this content is not available in your language, yet.'));
        }
    });
}


$app->get('/docs/?', function() use ($app) {
    $app->redirect('/docs/about');
});
