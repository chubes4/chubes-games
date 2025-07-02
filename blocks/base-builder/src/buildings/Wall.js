// Wall Building Definition
export const WALL_CONFIG = {
	id: 'wall',
	name: 'Wall',
	description: 'Defensive structure that blocks enemy movement.',
	baseStats: {
		health: 300,
		maxHealth: 300,
		attackDamage: 0,
		attackRange: 0,
		attackCooldown: 0,
		projectileCount: 0,
		lastAttackTime: 0,
		spikeDamage: 0, // Damage dealt to attackers
	},
	upgrades: {
		repair: {
			name: 'Repair',
			description: '+150 HP',
			cost: 3,
			effect: (building) => ({
				...building,
				health: Math.min(building.maxHealth, building.health + 150)
			})
		},
		reinforce: {
			name: 'Reinforce',
			description: '+100 Max HP',
			cost: 5,
			effect: (building) => ({
				...building,
				maxHealth: building.maxHealth + 100,
				health: building.health + 100
			})
		},
	},
	canBuild: true,
	buildCost: 5,
	color: '#78909c', // Blue-gray stone color for walls
	borderColor: '#546e7a'
};

export const createWall = (x, y) => ({
	...WALL_CONFIG.baseStats,
	id: `wall-${Date.now()}-${Math.random()}`,
	type: 'wall',
	x,
	y,
	isActive: true,
	buildCost: WALL_CONFIG.buildCost,
}); 