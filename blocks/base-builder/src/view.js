/**
 * Use this file for JavaScript code that you want to run in the front-end 
 * on posts/pages that contain this block.
 *
 * When this file is defined as the value of the `viewScript` property
 * in `block.json` it will be enqueued on the front end of the site.
 *
 * Example:
 *
 * ```js
 * {
 *   "viewScript": "file:./view.js"
 * }
 * ```
 *
 * If you're not making any changes to this file because your project doesn't need any 
 * JavaScript running in the front-end, then you should delete this file and remove 
 * the `viewScript` property from `block.json`. 
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */
 
/* eslint-disable no-console */
console.log("Hello World! (from chubes-games-base-builder block)");
/* eslint-enable no-console */

import React from 'react';
import ReactDOM from 'react-dom';
import GameWindow from '../../components/game-window';
import { useEffect, useRef, useState, useCallback } from '@wordpress/element';
import { EnemyManager } from './enemies';
import { ProjectileManager } from './ProjectileManager';
import { GameStateManager, GAME_STATUS, GRID_WIDTH, GRID_HEIGHT } from './GameState';
import { GameRenderer } from './GameRenderer';
import { calculateSellRefund } from './ResourceManager';
import BuildingPanel from './BuildingPanel';
import { applyUpgrade, getBuildingConfig, canAffordUpgrade, createBuilding } from './buildings';

// Styles
import './style.scss';

