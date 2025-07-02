export class EnemyPathfinder {
  constructor(gridWidth, gridHeight) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
  }

  /**
   * Calculate a path using A* from `start` {x,y} to `goal` {x,y} while avoiding obstacles.
   * Obstacles is a Set of "x,y" strings that are blocked.
   * Returns an array of way-points (excluding the starting cell). If no path exists, returns [].
   */
  findPath(start, goal, obstacles) {
    // Basic A* with Manhattan heuristic and diagonal moves (no corner cutting)
    const open = [{ ...start, g: 0, h: this.manhattan(start, goal), f: 0, parent: null }];
    open[0].f = open[0].h;
    const closed = new Set();
    const cameFrom = new Map();

    while (open.length) {
      // Grab lowest f node (linear search is OK for small open sets)
      let currentIndex = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[currentIndex].f) currentIndex = i;
      const current = open.splice(currentIndex, 1)[0];
      const cKey = `${current.x},${current.y}`;
      closed.add(cKey);

      if (current.x === goal.x && current.y === goal.y) {
        // Reconstruct path
        let node = current;
        const path = [];
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          const key = `${node.x},${node.y}`;
          node = cameFrom.get(key);
        }
        return path.slice(1); // drop start
      }

      for (const n of this.getNeighbors(current, obstacles)) {
        const nKey = `${n.x},${n.y}`;
        if (closed.has(nKey)) continue;

        const tentativeG = current.g + 1;
        const existing = open.find(e => e.x === n.x && e.y === n.y);
        if (!existing) {
          const h = this.manhattan(n, goal);
          open.push({ ...n, g: tentativeG, h, f: tentativeG + h, parent: current });
          cameFrom.set(nKey, current);
        } else if (tentativeG < existing.g) {
          existing.g = tentativeG;
          existing.f = tentativeG + existing.h;
          existing.parent = current;
          cameFrom.set(nKey, current);
        }
      }
    }
    return []; // No path
  }

  /* Convenience wrapper mirroring old API */
  calculatePath(enemy, target, allBuildings) {
    // Build obstacle set (skip the target's own cells)
    const obstacles = new Set();
    allBuildings.forEach(b => {
      if (!b.isActive) return;
      if (b.cells) b.cells.forEach(c => obstacles.add(`${c.x},${c.y}`));
      else obstacles.add(`${b.x},${b.y}`);
    });
    const start = { x: Math.floor(enemy.x), y: Math.floor(enemy.y) };
    const goal = { x: Math.round(target.x), y: Math.round(target.y) };

    // If start blocked, early exit.
    if (obstacles.has(`${start.x},${start.y}`)) return [];

    const path = this.findPath(start, goal, obstacles);

    // Simple path smoothing: drop first waypoint if visible
    if (path.length > 1) {
      const first = path[0];
      const second = path[1];
      if (this.isStepClear(start, second, obstacles)) path.shift();
    }
    return path;
  }

  /** Manhattan distance */
  manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /** Neighbor generation with diagonals (no corner cutting) */
  getNeighbors(node, obstacles) {
    const dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
    ];
    const result = [];
    for (const d of dirs) {
      const nx = node.x + d.x;
      const ny = node.y + d.y;
      if (nx < 0 || ny < 0 || nx >= this.gridWidth || ny >= this.gridHeight) continue;
      if (obstacles.has(`${nx},${ny}`)) continue;
      // For diagonals ensure no corner cutting
      if (d.x !== 0 && d.y !== 0) {
        const adj1 = `${node.x + d.x},${node.y}`;
        const adj2 = `${node.x},${node.y + d.y}`;
        if (obstacles.has(adj1) && obstacles.has(adj2)) continue;
      }
      result.push({ x: nx, y: ny });
    }
    return result;
  }

  /** Check if straight step is clear (used for smoothing) */
  isStepClear(start, next, obstacles) {
    if (obstacles.has(`${next.x},${next.y}`)) return false;
    const dx = next.x - start.x;
    const dy = next.y - start.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;
    if (dx !== 0 && dy !== 0) {
      const adj1 = `${start.x + dx},${start.y}`;
      const adj2 = `${start.x},${start.y + dy}`;
      if (obstacles.has(adj1) && obstacles.has(adj2)) return false;
    }
    return true;
  }

  /** 4-directional BFS path used for guaranteed corridor finding */
  calculatePathBFS(enemy, target, allBuildings) {
    // Build obstacle set (skip target cells so we can stand next to CC)
    const obstacles = new Set();
    allBuildings.forEach(b => {
      if (!b.isActive) return;
      if (b.cells) b.cells.forEach(c => obstacles.add(`${c.x},${c.y}`));
      else obstacles.add(`${b.x},${b.y}`);
    });

    const start = { x: Math.floor(enemy.x), y: Math.floor(enemy.y) };
    const goal = { x: Math.round(target.x), y: Math.round(target.y) };

    if (obstacles.has(`${start.x},${start.y}`)) return [];

    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    const parent = new Map();

    const dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
    ];

    while (queue.length) {
      const node = queue.shift();
      if (node.x === goal.x && node.y === goal.y) {
        // reconstruct path
        const path = [];
        let cur = node;
        while (cur) {
          path.unshift({ x: cur.x, y: cur.y });
          const key = `${cur.x},${cur.y}`;
          cur = parent.get(key);
        }
        return path.slice(1); // drop start cell
      }

      for (const d of dirs) {
        const nx = node.x + d.x;
        const ny = node.y + d.y;
        if (nx < 0 || ny < 0 || nx >= this.gridWidth || ny >= this.gridHeight) continue;
        const nKey = `${nx},${ny}`;
        if (visited.has(nKey) || obstacles.has(nKey)) continue;
        visited.add(nKey);
        parent.set(nKey, node);
        queue.push({ x: nx, y: ny });
      }
    }
    return []; // unreachable
  }
} 