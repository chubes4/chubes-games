/**
 * PathPlanner - Selects a priority target and generates a path using EnemyPathfinder.
 *
 * Priority order:
 *   1. Current attack target (sticky)
 *   2. Closest tower within aggro range
 *   3. Command Center
 * Walls are never chosen as primary targets. They are treated as obstacles and
 * will only be attacked when an enemy is adjacent AND no path is available to a higher-priority target.
 */

import { EnemyPathfinder } from './EnemyPathfinder';

// Towers will draw aggro once an enemy enters this many cells from them.
export const TOWER_AGGRO_RANGE = 10;

export class PathPlanner {
	constructor(gridWidth, gridHeight) {
		this.gridWidth = gridWidth;
		this.gridHeight = gridHeight;
		this.pathfinder = new EnemyPathfinder(gridWidth, gridHeight);
	}

	/** Manhattan distance */
	getDistance(a, b) {
		return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
	}

	/**
	 * Choose a target building based on priority rules.
	 */
	chooseTarget(enemy, allBuildings) {
		// 1. Keep currentTarget if still active
		if (enemy.currentTarget && enemy.currentTarget.isActive) {
			return enemy.currentTarget;
		}

		// Gather buildings
		const commandCenter = allBuildings.find(b => b.type === 'command-center');
		const towers = allBuildings.filter(b => b.type === 'tower' && b.isActive);

		// 2. If any tower exists, pick the closest one (towers always higher priority)
		if(towers.length>0){
			let closestTower=towers[0];
			towers.forEach(t=>{
				if(this.getDistance(enemy,t)<this.getDistance(enemy,closestTower)) closestTower=t;
			});
			return closestTower;
		}

		// 3. Fallback to command center
		return commandCenter;
	}

	/**
	 * Return the 8 perimeter cells around a building.
	 */
	getPerimeterCells(building) {
		const dirs = [
			{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
			{ x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
		];
		const cells = building.cells ? building.cells : [{ x: building.x, y: building.y }];
		const results = [];
		cells.forEach(c => {
			dirs.forEach(d => {
				const nx = c.x + d.x;
				const ny = c.y + d.y;
				if (nx < 0 || ny < 0 || nx >= this.gridWidth || ny >= this.gridHeight) return;
				results.push({ x: nx, y: ny });
			});
		});
		return results;
	}

	/**
	 * Produce a path for an enemy to its priority target.
	 * Returns { target, path } where path may be [] if unreachable.
	 */
	planPath(enemy, allBuildings) {
		const target = this.chooseTarget(enemy, allBuildings);
		if (!target) return { target: null, path: [] };

		// Choose closest perimeter cell to enemy
		const perimeter = this.getPerimeterCells(target);
		perimeter.sort((a,b)=> this.getDistance(enemy,a)-this.getDistance(enemy,b));

		// Build obstacle list (all active buildings) – exclude target perimeter cells
		const obstacles = new Set();
		allBuildings.forEach(b=>{
			if(!b.isActive) return;
			if(b.cells){b.cells.forEach(c=>obstacles.add(`${c.x},${c.y}`));}
			else obstacles.add(`${b.x},${b.y}`);
		});

		for (const cell of perimeter) {
			obstacles.delete(`${cell.x},${cell.y}`); // allow standing here
		}

		for (const cell of perimeter) {
			const path = this.pathfinder.findPath(
				{ x: Math.floor(enemy.x), y: Math.floor(enemy.y) },
				cell,
				obstacles
			);
			if (path.length > 0) {
				return { target, path };
			}
		}

		// No perimeter reachable – attempt to path to closest blocking wall
		const blockingWalls = allBuildings.filter(b=>b.type==='wall' && b.isActive);
		blockingWalls.sort((a,b)=> this.getDistance(enemy,a)-this.getDistance(enemy,b));
		for(const wall of blockingWalls){
			const adjDirs = [ {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1} ];
			const wallCells = wall.cells? wall.cells : [{x:wall.x,y:wall.y}];
			for(const wc of wallCells){
				for(const d of adjDirs){
					const cell={x:wc.x+d.x,y:wc.y+d.y};
					if(cell.x<0||cell.y<0||cell.x>=this.gridWidth||cell.y>=this.gridHeight) continue;
					// allow standing on this adjacent cell
					obstacles.delete(`${cell.x},${cell.y}`);
					const path=this.pathfinder.findPath({x:Math.floor(enemy.x),y:Math.floor(enemy.y)},cell,obstacles);
					if(path.length>0){
						return { target: wall, path };
					}
				}
			}
		}

		// Still nothing reachable – return empty
		return { target, path: [] };
	}
} 