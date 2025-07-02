/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Edit from './edit';
import metadata from '../block.json';
import './style.scss';
import './editor.css';

// Function to render the React component
const renderComponent = (element) => {
	if (element) {
		render(<Game />, element);
	}
};

/**
 * Register the block
 */
registerBlockType(metadata.name, {
	edit: Edit,
	save: () => null, // View is rendered via PHP with a render.php file
});

// Find the placeholder element on the frontend and render the component
document.addEventListener('DOMContentLoaded', () => {
	const gameElements = document.querySelectorAll('.wp-block-chubes-games-snake');
	gameElements.forEach(renderComponent);
});
