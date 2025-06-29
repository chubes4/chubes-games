import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { PanelBody, TextControl, Button } from '@wordpress/components';
import metadata from '../block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes, clientId } ) => {
		const { stepPrompt, stepId, triggers } = attributes;

		useEffect( () => {
			if ( ! stepId ) {
				setAttributes( { stepId: clientId } );
			}
		}, [ clientId ] );

		const handleTriggerChange = ( value, index, key ) => {
			const newTriggers = [ ...triggers ];
			newTriggers[ index ][ key ] = value;
			setAttributes( { triggers: newTriggers } );
		};

		const addTrigger = () => {
			const newTriggers = [ ...triggers, { triggerPhrase: '', destinationStep: '' } ];
			setAttributes( { triggers: newTriggers } );
		};

		const removeTrigger = ( index ) => {
			const newTriggers = [ ...triggers ];
			newTriggers.splice( index, 1 );
			setAttributes( { triggers: newTriggers } );
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Triggers', 'chubes-games' ) }>
						{ triggers.map( ( trigger, index ) => (
							<div key={ index } className="trigger-item">
								<TextControl
									label={ __( 'Trigger Phrase', 'chubes-games' ) }
									value={ trigger.triggerPhrase }
									onChange={ ( value ) => handleTriggerChange( value, index, 'triggerPhrase' ) }
									placeholder="e.g., Player opens the chest"
								/>
								<TextControl
									label={ __( 'Destination Step ID', 'chubes-games' ) }
									value={ trigger.destinationStep }
									onChange={ ( value ) => handleTriggerChange( value, index, 'destinationStep' ) }
									placeholder="Enter step ID or 'end_game'"
								/>
								<Button isLink isDestructive onClick={ () => removeTrigger( index ) }>
									{ __( 'Remove Trigger', 'chubes-games' ) }
								</Button>
							</div>
						) ) }
						<Button variant="primary" onClick={ addTrigger }>
							{ __( 'Add Trigger', 'chubes-games' ) }
						</Button>
					</PanelBody>
				</InspectorControls>
				<div { ...useBlockProps() }>
					<RichText
						tagName="p"
						onChange={ ( value ) => setAttributes( { stepPrompt: value } ) }
						value={ stepPrompt }
						placeholder={ __( 'Step Prompt: e.g., "A treasure chest sits in the center of the room."', 'chubes-games' ) }
					/>
				</div>
			</>
		);
	},
	save: () => {
		// This block's content is used for prompts and not saved to the front end.
		return null;
	},
} );
