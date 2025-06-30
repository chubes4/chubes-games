import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { PanelBody, TextControl, Button, SelectControl, TextareaControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import metadata from '../block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes, clientId } ) => {
		const { stepPrompt, stepId, triggers } = attributes;

		// Get all available steps from the block editor
		const availableSteps = useSelect( ( select ) => {
			const { getBlocks } = select( 'core/block-editor' );
			const allBlocks = getBlocks();
			const steps = [];
			let currentPathIndex = -1;

			// Find the AI Adventure parent block
			const adventureBlock = allBlocks.find( block => block.name === 'chubes-games/ai-adventure' );
			if ( adventureBlock ) {
				// First, find the index of the path containing the current step
				adventureBlock.innerBlocks.forEach((pathBlock, pathIndex) => {
					if (pathBlock.innerBlocks.some(stepBlock => stepBlock.clientId === clientId)) {
						currentPathIndex = pathIndex;
					}
				});

				// Now, build the list of available steps from valid paths
				adventureBlock.innerBlocks.forEach( ( pathBlock, pathIndex ) => {
					// Only include paths that are at or after the current path
					if ( pathIndex < currentPathIndex ) {
						return; // Skip previous paths
					}

					if ( pathBlock.name === 'chubes-games/ai-adventure-path' ) {
						const pathLabel = pathBlock.attributes.label || `Path ${pathIndex + 1}`;
						pathBlock.innerBlocks.forEach( ( stepBlock ) => {
							if ( stepBlock.clientId === clientId ) {
								return; // Skip self
							}
							if ( stepBlock.name === 'chubes-games/ai-adventure-step' ) {
								const stepLabel = stepBlock.attributes.label || `Step for ${stepBlock.clientId.substring(0,4)}`;
								const stepIdVal = stepBlock.attributes.stepId || stepBlock.clientId;
								steps.push( {
									value: stepIdVal,
									label: `${pathLabel} → ${stepLabel}`,
								} );
							}
						} );
					}
				} );
			}

			// Add special options
			const options = [
				{ value: '', label: __('Select destination...', 'chubes-games') },
				{ value: 'end_game', label: __('🏁 End Game', 'chubes-games') }
			];
			if (steps.length > 0) {
				options.push(...steps);
			}

			return options;
		}, [clientId]);

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
					<PanelBody title={ __( 'Story Triggers', 'chubes-games' ) }>
						<p className="components-base-control__help">
							{ __( 'Define semantic conditions that advance the story. Use descriptive phrases like "Player opens the chest" or "Player talks to the wizard".', 'chubes-games' ) }
						</p>
						{ triggers.map( ( trigger, index ) => (
							<div key={ index } className="trigger-item" style={ { marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' } }>
								<TextareaControl
									label={ __( 'Trigger Condition', 'chubes-games' ) }
									value={ trigger.triggerPhrase }
									onChange={ ( value ) => handleTriggerChange( value, index, 'triggerPhrase' ) }
									placeholder="e.g., Player decides to enter the cave"
									help={ __( 'Describe the player action or decision that should trigger this path.', 'chubes-games' ) }
									rows={ 3 }
								/>
								<SelectControl
									label={ __( 'Destination', 'chubes-games' ) }
									value={ trigger.destinationStep }
									onChange={ ( value ) => handleTriggerChange( value, index, 'destinationStep' ) }
									options={ availableSteps }
									help={ __( 'Where should the story go when this trigger is activated?', 'chubes-games' ) }
								/>
								<Button isLink isDestructive onClick={ () => removeTrigger( index ) }>
									{ __( 'Remove Trigger', 'chubes-games' ) }
								</Button>
							</div>
						) ) }
						<Button variant="primary" onClick={ addTrigger }>
							{ __( 'Add Story Trigger', 'chubes-games' ) }
						</Button>
					</PanelBody>
				</InspectorControls>
				<div { ...useBlockProps() }>
					<RichText
						tagName="p"
						onChange={ ( value ) => setAttributes( { stepPrompt: value } ) }
						value={ stepPrompt }
						placeholder={ __( 'Step Action: What is happening at this moment in the story?', 'chubes-games' ) }
					/>
				</div>
			</>
		);
	},
	save: ( { attributes } ) => {
		const { stepPrompt, label, stepId, triggers } = attributes;
		const blockProps = useBlockProps.save({ 
			'data-step-id': stepId,
			'data-triggers': JSON.stringify(triggers || [])
		});
		return (
			<div { ...blockProps }>
				{label && <RichText.Content tagName="h4" value={label} />}
				{stepPrompt && <RichText.Content tagName="p" value={stepPrompt} className="ai-adventure-step-prompt" />}
			</div>
		);
	},
} );
