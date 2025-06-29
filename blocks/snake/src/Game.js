import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { checkIfHighScore, getRankMessage, submitScore } from '../../utils/score-handler';
import GameWindow from '../../components/game-window';
import GameOverScreen from './GameOverScreen';
import { generateFood } from './food-handler';

const Game = () => {
    // Game constants
    const GRID_SIZE_X = 32;
    const GRID_SIZE_Y = 24;
    const GRID = { x: GRID_SIZE_X, y: GRID_SIZE_Y };
    const INITIAL_SNAKE = [ { x: 16, y: 12 }, { x: 16, y: 13 } ];
    const INITIAL_DIRECTION = { x: 0, y: -1 };
    const BASE_SPEED = 150;
    const FOOD_TIERS = [
        { points: 1, color: '#ff6b6b' },  // Red
        { points: 2, color: '#feca57' },  // Yellow
        { points: 3, color: '#e67e22' },  // Orange
        { points: 4, color: '#48dbfb' },  // Blue
        { points: 5, color: '#8e44ad' },  // Purple
    ];
    const FOOD_SPAWN_THRESHOLDS = [5, 15, 30, 50];

    // Game state
    const [ gameState, setGameState ] = useState( 'IDLE' );
    const [ snake, setSnake ] = useState( INITIAL_SNAKE );
    const [ direction, setDirection ] = useState( INITIAL_DIRECTION );
    const [ food, setFood ] = useState( [] );
    const [ score, setScore ] = useState( 0 );
    const [ speed, setSpeed ] = useState( BASE_SPEED );
    const [ nextFoodSpawnThresholdIndex, setNextFoodSpawnThresholdIndex ] = useState(0);
    const [ canvasWidth, setCanvasWidth ] = useState(0);
    const [ canvasHeight, setCanvasHeight ] = useState(0);
    
    const loggedInUserData = window.chubesGamesData?.userData;
    
    const canvasRef = useRef( null ); // Visible canvas
    const gameWindowRef = useRef( null ); // Ref for the container element

    const resetGame = () => {
        setSnake( INITIAL_SNAKE );
        setDirection( INITIAL_DIRECTION );
        setScore( 0 );
        setSpeed( BASE_SPEED );
        setFood( [ generateFood( INITIAL_SNAKE, [], GRID, FOOD_TIERS, { specificTier: 0 } ) ] );
        setNextFoodSpawnThresholdIndex(0);
        setGameState( 'PLAYING' );
    };
    
    // Game loop
    useEffect( () => {
        if ( gameState !== 'PLAYING' ) return;

        const gameInterval = setInterval( () => {
            setSnake( prevSnake => {
                const newSnake = [ ...prevSnake ];
                const head = { ...newSnake[ 0 ] };
                head.x += direction.x;
                head.y += direction.y;
                
                if ( head.x < 0 ) head.x = GRID_SIZE_X - 1;
                if ( head.x >= GRID_SIZE_X ) head.x = 0;
                if ( head.y < 0 ) head.y = GRID_SIZE_Y - 1;
                if ( head.y >= GRID_SIZE_Y ) head.y = 0;

                if ( newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ) {
                    clearInterval( gameInterval );
                    setGameState( 'GAME_OVER' );
                    return prevSnake;
                }
                
                newSnake.unshift( head );
                
                let foodEaten = null;
                const newFoodList = food.filter(f => {
                    if (f.position.x === head.x && f.position.y === head.y) {
                        foodEaten = f;
                        return false;
                    }
                    return true;
                });

                if ( foodEaten ) {
                    const newScore = score + foodEaten.tier.points;
                    setScore( newScore );
                    
                    let maxUnlockedTierIndex = nextFoodSpawnThresholdIndex;
                    if (
                        nextFoodSpawnThresholdIndex < FOOD_SPAWN_THRESHOLDS.length &&
                        newScore >= FOOD_SPAWN_THRESHOLDS[nextFoodSpawnThresholdIndex]
                    ) {
                        maxUnlockedTierIndex++;
                        setNextFoodSpawnThresholdIndex(i => i + 1);
                    }

                    // Always generate one new food item to replace the one eaten.
                    newFoodList.push(generateFood(newSnake, newFoodList, GRID, FOOD_TIERS, { maxTier: maxUnlockedTierIndex }));
                    setFood(newFoodList);

                } else {
                    newSnake.pop();
                }

                return newSnake;
            } );
        }, speed );

        return () => clearInterval( gameInterval );
    }, [ gameState, direction, speed, score, food, nextFoodSpawnThresholdIndex ] );

    // Speed scaling effect based on snake length
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const foodEatenCount = snake.length - INITIAL_SNAKE.length;
        const newSpeed = BASE_SPEED - (foodEatenCount * 1); // Speed increases by 1ms for each food eaten.
        
        setSpeed(Math.max(50, newSpeed));

    }, [snake.length, gameState]);

    // This effect handles observing the container size and updating the canvas dimensions.
    useEffect(() => {
        const gameWindow = gameWindowRef.current;
        if (!gameWindow) return;

        const resizeObserver = new ResizeObserver(() => {
            // Use clientWidth/clientHeight to get inner dimensions excluding border
            setCanvasWidth(gameWindow.clientWidth);
            setCanvasHeight(gameWindow.clientHeight);
        });

        resizeObserver.observe(gameWindow);

        return () => resizeObserver.disconnect();
    }, []);

    // This effect exclusively handles drawing on the canvas.
    // It runs whenever the game state (snake, food) or canvas size changes.
    useEffect( () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Set the canvas drawing surface size.
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        if (canvasWidth === 0 || canvasHeight === 0) return;
        const context = canvas.getContext('2d');
        
        // --- "Perfect Grid" Rendering Logic ---

        // 1. Calculate the ideal, floating-point size for a square cell.
        const cellWidthBasedOnContainer = canvasWidth / GRID_SIZE_X;
        const cellHeightBasedOnContainer = canvasHeight / GRID_SIZE_Y;
        const cellSize = Math.min(cellWidthBasedOnContainer, cellHeightBasedOnContainer);

        // 2. Calculate the total game area dimensions and centering offsets.
        const gameWidth = cellSize * GRID_SIZE_X;
        const gameHeight = cellSize * GRID_SIZE_Y;
        const offsetX = (canvasWidth - gameWidth) / 2;
        const offsetY = (canvasHeight - gameHeight) / 2;

        // 3. Clear the entire canvas with black to create the letterbox background.
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 4. Draw the game area on top of the letterbox.
        context.fillStyle = '#2d3436';
        context.fillRect(offsetX, offsetY, gameWidth, gameHeight);

        // --- Draw all game elements relative to the centered game area ---

        // Draw snake as square segments with a 1px gap
        context.fillStyle = '#00b894';
        const gap = 0.5; // 0.5-pixel gap
        snake.forEach(({ x, y }) => {
            context.fillRect(
                offsetX + x * cellSize + gap, 
                offsetY + y * cellSize + gap, 
                cellSize - gap * 2, 
                cellSize - gap * 2
            );
        });
        
        const head = snake[0];
        context.fillStyle = '#000000';
        
        const headSquareSize = cellSize - gap * 2;
        const eyeSize = headSquareSize / 5;
        const headSquareX = offsetX + head.x * cellSize + gap;
        const headSquareY = offsetY + head.y * cellSize + gap;

        if (direction.y === -1) { // Up
            const y = headSquareY + eyeSize;
            const x1 = headSquareX + eyeSize;
            const x2 = headSquareX + headSquareSize - 2 * eyeSize;
            context.fillRect(x1, y, eyeSize, eyeSize);
            context.fillRect(x2, y, eyeSize, eyeSize);
        } else if (direction.y === 1) { // Down
            const y = headSquareY + headSquareSize - 2 * eyeSize;
            const x1 = headSquareX + eyeSize;
            const x2 = headSquareX + headSquareSize - 2 * eyeSize;
            context.fillRect(x1, y, eyeSize, eyeSize);
            context.fillRect(x2, y, eyeSize, eyeSize);
        } else if (direction.x === -1) { // Left
            const x = headSquareX + eyeSize;
            const y1 = headSquareY + eyeSize;
            const y2 = headSquareY + headSquareSize - 2 * eyeSize;
            context.fillRect(x, y1, eyeSize, eyeSize);
            context.fillRect(x, y2, eyeSize, eyeSize);
        } else { // Right
            const x = headSquareX + headSquareSize - 2 * eyeSize;
            const y1 = headSquareY + eyeSize;
            const y2 = headSquareY + headSquareSize - 2 * eyeSize;
            context.fillRect(x, y1, eyeSize, eyeSize);
            context.fillRect(x, y2, eyeSize, eyeSize);
        }

        // Draw food
        food.forEach( f => {
            context.fillStyle = f.tier.color;
            context.beginPath();
            context.arc(
                offsetX + (f.position.x + 0.5) * cellSize, 
                offsetY + (f.position.y + 0.5) * cellSize, 
                cellSize / 2.2, 
                0, 2 * Math.PI
            );
            context.fill();
        });

        // Draw Score
        const fontSize = cellSize * 0.9;
        context.fillStyle = 'white';
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(`Score: ${score}`, offsetX + 10, offsetY + 10);

    }, [ snake, food, direction, score, canvasWidth, canvasHeight ] );

    // Keyboard input
    useEffect( () => {
        const handleKeyDown = ( e ) => {
            if (gameState !== 'PLAYING') {
                return;
            }

            let newDirection;
            switch ( e.key ) {
                case 'ArrowUp':
                    e.preventDefault();
                    if ( direction.y === 0 ) newDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if ( direction.y === 0 ) newDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if ( direction.x === 0 ) newDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if ( direction.x === 0 ) newDirection = { x: 1, y: 0 };
                    break;
                default:
                    return;
            }
            if (newDirection) {
                setDirection( newDirection );
            }
        };

        window.addEventListener( 'keydown', handleKeyDown );
        return () => window.removeEventListener( 'keydown', handleKeyDown );
    }, [ gameState, direction ] );

    return (
        <GameWindow className="wp-block-chubes-games-snake" ref={gameWindowRef}>
            { gameState === 'IDLE' && (
                <div className="game-overlay">
                    <button className="chubes-games-button" onClick={ resetGame }>Play</button>
                </div>
            ) }

            { gameState === 'GAME_OVER' && (
                <GameOverScreen
                    score={ score }
                    onPlayAgain={ resetGame }
                    loggedInUserData={loggedInUserData}
                />
            ) }
            <canvas ref={ canvasRef } />
        </GameWindow>
    );
};

export default Game; 