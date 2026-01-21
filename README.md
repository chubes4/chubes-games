# Chubes Games

A WordPress plugin containing modular Gutenberg game blocks for WordPress.

## Description

Chubes Games is a collection of interactive game blocks for the WordPress Gutenberg editor. Each game is implemented as a separate block with its own mechanics and features.

## Games

Note: AI Adventure / OpenAI integration was removed (see `docs/CHANGELOG.md`).

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
- PHP 8.0+
- Node.js 16+ (for development)
- MySQL 5.6+ (for score storage)

## Installation

See `docs/installation.md` for environment-specific installation guidance.

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

## License

GPL v2 or later

## Author

Chris Huber - https://chubes.net