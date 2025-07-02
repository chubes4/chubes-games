/**
 * EnemyTypes - Defines different enemy configurations
 */

export const ENEMY_TYPES = {
	basic: {
		id: 'basic',
		name: 'Basic Enemy',
		health: 100,
		damage: 10,
		speed: 0.02,
		color: '#e74c3c',
		borderColor: '#c0392b',
		attackColor: '#ff6b6b',
		attackBorderColor: '#e55353',
		attackCooldown: 1500,
		size: 0.6, // Relative to cell size
		points: 1, // Points/nuggets awarded for killing
		spawnWeight: 10 // How likely to spawn (higher = more common)
	},
	
	fast: {
		id: 'fast',
		name: 'Fast Enemy',
		health: 60,
		damage: 8,
		speed: 0.035,
		color: '#f39c12',
		borderColor: '#d68910',
		attackColor: '#ffcc29',
		attackBorderColor: '#f4b942',
		attackCooldown: 1200,
		size: 0.5,
		points: 2,
		spawnWeight: 3
	},
	
	heavy: {
		id: 'heavy',
		name: 'Heavy Enemy',
		health: 200,
		damage: 20,
		speed: 0.01,
		color: '#8e44ad',
		borderColor: '#6c3483',
		attackColor: '#bb6bd9',
		attackBorderColor: '#a569bd',
		attackCooldown: 2000,
		size: 0.8,
		points: 3,
		spawnWeight: 2
	}
};

/**
 * Create a new enemy instance based on type
 */
export const createEnemy = (type, position) => {
	const enemyType = ENEMY_TYPES[type];
	if (!enemyType) {
		throw new Error(`Unknown enemy type: ${type}`);
	}

	return {
		id: Date.now() + Math.random(), // Unique ID
		type: type,
		x: position.x,
		y: position.y,
		health: enemyType.health,
		maxHealth: enemyType.health,
		damage: enemyType.damage,
		speed: enemyType.speed,
		isActive: true,
		lastAttackTime: 0,
		isAttacking: false,
		attackAnimationProgress: 0,
		state: 'moving',
		currentTarget: null,
		path: null,
		pathIndex: 0,
		lastPathCalc: null
	};
};

/**
 * Get enemy type configuration
 */
export const getEnemyTypeConfig = (type) => {
	return ENEMY_TYPES[type];
};

/**
 * Get a random enemy type based on spawn weights
 */
export const getRandomEnemyType = () => {
	const types = Object.keys(ENEMY_TYPES);
	const totalWeight = types.reduce((sum, type) => sum + ENEMY_TYPES[type].spawnWeight, 0);
	
	let random = Math.random() * totalWeight;
	
	for (const type of types) {
		random -= ENEMY_TYPES[type].spawnWeight;
		if (random <= 0) {
			return type;
		}
	}
	
	return 'basic'; // Fallback
};

/**
 * Calculate points/nuggets for killing an enemy
 */
export const getEnemyReward = (enemyType) => {
	const config = ENEMY_TYPES[enemyType];
	return config ? config.points : 1;
}; 