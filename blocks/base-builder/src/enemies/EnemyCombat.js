/**
 * EnemyCombat - Handles enemy attack logic and combat animations
 */

import { getEnemyTypeConfig } from './EnemyTypes';

export class EnemyCombat {
	/**
	 * Handle enemy attack logic and animation
	 */
	static handleAttack(enemy, damageBuildingCallback, globalUpgrades = {}) {
		const currentTime = Date.now();
		const enemyConfig = getEnemyTypeConfig(enemy.type);
		const attackCooldown = enemyConfig.attackCooldown;
		
		// If enemy is in attack state and cooldown has passed
		if (enemy.state === 'attacking' && currentTime - enemy.lastAttackTime > attackCooldown) {
			// Start attack animation
			return {
				...enemy,
				isAttacking: true,
				attackAnimationProgress: 0,
				lastAttackTime: currentTime
			};
		}
		
		// Handle attack animation
		if (enemy.isAttacking) {
			const animationSpeed = 0.15; // How fast the lurch animation plays
			const newProgress = Math.min(1, enemy.attackAnimationProgress + animationSpeed);
			
			// If animation is complete, deal damage and reset
			if (newProgress >= 1) {
				const target = enemy.currentTarget;
				if (target) {
					// Attack the target building
					damageBuildingCallback(target.id, enemy.damage);
					
					// Apply global spike damage back to enemy if target is a wall
					if (target.type === 'wall' && globalUpgrades.spikeDamage > 0) {
						return {
							...enemy,
							health: Math.max(0, enemy.health - globalUpgrades.spikeDamage),
							isActive: enemy.health - globalUpgrades.spikeDamage > 0,
							isAttacking: false,
							attackAnimationProgress: 0
						};
					}
				}
				
				return {
					...enemy,
					isAttacking: false,
					attackAnimationProgress: 0
				};
			}
			
			return {
				...enemy,
				attackAnimationProgress: newProgress
			};
		}
		
		return enemy;
	}

	/**
	 * Apply damage to an enemy
	 */
	static damageEnemy(enemy, damage, onEnemyKilled) {
		const newHealth = Math.max(0, enemy.health - damage);

		// If health drops to 0 or below, trigger the callback
		if (newHealth <= 0 && enemy.health > 0) {
			onEnemyKilled(enemy);
		}

		return {
			...enemy,
			health: newHealth,
			isActive: newHealth > 0
		};
	}

	/**
	 * Get attack animation offset for rendering
	 */
	static getAttackAnimationOffset(enemy, gridWidth, gridHeight) {
		if (!enemy.isAttacking || enemy.attackAnimationProgress <= 0) {
			return { x: 0, y: 0 };
		}

		const lurchIntensity = 3; // How many pixels to lurch
		const animProgress = enemy.attackAnimationProgress;
		
		// Create a lurch effect (forward and back)
		let lurchOffset = 0;
		if (animProgress <= 0.5) {
			// Lurch forward
			lurchOffset = (animProgress * 2) * lurchIntensity;
		} else {
			// Return to position
			lurchOffset = ((1 - animProgress) * 2) * lurchIntensity;
		}
		
		// Apply offset toward the target if available, otherwise toward center
		let dirX = 0, dirY = 0;
		
		if (enemy.currentTarget) {
			dirX = enemy.currentTarget.x > enemy.x ? 1 : -1;
			dirY = enemy.currentTarget.y > enemy.y ? 1 : -1;
		} else {
			// Fallback to center direction
			const centerX = gridWidth / 2;
			const centerY = gridHeight / 2;
			dirX = centerX > enemy.x ? 1 : -1;
			dirY = centerY > enemy.y ? 1 : -1;
		}
		
		return {
			x: dirX * lurchOffset,
			y: dirY * lurchOffset
		};
	}
} 