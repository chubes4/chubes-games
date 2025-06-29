import apiFetch from '@wordpress/api-fetch';

/**
 * Checks if a given score is high enough to make the leaderboard.
 * @param {number} score The score to check.
 * @returns {Promise<boolean>} Whether the score is a high score.
 */
export const checkIfHighScore = async ( score ) => {
    try {
        const scores = await apiFetch( { path: '/chubes-games/v1/scores' } );
        if ( scores.length < 100 || score > scores[ scores.length - 1 ].player_score ) {
            return true;
        }
        return false;
    } catch ( error ) {
        console.error( 'Error checking high score:', error );
        return false;
    }
};

/**
 * Submits a new score to the database.
 * @param {string} gameSlug The slug of the game.
 * @param {number} score The player's score.
 * @param {string} playerName The player's name.
 * @returns {Promise<Object|null>} The API response or null on error.
 */
export const submitScore = async ( gameSlug, score, playerName ) => {
    try {
        const response = await apiFetch( {
            path: '/chubes-games/v1/scores',
            method: 'POST',
            data: {
                game: gameSlug,
                score: score,
                player_name: playerName,
            },
        } );
        return response;
    } catch ( error ) {
        console.error( 'Error submitting score:', error );
        return null;
    }
};

/**
 * Fetches the full leaderboard to find the rank of a newly submitted score.
 * @param {number} newScoreId The ID of the newly inserted score.
 * @returns {Promise<string>} A message indicating the player's rank.
 */
export const getRankMessage = async ( newScoreId ) => {
    try {
        const scores = await apiFetch( { path: '/chubes-games/v1/scores' } );
        const rank = scores.findIndex( ( s ) => s.id === newScoreId );
        if ( rank !== -1 ) {
            return `You are rank #${ rank + 1 }!`;
        }
        return 'Your score is on the board!';
    } catch ( error ) {
        console.error( 'Error getting rank:', error );
        return 'Score submitted!';
    }
}; 