import { useState, useEffect } from '@wordpress/element';
import { checkIfHighScore, getRankMessage, submitScore } from '../../utils/score-handler';

const GameOverScreen = ( { score, onPlayAgain, loggedInUserData } ) => {
    const [ gameState, setGameState ] = useState( 'PROCESSING' ); // PROCESSING, SHOW_FORM, SHOW_MESSAGE
    const [ results, setResults ] = useState( null );
    const [ playerName, setPlayerName ] = useState( '' );

    useEffect( () => {
        const handleScoreProcessing = async () => {
            const isHighScore = await checkIfHighScore( score );
            if ( ! isHighScore ) {
                setResults( { message: 'Thanks for playing!' } );
                setGameState( 'SHOW_MESSAGE' );
                return;
            }

            // It IS a high score.
            if ( loggedInUserData?.displayName ) {
                const finalPlayerName = loggedInUserData.displayName;
                const newScore = await submitScore( 'snake', score, finalPlayerName );
                if ( newScore?.new_score_id ) {
                    const rankMessage = await getRankMessage( newScore.new_score_id );
                    setResults( { message: `High Score! ${ rankMessage }` } );
                } else {
                    setResults( { message: 'Could not save high score.' } );
                }
                setGameState( 'SHOW_MESSAGE' );
            } else {
                // For guest users, show the form.
                setGameState( 'SHOW_FORM' );
            }
        };

        handleScoreProcessing();
    }, [ score, loggedInUserData ] );

    const handleNameSubmit = async ( e ) => {
        e.preventDefault();
        setGameState( 'PROCESSING' ); // Show a brief loading state
        const finalPlayerName = playerName.trim() === '' ? 'Guest' : playerName;
        const newScore = await submitScore( 'snake', score, finalPlayerName );
        if ( newScore?.new_score_id ) {
            const rankMessage = await getRankMessage( newScore.new_score_id );
            setResults( { message: `High Score! ${ rankMessage }` } );
        } else {
            setResults( { message: 'Could not save high score.' } );
        }
        setGameState( 'SHOW_MESSAGE' );
    };

    if ( gameState === 'PROCESSING' ) {
        return (
            <div className="game-overlay">
                <div className="results-screen">
                    <h2>Game Over!</h2>
                    <p>Final Score: { score }</p>
                    <p>Checking high scores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="game-overlay">
            <div className="results-screen">
                <h2>Game Over!</h2>
                <p>Final Score: { score }</p>
                { gameState === 'SHOW_FORM' ? (
                    <form onSubmit={ handleNameSubmit } className="highscore-form">
                        <p>New High Score! Enter your name:</p>
                        <div className="form-row">
                            <input
                                type="text"
                                value={ playerName }
                                onChange={ ( e ) => setPlayerName( e.target.value ) }
                                placeholder="Guest"
                                autoFocus
                            />
                            <button type="submit">Submit</button>
                        </div>
                    </form>
                ) : (
                    <>
                        { results && <p>{ results.message }</p> }
                        <button onClick={ onPlayAgain }>Play Again</button>
                    </>
                ) }
            </div>
        </div>
    );
};

export default GameOverScreen; 