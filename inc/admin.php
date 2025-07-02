<?php
/**
 * Admin-related functionality for the Chubes Games plugin.
 *
 * @package Chubes_Games
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Creates the custom database table for high scores upon plugin activation.
 */
function chubes_games_activate() {
    global $wpdb;
    $table_name      = $wpdb->prefix . 'chubes_games_scores';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        game_slug varchar(55) NOT NULL,
        player_name varchar(55) DEFAULT 'Guest' NOT NULL,
        player_score int(11) NOT NULL,
        date_recorded datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}
register_activation_hook( CHUBES_GAMES_FILE, 'chubes_games_activate' );


// --- Settings Page ---

/**
 * Adds the admin menu item for the settings page.
 */
function chubes_games_add_admin_menu() {
    add_options_page(
        __( 'Chubes Games Settings', 'chubes-games' ),
        __( 'Chubes Games', 'chubes-games' ),
        'manage_options',
        'chubes-games',
        'chubes_games_options_page_html'
    );
}
add_action( 'admin_menu', 'chubes_games_add_admin_menu' );

/**
 * Initializes the settings page, registers settings, sections, and fields.
 */
function chubes_games_settings_init() {
    register_setting( 'chubes_games_options', 'chubes_games_options', 'chubes_games_options_validate' );

    add_settings_section(
        'chubes_games_section_api_keys',
        __( 'API Keys', 'chubes-games' ),
        'chubes_games_section_api_keys_callback',
        'chubes-games'
    );

    add_settings_field(
        'chubes_games_openai_api_key',
        __( 'OpenAI API Key', 'chubes-games' ),
        'chubes_games_field_openai_api_key_html',
        'chubes-games',
        'chubes_games_section_api_keys',
        [ 'label_for' => 'chubes_games_openai_api_key' ]
    );
}
add_action( 'admin_init', 'chubes_games_settings_init' );

/**
 * Renders the description for the API Keys section.
 */
function chubes_games_section_api_keys_callback() {
    echo '<p>' . __( 'Enter your secret API keys for the various game services.', 'chubes-games' ) . '</p>';
}

/**
 * Renders the HTML for the OpenAI API Key input field.
 */
function chubes_games_field_openai_api_key_html() {
    $options = get_option( 'chubes_games_options' );
    $api_key = isset( $options['openai_api_key'] ) ? $options['openai_api_key'] : '';
    ?>
    <input type="password" id="chubes_games_openai_api_key" name="chubes_games_options[openai_api_key]" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text">
    <p class="description"><?php _e( 'Your secret API key for OpenAI services.', 'chubes-games' ); ?></p>
    <?php
}

/**
 * Sanitizes and validates the options before saving.
 *
 * @param array $input The input options.
 * @return array The sanitized options.
 */
function chubes_games_options_validate( $input ) {
    $new_input = [];
    if ( isset( $input['openai_api_key'] ) ) {
        $new_input['openai_api_key'] = sanitize_text_field( $input['openai_api_key'] );
    }
    return $new_input;
}

/**
 * Renders the main HTML wrapper for the settings page.
 */
function chubes_games_options_page_html() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
        <form action="options.php" method="post">
            <?php
            settings_fields( 'chubes_games_options' );
            do_settings_sections( 'chubes-games' );
            submit_button( __( 'Save Settings', 'chubes-games' ) );
            ?>
        </form>
    </div>
    <?php
} 