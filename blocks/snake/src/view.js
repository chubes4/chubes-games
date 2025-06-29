import { createRoot } from 'react-dom/client';
import { StrictMode } from '@wordpress/element';
import './style.scss';
import Game from './Game';

document.addEventListener( 'DOMContentLoaded', () => {
	const blocks = document.querySelectorAll( '.wp-block-chubes-games-snake' );
	blocks.forEach( ( block ) => {
		const root = createRoot( block );
		root.render(
			<StrictMode>
				<Game />
			</StrictMode>
		);
	} );
} ); 