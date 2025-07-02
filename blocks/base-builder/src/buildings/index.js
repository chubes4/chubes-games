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

	if (!upgrade) {
		return building;
	}
    
    // If the upgrade is global, apply it to the global state
    if (upgrade.isGlobal) {
        return upgrade.effect(globalUpgrades);
    }

	// Otherwise, apply it to the building instance
	return upgrade.effect(building);
};

/**
 * Check if a player can afford a specific upgrade.
 * @param {string} buildingType - The type of building.
 * @param {string} upgradeType - The type of upgrade.
 * @param {number} nuggets - The player's current nuggets.
 * @returns {boolean} True if the player can afford the upgrade.
 */
export const canAffordUpgrade = (buildingType, upgradeType, nuggets) => {
	const config = getBuildingConfig(buildingType);
	const cost = config?.upgrades?.[upgradeType]?.cost;
	return cost !== undefined && nuggets >= cost;
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