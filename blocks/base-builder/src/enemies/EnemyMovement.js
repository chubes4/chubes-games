/**
 * EnemyMovement - simplified movement using PathPlanner and basic stuck detection.
 */

import { PathPlanner } from './PathPlanner';

const ATTACK_RANGE = 1.5; // cells
// Distance an enemy must move in a single frame to be considered "not stuck"
// Speeds for our slowest enemies are around 0.01 cells/frame, so we use a
// comfortably smaller epsilon. This prevents false positives that caused
// constant re-planning and freezing.
const STUCK_DISTANCE_EPS = 0.0025;
const STUCK_FRAME_LIMIT = 20; // frames (~0.3s at 60fps)

export class EnemyMovement {
	constructor(gridWidth, gridHeight) {
		this.gridWidth = gridWidth;
		this.gridHeight = gridHeight;
		this.planner = new PathPlanner(gridWidth, gridHeight);
	}

	distance(a, b) {
		return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
	}

	minDistanceToBuilding(pos, building) {
		if (!building) return Infinity;
		if (building.cells) {
			return Math.min(...building.cells.map(c => this.distance(pos, c)));
		}
		return this.distance(pos, building);
	}

	getMinDistanceToBuilding(enemy, building) {
		return this.minDistanceToBuilding(enemy, building);
	}

	isPathBlocked(path, allBuildings) {
		if (!path || path.length === 0) return false;
		return path.some(wp => {
			return allBuildings.some(b => {
				if (!b.isActive) return false;
				if (b.cells) return b.cells.some(c => c.x === wp.x && c.y === wp.y);
				return b.x === wp.x && b.y === wp.y;
			});
		});
	}

	update(enemy, allBuildings) {
		// Initialise movement metadata
		if (enemy.lastPos === undefined) {
			enemy.lastPos = { x: enemy.x, y: enemy.y };
			enemy.stuckFrames = 0;
		}

		// Re-plan when needed
		if (
			!enemy.path ||
			enemy.pathIndex >= enemy.path.length ||
			this.isPathBlocked(enemy.path, allBuildings) ||
			enemy.stuckFrames > STUCK_FRAME_LIMIT
		) {
			const { target, path } = this.planner.planPath(enemy, allBuildings);
			enemy.path = path;
			enemy.pathIndex = 0;
			enemy.currentTarget = target;
			// Only reset stuck tracking if we actually found a viable path
			if (path && path.length > 0) {
				enemy.stuckFrames = 0;
				enemy.lastPos = { x: enemy.x, y: enemy.y };
			}
		}

		// No path → attack if adjacent else wait and increment stuck counter so we eventually re-plan
		if (!enemy.path || enemy.path.length === 0) {
			if (enemy.currentTarget && this.minDistanceToBuilding(enemy, enemy.currentTarget) <= ATTACK_RANGE) {
				return { ...enemy, state: 'attacking' };
			}
			// Not adjacent and nowhere to go → count as stuck so we re-plan soon
			enemy.stuckFrames += 1;
			return enemy;
		}

		// Step toward next waypoint
		const wp = enemy.path[enemy.pathIndex];
		const dx = wp.x - enemy.x;
		const dy = wp.y - enemy.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 0.1) {
			enemy.pathIndex += 1;
		return enemy;
	}

		const vx = (dx / dist) * enemy.speed;
		const vy = (dy / dist) * enemy.speed;
		let newX = enemy.x + vx;
		let newY = enemy.y + vy;

		// Prevent stepping inside building cells
		const cellX = Math.round(newX);
		const cellY = Math.round(newY);
		const occupied = allBuildings.some(b => {
			if (!b.isActive) return false;
			if (b.cells) return b.cells.some(c => c.x === cellX && c.y === cellY);
			return b.x === cellX && b.y === cellY;
		});
		if (occupied) {
			enemy.stuckFrames += 1;
		return enemy;
	}

		// Stuck frame accounting
		const moved = this.distance({ x: newX, y: newY }, enemy.lastPos);
		if (moved < STUCK_DISTANCE_EPS) {
			enemy.stuckFrames += 1;
		} else {
			enemy.stuckFrames = 0;
			enemy.lastPos = { x: newX, y: newY };
		}

		// Auto-attack when close
		if (enemy.currentTarget && this.minDistanceToBuilding({ x: newX, y: newY }, enemy.currentTarget) <= ATTACK_RANGE) {
			return { ...enemy, x: newX, y: newY, state: 'attacking' };
		}

		// Dynamic aggro: if currently targeting CC but now a tower is within aggro range, switch.
		if(enemy.currentTarget && enemy.currentTarget.type==='command-center'){
			const nearbyTower = allBuildings.find(b=>b.type==='tower' && b.isActive && this.minDistanceToBuilding(enemy,b)<=10);
			if(nearbyTower){
				const result=this.planner.planPath(enemy, allBuildings);
				enemy.currentTarget=result.target;
				enemy.path=result.path;
				enemy.pathIndex=0;
			}
		}

		return { ...enemy, x: newX, y: newY, state: 'moving' };
	}

	// Placeholder for debug compatibility
	debugRenderPaths() {}
} 