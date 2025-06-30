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

// Define plugin path and URL constants
if ( ! defined( 'CHUBES_GAMES_PATH' ) ) {
    define( 'CHUBES_GAMES_PATH', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'CHUBES_GAMES_URL' ) ) {
    define( 'CHUBES_GAMES_URL', plugin_dir_url( __FILE__ ) );
}

function chubes_games_register_all_blocks() {
    $block_json_files = glob( CHUBES_GAMES_PATH . 'blocks/**/block.json', GLOB_BRACE );

    foreach ( $block_json_files as $filename ) {
        $block_folder = dirname( $filename );
        $block_name   = basename( $block_folder );

        $args = [];

        $render_callback_map = [
            'chubes-games/leaderboard'  => 'chubes_games_render_leaderboard_block',
            // 'chubes-games/ai-adventure' => 'chubes_games_render_ai_adventure_block', // Use standard save function instead
            'chubes-games/snake'        => 'chubes_games_render_js_app_holder',
        ];
        
        $block_data = json_decode( file_get_contents( $filename ), true );
        if ( isset( $render_callback_map[ $block_data['name'] ] ) ) {
            $args['render_callback'] = $render_callback_map[ $block_data['name'] ];
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
 * Manages frontend assets for the Snake game block.
 *
 * This function uses the standard `wp_enqueue_scripts` hook to:
 * 1. Add a dynamic `filemtime` version to the stylesheet to prevent caching issues.
 * 2. Localize the logged-in user's data and pass it to the game's script.
 */
function chubes_games_snake_assets() {
    // WordPress automatically enqueues the 'viewScript' from block.json when the block is present.
    // We only need to act if the script has been enqueued. The handle is 'chubes-games/snake-view'.
    if ( wp_script_is( 'chubes-games/snake-view', 'enqueued' ) ) {
        if ( is_user_logged_in() ) {
            $current_user = wp_get_current_user();
            wp_localize_script(
                'chubes-games/snake-view',
                'chubesGamesData',
                [ 'userData' => [ 'displayName' => $current_user->display_name ] ]
            );
        }
    }

    // We also add a dynamic version to the style to bust browser cache on changes.
    // The handle for the 'style' from block.json is 'chubes-games-snake-style'.
    $style_handle = 'chubes-games/snake-style';
    global $wp_styles;
    if ( isset( $wp_styles->registered[$style_handle] ) ) {
        $style_path = CHUBES_GAMES_PATH . 'build/snake/index.css';
        if ( file_exists( $style_path ) ) {
            $wp_styles->registered[$style_handle]->ver = filemtime( $style_path );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'chubes_games_snake_assets' );

/**
 * Renders a simple div with the block's wrapper attributes for JS apps.
 *
 * @param array $attributes The block attributes from the editor.
 * @return string The HTML div for the JS app to mount on.
 */
function chubes_games_render_js_app_holder( $block_attributes, $content, $block ) {
    $game_slug_short = str_replace('chubes-games/', '', $block->name);

    $wrapper_attributes = get_block_wrapper_attributes([
        'data-game-slug' => $game_slug_short,
    ]);

    return sprintf(
        '<div %1$s></div>',
        $wrapper_attributes
    );
}

/**
 * Renders the AI Adventure block on the front-end, passing data to the script.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 * @return string The HTML of the block.
 */
function chubes_games_render_ai_adventure_block( $attributes, $content, $block ) {
    $wrapper_attributes = get_block_wrapper_attributes([ 'class' => 'chubes-game-window' ]);
    
    // Debug: Log the block structure
    error_log('AI Adventure Block - Attributes: ' . print_r($attributes, true));
    error_log('AI Adventure Block - Inner blocks count: ' . count($block->inner_blocks));
    error_log('AI Adventure Block - Inner blocks structure: ' . print_r($block->inner_blocks, true));
    
    // Encode the attributes and the full inner block structure to be used by the React app.
    $encoded_attributes = wp_json_encode( $attributes );
    $encoded_inner_blocks = wp_json_encode( $block->inner_blocks );

    // The data-* attributes will be picked up by the view.js script.
    return sprintf(
        '<div %s data-attributes="%s" data-innerblocks="%s"></div>',
        $wrapper_attributes,
        esc_attr( $encoded_attributes ),
        esc_attr( $encoded_inner_blocks )
    );
}

/**
 * Renders the Leaderboard block on the front-end.
 *
 * @return string The HTML of the block.
 */
function chubes_games_render_leaderboard_block() {
    $scores = chubes_games_get_scores()->get_data();
    
    ob_start();
    ?>
    <div class="wp-block-chubes-games-leaderboard">
        <h4><?php echo __( 'Leaderboard', 'chubes-games' ); ?></h4>
        <table>
            <thead>
                <tr>
                    <th><?php echo __( 'Rank', 'chubes-games' ); ?></th>
                    <th><?php echo __( 'Player', 'chubes-games' ); ?></th>
                    <th><?php echo __( 'Score', 'chubes-games' ); ?></th>
                    <th><?php echo __( 'Date', 'chubes-games' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if ( empty( $scores ) ) : ?>
                    <tr>
                        <td colspan="4"><?php echo __( 'No scores yet!', 'chubes-games' ); ?></td>
                    </tr>
                <?php else : ?>
                    <?php foreach ( $scores as $index => $score ) : ?>
                        <tr key="<?php echo esc_attr( $score->id ); ?>">
                            <td><?php echo $index + 1; ?></td>
                            <td><?php echo esc_html( $score->player_name ); ?></td>
                            <td><?php echo esc_html( $score->player_score ); ?></td>
                            <td><?php echo esc_html( date( 'm/d/Y', strtotime( $score->date_recorded ) ) ); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
    return ob_get_clean();
}

/**
 * Creates the custom database table for high scores upon plugin activation.
 */
function chubes_games_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'chubes_games_scores';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        game_slug varchar(55) NOT NULL,
        player_name varchar(55) DEFAULT 'Guest' NOT NULL,
        player_score int(11) NOT NULL,
        date_recorded datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
}
register_activation_hook( __FILE__, 'chubes_games_activate' );

/**
 * Register the REST API endpoint for submitting scores.
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'chubes-games/v1', '/scores', array(
        array(
            'methods' => 'POST',
            'callback' => 'chubes_games_submit_score',
            'permission_callback' => '__return_true'
        ),
        array(
            'methods' => 'GET',
            'callback' => 'chubes_games_get_scores',
            'permission_callback' => '__return_true'
        )
    ) );

    register_rest_route( 'chubes-games/v1', '/adventure', array(
        'methods' => 'POST',
        'callback' => 'chubes_games_handle_adventure_request',
        'permission_callback' => '__return_true', // Public endpoint
    ) );
} );

/**
 * Communicates with the OpenAI API.
 *
 * @param array $messages The array of messages for the chat completion.
 * @param float $temperature The creativity of the response.
 * @return string|WP_Error The message content from the AI or a WP_Error on failure.
 */
function chubes_games_call_openai( $messages, $temperature = 0.2 ) {
    // This function should be implemented to securely retrieve the 
    // configured API key from the plugin's settings page.
    $api_key = apply_filters( 'chubes_games_get_openai_key', null );

    if ( empty( $api_key ) ) {
        return new WP_Error( 'api_key_missing', 'OpenAI API key is not configured.', array( 'status' => 500 ) );
    }

    $api_url = 'https://api.openai.com/v1/chat/completions';

    $body = array(
        'model'       => 'gpt-3.5-turbo',
        'messages'    => $messages,
        'temperature' => $temperature,
    );

    $response = wp_remote_post( $api_url, array(
        'method'  => 'POST',
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ),
        'body'    => json_encode( $body ),
        'timeout' => 30,
    ) );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'openai_request_failed', 'Failed to connect to OpenAI.', array( 'status' => 500 ) );
    }

    $response_body = wp_remote_retrieve_body( $response );
    $response_data = json_decode( $response_body, true );

    if ( isset( $response_data['error'] ) ) {
        return new WP_Error( 'openai_api_error', $response_data['error']['message'], array( 'status' => 500 ) );
    }

    if ( ! isset( $response_data['choices'][0]['message']['content'] ) ) {
        return new WP_Error( 'openai_unexpected_response', 'Unexpected response format from OpenAI.', array( 'status' => 500 ) );
    }

    return $response_data['choices'][0]['message']['content'];
}

/**
 * Handles the AI Adventure game logic via REST API.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
 */
function chubes_games_handle_adventure_request( $request ) {
    $params = $request->get_json_params();

    // Base system prompt that explains the game mechanics to the AI
    $base_system_prompt = 'You are part of an interactive text-based adventure game engine. This is a "Choose Your Own Adventure" style game where:\n\n1. GAME STRUCTURE: The story is divided into "steps" connected by semantic triggers\n2. YOUR ROLE: You act as both a conversational AI and story progression detector  \n3. CONVERSATION MODE: Respond naturally and engagingly to player input\n4. PROGRESSION MODE: Detect when players have made story-changing decisions\n5. NARRATIVE STYLE: Be descriptive, immersive, and maintain consistent tone\n\nIMPORTANT: Players can chat freely about the current scene. Only advance the story when they have clearly made a decision that matches one of the available story branches.';

    $is_initial_turn = isset( $params['is_initial_turn'] ) && $params['is_initial_turn'];
    $persona = sanitize_text_field( $params['gameMasterPersona'] );
    $adventure_prompt = sanitize_text_field( $params['adventurePrompt'] );
    $path_prompt = isset($params['pathPrompt']) ? sanitize_text_field( $params['pathPrompt'] ) : '';
    $step_prompt = isset($params['stepPrompt']) ? sanitize_textarea_field( $params['stepPrompt'] ) : '';
    $story_progression = isset($params['storyProgression']) && is_array($params['storyProgression']) ? $params['storyProgression'] : [];

    // Format story progression for the prompt (last 10 steps)
    $progression_lines = [];
    $progression_slice = array_slice($story_progression, -10);
    $i = 1;
    foreach ($progression_slice as $entry) {
        $step_action = isset($entry['stepAction']) ? $entry['stepAction'] : '';
        $trigger_activated = isset($entry['triggerActivated']) ? $entry['triggerActivated'] : '';
        $progression_lines[] = "$i. Step: \"$step_action\"\n   Player chose: \"$trigger_activated\"";
        $i++;
    }
    $progression_text = empty($progression_lines) ? 'None yet.' : implode("\n", $progression_lines);
    $progression_section = "Story Progression So Far:\n$progression_text\n";

    if ( $is_initial_turn ) {
        $messages = array(
            array(
                'role' => 'system',
                'content' => $base_system_prompt . "\n\n" . $persona . "\n\nAdventure Description: " . $adventure_prompt . "\nPath Description: " . $path_prompt . "\n\n" . $progression_section . "\nYour goal is to set the stage. Begin the story by presenting the following step action in an engaging way. Do not ask the player what to do, simply present the scene vividly."
            ),
            array(
                'role' => 'user',
                'content' => "Step Action: " . $step_prompt
            )
        );

        $narrative = chubes_games_call_openai( $messages, 0.7 );

        if ( is_wp_error( $narrative ) ) {
            return $narrative;
        }

        return new WP_REST_Response( array( 'narrative' => $narrative ), 200 );

    } else {
        $player_input = sanitize_text_field( $params['playerInput'] );
        $triggers = $params['triggers'] ?? [];
        $conversation_history = isset($params['conversationHistory']) && is_array($params['conversationHistory']) ? $params['conversationHistory'] : [];
        // Conversation AI
        $conversation_messages = array(
            array(
                'role' => 'system',
                'content' => $base_system_prompt . "\n\n" . $persona . "\n\nAdventure Description: " . $adventure_prompt . "\nPath Description: " . $path_prompt . "\n\n" . $progression_section . "\nCurrent Step Action: " . $step_prompt . "\n\nRespond naturally to the player's action. Be engaging and descriptive. Continue the conversation fluidly. Do not advance the story unless explicitly told to do so."
            ),
            array(
                'role' => 'user',
                'content' => "Player says/does: " . $player_input
            )
        );
        
        $narrative_response = chubes_games_call_openai( $conversation_messages, 0.6 );

        if ( is_wp_error( $narrative_response ) ) {
            return $narrative_response;
        }

        // Progression AI
        $next_step_id = null;
        if ( ! empty( $triggers ) && is_array( $triggers ) ) {
            $triggers_list = array_map(function($t) { 
                return [
                    'id' => $t['id'], 
                    'condition' => $t['action'],
                    'description' => 'Trigger when: ' . $t['action']
                ]; 
            }, $triggers);
        
            $progression_messages = array(
                array(
                    'role' => 'system',
                    'content' => $base_system_prompt . "\n\n" . $persona . "\n\nAdventure Description: " . $adventure_prompt . "\nPath Description: " . $path_prompt . "\n\n" . $progression_section . "\nCurrent Step Action: " . $step_prompt . "\n\nYou are now in PROGRESSION ANALYSIS mode. Your job is to determine if the player's action semantically matches any of the available story branches.\n\nAvailable Story Branches:\n" . json_encode( $triggers_list, JSON_PRETTY_PRINT ) . "\n\nAnalyze the player's intent. Only progress the story if their action clearly matches one of the trigger conditions. Be semantic, not literal - understand the player's intent.\n\nRespond with ONLY a JSON object:\n- If no progression: {\"shouldProgress\": false}\n- If progression: {\"shouldProgress\": true, \"triggerId\": \"matching_trigger_id\"}"
                ),
                array(
                    'role' => 'user',
                    'content' => "Current step action: " . $step_prompt . "\nPlayer's action: " . $player_input . "\n\nDoes this action trigger any story progression?"
                )
            );

            $progression_response = chubes_games_call_openai( $progression_messages, 0.2 );

            if ( ! is_wp_error( $progression_response ) ) {
                $json_start = strpos( $progression_response, '{' );
                if ( $json_start !== false ) {
                    $json_string = substr( $progression_response, $json_start );
                    $progression_data = json_decode( $json_string, true );
                    
                    if ( isset( $progression_data['shouldProgress'] ) && $progression_data['shouldProgress'] && isset( $progression_data['triggerId'] ) ) {
                        // Find the destination for this trigger
                        foreach ( $triggers as $trigger ) {
                            if ( $trigger['id'] == $progression_data['triggerId'] ) {
                                $next_step_id = $trigger['destination'];
                break;
            }
        }
                    }
                }
            }
        }

        return new WP_REST_Response( array( 
            'narrative' => $narrative_response,
            'nextStepId' => $next_step_id  // null means continue current step, non-null means advance
        ), 200 );
    }
}

/**
 * Handles retrieving scores for the leaderboard.
 *
 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
 */
function chubes_games_get_scores() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'chubes_games_scores';
    
    $results = $wpdb->get_results( "SELECT * FROM $table_name ORDER BY player_score DESC LIMIT 100" );

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
    $scores = $wpdb->get_results( "SELECT id, player_score FROM $table_name ORDER BY player_score DESC LIMIT 100" );
    $score_count = count($scores);

    if ( $score_count >= 100 ) {
        $lowest_score = end( $scores );
        if ( $score <= $lowest_score->player_score ) {
            return new WP_Error( 'not_a_high_score', 'Score is not high enough to be on the leaderboard.', array( 'status' => 200 ) );
        }
    }
    
    $player_name = 'Guest';
    if ( is_user_logged_in() ) {
        $current_user = wp_get_current_user();
        $player_name = $current_user->display_name;
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

/**
 * Hooks into the custom filter to provide the OpenAI API key from settings.
 *
 * @param string|null $key The default key value.
 * @return string|null The API key from options, or null if not found.
 */
function chubes_games_provide_openai_key( $key ) {
    $options = get_option( 'chubes_games_options' );
    if ( isset( $options['openai_api_key'] ) && ! empty( $options['openai_api_key'] ) ) {
        return $options['openai_api_key'];
    }
    return $key; // Return original value (null) if not found.
}
add_filter( 'chubes_games_get_openai_key', 'chubes_games_provide_openai_key' ); 