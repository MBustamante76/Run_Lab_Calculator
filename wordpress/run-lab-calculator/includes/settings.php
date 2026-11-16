<?php
/**
 * Settings screen for calculator explanatory copy.
 *
 * @package RunLabCalculator
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

const RUN_LAB_CALCULATOR_COPY_OPTION = 'run_lab_calculator_copy';

/**
 * @return array<int, string>
 */
function run_lab_calculator_intro_fields(): array
{
    return array('eyebrow', 'headlineLead', 'headlineAccent', 'summary', 'sideTitle', 'sideBody');
}

/**
 * @return array<int, string>
 */
function run_lab_calculator_tool_ids(): array
{
    return array('predict', 'pace', 'finish', 'target', 'splits', 'profile', 'ageGrade');
}

/**
 * @return array<int, string>
 */
function run_lab_calculator_tool_fields(): array
{
    return array('title', 'description', 'purpose', 'formLead');
}

/**
 * Built-in wording shipped with the plugin. Empty saved fields fall back to this.
 *
 * @return array<string, mixed>
 */
function run_lab_calculator_copy_defaults(): array
{
    static $defaults = null;

    if (is_array($defaults)) {
        return $defaults;
    }

    $path = plugin_dir_path(__DIR__) . 'copy-defaults.json';
    if (! is_readable($path)) {
        $defaults = array();

        return $defaults;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    $defaults = is_array($decoded) ? $decoded : array();

    return $defaults;
}

/**
 * @param mixed $value
 */
function run_lab_calculator_normalize_copy($value): string
{
    if (! is_string($value)) {
        return '';
    }

    $value = str_replace(array("\r\n", "\r"), "\n", $value);

    return sanitize_textarea_field($value);
}

/**
 * @param array<string, mixed> $source
 * @param array<int, string>   $path
 */
function run_lab_calculator_nested_string(array $source, array $path): string
{
    $current = $source;

    foreach ($path as $key) {
        if (! is_array($current) || ! array_key_exists($key, $current)) {
            return '';
        }
        $current = $current[$key];
    }

    return is_string($current) ? $current : '';
}

/**
 * @param mixed $input
 * @return array<string, mixed>
 */
function run_lab_calculator_sanitize_copy($input): array
{
    if (! is_array($input)) {
        return array();
    }

    $defaults = run_lab_calculator_copy_defaults();
    $clean = array();

    $intro_in = isset($input['intro']) && is_array($input['intro']) ? $input['intro'] : array();
    foreach (run_lab_calculator_intro_fields() as $field) {
        $value = run_lab_calculator_normalize_copy($intro_in[$field] ?? '');
        $default = run_lab_calculator_normalize_copy(run_lab_calculator_nested_string($defaults, array('intro', $field)));
        if ($value !== '' && $value !== $default) {
            $clean['intro'][$field] = $value;
        }
    }

    $disclaimer = run_lab_calculator_normalize_copy($input['disclaimer'] ?? '');
    $default_disclaimer = run_lab_calculator_normalize_copy(run_lab_calculator_nested_string($defaults, array('disclaimer')));
    if ($disclaimer !== '' && $disclaimer !== $default_disclaimer) {
        $clean['disclaimer'] = $disclaimer;
    }

    $tools_in = isset($input['tools']) && is_array($input['tools']) ? $input['tools'] : array();
    foreach (run_lab_calculator_tool_ids() as $id) {
        $tool_in = isset($tools_in[$id]) && is_array($tools_in[$id]) ? $tools_in[$id] : array();
        foreach (run_lab_calculator_tool_fields() as $field) {
            $value = run_lab_calculator_normalize_copy($tool_in[$field] ?? '');
            $default = run_lab_calculator_normalize_copy(run_lab_calculator_nested_string($defaults, array('tools', $id, $field)));
            if ($value !== '' && $value !== $default) {
                $clean['tools'][$id][$field] = $value;
            }
        }
    }

    return $clean;
}

function run_lab_calculator_register_copy_setting(): void
{
    register_setting(
        'run_lab_calculator',
        RUN_LAB_CALCULATOR_COPY_OPTION,
        array(
            'type' => 'array',
            'sanitize_callback' => 'run_lab_calculator_sanitize_copy',
            'default' => array(),
            'show_in_rest' => false,
        )
    );
}

function run_lab_calculator_register_settings_page(): void
{
    add_options_page(
        'RUN-LAB Calculator',
        'RUN-LAB Calculator',
        'manage_options',
        'run-lab-calculator',
        'run_lab_calculator_render_settings_page'
    );
}

function run_lab_calculator_handle_copy_reset(): void
{
    if (! isset($_POST['run_lab_calculator_reset'])) {
        return;
    }

    if (! current_user_can('manage_options')) {
        return;
    }

    check_admin_referer('run_lab_calculator_reset');
    delete_option(RUN_LAB_CALCULATOR_COPY_OPTION);

    wp_safe_redirect(
        add_query_arg(
            array(
                'page' => 'run-lab-calculator',
                'reset' => '1',
            ),
            admin_url('options-general.php')
        )
    );
    exit;
}

add_action('admin_init', 'run_lab_calculator_register_copy_setting');
add_action('admin_init', 'run_lab_calculator_handle_copy_reset');
add_action('admin_menu', 'run_lab_calculator_register_settings_page');

/**
 * @param array<string, mixed> $defaults
 * @param array<string, mixed> $saved
 * @param array<int, string>   $path
 */
function run_lab_calculator_effective_string(array $defaults, array $saved, array $path): string
{
    $override = run_lab_calculator_nested_string($saved, $path);
    if ($override !== '') {
        return $override;
    }

    return run_lab_calculator_nested_string($defaults, $path);
}

/**
 * @param array<string, mixed> $defaults
 */
function run_lab_calculator_tool_heading(array $defaults, string $id): string
{
    $numbers = array(
        'predict' => '01',
        'pace' => '02',
        'finish' => '03',
        'target' => '04',
        'splits' => '05',
        'profile' => '06',
        'ageGrade' => '07',
    );
    $title = run_lab_calculator_nested_string($defaults, array('tools', $id, 'title'));
    $number = $numbers[$id] ?? '';

    if ($title === '') {
        return 'Tool ' . $number;
    }

    return 'Tool ' . $number . ' — ' . $title;
}

function run_lab_calculator_render_textarea(string $id, string $name, string $label, string $value, int $rows): void
{
    ?>
    <tr>
        <th scope="row">
            <label for="<?php echo esc_attr($id); ?>"><?php echo esc_html($label); ?></label>
        </th>
        <td>
            <textarea class="large-text" rows="<?php echo (int) $rows; ?>" id="<?php echo esc_attr($id); ?>" name="<?php echo esc_attr($name); ?>"><?php echo esc_textarea($value); ?></textarea>
        </td>
    </tr>
    <?php
}

function run_lab_calculator_render_settings_page(): void
{
    if (! current_user_can('manage_options')) {
        return;
    }

    $defaults = run_lab_calculator_copy_defaults();
    $saved = get_option(RUN_LAB_CALCULATOR_COPY_OPTION, array());
    if (! is_array($saved)) {
        $saved = array();
    }

    $intro_labels = array(
        'eyebrow' => 'Eyebrow',
        'headlineLead' => 'Headline, first line',
        'headlineAccent' => 'Headline, second line',
        'summary' => 'Summary',
        'sideTitle' => 'Side note title',
        'sideBody' => 'Side note',
    );
    $tool_labels = array(
        'title' => 'Card title',
        'description' => 'Short description',
        'purpose' => 'What is it for?',
        'formLead' => 'Form introduction',
    );
    $tool_rows = array(
        'title' => 2,
        'description' => 3,
        'purpose' => 10,
        'formLead' => 3,
    );
    ?>
    <div class="wrap">
        <h1>RUN-LAB Calculator</h1>
        <p>Edit the explanatory wording shown around the calculators. Calculations, validation messages and button labels stay as built. Leave a field blank and save to restore that line to the built-in wording.</p>
        <?php if (isset($_GET['reset']) && $_GET['reset'] === '1') : ?>
            <div class="notice notice-success is-dismissible"><p>Calculator copy reset to the built-in wording.</p></div>
        <?php endif; ?>
        <?php if ($defaults === array()) : ?>
            <div class="notice notice-warning"><p>Built-in copy defaults could not be read. Save only the lines you want to change.</p></div>
        <?php endif; ?>

        <form action="options.php" method="post">
            <?php settings_fields('run_lab_calculator'); ?>

            <h2>Introduction</h2>
            <table class="form-table" role="presentation">
                <?php foreach (run_lab_calculator_intro_fields() as $field) : ?>
                    <?php
                    run_lab_calculator_render_textarea(
                        'run-lab-intro-' . $field,
                        'run_lab_calculator_copy[intro][' . $field . ']',
                        $intro_labels[$field],
                        run_lab_calculator_effective_string($defaults, $saved, array('intro', $field)),
                        $field === 'summary' || $field === 'sideBody' ? 3 : 2
                    );
                    ?>
                <?php endforeach; ?>
            </table>

            <h2>Results note</h2>
            <table class="form-table" role="presentation">
                <?php
                run_lab_calculator_render_textarea(
                    'run-lab-disclaimer',
                    'run_lab_calculator_copy[disclaimer]',
                    'Disclaimer',
                    run_lab_calculator_effective_string($defaults, $saved, array('disclaimer')),
                    5
                );
                ?>
            </table>

            <?php foreach (run_lab_calculator_tool_ids() as $id) : ?>
                <h2><?php echo esc_html(run_lab_calculator_tool_heading($defaults, $id)); ?></h2>
                <table class="form-table" role="presentation">
                    <?php foreach (run_lab_calculator_tool_fields() as $field) : ?>
                        <?php
                        run_lab_calculator_render_textarea(
                            'run-lab-tool-' . $id . '-' . $field,
                            'run_lab_calculator_copy[tools][' . $id . '][' . $field . ']',
                            $tool_labels[$field],
                            run_lab_calculator_effective_string($defaults, $saved, array('tools', $id, $field)),
                            $tool_rows[$field]
                        );
                        ?>
                    <?php endforeach; ?>
                </table>
            <?php endforeach; ?>

            <?php submit_button('Save copy'); ?>
        </form>

        <form method="post" action="<?php echo esc_url(admin_url('options-general.php?page=run-lab-calculator')); ?>">
            <?php wp_nonce_field('run_lab_calculator_reset'); ?>
            <input type="hidden" name="run_lab_calculator_reset" value="1" />
            <?php submit_button('Reset to defaults', 'delete', 'submit', false); ?>
        </form>
    </div>
    <?php
}
