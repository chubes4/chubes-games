import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => {
		const { pathPrompt } = attributes;
		return (
			<div { ...useBlockProps() }>
				<RichText
					tagName="h4"
					onChange={ ( value ) => setAttributes( { pathPrompt: value } ) }
					value={ pathPrompt }
					placeholder={ __( 'Path Prompt: e.g., "The user enters the dark cave..."', 'chubes-games' ) }
				/>
				<InnerBlocks allowedBlocks={ [ 'chubes-games/ai-adventure-step' ] } />
			</div>
		);
	},
	save: ( { attributes } ) => {
		return <InnerBlocks.Content />;
	},
} );
