import { registerBlockType } from '@wordpress/blocks';
import { render } from '@wordpress/element';
import Game from './Game';
import metadata from '../block.json';
import './style.scss';

// Function to render the React component
const renderComponent = (element) => {
	if (element) {
		render(<Game />, element);
	}
};

// Register the block
registerBlockType(metadata.name, {
	edit: () => null, // No editor view
	save: () => null, // View is rendered via PHP
});

// Find the placeholder element on the frontend and render the component
document.addEventListener('DOMContentLoaded', () => {
	const gameElements = document.querySelectorAll('.wp-block-chubes-games-snake');
	gameElements.forEach(renderComponent);
});
