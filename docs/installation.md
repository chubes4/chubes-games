# Installation

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- MySQL 5.6 or higher
- Node.js 16 or higher (for development)

## Installation Steps

1. Download the plugin ZIP file from the releases page
2. In WordPress admin, go to Plugins > Add New
3. Click "Upload Plugin"
4. Upload the `chubes-games.zip` file
5. Activate the plugin

The plugin will automatically:
- Register the `game` custom post type
- Create database tables for score tracking
- Register game blocks in Gutenberg editor

## Development Setup

For development:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run start` for development server
4. Run `npm run build` to create production build

## Database Tables

The plugin creates a custom table `wp_chubes_game_scores` for tracking:
- User scores
- Game completion times
- Achievement data

## Available Games

- **Base Builder**: Tower defense game with resource management
- **Snake**: Classic snake game with score tracking
- **Leaderboard**: Display high scores and rankings