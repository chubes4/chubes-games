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