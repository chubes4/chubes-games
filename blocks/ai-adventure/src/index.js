import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps({ className: 'chubes-game-window' });
		const { title, adventurePrompt, gameMasterPersona } = attributes;

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'AI Settings', 'chubes-games' ) }>
						<TextareaControl
							label={ __( 'Game Master Persona', 'chubes-games' ) }
							value={ gameMasterPersona }
							onChange={ ( value ) => setAttributes( { gameMasterPersona: value } ) }
							help={ __( 'Define the personality and role of the AI storyteller.', 'chubes-games' ) }
						/>
					</PanelBody>
				</InspectorControls>
				<div { ...blockProps }>
					<RichText
						tagName="h2"
						className="adventure-title"
						onChange={ ( value ) => setAttributes( { title: value } ) }
						value={ title }
						placeholder={ __( 'Enter Adventure Title', 'chubes-games' ) }
					/>
					<RichText
						tagName="p"
						className="adventure-prompt"
						onChange={ ( value ) => setAttributes( { adventurePrompt: value } ) }
						value={ adventurePrompt }
						placeholder={ __( 'Adventure Description: Describe the overall plot in 2-3 sentences. This will be shown to the player before they start.', 'chubes-games' ) }
					/>
					<InnerBlocks
						allowedBlocks={ [ 'chubes-games/ai-adventure-path' ] }
					/>
				</div>
			</>
		);
	},
	save: ( { attributes } ) => {
		const { adventurePrompt } = attributes;
		const blockProps = useBlockProps.save({ className: 'chubes-game-window' });

		return (
			<div { ...blockProps }>
				<p className="adventure-prompt">{adventurePrompt}</p>
			</div>
		);
	},
} );
