import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import './editor.css';

export default function Edit() {
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<p>{ __( 'Snake Game Placeholder - The game is playable on the front-end.', 'chubes-games' ) }</p>
		</div>
	);
} 