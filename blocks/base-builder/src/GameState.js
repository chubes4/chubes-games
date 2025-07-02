/**
 * GameState - Manages all game state logic and transitions
 */

import { createCommandCenter } from './buildings/CommandCenter';
import { ResourceState, STARTING_NUGGETS } from './ResourceManager';

// Game constants
export const GRID_WIDTH = 43;
export const GRID_HEIGHT = 32;
export const PRE_GAME_COUNTDOWN_SECONDS = 10;

// Game status constants
export const GAME_STATUS = {
	COUNTDOWN: 'countdown',
	PLAYING: 'playing',
	GAME_OVER: 'gameOver'
};

export class GameStateManager {
	constructor() {
		this.reset();
	}

	reset() {
		this.status = GAME_STATUS.COUNTDOWN;
		this.countdown = PRE_GAME_COUNTDOWN_SECONDS;
		this.mainBuilding = createCommandCenter(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2));
		this.buildings = [];
		this.resources = new ResourceState(STARTING_NUGGETS);
		this.countdownStartTime = null;
	}

	// Get the complete current state
	getState() {
		const resourceState = this.resources.getState();
		return {
			status: this.status,
			countdown: this.countdown,
			mainBuilding: this.mainBuilding,
			buildings: this.buildings,
			nuggets: resourceState.nuggets,
			score: resourceState.score
		};
	}

	// Update countdown logic
	updateCountdown() {
		if (this.status !== GAME_STATUS.COUNTDOWN) return false;

		if (!this.countdownStartTime) {
			this.countdownStartTime = Date.now();
		}

		const elapsed = Math.floor((Date.now() - this.countdownStartTime) / 1000);
		const newCountdownValue = Math.max(0, PRE_GAME_COUNTDOWN_SECONDS - elapsed);

		if (newCountdownValue !== this.countdown) {
			this.countdown = newCountdownValue;
			
			if (newCountdownValue === 0) {
				this.status = GAME_STATUS.PLAYING;
				this.countdownStartTime = null;
			}
			return true; // State changed
		}
		return false; // No change
	}

	// Damage a building
	damageBuilding(buildingId, damage) {
		// Handle main building damage
		if (buildingId === 'main-command-center') {
			const newHealth = Math.max(0, this.mainBuilding.health - damage);
			this.mainBuilding.health = newHealth;
			
			if (newHealth === 0) {
				this.status = GAME_STATUS.GAME_OVER;
				return { gameOver: true, building: this.mainBuilding };
			}
			return { gameOver: false, building: this.mainBuilding };
		}
		
		// Handle other building damage
		const buildingIndex = this.buildings.findIndex(b => b.id === buildingId);
		if (buildingIndex === -1) return { gameOver: false, building: null };

		const building = this.buildings[buildingIndex];
		const newHealth = Math.max(0, building.health - damage);
		building.health = newHealth;
		building.isActive = newHealth > 0;

		if (!building.isActive) {
			this.buildings.splice(buildingIndex, 1); // Remove destroyed building
		}

		return { gameOver: false, building };
	}

	// Add enemy kill reward
	addEnemyKillReward(reward) {
		return this.resources.addReward(reward);
	}

	// Try to spend nuggets (returns success/failure)
	spendNuggets(amount) {
		return this.resources.spendNuggets(amount);
	}

	// Check if can afford something
	canAfford(cost) {
		return this.resources.canAfford(cost);
	}

	// Add a new building
	addBuilding(building) {
		this.buildings.push(building);
	}

	// Remove a building by ID
	removeBuilding(buildingId) {
		const buildingIndex = this.buildings.findIndex(b => b.id === buildingId);
		if (buildingIndex !== -1) {
			const building = this.buildings[buildingIndex];
			this.buildings.splice(buildingIndex, 1);
			return building;
		}
		return null;
	}

	// Update a building (for upgrades)
	updateBuilding(buildingId, updatedBuilding) {
		if (buildingId === 'main-command-center') {
			this.mainBuilding = updatedBuilding;
			return this.mainBuilding;
		}

		const buildingIndex = this.buildings.findIndex(b => b.id === buildingId);
		if (buildingIndex !== -1) {
			this.buildings[buildingIndex] = updatedBuilding;
			return this.buildings[buildingIndex];
		}
		return null;
	}

	// Get all buildings (including main building)
	getAllBuildings() {
		return [...this.buildings, this.mainBuilding];
	}

	// Check if a position is occupied by any building
	isPositionOccupied(x, y) {
		// Check main building
		const isOccupiedByCommandCenter = this.mainBuilding.cells.some(cell => 
			cell.x === x && cell.y === y
		);
		if (isOccupiedByCommandCenter) return true;

		// Check other buildings
		return this.buildings.some(building => building.x === x && building.y === y);
	}

	// Validate build position
	canBuildAt(x, y, enemyManager = null) {
		// Check grid bounds
		if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
			return false;
		}

		// Check building occupation
		if (this.isPositionOccupied(x, y)) {
			return false;
		}

		// Check enemy occupation if enemyManager provided
		if (enemyManager && enemyManager.isCellOccupied(x, y)) {
			return false;
		}

		return true;
	}
} 