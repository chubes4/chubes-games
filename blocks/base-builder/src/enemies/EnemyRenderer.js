/**
 * EnemyRenderer - Handles rendering enemies with different visual styles
 */

import { getEnemyTypeConfig } from './EnemyTypes';
import { EnemyCombat } from './EnemyCombat';
import { drawHealthBar } from '../utils/HealthBar';

export class EnemyRenderer {
	/**
	 * Render a single enemy on the canvas
	 */
	static renderEnemy(enemy, context, offsetX, offsetY, cellSize, gridWidth, gridHeight) {
		if (!enemy.isActive) return;

		const enemyConfig = getEnemyTypeConfig(enemy.type);
		
		// Calculate base position
		let enemyPixelX = offsetX + enemy.x * cellSize;
		let enemyPixelY = offsetY + enemy.y * cellSize;
		
		// Apply attack animation offset
		const animationOffset = EnemyCombat.getAttackAnimationOffset(enemy, gridWidth, gridHeight);
		enemyPixelX += animationOffset.x;
		enemyPixelY += animationOffset.y;
		
		// Calculate enemy size
		const enemySize = cellSize * enemyConfig.size;
		const padding = (cellSize - enemySize) / 2;
		
		// Choose colors based on attack state
		const fillColor = enemy.isAttacking ? enemyConfig.attackColor : enemyConfig.color;
		const borderColor = enemy.isAttacking ? enemyConfig.attackBorderColor : enemyConfig.borderColor;
		
		// Draw enemy body
		context.fillStyle = fillColor;
		context.fillRect(
			enemyPixelX + padding, 
			enemyPixelY + padding, 
			enemySize, 
			enemySize
		);
		
		// Draw enemy border
		context.strokeStyle = borderColor;
		context.lineWidth = 1;
		context.strokeRect(
			enemyPixelX + padding, 
			enemyPixelY + padding, 
			enemySize, 
			enemySize
		);

		// Draw health bar if damaged
		this.renderHealthBar(enemy, context, enemyPixelX, enemyPixelY, cellSize);
		
		// Draw type indicator for non-basic enemies
		if (enemy.type !== 'basic') {
			this.renderTypeIndicator(enemy, enemyConfig, context, enemyPixelX, enemyPixelY, cellSize);
		}
	}

	/**
	 * Render enemy health bar
	 */
	static renderHealthBar(enemy, context, pixelX, pixelY, cellSize) {
		if (enemy.health >= enemy.maxHealth) return; // skip full health
		const barWidth = cellSize - 8;
		const barY = pixelY + cellSize - 2;
		drawHealthBar(context, pixelX + 4, barY, barWidth, enemy.health, enemy.maxHealth, 3);
	}

	/**
	 * Render type indicator for special enemies
	 */
	static renderTypeIndicator(enemy, enemyConfig, context, pixelX, pixelY, cellSize) {
		const indicatorSize = 6;
		const indicatorX = pixelX + cellSize - indicatorSize - 2;
		const indicatorY = pixelY + 2;

		// Different shapes for different types
		context.fillStyle = 'white';
		context.strokeStyle = '#333';
		context.lineWidth = 1;

		switch (enemy.type) {
			case 'fast':
				// Triangle for fast enemies
				context.beginPath();
				context.moveTo(indicatorX + indicatorSize/2, indicatorY);
				context.lineTo(indicatorX, indicatorY + indicatorSize);
				context.lineTo(indicatorX + indicatorSize, indicatorY + indicatorSize);
				context.closePath();
				context.fill();
				context.stroke();
				break;
			
			case 'heavy':
				// Square for heavy enemies
				context.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
				context.strokeRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
				break;
			
			default:
				// Circle for other types
				context.beginPath();
				context.arc(indicatorX + indicatorSize/2, indicatorY + indicatorSize/2, indicatorSize/2, 0, 2 * Math.PI);
				context.fill();
				context.stroke();
				break;
		}
	}

	/**
	 * Render all enemies
	 */
	static renderAllEnemies(enemies, context, offsetX, offsetY, cellSize, gridWidth, gridHeight) {
		enemies.forEach(enemy => {
			this.renderEnemy(enemy, context, offsetX, offsetY, cellSize, gridWidth, gridHeight);
		});
	}

	/**
	 * Render enemy path for debugging (optional)
	 */
	static renderEnemyPath(enemy, context, offsetX, offsetY, cellSize) {
		if (!enemy.path || enemy.path.length === 0) return;

		context.strokeStyle = 'rgba(255, 255, 0, 0.3)';
		context.lineWidth = 2;
		context.beginPath();

		// Start from enemy position
		context.moveTo(
			offsetX + enemy.x * cellSize + cellSize/2,
			offsetY + enemy.y * cellSize + cellSize/2
		);

		// Draw path
		enemy.path.forEach(waypoint => {
			context.lineTo(
				offsetX + waypoint.x * cellSize + cellSize/2,
				offsetY + waypoint.y * cellSize + cellSize/2
			);
		});

		context.stroke();
	}
} 