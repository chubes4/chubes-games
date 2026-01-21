# Installation

## Requirements

- WordPress 5.8 or higher
- PHP 8.0 or higher
- MySQL 5.6 or higher
- Node.js 16 or higher (for development)

## Installation

(Developer note: installation steps vary by environment; this page avoids step-by-step setup details.)

## Plugin Behavior After Activation

After activation, the plugin:

- Registers the `game` custom post type
- Creates the `wp_chubes_games_scores` table for score tracking
- Registers the Base Builder, Snake, and Leaderboard blocks

## Development Setup

For development:

- `npm install`
- `npm run start` (development server)
- `npm run build` (production build)

## Database Tables

The plugin creates a custom table `wp_chubes_games_scores` for tracking:
- User scores
- Player name
- Timestamped score entries
- Game identifiers

## Available Games

- **Base Builder**: Tower defense game with resource management
- **Snake**: Classic snake game with score tracking
- **Leaderboard**: Display high scores and rankings