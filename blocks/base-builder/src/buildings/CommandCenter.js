// Command Center Building Definition
export const COMMAND_CENTER_CONFIG = {
	id: 'command-center',
	name: 'Command Center',
	description: 'Your main base. Protect it at all costs!',
	baseStats: {
		health: 1000,
		maxHealth: 1000,
		attackDamage: 20,
		attackRange: 8,
		attackCooldown: 1000,
		projectileCount: 1,
		lastAttackTime: 0,
	},
	upgrades: {
		damage: {
			name: 'Damage',
			description: '+5 DMG',
			cost: 29,
			effect: (building) => ({
				...building,
				attackDamage: building.attackDamage + 5
			})
		},
		range: {
			name: 'Range',
			description: '+1 Range',
			cost: 29,
			effect: (building) => ({
				...building,
				attackRange: building.attackRange + 1
			})
		},
		fireRate: {
			name: 'Fire Rate',
			description: '-50ms Cooldown',
			cost: 48,
			effect: (building) => ({
				...building,
				attackCooldown: Math.max(100, building.attackCooldown - 50)
			})
		},
		projectiles: {
			name: 'Multi-Shot',
			description: '+1 Projectile',
			cost: 125,
			effect: (building) => ({
				...building,
				projectileCount: building.projectileCount + 1
			})
		},
		repair: {
			name: 'Repair',
			description: '+250 HP',
			cost: 20,
			effect: (building) => ({
				...building,
				health: Math.min(building.maxHealth, building.health + 250)
			})
		},
		maxHealth: {
			name: 'Fortify',
			description: '+250 Max HP',
			cost: 50,
			effect: (building) => ({
				...building,
				maxHealth: building.maxHealth + 250,
				health: building.health + 250
			})
		}
	},
	shape: [ // Defines the shape relative to the center (x, y)
		{ x: 0, y: 0 }, // Center
		{ x: 0, y: -1 }, // Top
		{ x: 0, y: 1 }, // Bottom
		{ x: -1, y: 0 }, // Left
		{ x: 1, y: 0 }, // Right
	],
	canBuild: false, // Command center is unique - only one exists at start
	buildCost: 0
};

export const createCommandCenter = (x, y) => ({
	...COMMAND_CENTER_CONFIG.baseStats,
	id: 'main-command-center',
	type: 'command-center',
	x, // Central x for targeting
	y, // Central y for targeting
	cells: COMMAND_CENTER_CONFIG.shape.map(offset => ({
		x: x + offset.x,
		y: y + offset.y,
	})),
	isActive: true,
	lastTurretAngle: 0
}); 