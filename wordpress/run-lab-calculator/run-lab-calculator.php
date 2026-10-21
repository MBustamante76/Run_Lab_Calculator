<?php
/**
 * Plugin Name: RUN-LAB Performance Calculator
 * Description: Mounts the RUN-LAB performance calculator with the shortcode [run_lab_calculator].
 * Version: 0.1.0
 * Author: RUN-LAB
 * Text Domain: run-lab-calculator
 * Requires at least: 6.0
 * Requires PHP: 7.4
 *
 * @package RunLabCalculator
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Register the calculator shortcode.
 */
function run_lab_calculator_register_shortcode(): void
{
    add_shortcode('run_lab_calculator', 'run_lab_calculator_render_shortcode');
}

add_action('init', 'run_lab_calculator_register_shortcode');

/**
 * Render a unique calculator mount and enqueue the compiled assets.
 */
function run_lab_calculator_render_shortcode(): string
{
    static $instance = 0;
    $instance++;

    run_lab_calculator_enqueue_assets();

    $id = 'run-lab-calculator-' . $instance;

    return sprintf(
        '<div id="%1$s" class="run-lab-calculator" data-run-lab-calculator="true"></div>',
        esc_attr($id)
    );
}

/**
 * Enqueue the compiled calculator once per request.
 */
function run_lab_calculator_enqueue_assets(): void
{
    static $enqueued = false;

    if ($enqueued || wp_script_is('run-lab-calculator', 'enqueued')) {
        return;
    }

    $enqueued = true;
    $directory = plugin_dir_path(__FILE__) . 'assets/';
    $url = plugin_dir_url(__FILE__) . 'assets/';
    $script = $directory . 'run-lab-calculator.js';
    $style = $directory . 'run-lab-calculator.css';

    if (is_readable($script)) {
        wp_enqueue_script(
            'run-lab-calculator',
            $url . 'run-lab-calculator.js',
            array(),
            run_lab_calculator_asset_version($script),
            true
        );
    }

    if (is_readable($style)) {
        wp_enqueue_style(
            'run-lab-calculator',
            $url . 'run-lab-calculator.css',
            array(),
            run_lab_calculator_asset_version($style)
        );
    }
}

/**
 * Cache-bust a compiled asset from its modified time.
 */
function run_lab_calculator_asset_version(string $path): string
{
    $modified = filemtime($path);

    return '0.1.0.' . ($modified === false ? '0' : (string) $modified);
}
