# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chubes Games is a WordPress plugin containing modular Gutenberg game blocks. Each game is implemented as a separate block with its own mechanics, assets, and game logic. This plugin is in early development stages, focusing on simple interactive game experiments.

## Architecture

The codebase follows automatic block discovery with individual game implementations:

```
chubes-games/
├── chubes-games.php          # Main plugin file
├── package.json              # Build configuration
├── blocks/                   # Individual game blocks
│   ├── base-builder/         # Tower defense game
│   ├── leaderboard/          # Score tracking system
│   ├── snake/               # Classic snake game
│   ├── components/          # Shared game components
│   └── utils/              # Shared utilities
├── inc/                      # Shared functionality
│   ├── admin.php            # Plugin activation (score table)
│   ├── post-type.php        # Game post type registration
│   └── score.php            # Score handling
└── assets/                   # Shared assets
```

## Block Structure

Each game block follows this structure:
```
blocks/game-name/
├── block.json               # Block configuration
├── src/                     # Frontend JavaScript
│   ├── index.js            # Block editor
│   ├── view.js             # Frontend display
│   └── edit.js             # Editor interface
├── render.php              # Server-side rendering (optional)
└── assets/                 # Game-specific assets
```

## Game Implementations

### Base Builder
Tower defense game with complex mechanics:
- **Building System**: Towers, walls, command centers, upgrade facilities
- **Enemy AI**: Pathfinding, combat, movement patterns
- **Resource Management**: Economy and upgrade systems
- **Physics**: Projectile systems and collision detection
- **Rendering**: Real-time canvas-based game display
- **Modular Architecture**: Separate components for buildings, enemies, and utilities
- **Server-side Rendering**: Uses `render.php` for initial game state

### Snake
Classic arcade game implementation:
- Smooth gameplay mechanics
- Score tracking and high scores
- Responsive controls and collision detection

### Leaderboard
Competitive scoring system:
- Score submission and validation
- Integration with all game blocks
- Admin management interface

## Development Commands

```bash
# Build all blocks
npm run build

# Development server
npm run start
```

## Key Technical Details

### Asset Loading
- Conditional loading using `has_block()` checks
- Individual CSS and JS per game block
- Cache busting via `filemtime()`

### Score System
- Centralized score handling in `inc/score.php`
- Database storage for high scores
- Custom database table created on plugin activation

### Game Post Type
- Custom `game` post type for hosting games
- Public archives at `/games`
- Full Gutenberg support

## Block Registration

The plugin uses automatic block discovery:
- Scans `blocks/` directory for `block.json` files
- Registers each block with `register_block_type()`
- Loads assets conditionally based on block presence

## Security Considerations

- Input sanitization for all user data
- Nonce verification for AJAX requests
- Capability checks for admin functions

## Development Guidelines

- Each game block should be self-contained
- Use modular JavaScript with clear separation of concerns
- Implement proper error handling
- Test games across different screen sizes
- Ensure assets only load when blocks are present

## Architectural Principles

- Single responsibility: Each block handles one game
- Modular design: Shared functionality in `inc/` directory
- Performance: Conditional asset loading
- Extensibility: Clear patterns for adding new games

## Contact

- Owner: Chris Huber — https://chubes.net
