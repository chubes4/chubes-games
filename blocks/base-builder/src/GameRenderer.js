/**
 * GameRenderer - Handles all game rendering logic
 */

import { getBuildingConfig } from './buildings';
import { drawHealthBar } from './utils/HealthBar';
import { renderResourceUI } from './ResourceManager';
import { GRID_WIDTH, GRID_HEIGHT } from './GameState';

export class GameRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
	}

	// Calculate sizing and offsets for responsive rendering
	calculateLayout() {
		const container = this.canvas.parentElement;
		
		// Update canvas size if needed
		if (this.canvas.width !== container.clientWidth || this.canvas.height !== container.clientHeight) {
			this.canvas.width = container.clientWidth;
			this.canvas.height = container.clientHeight;
		}

		const cellWidth = Math.floor(this.canvas.width / GRID_WIDTH);
		const cellHeight = Math.floor(this.canvas.height / GRID_HEIGHT);
		const actualCellSize = Math.min(cellWidth, cellHeight);
		const gridPixelWidth = GRID_WIDTH * actualCellSize;
		const gridPixelHeight = GRID_HEIGHT * actualCellSize;
		const offsetX = (this.canvas.width - gridPixelWidth) / 2;
		const offsetY = (this.canvas.height - gridPixelHeight) / 2;

		return { actualCellSize, gridPixelWidth, gridPixelHeight, offsetX, offsetY };
	}

	// Clear the canvas
	clear() {
		this.context.fillStyle = '#1a1a1a';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	// Render the grid
	renderGrid(layout) {
		const { actualCellSize, gridPixelWidth, gridPixelHeight, offsetX, offsetY } = layout;
		
		this.context.strokeStyle = '#333';
		this.context.lineWidth = 1;
		
		// Vertical lines
		for(let i = 0; i <= GRID_WIDTH; i++) { 
			this.context.beginPath();
			this.context.moveTo(offsetX + i * actualCellSize, offsetY); 
			this.context.lineTo(offsetX + i * actualCellSize, offsetY + gridPixelHeight); 
			this.context.stroke();
		}
		
		// Horizontal lines
		for(let i = 0; i <= GRID_HEIGHT; i++) { 
			this.context.beginPath();
			this.context.moveTo(offsetX, offsetY + i * actualCellSize); 
			this.context.lineTo(offsetX + gridPixelWidth, offsetY + i * actualCellSize); 
			this.context.stroke();
		}
	}

	// Render a single building
	renderBuilding(building, layout, isSelected = false) {
		const { actualCellSize, offsetX, offsetY } = layout;
		const config = getBuildingConfig(building.type);
		const fillColor = config?.color || '#4a90e2';
		const borderColor = config?.borderColor || '#2c5aa0';

		const drawCell = (cellX, cellY) => {
			const buildingPixelX = offsetX + cellX * actualCellSize;
			const buildingPixelY = offsetY + cellY * actualCellSize;

			this.context.fillStyle = fillColor;
			this.context.fillRect(buildingPixelX, buildingPixelY, actualCellSize, actualCellSize);
			this.context.strokeStyle = borderColor;
			this.context.lineWidth = 1;
			this.context.strokeRect(buildingPixelX, buildingPixelY, actualCellSize, actualCellSize);
		};

		// Draw building cells
		if (building.type === 'command-center') {
			building.cells.forEach(cell => drawCell(cell.x, cell.y));
		} else {
			drawCell(building.x, building.y);
		}

		// Draw rotating turret for command center and guard tower
		if (building.type === 'tower' || building.type === 'command-center') {
			this.renderTurret(building, layout);
		}

		// Draw selection highlight
		if (isSelected) {
			this.renderSelectionHighlight(building, layout);
		}

		// Health bars rendered in a separate pass for proper z-order
		// (see renderHealthBarsAll)
	}

	// Render turret for towers and command center
	renderTurret(building, layout) {
		const { actualCellSize, offsetX, offsetY } = layout;
		const centerPixelX = offsetX + building.x * actualCellSize + actualCellSize / 2;
		const centerPixelY = offsetY + building.y * actualCellSize + actualCellSize / 2;

		const turretLength = actualCellSize * 0.4;
		const turretAngle = building.lastTurretAngle || 0;

		const endX = centerPixelX + Math.cos(turretAngle) * turretLength;
		const endY = centerPixelY + Math.sin(turretAngle) * turretLength;

		this.context.strokeStyle = '#bdc3c7'; // Gray turret color
		this.context.lineWidth = 3;
		this.context.beginPath();
		this.context.moveTo(centerPixelX, centerPixelY);
		this.context.lineTo(endX, endY);
		this.context.stroke();
	}

	// Render selection highlight around a building
	renderSelectionHighlight(building, layout) {
		const { actualCellSize, offsetX, offsetY } = layout;
		
		this.context.strokeStyle = '#32cd32'; // Warcraft 3 green
		this.context.lineWidth = 3;
		
		const highlightCells = building.cells || [{x: building.x, y: building.y}];
		highlightCells.forEach(cell => {
			this.context.strokeRect(
				offsetX + cell.x * actualCellSize,
				offsetY + cell.y * actualCellSize,
				actualCellSize,
				actualCellSize
			);
		});
	}

	// Render health bar for a building
	renderHealthBar(building, layout) {
		const { actualCellSize, offsetX, offsetY } = layout;
		
		let healthBarWidth = actualCellSize - 4;
		let healthBarX = offsetX + building.x * actualCellSize + 2;
		let healthBarY = offsetY + building.y * actualCellSize + actualCellSize;

		if (building.type === 'command-center') {
			// Center the health bar under the 3-cell wide structure
			healthBarWidth = (actualCellSize * 3) - 4;
			healthBarX = offsetX + (building.x - 1) * actualCellSize + 2;
			// Place it under the lowest cell
			healthBarY = offsetY + (building.y + 1) * actualCellSize + actualCellSize;
		}

		const healthBarHeight = 5;
		drawHealthBar(this.context, healthBarX, healthBarY, healthBarWidth, building.health, building.maxHealth, healthBarHeight);
	}

	// Render all health bars in a dedicated pass so they appear on top of buildings
	renderHealthBarsAll(buildings, layout){
		buildings.forEach(b=>{
			if(b.health>=b.maxHealth) return; // Skip full-health
			this.renderHealthBar(b, layout);
		});
	}

	// Render all buildings (visuals only; health bars done separately)
	renderBuildings(buildings, layout, selectedBuilding = null) {
		buildings.forEach(building => {
			const isSelected = selectedBuilding && selectedBuilding.id === building.id;
			this.renderBuilding(building, layout, isSelected);
		});
	}

	// Render build selection highlight
	renderBuildSelection(buildPosition, layout, isValid = true) {
		const { actualCellSize, offsetX, offsetY } = layout;
		const selectionPixelX = offsetX + buildPosition.x * actualCellSize;
		const selectionPixelY = offsetY + buildPosition.y * actualCellSize;

		this.context.strokeStyle = isValid ? '#32cd32' : '#e74c3c'; // Green or Red
		this.context.lineWidth = 3;
		this.context.strokeRect(
			selectionPixelX,
			selectionPixelY,
			actualCellSize,
			actualCellSize
		);
	}

	// Render game over overlay
	renderGameOverOverlay() {
		this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.font = '40px Arial';
		this.context.fillStyle = 'white';
		this.context.textAlign = 'center';
		this.context.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
	}

	// Render countdown overlay
	renderCountdownOverlay(countdown) {
		this.context.font = '60px Arial';
		this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
		this.context.textAlign = 'center';
		this.context.fillText(countdown, this.canvas.width / 2, 80);
		this.context.font = '20px Arial';
		this.context.fillText('Prepare your defenses!', this.canvas.width / 2, 120);
	}

	// Render resource UI
	renderResourceUI(score, nuggets) {
		renderResourceUI(this.context, this.canvas.width, score, nuggets);
	}

	// Main render method that orchestrates all rendering
	render(gameState, selectedBuilding, isBuildLocationValid, enemyManager, projectileManager) {
		// Calculate layout
		const layout = this.calculateLayout();

		// Clear canvas
		this.clear();

		// Render grid
		this.renderGrid(layout);

		// Render buildings
		const allBuildings = [gameState.mainBuilding, ...gameState.buildings];
		this.renderBuildings(allBuildings, layout, selectedBuilding);

		// Render health bars pass
		this.renderHealthBarsAll(allBuildings, layout);

		// Render build selection if in build mode
		if (selectedBuilding && selectedBuilding.type === 'build') {
			this.renderBuildSelection(selectedBuilding, layout, isBuildLocationValid);
		}

		// Render game entities
		if (enemyManager) {
			enemyManager.render(this.context, layout.offsetX, layout.offsetY, layout.actualCellSize);
		}
		
		if (projectileManager) {
			projectileManager.render(this.context, layout.offsetX, layout.offsetY, layout.actualCellSize);
		}

		// Render UI
		this.renderResourceUI(gameState.score, gameState.nuggets);

		// Render overlays
		if (gameState.status === 'gameOver') {
			this.renderGameOverOverlay();
		}

		if (gameState.status === 'countdown' && gameState.countdown > 0) {
			this.renderCountdownOverlay(gameState.countdown);
		}

		return layout; // Return layout for click detection
	}
} 