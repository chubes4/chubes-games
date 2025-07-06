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
import BuildingPanel from './BuildingPanel';
import { BUILDABLE_TYPES, getUpgradeCost, createBuilding, getBuildingConfig } from './buildings';
import { TurretManager } from './buildings/mechanics/TurretManager';
import { attemptUpgrade } from './buildings/mechanics/UpgradeManager';
import { sellBuilding as sellBuildingHelper } from './buildings/mechanics/SellBuilding';
import { attemptRepair } from './buildings/mechanics/RepairHandler';
import { getSelection } from './utils/SelectionManager';

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
	const turretManagerRef = useRef(null);

	// Initialize managers
	useEffect(() => {
		gameStateManagerRef.current = new GameStateManager();
		gameRendererRef.current = new GameRenderer(canvasRef.current);
		enemyManagerRef.current = new EnemyManager(GRID_WIDTH, GRID_HEIGHT);
		projectileManagerRef.current = new ProjectileManager();
		turretManagerRef.current = new TurretManager(projectileManagerRef.current);
		
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

			const gridX = Math.floor((clickX - layout.offsetX) / layout.actualCellSize);
			const gridY = Math.floor((clickY - layout.offsetY) / layout.actualCellSize);

			const sel = getSelection(gridX, gridY, gameState);
			switch(sel.mode){
				case 'command-center':
				case 'building':
					setSelectedBuilding(sel.building);
					break;
				case 'build':
					setSelectedBuilding({ type:'build', x: sel.x, y: sel.y});
					break;
				default:
					break;
			}
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
			if (!selectedBuilding) return { success:false };
			const result = attemptUpgrade(gameStateManagerRef.current, selectedBuilding, upgradeType, globalUpgrades);
			if (result.success) {
				if (result.updatedBuilding) setSelectedBuilding(result.updatedBuilding);
				if (result.globalUpgrades) setGlobalUpgrades(result.globalUpgrades);
				updateGameState();
			}
			return result;
		},
		
		handleSell: (buildingId) => {
			const res = sellBuildingHelper(gameStateManagerRef.current, buildingId);
			if (res.success) {
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
			turretManagerRef.current = new TurretManager(projectileManagerRef.current);
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
				
				// Building attack logic handled by TurretManager
				turretManagerRef.current.update(allBuildings, enemyManagerRef.current, currentTime);

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
		if (!selectedBuilding) return;
		const costPreview = getUpgradeCost(selectedBuilding, upgradeType);
		if (nuggets < costPreview) return;

		if (gameRef.current) {
			const result = gameRef.current.handleUpgrade(upgradeType);
			if (result?.success) {
				setNuggets(prev => prev - result.cost);
				if (result.globalUpgrades) setGlobalUpgrades(result.globalUpgrades);
			}
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
