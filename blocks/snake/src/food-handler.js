/**
 * Handles the generation of food items for the Snake game.
 */

/**
 * Generates a new food object at a random position that does not collide with the snake or other food items.
 *
 * @param {Array}  currentSnake The array of snake segments.
 * @param {Array}  currentFood  The array of existing food items.
 * @param {Object} grid         An object with the grid dimensions, e.g., { x: 32, y: 24 }.
 * @param {Array}  foodTiers    The array of possible food tiers with points and colors.
 * @param {Object} options      Optional parameters for generation.
 * @param {number} options.specificTier - A specific tier index to generate.
 * @param {number} options.maxTier - The maximum tier index that can be randomly generated.
 * @returns {Object} A new food object with `position` and `tier`.
 */
export const generateFood = ( currentSnake, currentFood, grid, foodTiers, options = {} ) => {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor( Math.random() * grid.x ),
            y: Math.floor( Math.random() * grid.y ),
        };
    } while (
        currentSnake.some( segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y ) ||
        currentFood.some( f => f.position.x === newFoodPosition.x && f.position.y === newFoodPosition.y )
    );

    let tierIndex = 0;
    if ( options.specificTier !== undefined ) {
        tierIndex = options.specificTier;
    } else if ( options.maxTier !== undefined ) {
        tierIndex = Math.floor( Math.random() * ( options.maxTier + 1 ) );
    }

    return {
        position: newFoodPosition,
        tier: foodTiers[ Math.min( tierIndex, foodTiers.length - 1 ) ],
    };
}; 