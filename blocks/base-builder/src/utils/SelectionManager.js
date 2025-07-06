// SelectionManager.js - Centralises click/selection logic
// Placement: blocks/base-builder/src/utils/SelectionManager.js

import { GRID_WIDTH, GRID_HEIGHT } from '../GameState';

/**
 * Determine what was selected from a grid click.
 * Returns an object:
 *   { mode: 'command-center', building }
 *   { mode: 'building', building }
 *   { mode: 'build', x, y }
 *   { mode: 'none' }
 */
export function getSelection(gridX, gridY, gameState) {
	if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
		return { mode: 'none' };
	}

	// Command center hit?
	const isCC = gameState.mainBuilding.cells.some(c => c.x === gridX && c.y === gridY);
	if (isCC) return { mode: 'command-center', building: gameState.mainBuilding };

	// Other building?
	const b = gameState.buildings.find(build => build.x === gridX && build.y === gridY);
	if (b) return { mode: 'building', building: b };

	// Empty – build mode
	return { mode: 'build', x: gridX, y: gridY };
} 