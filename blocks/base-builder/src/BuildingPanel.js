import React from 'react';
import './BuildingPanel.scss';
import { getBuildingConfig, BUILDABLE_TYPES, getUpgradeCost, canAffordUpgrade } from './buildings';

const BuildingPanel = ({ building, nuggets, onUpgrade, onSell, onClose, onBuild, mode = 'upgrade', isBuildLocationValid = true }) => {
	// If no building and not in build mode, don't show panel
	if (!building && mode !== 'build') return null;

	// Build mode - show available buildings to construct
	if (mode === 'build') {
		const canAffordBuilding = (cost) => nuggets >= cost;
		const isLocationInvalid = !isBuildLocationValid;

		return (
			<div className="building-panel visible">
				<div className="panel-header">
					<h3>Build Menu</h3>
					<button onClick={onClose} className="close-button">&times;</button>
				</div>
				<div className="panel-main">
					<div className="panel-content">
						<p>Nuggets: <span className="stat-value">{nuggets}💎</span></p>
						{isLocationInvalid ? (
							<p className="location-invalid-message">Cannot build here: Location is blocked by an enemy.</p>
						) : (
							<p>Select a building to construct:</p>
						)}
					</div>
					<div className="panel-builds">
						{BUILDABLE_TYPES.map(({ type, config }) => (
							<button
								key={type}
								onClick={() => onBuild(type)}
								disabled={!canAffordBuilding(config.buildCost) || isLocationInvalid}
								className="build-button"
								title={isLocationInvalid ? 'Location is blocked' : ''}
							>
								<div className="build-title">{config.name}</div>
								<div className="build-description">{config.description}</div>
								<div className="build-cost">{config.buildCost}💎</div>
							</button>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Upgrade mode - show building stats and upgrades
	const config = getBuildingConfig(building.type);
	if (!config) return null;

	const canAffordUpgradeLocal = (upgradeType) => {
		return canAffordUpgrade(building, upgradeType, nuggets);
	};

	const getRefundAmount = () => {
		if (!building || !building.buildCost) return 0;
		return Math.floor((building.health / building.maxHealth) * building.buildCost);
	};

	const getUpgradeButtonClass = (upgradeType) => {
		if (!canAffordUpgradeLocal(upgradeType)) return 'upgrade-button disabled';
		return 'upgrade-button';
	};

	const renderStat = (label, value, suffix = '') => (
		<p key={label}>
			{label}: <span className="stat-value">{value}{suffix}</span>
		</p>
	);

	const renderStats = () => {
		const stats = [];
		
		// Always show health
		stats.push(renderStat('Health', `${Math.round(building.health)} / ${building.maxHealth}`));
		
		// Show attack stats only if building can attack
		if (building.attackDamage > 0) {
			stats.push(renderStat('Damage', building.attackDamage));
			stats.push(renderStat('Range', building.attackRange));
			stats.push(renderStat('Fire Rate', (1000 / building.attackCooldown).toFixed(2), '/s'));
			if (building.projectileCount > 1) {
				stats.push(renderStat('Projectiles', building.projectileCount));
			}
		}
		
		// Show spike damage for defensive buildings
		if (building.spikeDamage > 0) {
			stats.push(renderStat('Spike Damage', building.spikeDamage));
		}
		
		return stats;
	};

	const showSellButton = building.type !== 'command-center';
	const refundAmount = getRefundAmount();

	return (
		<div className="building-panel visible">
			<div className="panel-header">
				<h3>{config.name}</h3>
				<button onClick={onClose} className="close-button">&times;</button>
			</div>
			<div className="panel-main">
				<div className="panel-content">
					{renderStats()}
				</div>
				<div className="panel-upgrades">
					{Object.entries(config.upgrades).map(([upgradeType, upgrade]) => {
						const cost = getUpgradeCost(building, upgradeType);
						return (
							<button
								key={upgradeType}
								onClick={() => onUpgrade(upgradeType)}
								disabled={!canAffordUpgradeLocal(upgradeType)}
								className={getUpgradeButtonClass(upgradeType)}
							>
								<div className="upgrade-title">{upgrade.name}</div>
								<div className="upgrade-effect">{upgrade.description}</div>
								<div className="upgrade-cost">{cost}💎</div>
							</button>
						);
					})}
				</div>
				{showSellButton && (
					<div className="panel-sell">
						<button onClick={() => onSell(building.id)} className="sell-button">
							Sell Building
							<span className="sell-amount">+{refundAmount}💎</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default BuildingPanel; 