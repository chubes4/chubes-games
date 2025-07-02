// Tower Building Definition
export const TOWER_CONFIG = {
	id: 'tower',
	name: 'Guard Tower',
	description: 'Attacks enemies within its range. High priority target for enemies.',
	baseStats: {
		health: 150,
		maxHealth: 150,
		attackDamage: 10,
		attackRange: 6,
		attackCooldown: 500,
		projectileCount: 1,
		lastAttackTime: 0,
	},
	upgrades: {
		damage: {
			name: 'Damage',
			description: '+4 DMG',
			cost: 40,
			effect: (building) => ({
				...building,
				attackDamage: building.attackDamage + 4
			})
		},
		range: {
			name: 'Range',
			description: '+1 Range',
			cost: 30,
			effect: (building) => ({
				...building,
				attackRange: building.attackRange + 1
			})
		},
		fireRate: {
			name: 'Fire Rate',
			description: '-150ms Cooldown',
			cost: 45,
			effect: (building) => ({
				...building,
				attackCooldown: Math.max(200, building.attackCooldown - 150)
			})
		},
		projectiles: {
			name: 'Multi-Shot',
			description: '+1 Projectile',
			cost: 100,
			effect: (building) => ({
				...building,
				projectileCount: building.projectileCount + 1
			})
		},
		repair: {
			name: 'Repair',
			description: '+75 HP',
			cost: 15,
			effect: (building) => ({
				...building,
				health: Math.min(building.maxHealth, building.health + 75)
			})
		}
	},
	canBuild: true,
	buildCost: 35,
	color: '#27ae60', // Green for towers
	borderColor: '#229954'
};

export const createTower = (x, y) => ({
	...TOWER_CONFIG.baseStats,
	lastTurretAngle: 0,
	id: `tower-${Date.now()}-${Math.random()}`,
	type: 'tower',
	x,
	y,
	isActive: true,
	buildCost: TOWER_CONFIG.buildCost,
}); 