// Building System Index
import { COMMAND_CENTER_CONFIG } from './CommandCenter';
import { WALL_CONFIG, createWall } from './Wall';
import { TOWER_CONFIG, createTower } from './Tower';
import { UPGRADE_CENTER_CONFIG, createUpgradeCenter } from './UpgradeCenter';

// All buildable building types
export const BUILDABLE_TYPES = [
	{ type: 'wall', config: WALL_CONFIG },
	{ type: 'tower', config: TOWER_CONFIG },
	{ type: 'upgrade-center', config: UPGRADE_CENTER_CONFIG },
];

// All building configurations (including non-buildable)
const ALL_BUILDING_CONFIGS = {
	'command-center': COMMAND_CENTER_CONFIG,
	'wall': WALL_CONFIG,
	'tower': TOWER_CONFIG,
	'upgrade-center': UPGRADE_CENTER_CONFIG,
};

/**
 * Create a new building instance of a specific type
 * @param {string} type - The type of building to create (e.g., 'wall', 'tower').
 * @param {number} x - The grid x-coordinate.
 * @param {number} y - The grid y-coordinate.
 * @returns {object|null} A new building object or null if type is invalid.
 */
export const createBuilding = (type, x, y) => {
	switch (type) {
		case 'wall':
			return createWall(x, y);
		case 'tower':
			return createTower(x, y);
		case 'upgrade-center':
			return createUpgradeCenter(x, y);
		default:
			return null;
	}
};

/**
 * Get the configuration object for a specific building type.
 * @param {string} type - The building type.
 * @returns {object|null} The configuration object or null.
 */
export const getBuildingConfig = (type) => {
	return ALL_BUILDING_CONFIGS[type] || null;
};

/**
 * Apply an upgrade to a building or global state.
 * @param {object} building - The building being upgraded.
 * @param {string} upgradeType - The type of upgrade to apply.
 * @param {object} globalUpgrades - The current global upgrades state.
 * @returns {object} The updated building or global state object.
 */
export const applyUpgrade = (building, upgradeType, globalUpgrades) => {
	const config = getBuildingConfig(building.type);
	const upgrade = config?.upgrades?.[upgradeType];

	if (!upgrade) return building;

	// Handle global upgrades separately (they modify globalUpgrades object)
	if (upgrade.isGlobal) {
		return upgrade.effect(globalUpgrades);
	}

	// Clone upgradeLevels helper
	const levels = {
		...(building.upgradeLevels || {}),
	};
	levels[upgradeType] = (levels[upgradeType] || 0) + 1;

	// Apply the upgrade effect to produce the new building stats
	const updated = upgrade.effect(building);

	return {
		...updated,
		upgradeLevels: levels,
	};
};

/**
 * Calculate the scaled cost for an upgrade based on how many times it has
 * already been purchased for that building. Simple exponential scaling keeps
 * late-game power spikes under control while still letting early upgrades be
 * affordable.
 *
 * Formula: cost = baseCost * (multiplier ^ currentLevel)
 * Where multiplier is a tunable constant (default 1.5).
 *
 * Note: Repair upgrades always cost the base amount (no scaling).
 *
 * @param {object} building – The building instance being upgraded.
 * @param {string} upgradeType – The upgrade key (e.g. 'damage').
 * @param {number} [multiplier=1.5] – Optional scaling multiplier.
 * @returns {number} – Nugget cost after scaling & rounding.
 */
export const getUpgradeCost = (building, upgradeType, multiplier = 1.5) => {
	const config = getBuildingConfig(building.type);
	const baseCost = config?.upgrades?.[upgradeType]?.cost ?? Infinity;
	
	// Repair upgrades don't scale - always cost the base amount
	if (upgradeType === 'repair') {
		return baseCost;
	}
	
	const currentLevel = building.upgradeLevels?.[upgradeType] || 0;
	return Math.round(baseCost * Math.pow(multiplier, currentLevel));
};

/**
 * Check if the player can afford the next level of an upgrade.
 *
 * @param {object} building – Building instance.
 * @param {string} upgradeType – Upgrade key.
 * @param {number} nuggets – Player's current currency.
 * @returns {boolean}
 */
export const canAffordUpgrade = (building, upgradeType, nuggets) => {
	const cost = getUpgradeCost(building, upgradeType);
	return nuggets >= cost;
};

export {
	COMMAND_CENTER_CONFIG,
	WALL_CONFIG,
	createWall,
	TOWER_CONFIG,
	createTower,
	UPGRADE_CENTER_CONFIG,
	createUpgradeCenter
}; 