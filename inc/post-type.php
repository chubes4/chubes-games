<?php
/**
 * Game Post Type Registration
 *
 * Registers the Game custom post type for hosting interactive game blocks.
 * Public archives available at /games with Gutenberg support.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register Game Post Type
 */
function chubes_games_register_post_type() {
	$labels = array(
		'name'                  => _x( 'Games', 'Post Type General Name', 'chubes-games' ),
		'singular_name'         => _x( 'Game', 'Post Type Singular Name', 'chubes-games' ),
		'menu_name'             => __( 'Games', 'chubes-games' ),
		'name_admin_bar'        => __( 'Game', 'chubes-games' ),
		'archives'              => __( 'Game Archives', 'chubes-games' ),
		'attributes'            => __( 'Game Attributes', 'chubes-games' ),
		'parent_item_colon'     => __( 'Parent Game:', 'chubes-games' ),
		'all_items'             => __( 'All Games', 'chubes-games' ),
		'add_new_item'          => __( 'Add New Game', 'chubes-games' ),
		'add_new'               => __( 'Add New', 'chubes-games' ),
		'new_item'              => __( 'New Game', 'chubes-games' ),
		'edit_item'             => __( 'Edit Game', 'chubes-games' ),
		'update_item'           => __( 'Update Game', 'chubes-games' ),
		'view_item'             => __( 'View Game', 'chubes-games' ),
		'view_items'            => __( 'View Games', 'chubes-games' ),
		'search_items'          => __( 'Search Game', 'chubes-games' ),
		'not_found'             => __( 'Not found', 'chubes-games' ),
		'not_found_in_trash'    => __( 'Not found in Trash', 'chubes-games' ),
		'featured_image'        => __( 'Featured Image', 'chubes-games' ),
		'set_featured_image'    => __( 'Set featured image', 'chubes-games' ),
		'remove_featured_image' => __( 'Remove featured image', 'chubes-games' ),
		'use_featured_image'    => __( 'Use as featured image', 'chubes-games' ),
		'insert_into_item'      => __( 'Insert into game', 'chubes-games' ),
		'uploaded_to_this_item' => __( 'Uploaded to this game', 'chubes-games' ),
		'items_list'            => __( 'Games list', 'chubes-games' ),
		'items_list_navigation' => __( 'Games list navigation', 'chubes-games' ),
		'filter_items_list'     => __( 'Filter games list', 'chubes-games' ),
	);

	$args = array(
		'label'               => __( 'Game', 'chubes-games' ),
		'description'         => __( 'Post type for hosting games.', 'chubes-games' ),
		'labels'              => $labels,
		'supports'            => array( 'title', 'editor', 'thumbnail', 'revisions' ),
		'taxonomies'          => array(),
		'hierarchical'        => false,
		'public'              => true,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'menu_position'       => 5,
		'menu_icon'           => 'dashicons-games',
		'show_in_admin_bar'   => true,
		'show_in_nav_menus'   => true,
		'can_export'          => true,
		'has_archive'         => 'games',
		'exclude_from_search' => false,
		'publicly_queryable'  => true,
		'capability_type'     => 'post',
		'show_in_rest'        => true,
		'rewrite'             => array( 'slug' => 'games' ),
	);

	register_post_type( 'game', $args );
}
add_action( 'init', 'chubes_games_register_post_type', 0 );

/**
 * Add game post type to search results
 */
function chubes_games_add_to_search( $post_types ) {
	$post_types[] = 'game';
	return $post_types;
}
add_filter( 'chubes_search_post_types', 'chubes_games_add_to_search' );
