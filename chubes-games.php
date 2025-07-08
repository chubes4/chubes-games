<?php
/*
Plugin Name: Chubes Games
Description: A collection of modular Gutenberg game blocks for WordPress. Each game is a separate block, starting with Snake.
Version: 0.1.0
Author: Chris Huber
Author URI: https://chubes.net
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

// Define plugin constants
if ( ! defined( 'CHUBES_GAMES_FILE' ) ) {
    define( 'CHUBES_GAMES_FILE', __FILE__ );
}
if ( ! defined( 'CHUBES_GAMES_PATH' ) ) {
    define( 'CHUBES_GAMES_PATH', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'CHUBES_GAMES_URL' ) ) {
    define( 'CHUBES_GAMES_URL', plugin_dir_url( __FILE__ ) );
}

// Include shared functionality
require_once CHUBES_GAMES_PATH . 'inc/admin.php';
require_once CHUBES_GAMES_PATH . 'inc/score.php';
require_once CHUBES_GAMES_PATH . 'inc/openai.php';

/**
 * Registers all blocks from the 'blocks' directory.
 *
 * This function scans for 'block.json' files in subdirectories of the 'blocks' folder
 * and registers them as WordPress blocks. This modern approach allows each block to be
 * self-contained. For blocks that need server-side rendering, a 'render.php' file
 * should be included in the block's directory and referenced in its 'block.json'.
 */
function chubes_games_register_all_blocks() {
    $block_json_files = glob( CHUBES_GAMES_PATH . 'blocks/**/block.json' );

    foreach ( $block_json_files as $filename ) {
        $block_folder = dirname( $filename );

        // Skip non-block utility/component folders.
        if ( strpos( $block_folder, 'utils' ) !== false || strpos( $block_folder, 'components' ) !== false ) {
            continue;
        }

        // Load the block's index.php if it exists. This makes functions like
        // render callbacks available before block registration.
        $index_file = $block_folder . '/index.php';
        if ( file_exists( $index_file ) ) {
            require_once $index_file;
        }

        // Prepare args for registration. We default to an empty array.
        $args = [];
        $block_data = json_decode( file_get_contents( $filename ), true );
        
        // Only assign a render_callback if the block doesn't define a 'render' file in block.json
        // and a specific callback function exists for it.
        if ( ! isset( $block_data['render'] ) ) {
            if ( $block_data['name'] === 'chubes-games/ai-adventure' && function_exists( 'chubes_games_render_ai_adventure_block' ) ) {
                $args['render_callback'] = 'chubes_games_render_ai_adventure_block';
            }
        }
        
        register_block_type( $block_folder, $args );
    }
}
add_action( 'init', 'chubes_games_register_all_blocks' );

/**
 * Enqueue the main stylesheet for shared game window styling.
 */
function chubes_games_enqueue_main_styles() {
    $main_css_path = CHUBES_GAMES_PATH . 'assets/css/main.css';
    if ( file_exists( $main_css_path ) ) {
        wp_enqueue_style(
            'chubes-games-main',
            CHUBES_GAMES_URL . 'assets/css/main.css',
            array(),
            filemtime( $main_css_path )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'chubes_games_enqueue_main_styles' );

/**
 * Conditionally enqueue block-specific frontend assets only when blocks are present.
 */
function chubes_games_enqueue_block_assets() {
    // Only load assets if we're on a page with our blocks
    if ( ! has_block( 'chubes-games/base-builder' ) && 
         ! has_block( 'chubes-games/snake' ) && 
         ! has_block( 'chubes-games/ai-adventure' ) && 
         ! has_block( 'chubes-games/leaderboard' ) ) {
        return;
    }

    // Enqueue base-builder assets
    if ( has_block( 'chubes-games/base-builder' ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/base-builder/style-index.css';
        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'chubes-games-base-builder',
                CHUBES_GAMES_URL . 'build/base-builder/style-index.css',
                array(),
                filemtime( $style_path )
            );
        }
    }

    // Enqueue snake assets
    if ( has_block( 'chubes-games/snake' ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/snake/style-index.css';
        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'chubes-games-snake',
                CHUBES_GAMES_URL . 'build/snake/style-index.css',
                array(),
                filemtime( $style_path )
            );
        }
    }

    // Enqueue ai-adventure assets
    if ( has_block( 'chubes-games/ai-adventure' ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/ai-adventure/style-style.css';
        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'chubes-games-ai-adventure',
                CHUBES_GAMES_URL . 'build/ai-adventure/style-style.css',
                array(),
                filemtime( $style_path )
            );
        }
    }

    // Enqueue leaderboard assets
    if ( has_block( 'chubes-games/leaderboard' ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/leaderboard/style-index.css';
        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'chubes-games-leaderboard',
                CHUBES_GAMES_URL . 'build/leaderboard/style-index.css',
                array(),
                filemtime( $style_path )
            );
        }
    }

    // Enqueue ai-adventure-path assets
    if ( has_block( 'chubes-games/ai-adventure-path' ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/ai-adventure-path/style-style.css';
        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'chubes-games-ai-adventure-path',
                CHUBES_GAMES_URL . 'build/ai-adventure-path/style-style.css',
                array(),
                filemtime( $style_path )
            );
        }
    }

    // Enqueue ai-adventure-step assets
    if ( has_block( 'chubes-games/ai-adventure-step' ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/ai-adventure-step/style.css';
        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'chubes-games-ai-adventure-step',
                CHUBES_GAMES_URL . 'build/ai-adventure-step/style.css',
                array(),
                filemtime( $style_path )
            );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'chubes_games_enqueue_block_assets' );