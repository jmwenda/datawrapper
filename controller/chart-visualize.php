<?php


require_once '../lib/utils/visualizations.php';
require_once '../lib/utils/themes.php';

/*
 * VISUALIZE STEP
 */
$app->get('/chart/:id/visualize', function ($id) use ($app) {
    check_chart_writable($id, function($user, $chart) use ($app) {
        $page = array(
            'chartData' => $chart->loadData(),
            'chart' => $chart,
            'visualizations' => get_visualizations_meta('', true),
            'vis' => get_visualization_meta($chart->getType()),
            'themes' => get_themes_meta()
        );
        add_header_vars($page, 'chart');
        add_editor_nav($page, 3);
        $res = $app->response();
        $res['Cache-Control'] = 'max-age=0';

        $app->render('chart-visualize.twig', $page);
    });
});

