/**
 * ResourceManager - Handles all resource-related functionality including state, validation, and calculations
 */

// Starting resources
export const STARTING_NUGGETS = 100;

// Resource state management
export class ResourceState {
	constructor(initialNuggets = STARTING_NUGGETS) {
		this.nuggets = initialNuggets;
		this.score = 0;
	}

	// Add nuggets and score (typically from enemy kills)
	addReward(reward) {
		this.nuggets += reward;
		this.score += reward;
		return { nuggets: this.nuggets, score: this.score };
	}

	// Spend nuggets (for building/upgrading)
	spendNuggets(amount) {
		if (this.nuggets >= amount) {
			this.nuggets -= amount;
			return true;
		}
		return false;
	}

	// Check if can afford something
	canAfford(cost) {
		return this.nuggets >= cost;
	}

	// Get current state
	getState() {
		return { nuggets: this.nuggets, score: this.score };
	}

	// Reset resources
	reset() {
		this.nuggets = STARTING_NUGGETS;
		this.score = 0;
	}
}

/**
 * Renders the score and nugget count on the canvas.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} score - The current score.
 * @param {number} nuggets - The current nugget count.
 */
export const renderResourceUI = (context, canvasWidth, score, nuggets) => {
	context.fillStyle = 'white';
	context.font = 'bold 18px Arial';
	
	// Score (top-left)
	context.textAlign = 'left';
	context.fillText(`Score: ${score}`, 10, 25);
	
	// Nuggets (top-left, below score)
	context.fillText(`Nuggets: ${nuggets} 💎`, 10, 50);
};

/**
 * Calculate refund amount for selling a building
 * @param {object} building - The building to calculate refund for
 * @returns {number} - The refund amount
 */
export const calculateSellRefund = (building) => {
	return Math.floor((building.health / building.maxHealth) * building.buildCost);
};

/**
 * Calculate total cost for multiple purchases
 * @param {array} costs - Array of cost amounts
 * @returns {number} - Total cost
 */
export const calculateTotalCost = (costs) => {
	return costs.reduce((total, cost) => total + cost, 0);
}; 