/**
 * EnemyManager - Orchestrates all enemy-related functionality using modular components
 */

import { EnemyCombat } from './EnemyCombat';
import { EnemyRenderer } from './EnemyRenderer';
import { createEnemy, getRandomEnemyType, getEnemyReward } from './EnemyTypes';
import { EnemyMovement } from './EnemyMovement';

// Spawn constants
const ENEMY_SPAWN_INTERVAL = 2000; // milliseconds
const TOWER_AGGRO_RANGE = 10; // Cells

export class EnemyManager {
	constructor(gridWidth, gridHeight) {
		this.gridWidth = gridWidth;
		this.gridHeight = gridHeight;
		this.enemies = [];
		this.lastSpawnTime = 0;
		
		// Initialize movement handler
		this.movementHandler = new EnemyMovement(gridWidth, gridHeight);
		
		// Pre-calculate edge positions for performance
		this.edgePositions = this.calculateEdgePositions();
	}

	/**
	 * Calculate all possible edge spawn positions
	 */
	calculateEdgePositions() {
		const edges = [
			// Top edge
			...Array.from({length: this.gridWidth}, (_, i) => ({x: i, y: 0})),
			// Bottom edge
			...Array.from({length: this.gridWidth}, (_, i) => ({x: i, y: this.gridHeight - 1})),
			// Left edge (excluding corners to avoid duplicates)
			...Array.from({length: this.gridHeight - 2}, (_, i) => ({x: 0, y: i + 1})),
			// Right edge (excluding corners to avoid duplicates)
			...Array.from({length: this.gridHeight - 2}, (_, i) => ({x: this.gridWidth - 1, y: i + 1}))
		];
		return edges;
	}

	/**
	 * Spawn a new enemy at a random edge position
	 */
	spawnEnemy() {
		const randomEdgePosition = this.edgePositions[Math.floor(Math.random() * this.edgePositions.length)];
		const enemyType = getRandomEnemyType();
		
		const enemy = createEnemy(enemyType, randomEdgePosition);
		this.enemies.push(enemy);
		
		return enemy;
	}

	/**
	 * Update all enemies - spawning, movement, attacks
	 * @param {array} allBuildings - Array of all buildings that can be attacked.
	 * @param {function} damageBuildingCallback - Callback to damage buildings by ID.
	 * @param {object} globalUpgrades - The global upgrades state.
	 */
	update(allBuildings, damageBuildingCallback, globalUpgrades) {
		const currentTime = Date.now();
		
		// Spawn new enemies
		if (currentTime - this.lastSpawnTime > ENEMY_SPAWN_INTERVAL) {
			this.spawnEnemy();
			this.lastSpawnTime = currentTime;
		}

		const towers = allBuildings.filter(b => b.type === 'tower' && b.isActive);
		const commandCenter = allBuildings.find(b => b.type === 'command-center');

		// Build dynamic obstacle set once per frame (enemy positions)
		const enemyObstacleSet = new Set(this.enemies.map(e => `${Math.floor(e.x)},${Math.floor(e.y)}`));

		// Update all enemies
		this.enemies = this.enemies.map(enemy => {
			if (!commandCenter) return enemy; // No target, do nothing

			// Simplified target priority logic:
			// 1. If already attacking command center (very close), keep attacking it
			// 2. Otherwise if towers exist, attack closest tower  
			// 3. Otherwise attack command center
			
			let primaryTarget = commandCenter;
			
			// Check if already in attack mode against command center
			const isAttackingCC = enemy.state === 'attacking' && 
								  enemy.currentTarget && 
								  enemy.currentTarget.type === 'command-center';
			
			// If not already committed to attacking command center, prefer towers
			if (!isAttackingCC && towers.length > 0) {
				// Find closest tower
				const closestTower = towers.reduce((closest, tower) => {
					const distanceToClosest = this.movementHandler.getMinDistanceToBuilding(enemy, closest);
					const distanceToTower = this.movementHandler.getMinDistanceToBuilding(enemy, tower);
					return distanceToTower < distanceToClosest ? tower : closest;
				}, towers[0]);
				
				primaryTarget = closestTower;
			}
			
			// Handle movement using the movement module
			let updatedEnemy = this.movementHandler.update(enemy, allBuildings);
			
			// Handle attacks using the combat module
			updatedEnemy = EnemyCombat.handleAttack(updatedEnemy, damageBuildingCallback, globalUpgrades);
			
			return updatedEnemy;
		}).filter(enemy => enemy.isActive); // Remove dead enemies
	}

	/**
	 * Render all enemies using the renderer module
	 */
	render(context, offsetX, offsetY, cellSize) {
		EnemyRenderer.renderAllEnemies(
			this.enemies, 
			context, 
			offsetX, 
			offsetY, 
			cellSize, 
			this.gridWidth, 
			this.gridHeight
		);
	}

	/**
	 * Get current enemy count
	 */
	getEnemyCount() {
		return this.enemies.length;
	}

	/**
	 * Get all enemies (for external collision detection, etc.)
	 */
	getEnemies() {
		return this.enemies;
	}

	/**
	 * Remove an enemy by ID (for when destroyed by projectiles)
	 */
	removeEnemy(enemyId) {
		this.enemies = this.enemies.filter(enemy => enemy.id !== enemyId);
	}

	/**
	 * Damage an enemy
	 * @param {string} enemyId - The ID of the enemy to damage.
	 * @param {number} damage - The amount of damage to deal.
	 * @param {function} onEnemyKilled - Callback function when an enemy is killed.
	 */
	damageEnemy(enemyId, damage, onEnemyKilled) {
		this.enemies = this.enemies.map(enemy => {
			if (enemy.id === enemyId) {
				const updatedEnemy = EnemyCombat.damageEnemy(enemy, damage, (killedEnemy) => {
					// Calculate reward based on enemy type
					const reward = getEnemyReward(killedEnemy.type);
					onEnemyKilled({ ...killedEnemy, reward });
				});
				return updatedEnemy;
			}
			return enemy;
		}).filter(enemy => enemy.isActive); // Remove dead enemies
	}

	/**
	 * Checks if a specific grid cell is occupied by an enemy.
	 * @param {number} x - The grid x-coordinate.
	 * @param {number} y - The grid y-coordinate.
	 * @returns {boolean} - True if the cell is occupied, false otherwise.
	 */
	isCellOccupied(x, y) {
		return this.enemies.some(enemy => Math.floor(enemy.x) === x && Math.floor(enemy.y) === y);
	}

	/**
	 * Debug: Render enemy paths
	 */
	debugRenderPaths(context, offsetX, offsetY, cellSize) {
		this.movementHandler.debugRenderPaths(context, this.enemies, cellSize, offsetX, offsetY);
	}
} 