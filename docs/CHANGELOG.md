# Changelog

## [0.2.1] - 2026-01-20

- docs

## [0.2.0] - 2025-11-30

### Added
- Game custom post type with public archives at `/games`
- Full Gutenberg support for game posts with title, editor, and thumbnail support
- Comprehensive development documentation (CLAUDE.md)
- Updated README.md with current architecture and game descriptions
- Post type registration with proper labels and admin interface

### Removed
- AI Adventure blocks (ai-adventure, ai-adventure-path, ai-adventure-step) and all associated files
- OpenAI API integration and client code (`inc/openai.php`)
- Admin settings page for OpenAI API key configuration
- All OpenAI-related dependencies, includes, and asset enqueuing
- OpenAI settings fields and validation functions

### Changed
- Simplified block registration logic in main plugin file
- Streamlined conditional asset loading to remove AI adventure references
- Cleaned up `inc/admin.php` to focus only on database table creation
- Updated package.json version consistency across all version fields
- Removed complex render callback logic for AI adventure blocks

### Technical Details
- Removed 40+ files related to AI adventure functionality (source, build, and asset files)
- Added modular post type registration in `inc/post-type.php`
- Maintained backward compatibility for existing game blocks (Base Builder, Snake, Leaderboard)
- Preserved all existing game mechanics and scoring functionality
- Updated asset loading to be more efficient by removing unused block checks

### Architecture Improvements
- Cleaner separation of concerns with dedicated post type file
- Simplified plugin initialization and block registration
- More maintainable codebase with reduced complexity
- Better documentation and development guidelines
