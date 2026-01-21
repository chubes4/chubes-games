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

#### Gameplay Highlights
- Start with a command center and expand structures
- Collect resources and spend them on upgrades
- Survive enemy waves with automated defenses

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
- Score data comes from the `chubes_games_scores` table

## REST API Endpoints

The plugin provides REST API endpoints for score management:

- `GET /wp-json/chubes-games/v1/scores` - Retrieve scores
- `POST /wp-json/chubes-games/v1/scores` - Submit new score

## Game Architecture

### Components
- **Game Blocks**: Individual Gutenberg blocks for each game
- **Score System**: Database-backed score tracking
- **Score Storage**: Database-backed score tracking

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

### Block Registration
Blocks are registered automatically by scanning `blocks/` for `block.json` files.