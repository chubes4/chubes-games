// TurretManager.js - Handles automated building attacks (towers & command-center)
// Placement: blocks/base-builder/src/buildings/mechanics/TurretManager.js

/**
 * Helper to compute Euclidean distance (pixel-agnostic, grid units).
 */
const dist = (a,b)=> Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

export class TurretManager {
	constructor(projectileManager) {
		this.projectileManager = projectileManager;
	}

	/**
	 * Execute one frame of attack logic for all buildings able to shoot.
	 *
	 * @param {Array} buildings – All active buildings.
	 * @param {EnemyManager} enemyManager – Access to current enemies.
	 * @param {number} currentTime – `Date.now()` timestamp.
	 */
	update(buildings, enemyManager, currentTime) {
		const enemies = enemyManager.getEnemies();
		if (enemies.length === 0) return;

		buildings.forEach((building) => {
			if (building.attackDamage <= 0) return;
			if (currentTime - building.lastAttackTime < building.attackCooldown) return;

			// Filter enemies inside range
			const inRange = enemies.filter((e) => dist(e, building) <= building.attackRange);
			if (inRange.length === 0) return;

			// Sort by distance, grab up to projectileCount targets
			const targets = inRange
				.sort((a, b) => dist(a, building) - dist(b, building))
				.slice(0, building.projectileCount || 1);

			// Save turret angle for renderer (use closest target)
			const closest = targets[0];
			building.lastTurretAngle = Math.atan2(closest.y - building.y, closest.x - building.x);

			// Fire!
			targets.forEach((target) => {
				this.projectileManager.createProjectile(building, target, building.attackDamage);
			});

			building.lastAttackTime = currentTime;
		});
	}
} 