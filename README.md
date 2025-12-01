# Chubes Games

A WordPress plugin containing modular Gutenberg game blocks for WordPress.

## Description

Chubes Games is a collection of interactive game blocks for the WordPress Gutenberg editor. Each game is implemented as a separate block with its own mechanics and features.

## Games

### AI Adventure Series
Interactive text-based adventure games with:
- **ai-adventure**: Main game block with opening screen and story initialization
- **ai-adventure-path**: Manages story paths and branching narratives
- **ai-adventure-step**: Handles individual story steps and choices
- OpenAI API integration for dynamic story generation
- Path and step blocks for story progression

### Base Builder
Tower defense game featuring:
- Complex building mechanics with towers, walls, command centers, and upgrade facilities
- Enemy AI with pathfinding, combat, and movement patterns
- Resource management, economy systems, and projectile physics
- Real-time canvas-based game rendering and state management
- Modular architecture with separate components for buildings, enemies, and utilities

### Snake
Classic snake game with:
- Smooth gameplay mechanics with collision detection
- Score tracking and high score persistence
- Responsive controls with keyboard and touch support
- Progressive difficulty with speed increases

### Leaderboard
Competitive scoring system with:
- Score submission and validation with anti-cheat measures
- High score display with ranking systems
- Integration with all game blocks
- Admin management interface for score moderation

## Requirements

- WordPress 5.8+
- PHP 7.4+
- Node.js 16+ (for development)

## Installation

1. Download the latest release from the repository
2. Upload the plugin to your WordPress installation
3. Activate the plugin

## Development

### Build Commands

```bash
# Build all blocks
npm run build

# Development server for all blocks
npm run start
```

### Architecture

The plugin uses automatic block discovery:
- Main plugin scans `blocks/` directory for `block.json` files
- Each block is registered using `register_block_type()` with the directory path
- Assets are conditionally loaded only when blocks are present
- OpenAI integration requires API key configuration

## Configuration

### AI Adventure Setup
1. Configure OpenAI API key in WordPress admin
2. Set up prompt templates in the plugin settings
3. Customize adventure parameters as needed

## License

GPL v2 or later

## Author

Chris Huber - https://chubes.net