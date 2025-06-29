const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const glob = require( 'glob' );
const fs = require( 'fs' );

// Find all block folders (directories with a block.json file)
const blockPaths = glob.sync( './blocks/*/block.json' ).map( p => path.dirname( p ) );

// Create entry points for each block
const entry = blockPaths.reduce( ( acc, blockPath ) => {
    const blockName = path.basename( blockPath );
    
    // Define potential paths for source files, with and without a 'src' directory
    const basePaths = [
        path.resolve( process.cwd(), blockPath ),
        path.resolve( process.cwd(), blockPath, 'src' )
    ];

    const findFile = ( filenames ) => {
        for ( const basePath of basePaths ) {
            for ( const filename of filenames ) {
                const filePath = path.join( basePath, filename );
                if ( fs.existsSync( filePath ) ) {
                    return filePath;
                }
            }
        }
        return null;
    };
    
    const indexJs = findFile( [ 'index.js' ] );
    const viewJs = findFile( [ 'view.js' ] );
    const style = findFile( [ 'style.css', 'style.scss', 'index.scss', 'index.css' ] );
    const editorStyle = findFile( [ 'editor.css', 'editor.scss' ] );

    // The key determines the output file path inside the single, top-level /build directory.
    // e.g., 'snake/index' will compile to 'build/snake/index.js'
    if ( indexJs ) {
        acc[ `${blockName}/index` ] = indexJs;
    }
    if ( viewJs ) {
        acc[ `${blockName}/view` ] = viewJs;
    }
    if ( style ) {
        acc[ `${blockName}/style` ] = style;
    }
    if ( editorStyle ) {
        acc[ `${blockName}/editor` ] = editorStyle;
    }

    return acc;
}, {} );

// Overwrite the default entry points with our own.
defaultConfig.entry = entry;

module.exports = defaultConfig; 