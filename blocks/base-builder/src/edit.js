/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

import { useEffect, useRef } from '@wordpress/element';
import GameWindow from '../../components/game-window';

// Static constants for placeholder
const GRID_WIDTH = 39;
const GRID_HEIGHT = 29;

/**
 * A static placeholder component to display in the editor.
 */
const EditorPlaceholder = () => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext('2d');
		if (!context) return;

		// Resize canvas to fit container
		const container = canvas.parentElement;
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;

		const cellWidth = Math.floor(canvas.width / GRID_WIDTH);
		const cellHeight = Math.floor(canvas.height / GRID_HEIGHT);
		const actualCellSize = Math.min(cellWidth, cellHeight);

		const gridPixelWidth = GRID_WIDTH * actualCellSize;
		const gridPixelHeight = GRID_HEIGHT * actualCellSize;
		const offsetX = (canvas.width - gridPixelWidth) / 2;
		const offsetY = (canvas.height - gridPixelHeight) / 2;

		// Clear canvas with dark background
		context.fillStyle = '#1a1a1a';
		context.fillRect(0, 0, canvas.width, canvas.height);

		// Draw grid lines
		context.strokeStyle = '#333';
		context.lineWidth = 1;
		for (let x = 0; x <= GRID_WIDTH; x++) {
			const pixelX = offsetX + x * actualCellSize;
			context.beginPath();
			context.moveTo(pixelX, offsetY);
			context.lineTo(pixelX, offsetY + gridPixelHeight);
			context.stroke();
		}
		for (let y = 0; y <= GRID_HEIGHT; y++) {
			const pixelY = offsetY + y * actualCellSize;
			context.beginPath();
			context.moveTo(offsetX, pixelY);
			context.lineTo(offsetX + gridPixelWidth, pixelY);
			context.stroke();
		}

		// Draw main building
		const buildingX = Math.floor(GRID_WIDTH / 2);
		const buildingY = Math.floor(GRID_HEIGHT / 2);
		const buildingPixelX = offsetX + buildingX * actualCellSize;
		const buildingPixelY = offsetY + buildingY * actualCellSize;

		context.fillStyle = '#4a90e2';
		context.fillRect(
			buildingPixelX + 2,
			buildingPixelY + 2,
			actualCellSize - 4,
			actualCellSize - 4
		);
		context.strokeStyle = '#2c5aa0';
		context.lineWidth = 2;
		context.strokeRect(
			buildingPixelX + 2,
			buildingPixelY + 2,
			actualCellSize - 4,
			actualCellSize - 4
		);

		// Add placeholder text
		context.font = 'bold 20px Arial';
		context.fillStyle = 'rgba(255, 255, 255, 0.5)';
		context.textAlign = 'center';
		context.fillText(
			'Base Builder Game',
			canvas.width / 2,
			canvas.height / 2 - 10
		);
		context.font = '14px Arial';
		context.fillText(
			'(Preview is live on the front-end)',
			canvas.width / 2,
			canvas.height / 2 + 10
		);

	}, []); // Run only once on mount

	return <canvas ref={canvasRef} />;
};


/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<GameWindow>
				<EditorPlaceholder />
			</GameWindow>
		</div>
	);
}
