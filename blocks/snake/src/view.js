import { render } from '@wordpress/element';
import Game from './Game';
import './style.scss';

// Function to render the React component for a single element
const renderComponent = (element) => {
	if (element) {
		render(<Game />, element);
	}
};

// Find all placeholder elements on the frontend and render the game component in each
document.addEventListener('DOMContentLoaded', () => {
	const gameElements = document.querySelectorAll('.wp-block-chubes-games-snake');
	gameElements.forEach(renderComponent);
}); 