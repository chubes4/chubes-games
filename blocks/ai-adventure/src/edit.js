<PanelBody title={ __( 'Adventure Settings', 'chubes-games' ) }>
    <TextControl
        label={ __( 'Adventure Description', 'chubes-games' ) }
        value={ attributes.adventurePrompt }
        onChange={ ( value ) => setAttributes( { adventurePrompt: value } ) }
        help={ __( 'Describe the overall plot in 2-3 sentences. This will be shown to the player before they start.', 'chubes-games' ) }
        placeholder={ __( 'Adventure Description: Describe the overall plot in 2-3 sentences. This will be shown to the player before they start.', 'chubes-games' ) }
    />
</PanelBody> 