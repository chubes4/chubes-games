// RepairHandler.js - Handles building repairs separate from standard stat upgrades
// Placement: blocks/base-builder/src/buildings/mechanics/RepairHandler.js

import { getBuildingConfig } from '../index';

/**
 * Attempt to repair a building by its configured repair upgrade.
 * Repair upgrades are identified by key 'repair' inside the building config.
 * Returns an object with { success, cost, updatedBuilding }
 */
export function attemptRepair(gameStateManager, building) {
	const config = getBuildingConfig(building.type);
	const repairUpgrade = config?.upgrades?.repair;
	if (!repairUpgrade) return { success: false, reason: 'no-repair' };

	const cost = repairUpgrade.cost;
	if (!gameStateManager.canAfford(cost)) return { success: false, reason: 'no-funds', cost };

	if (!gameStateManager.spendNuggets(cost)) return { success: false, reason: 'spend-failed' };

	const updated = repairUpgrade.effect(building);
	gameStateManager.updateBuilding(building.id, updated);
	return { success: true, cost, updatedBuilding: updated };
} 