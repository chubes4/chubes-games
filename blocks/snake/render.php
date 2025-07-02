<?php
/**
 * Renders a simple div with the block's wrapper attributes for JS apps.
 *
 * @param array $attributes The block attributes from the editor.
 * @param string $content The block content.
 * @param WP_Block $block The block object.
 * @return string The HTML div for the JS app to mount on.
 */
$game_slug_short = str_replace('chubes-games/', '', $block->name);

$wrapper_attributes = get_block_wrapper_attributes([
    'data-game-slug' => $game_slug_short,
]);

echo sprintf(
    '<div %s></div>',
    $wrapper_attributes
); 