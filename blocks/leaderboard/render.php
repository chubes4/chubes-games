<?php
/**
 * Renders the Leaderboard block on the front-end.
 *
 * This file is loaded by WordPress when the block is rendered on the front-end.
 */

$scores = [];
if ( function_exists( 'chubes_games_get_score_data' ) ) {
    $scores = chubes_games_get_score_data();
}

$wrapper_attributes = get_block_wrapper_attributes();

?>
<div <?php echo $wrapper_attributes; ?>>
    <h4 class="wp-block-chubes-games-leaderboard-header"><?php echo __( 'Leaderboard', 'chubes-games' ); ?></h4>
    <table class="wp-block-chubes-games-leaderboard-table">
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