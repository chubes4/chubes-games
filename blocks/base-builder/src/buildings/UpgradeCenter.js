// Upgrade Center Building Definition
export const UPGRADE_CENTER_CONFIG = {
	id: 'upgrade-center',
	name: 'Upgrade Center',
	description: 'Unlocks powerful global upgrades for all your structures.',
	baseStats: {
		health: 400,
		maxHealth: 400,
	},
	upgrades: {
		spikes: {
			name: 'Global Spikes',
			description: 'All walls deal 10 damage to attackers.',
			cost: 150,
			isGlobal: true, // Custom flag to identify global upgrades
			effect: (globalUpgrades) => ({
				...globalUpgrades,
				spikeDamage: (globalUpgrades.spikeDamage || 0) + 10,
			}),
		},
		repair: {
			name: 'Repair',
			description: '+100 HP',
			cost: 15,
			effect: (building) => ({
				...building,
				health: Math.min(building.maxHealth, building.health + 100),
			}),
		},
	},
	canBuild: true,
	buildCost: 60,
	color: '#f1c40f',
	borderColor: '#f39c12',
};

export const createUpgradeCenter = (x, y) => ({
	...UPGRADE_CENTER_CONFIG.baseStats,
	id: `upgrade-center-${Date.now()}-${Math.random()}`,
	type: 'upgrade-center',
	x,
	y,
	isActive: true,
	upgradeLevels: {},
	buildCost: UPGRADE_CENTER_CONFIG.buildCost,
}); 