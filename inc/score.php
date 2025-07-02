<?php
/**
 * REST API functionality for scores.
 *
 * @package Chubes_Games
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Register the REST API endpoint for submitting and retrieving scores.
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'chubes-games/v1', '/scores', array(
        array(
            'methods'  => 'POST',
            'callback' => 'chubes_games_submit_score',
            'permission_callback' => '__return_true',
        ),
        array(
            'methods'  => 'GET',
            'callback' => 'chubes_games_get_scores',
            'permission_callback' => '__return_true',
        ),
    ) );
} );

/**
 * Gets the raw score data from the database.
 * This is the new internal function for fetching scores.
 *
 * @return array An array of score objects.
 */
function chubes_games_get_score_data() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'chubes_games_scores';
    
    $results = $wpdb->get_results( "SELECT * FROM $table_name ORDER BY player_score DESC LIMIT 100" );

    return $results;
}

/**
 * Retrieves the top 100 scores for the REST API.
 * This function now acts as a wrapper for the data-fetching function.
 *
 * @return WP_REST_Response The response object containing the scores.
 */
function chubes_games_get_scores() {
    $results = chubes_games_get_score_data();
    return new WP_REST_Response( $results, 200 );
}

/**
 * Handles the score submission from the game block.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
 */
function chubes_games_submit_score( $request ) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'chubes_games_scores';

    $params = $request->get_json_params();
    $game_slug = sanitize_text_field( $params['game'] );
    $score = absint( $params['score'] );

    // Simple validation
    if ( empty( $game_slug ) || ! is_numeric( $score ) || $score <= 0 ) {
        return new WP_Error( 'invalid_data', 'Invalid game or score.', array( 'status' => 400 ) );
    }

    // Check if the score is a high score before inserting
    $scores      = $wpdb->get_results( "SELECT id, player_score FROM $table_name ORDER BY player_score DESC LIMIT 100" );
    $score_count = count( $scores );

    if ( $score_count >= 100 ) {
        $lowest_score = end( $scores );
        if ( $score <= $lowest_score->player_score ) {
            return new WP_Error( 'not_a_high_score', 'Score is not high enough to be on the leaderboard.', array( 'status' => 200 ) );
        }
    }
    
    $player_name = 'Guest';
    if ( is_user_logged_in() ) {
        $current_user = wp_get_current_user();
        $player_name  = $current_user->display_name;
    } elseif ( ! empty( $params['player_name'] ) ) {
        // Sanitize the guest's name, allowing basic characters.
        $player_name = sanitize_text_field( $params['player_name'] );
    }
    
    // Insert the new high score
    $wpdb->insert(
        $table_name,
        array(
            'game_slug'      => $game_slug,
            'player_score'   => $score,
            'player_name'    => $player_name,
            'date_recorded' => current_time( 'mysql' ),
        )
    );
    $new_score_id = $wpdb->insert_id;

    // If the board was full, remove the lowest score
    if ( $score_count >= 100 && isset( $lowest_score ) ) {
        $wpdb->delete( $table_name, array( 'id' => $lowest_score->id ), array( '%d' ) );
    }

    return new WP_REST_Response( array( 'status' => 'success', 'message' => 'Score submitted.', 'new_score_id' => $new_score_id ), 200 );
} 