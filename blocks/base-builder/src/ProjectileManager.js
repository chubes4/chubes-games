// Projectile constants
const PROJECTILE_SPEED = 0.1; // Speed of projectiles

/**
 * ProjectileManager - Handles all projectile logic
 */
export class ProjectileManager {
	constructor() {
		this.projectiles = [];
	}

	/**
	 * Create a new projectile
	 * @param {object} start - The starting {x, y} coordinates
	 * @param {object} target - The target enemy object
	 * @param {number} damage - The damage the projectile will deal
	 */
	createProjectile(start, target, damage) {
		const newProjectile = {
			id: Date.now() + Math.random(),
			x: start.x,
			y: start.y,
			targetId: target.id,
			targetX: target.x,
			targetY: target.y,
			damage: damage,
			speed: PROJECTILE_SPEED,
			isActive: true,
		};
		this.projectiles.push(newProjectile);
	}

	/**
	 * Update all projectiles - movement and collision
	 * @param {array} enemies - The array of current enemy objects
	 * @param {function} damageEnemyCallback - The function to call to damage an enemy
	 */
	update(enemies, damageEnemyCallback) {
		this.projectiles = this.projectiles.filter(p => p.isActive);

		this.projectiles.forEach(projectile => {
			const target = enemies.find(e => e.id === projectile.targetId);

			// If target is gone, projectile continues to last known spot and fizzles
			const targetX = target ? target.x : projectile.targetX;
			const targetY = target ? target.y : projectile.targetY;

			const dx = targetX - projectile.x;
			const dy = targetY - projectile.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Check for collision
			if (distance < 0.5) {
				if (target) {
					damageEnemyCallback(projectile.targetId, projectile.damage);
				}
				projectile.isActive = false;
				return;
			}

			// Move projectile
			const moveX = (dx / distance) * projectile.speed;
			const moveY = (dy / distance) * projectile.speed;
			projectile.x += moveX;
			projectile.y += moveY;
			
			// Update last known target position
			if(target) {
				projectile.targetX = target.x;
				projectile.targetY = target.y;
			}
		});
	}

	/**
	 * Render all active projectiles
	 */
	render(context, offsetX, offsetY, cellSize) {
		this.projectiles.forEach(p => {
			const pixelX = offsetX + p.x * cellSize + cellSize / 2;
			const pixelY = offsetY + p.y * cellSize + cellSize / 2;

			context.fillStyle = '#f1c40f'; // Yellow for projectiles
			context.beginPath();
			context.arc(pixelX, pixelY, 3, 0, Math.PI * 2);
			context.fill();
		});
	}
} 