// SellBuilding.js - Handles building refunds on sell
// Placement: blocks/base-builder/src/buildings/mechanics/SellBuilding.js

import { calculateSellRefund } from '../../ResourceManager';

export function sellBuilding(gameStateManager, buildingId) {
	const building = gameStateManager.removeBuilding(buildingId);
	if (!building) return { success: false };

	const refund = calculateSellRefund(building);
	gameStateManager.resources.nuggets += refund;
	return { success: true, refund };
} 