const Game = React.forwardRef(({ selectedBuilding, setSelectedBuilding, setNuggets, setGameStatus, onBuildLocationValidityChange, globalUpgrades }, ref) => {
	const canvasRef = useRef(null);
	const gameStateManagerRef = useRef(null);
	const gameRendererRef = useRef(null);
	const enemyManagerRef = useRef(null);
	const projectileManagerRef = useRef(null);
	const animationFrameRef = useRef(null);
	const [gameState, setGameState] = useState(null);
	const [isBuildLocationValid, setIsBuildLocationValid] = useState(true);

	// Initialize managers
	useEffect(() => {
		gameStateManagerRef.current = new GameStateManager();
		gameRendererRef.current = new GameRenderer(canvasRef.current);
		enemyManagerRef.current = new EnemyManager(GRID_WIDTH, GRID_HEIGHT);
		projectileManagerRef.current = new ProjectileManager();
		
		// Set initial game state
		setGameState(gameStateManagerRef.current.getState());
	}, []);

	// Communicate build location validity changes to parent
	useEffect(() => {
		if (onBuildLocationValidityChange) {
			onBuildLocationValidityChange(isBuildLocationValid);
		}
	}, [isBuildLocationValid, onBuildLocationValidityChange]);

	// Communicate status changes to parent
	useEffect(() => {
		if (gameState) {
			setGameStatus(gameState.status);
			setNuggets(gameState.nuggets);
		}
	}, [gameState, setGameStatus, setNuggets]);

	// Click handler
	useEffect(() => {
		const canvas = canvasRef.current;
		
		const handleClick = (event) => {
			if (!gameState || gameState.status === GAME_STATUS.GAME_OVER) return;
			
			const rect = canvas.getBoundingClientRect();
			const layout = gameRendererRef.current.calculateLayout();
			
			const clickX = event.clientX - rect.left;
			const clickY = event.clientY - rect.top;

			// Convert to grid coordinates
			const gridX = Math.floor((clickX - layout.offsetX) / layout.actualCellSize);
			const gridY = Math.floor((clickY - layout.offsetY) / layout.actualCellSize);

			// Check if click is within grid bounds
			if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
				return;
			}

			// Check main building click
			const isCommandCenterCell = gameState.mainBuilding.cells.some(cell => cell.x === gridX && cell.y === gridY);
			if (isCommandCenterCell) {
				setSelectedBuilding(gameState.mainBuilding);
				return;
			}

			// Check other buildings click
			const clickedBuilding = gameState.buildings.find(building => 
				building.x === gridX && building.y === gridY
			);
			
			if (clickedBuilding) {
				setSelectedBuilding(clickedBuilding);
				return;
			}

			// Empty grid click - open build panel
			setSelectedBuilding({ type: 'build', x: gridX, y: gridY });
		};

		canvas.addEventListener('click', handleClick);
		return () => canvas.removeEventListener('click', handleClick);
	}, [gameState, setSelectedBuilding]);

	// Game state update helper
	const updateGameState = useCallback(() => {
		setGameState(gameStateManagerRef.current.getState());
	}, []);

	// Callbacks for managers
	const damageBuilding = useCallback((buildingId, damage) => {
		const result = gameStateManagerRef.current.damageBuilding(buildingId, damage);
		
		if (result.gameOver) {
			setSelectedBuilding(null); // Close panel on game over
		}
		
		updateGameState();
	}, [updateGameState, setSelectedBuilding]);

	const onEnemyKilled = useCallback((killedEnemy) => {
		gameStateManagerRef.current.addEnemyKillReward(killedEnemy.reward || 1);
		updateGameState();
	}, [updateGameState]);

	const damageEnemy = useCallback((enemyId, damage) => {
		if (enemyManagerRef.current) {
			enemyManagerRef.current.damageEnemy(enemyId, damage, onEnemyKilled);
		}
	}, [onEnemyKilled]);

	// Expose handlers to parent component
	React.useImperativeHandle(ref, () => ({
		handleUpgrade: (upgradeType) => {
			if (!selectedBuilding) return;

			const config = getBuildingConfig(selectedBuilding.type);
			
			if (!canAffordUpgrade(selectedBuilding.type, upgradeType, gameState.nuggets)) {
				return;
			}

			const cost = config.upgrades[upgradeType].cost;
			const upgradedBuilding = applyUpgrade(selectedBuilding, upgradeType);

			if (gameStateManagerRef.current.spendNuggets(cost)) {
				gameStateManagerRef.current.updateBuilding(selectedBuilding.id, upgradedBuilding);
				setSelectedBuilding(upgradedBuilding); // Update panel with new stats
				updateGameState();
			}
		},
		
		handleSell: (buildingId) => {
			const building = gameStateManagerRef.current.removeBuilding(buildingId);
			if (building) {
				const refund = calculateSellRefund(building);
				gameStateManagerRef.current.resources.nuggets += refund;
				updateGameState();
			}
			setSelectedBuilding(null);
		},
		
		handleBuild: (buildingType, gridX, gridY) => {
			const config = getBuildingConfig(buildingType);
			if (!config || !gameStateManagerRef.current.canAfford(config.buildCost)) {
				return;
			}

			// Validate build position
			if (!gameStateManagerRef.current.canBuildAt(gridX, gridY, enemyManagerRef.current)) {
				console.error('Build failed: Invalid location.');
				return;
			}

			if (gameStateManagerRef.current.spendNuggets(config.buildCost)) {
				const newBuilding = createBuilding(buildingType, gridX, gridY);
				gameStateManagerRef.current.addBuilding(newBuilding);
				updateGameState();
			}
		},
		
		resetGame: () => {
			gameStateManagerRef.current.reset();
			enemyManagerRef.current = new EnemyManager(GRID_WIDTH, GRID_HEIGHT);
			projectileManagerRef.current = new ProjectileManager();
			setSelectedBuilding(null);
			updateGameState();
		}
	}));

	// Sync current building state to parent for real-time panel updates
	useEffect(() => {
		if (!gameState) return;
		
		setSelectedBuilding(prevSelected => {
			if (!prevSelected || prevSelected.type === 'build') return prevSelected;
			
			// For building upgrades, sync with current building state
			if (prevSelected.id === 'main-command-center') {
				return gameState.mainBuilding;
			}
			
			// For other buildings, find the updated building in the buildings array
			const updatedBuilding = gameState.buildings.find(building => building.id === prevSelected.id);
			return updatedBuilding || null;
		});
	}, [gameState, setSelectedBuilding]);

	// Game Loop
	useEffect(() => {
		if (!gameState) return;

		const gameLoop = () => {
			// Update countdown if needed
			if (gameStateManagerRef.current.updateCountdown()) {
				updateGameState();
			}

			// Handle build location validity
			if (selectedBuilding && selectedBuilding.type === 'build') {
				const isValid = gameStateManagerRef.current.canBuildAt(
					selectedBuilding.x, 
					selectedBuilding.y, 
					enemyManagerRef.current
				);
				if (isValid !== isBuildLocationValid) {
					setIsBuildLocationValid(isValid);
				}
			}

			// Render everything
			const layout = gameRendererRef.current.render(
				gameState,
				selectedBuilding,
				isBuildLocationValid,
				enemyManagerRef.current,
				projectileManagerRef.current
			);

			// Update game logic if playing
			if (gameState.status === GAME_STATUS.PLAYING) {
				const currentTime = Date.now();
				const allBuildings = gameStateManagerRef.current.getAllBuildings();
				
				// Building attack logic
				allBuildings.forEach(building => {
					if (building.attackDamage > 0 && currentTime - building.lastAttackTime > building.attackCooldown) {
						const enemies = enemyManagerRef.current.getEnemies();
						const enemiesInRange = enemies.filter(enemy => {
							const dx = enemy.x - building.x;
							const dy = enemy.y - building.y;
							const distance = Math.sqrt(dx * dx + dy * dy);
							return distance <= building.attackRange;
						});

						if (enemiesInRange.length > 0) {
							// Target closest enemy
							const closestEnemy = enemiesInRange.reduce((closest, enemy) => {
								const distToClosest = Math.sqrt((closest.x - building.x)**2 + (closest.y - building.y)**2);
								const distToEnemy = Math.sqrt((enemy.x - building.x)**2 + (enemy.y - building.y)**2);
								return distToEnemy < distToClosest ? enemy : closest;
							});

							// Save turret angle for rendering
							building.lastTurretAngle = Math.atan2(
								closestEnemy.y - building.y,
								closestEnemy.x - building.x
							);

							// Fire projectiles
							const projectileCount = building.projectileCount || 1;
							const targets = enemiesInRange.sort((a, b) => {
								const distA = Math.sqrt((a.x - building.x)**2 + (a.y - building.y)**2);
								const distB = Math.sqrt((b.x - building.x)**2 + (b.y - building.y)**2);
								return distA - distB;
							}).slice(0, projectileCount);

							targets.forEach(target => {
								projectileManagerRef.current.createProjectile(building, target, building.attackDamage);
							});
							
							building.lastAttackTime = currentTime;
						}
					}
				});

				// Update enemies and projectiles
				if (enemyManagerRef.current) {
					enemyManagerRef.current.update(allBuildings, damageBuilding, globalUpgrades);
				}
				
				if (projectileManagerRef.current) {
					projectileManagerRef.current.update(enemyManagerRef.current.getEnemies(), damageEnemy);
				}
			}

			animationFrameRef.current = window.requestAnimationFrame(gameLoop);
		};
		
		gameLoop();

		return () => {
			if (animationFrameRef.current) {
				window.cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [gameState, selectedBuilding, isBuildLocationValid, updateGameState, damageBuilding, damageEnemy, globalUpgrades]);

	return <canvas ref={canvasRef} />;
});

const App = () => {
	const [selectedBuilding, setSelectedBuilding] = useState(null);
	const [nuggets, setNuggets] = useState(100);
	const [gameStatus, setGameStatus] = useState(GAME_STATUS.COUNTDOWN);
	const [isBuildLocationValid, setIsBuildLocationValid] = useState(true);
	const [globalUpgrades, setGlobalUpgrades] = useState({ spikeDamage: 0 });
	const gameRef = useRef(null);

	const handleUpgrade = (upgradeType) => {
		const config = getBuildingConfig(selectedBuilding.type);
		const upgrade = config?.upgrades?.[upgradeType];

		if (!upgrade || nuggets < upgrade.cost) {
			return;
		}

		setNuggets(nuggets - upgrade.cost);

		// Handle global upgrades
		if (upgrade.isGlobal) {
			const newGlobalUpgrades = applyUpgrade(selectedBuilding, upgradeType, globalUpgrades);
			setGlobalUpgrades(newGlobalUpgrades);
			return;
		}

		// Handle standard building-specific upgrades
		if (gameRef.current) {
			gameRef.current.handleUpgrade(upgradeType);
		}
	};

	const handleSell = (buildingId) => {
		if (gameRef.current) {
			gameRef.current.handleSell(buildingId);
		}
	};

	const handleBuild = (buildingType) => {
		if (gameRef.current && selectedBuilding && selectedBuilding.type === 'build') {
			gameRef.current.handleBuild(buildingType, selectedBuilding.x, selectedBuilding.y);
			setSelectedBuilding(null);
		}
	};
	
	const handleClose = () => setSelectedBuilding(null);

	const handlePlayAgain = () => {
		setSelectedBuilding(null);
		setNuggets(100);
		if (gameRef.current) {
			gameRef.current.resetGame();
		}
	};

	const panelMode = selectedBuilding?.type === 'build' ? 'build' : 'upgrade';
	const panelBuilding = selectedBuilding?.type === 'build' ? null : selectedBuilding;

	return (
		<GameWindow>
			<Game 
				ref={gameRef} 
				selectedBuilding={selectedBuilding} 
				setSelectedBuilding={setSelectedBuilding} 
				setNuggets={setNuggets} 
				setGameStatus={setGameStatus}
				onBuildLocationValidityChange={setIsBuildLocationValid}
				globalUpgrades={globalUpgrades}
			/>
			{gameStatus === GAME_STATUS.GAME_OVER && (
				<div className="game-over-overlay">
					<button onClick={handlePlayAgain} className="play-again-button">
						Play Again
					</button>
				</div>
			)}
			<BuildingPanel 
				building={panelBuilding}
				nuggets={nuggets}
				onUpgrade={handleUpgrade}
				onSell={handleSell}
				onClose={handleClose}
				onBuild={handleBuild}
				mode={panelMode}
				isBuildLocationValid={isBuildLocationValid}
			/>
		</GameWindow>
	);
};

document.addEventListener('DOMContentLoaded', () => {
	const blockClass = '.wp-block-chubes-games-base-builder';
	const appContainers = document.querySelectorAll(blockClass);
	appContainers.forEach((el) => {
		ReactDOM.render(<App />, el);
	});
});
