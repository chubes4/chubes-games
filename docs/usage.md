# Usage Guide

## Game Blocks

### Base Builder

A complex tower defense game with resource management and strategic gameplay.

#### Features
- Resource collection and management
- Building construction (Command Center, Towers, Walls, Upgrade Center)
- Enemy waves with pathfinding AI
- Projectile combat system
- Upgrade system for buildings
- Health and damage mechanics

#### Gameplay
1. Start with a Command Center
2. Collect resources automatically
3. Build defensive structures
4. Upgrade buildings for better performance
5. Survive enemy waves

#### Controls
- Click buildings to select them
- Use building panel to construct new structures
- Drag to move camera
- Buildings auto-target enemies

### Snake

Classic snake game with modern implementation.

#### Features
- Smooth gameplay with collision detection
- Score tracking and persistence
- Responsive controls
- Game over screen with restart

#### Controls
- Arrow keys or WASD to change direction
- Avoid walls and self-collision
- Eat food to grow and increase score

### Leaderboard

Displays high scores and rankings for games.

#### Features
- Global leaderboard display
- User score tracking
- Sortable by game and score
- Responsive design

## REST API Endpoints

The plugin provides REST API endpoints for score management:

- `GET /wp-json/chubes-games/v1/scores` - Retrieve scores
- `POST /wp-json/chubes-games/v1/scores` - Submit new score

## Game Architecture

### Components
- **Game Blocks**: Individual Gutenberg blocks for each game
- **Score System**: Database-backed score tracking
- **Admin Interface**: Score management in WordPress admin

### Technical Details
- Canvas-based rendering for games
- React components for UI elements
- Custom database table for scores
- REST API for score submission
- Automatic block registration via webpack

## Development

### Building Games
```bash
npm run build  # Production build
npm run start  # Development server
```

### Adding New Games
1. Create new block directory under `/blocks/`
2. Implement game logic in React components
3. Add score tracking integration
4. Register block in main plugin file