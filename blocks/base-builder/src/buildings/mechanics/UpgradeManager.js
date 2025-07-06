// UpgradeManager.js - Helper functions for purchasing building upgrades
// Placement: blocks/base-builder/src/buildings/mechanics/UpgradeManager.js

import { getUpgradeCost, getBuildingConfig, applyUpgrade } from '../index';

/**
 * Attempt to apply an upgrade. Handles cost calculation and building/global updates.
 * Returns an object describing the outcome.
 */
export function attemptUpgrade(gameStateManager, building, upgradeType, globalUpgrades) {
	const cost = getUpgradeCost(building, upgradeType);
	const config = getBuildingConfig(building.type);
	const upgrade = config?.upgrades?.[upgradeType];

	if (!upgrade) return { success: false, reason: 'invalid-upgrade' };
	if (!gameStateManager.canAfford(cost)) return { success: false, reason: 'no-funds', cost };

	// Deduct nuggets inside manager
	if (!gameStateManager.spendNuggets(cost)) return { success: false, reason: 'spend-failed' };

	if (upgrade.isGlobal) {
		const newGlobals = applyUpgrade(building, upgradeType, globalUpgrades);
		return { success: true, cost, globalUpgrades: newGlobals };
	}

	const updated = applyUpgrade(building, upgradeType);
	gameStateManager.updateBuilding(building.id, updated);
	return { success: true, cost, updatedBuilding: updated };
} 