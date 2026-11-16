<?php
/**
 * Open Graph tags and the PNG link-preview card.
 *
 * @package RunLabCalculator
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

const RUN_LAB_CALCULATOR_CARD_WIDTH = 1200;
const RUN_LAB_CALCULATOR_CARD_HEIGHT = 630;

/**
 * @return array<int, string>
 */
function run_lab_calculator_share_tools(): array
{
    return array('predict', 'pace', 'finish', 'target', 'splits', 'profile', 'ageGrade');
}

function run_lab_calculator_requested_calc(): string
{
    if (! isset($_GET['calc']) || ! is_string($_GET['calc'])) {
        return '';
    }

    $calc = sanitize_text_field(wp_unslash($_GET['calc']));

    return in_array($calc, run_lab_calculator_share_tools(), true) ? $calc : '';
}

/**
 * @return array<int, string>
 */
function run_lab_calculator_card_lines(): array
{
    if (! isset($_GET['card']) || ! is_string($_GET['card'])) {
        return array();
    }

    $raw = wp_unslash($_GET['card']);
    if (strlen($raw) > 800) {
        $raw = substr($raw, 0, 800);
    }

    $raw = wp_strip_all_tags($raw);
    $pieces = preg_split("/\r\n|\n|\r/", $raw);
    if (! is_array($pieces)) {
        return array();
    }

    $lines = array();
    foreach ($pieces as $piece) {
        $line = trim(preg_replace('/\s+/', ' ', $piece) ?? '');
        if ($line === '') {
            continue;
        }
        $lines[] = function_exists('mb_substr') ? mb_substr($line, 0, 80) : substr($line, 0, 80);
        if (count($lines) >= 6) {
            break;
        }
    }

    return $lines;
}

function run_lab_calculator_preview_title(string $calc): string
{
    $labels = array(
        'predict' => 'Predicted time',
        'pace' => 'Race pace',
        'finish' => 'Finishing time',
        'target' => 'Target PB',
        'splits' => 'Race splits',
        'profile' => 'Performance profile',
        'ageGrade' => 'Age-grade result',
    );
    $lines = run_lab_calculator_card_lines();

    return $lines[0] ?? ($labels[$calc] ?? 'RUN-LAB result');
}

function run_lab_calculator_preview_description(): string
{
    $lines = array_slice(run_lab_calculator_card_lines(), 1, 3);
    if ($lines === array()) {
        return 'A RUN-LAB performance result.';
    }

    return implode(' · ', $lines);
}

function run_lab_calculator_request_url(bool $image): string
{
    $host = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field(wp_unslash((string) $_SERVER['HTTP_HOST'])) : '';
    $uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash((string) $_SERVER['REQUEST_URI']) : '/';
    $url = (is_ssl() ? 'https://' : 'http://') . $host . $uri;
    $url = remove_query_arg('run_lab_card', $url);

    if ($image) {
        $url = add_query_arg('run_lab_card', '1', $url);
    }

    return $url;
}

function run_lab_calculator_page_has_calculator(): bool
{
    if (! is_singular()) {
        return false;
    }

    $post = get_post();

    return $post instanceof WP_Post && has_shortcode($post->post_content, 'run_lab_calculator');
}

function run_lab_calculator_share_preview_tags(): void
{
    $calc = run_lab_calculator_requested_calc();
    if ($calc === '' || ! run_lab_calculator_page_has_calculator()) {
        return;
    }

    $title = run_lab_calculator_preview_title($calc);
    $description = run_lab_calculator_preview_description();
    $url = run_lab_calculator_request_url(false);
    $image = run_lab_calculator_request_url(true);

    echo '<meta property="og:type" content="website" />' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($description) . '" />' . "\n";
    echo '<meta property="og:url" content="' . esc_url($url) . '" />' . "\n";
    echo '<meta property="og:image" content="' . esc_url($image) . '" />' . "\n";
    echo '<meta property="og:image:width" content="' . RUN_LAB_CALCULATOR_CARD_WIDTH . '" />' . "\n";
    echo '<meta property="og:image:height" content="' . RUN_LAB_CALCULATOR_CARD_HEIGHT . '" />' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr($description) . '" />' . "\n";
    echo '<meta name="twitter:image" content="' . esc_url($image) . '" />' . "\n";
}

function run_lab_calculator_font_path(): string
{
    $candidates = array(
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        'C:\\Windows\\Fonts\\arial.ttf',
    );

    foreach ($candidates as $path) {
        if (is_readable($path)) {
            return $path;
        }
    }

    return '';
}

function run_lab_calculator_output_plain_png(): void
{
    echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
}

function run_lab_calculator_short_page_address(string $url): string
{
    if (strlen($url) <= 90) {
        return $url;
    }

    return substr($url, 0, 87) . '...';
}

/**
 * @param array<int, string> $lines
 */
function run_lab_calculator_output_card_png(array $lines, string $pageUrl): void
{
    if (! function_exists('imagecreatetruecolor')) {
        run_lab_calculator_output_plain_png();

        return;
    }

    $width = RUN_LAB_CALCULATOR_CARD_WIDTH;
    $height = RUN_LAB_CALCULATOR_CARD_HEIGHT;
    $image = imagecreatetruecolor($width, $height);
    if ($image === false) {
        run_lab_calculator_output_plain_png();

        return;
    }

    $black = imagecolorallocate($image, 17, 17, 17);
    $white = imagecolorallocate($image, 255, 255, 255);
    $amber = imagecolorallocate($image, 255, 180, 0);
    $grey = imagecolorallocate($image, 189, 189, 189);
    imagefilledrectangle($image, 0, 0, $width, $height, $black);
    imagefilledrectangle($image, 0, 0, $width, 12, $amber);

    $font = run_lab_calculator_font_path();
    if ($font !== '' && function_exists('imagettftext')) {
        imagettftext($image, 22, 0, 72, 90, $amber, $font, 'RUN-LAB');
        $y = 180;
        foreach ($lines as $index => $line) {
            $size = $index === 0 ? 48 : 28;
            imagettftext($image, $size, 0, 72, $y, $white, $font, $line);
            $y += $index === 0 ? 78 : 48;
            if ($y > $height - 120) {
                break;
            }
        }
        imagettftext($image, 18, 0, 72, $height - 48, $grey, $font, run_lab_calculator_short_page_address($pageUrl));
    } else {
        imagestring($image, 5, 72, 70, 'RUN-LAB', $amber);
        $y = 140;
        foreach ($lines as $line) {
            imagestring($image, 5, 72, $y, $line, $white);
            $y += 28;
        }
        imagestring($image, 3, 72, $height - 40, run_lab_calculator_short_page_address($pageUrl), $grey);
    }

    imagepng($image);
    imagedestroy($image);
}

function run_lab_calculator_maybe_render_card(): void
{
    if (! isset($_GET['run_lab_card']) || $_GET['run_lab_card'] !== '1') {
        return;
    }

    if (run_lab_calculator_requested_calc() === '') {
        status_header(404);
        exit;
    }

    header('Content-Type: image/png');
    header('Cache-Control: public, max-age=86400');
    run_lab_calculator_output_card_png(
        run_lab_calculator_card_lines(),
        run_lab_calculator_request_url(false)
    );
    exit;
}

add_action('wp_head', 'run_lab_calculator_share_preview_tags', 1);
add_action('template_redirect', 'run_lab_calculator_maybe_render_card');
