import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps();
		const { label, pathPrompt } = attributes;

		return (
			<div { ...blockProps }>
				<RichText
					tagName="h3"
					onChange={ ( value ) => setAttributes( { label: value } ) }
					value={ label }
					placeholder={ __( 'Path Label', 'chubes-games' ) }
				/>
				<RichText
					tagName="p"
					onChange={ ( value ) => setAttributes( { pathPrompt: value } ) }
					value={ pathPrompt }
					placeholder={ __( 'Path Description: Describe this branch of the story...', 'chubes-games' ) }
				/>
				<InnerBlocks
					allowedBlocks={ [ 'chubes-games/ai-adventure-step' ] }
				/>
			</div>
		);
	},
	save: ( { attributes } ) => {
		const { label, pathPrompt } = attributes;
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<RichText.Content tagName="h3" value={ label } />
				<RichText.Content tagName="p" value={ pathPrompt } className="ai-adventure-path-prompt" />
				<InnerBlocks.Content />
			</div>
		);
	},
} );
