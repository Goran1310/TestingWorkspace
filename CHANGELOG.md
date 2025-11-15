# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-11-15

### 🎉 Major Feature Release

#### Added
- **Playback History** - Tracks recently played stories with timestamps and play counts
- **Resume Playback** - Automatically saves position every 5 seconds, resumes on replay
- **Custom Playlists** - Full playlist management (create, add, remove, delete)
- **Shuffle Mode** - Auto-play next story with Fisher-Yates-inspired repeat prevention
- **Share Functionality** - Web Share API with clipboard fallback
- **Export/Import** - Backup and restore all data (favorites, playlists, history, positions)
- **Metadata Extraction** - Automatic parsing of year, author, and title from URLs
- **Advanced Filters** - Filter by year and author with dropdown selects
- **Fuzzy Search** - Multi-word search matching in any order
- **Visual Resume Notice** - Shows saved position when resuming playback
- **Player Controls** - Share and Add to Playlist buttons in audio player
- **Data Management Section** - Export/Import UI with instructions
- **History Section** - Display recently played stories with metadata
- **Playlists Section** - View and manage all playlists
- **.editorconfig** - Code style consistency configuration
- **LICENSE** - MIT license with HRT attribution

#### Enhanced
- **Search Function** - Now uses metadata index for better results
- **Keyboard Shortcuts** - Added Ctrl+S for shuffle toggle
- **Storage Management** - Separate functions for history, positions, playlists
- **Audio Player** - Enhanced with resume, share, and playlist features
- **Header** - Shuffle button added alongside random story button
- **Filter Controls** - Year and author dropdowns with "All" options
- **Results Info** - Dynamic display of filtered vs total stories

#### Technical
- Metadata extraction from 204 story URLs
- Searchable metadata index with fuzzy matching
- Auto-play next story in shuffle mode
- Position saving with 5-second intervals
- JSON export with version and timestamp
- Import validation and error handling
- Time formatting helper (MM:SS)
- Time ago helper for history timestamps

## [1.0.0] - 2025-11-14

### Added
- **Pagination System**: 50 stories per page for better performance
- **Keyboard Shortcuts**: Ctrl/Cmd+K for search, Ctrl/Cmd+R for random story
- **ARIA Labels**: Full accessibility support for screen readers
- **Semantic HTML**: Proper header, main, section, nav elements
- **Focus Management**: Visible focus indicators for keyboard navigation
- **Debounced Search**: 300ms debounce to reduce unnecessary renders
- **Results Counter**: Shows current range and total stories
- **Empty State Messages**: User-friendly messages for empty favorites
- **Keyboard Support**: Enter/Space on all interactive elements

### Changed
- **Touch Targets**: Increased to minimum 48x48px (56px on mobile)
- **Mobile Max-height**: Increased from 200px to 400px
- **Button Styles**: Enhanced with better hover/active states
- **Link Display**: Changed from anchor tags to buttons for better semantics
- **Search Bar**: Now uses event listener instead of inline oninput
- **Language**: Changed HTML lang from "en" to "hr" (Croatian)
- **Title**: Updated from "Favorite Links" to "Priče za Velike i Male"

### Fixed
- **Duplicate displayLinks() function**: Removed duplicate definition
- **Dead Code**: Removed all commented-out HTML
- **Inline Event Handlers**: Converted to proper event listeners
- **Accessibility Issues**: Added proper ARIA attributes throughout
- **Mobile UX**: Better responsive design with larger touch targets
- **Performance**: Rendering 200+ items at once (now paginated)

### Improved
- **Code Organization**: Better structure and consistency
- **Event Management**: Centralized event listener setup
- **Memory Usage**: More efficient DOM manipulation
- **User Feedback**: Better visual feedback on interactions
- **Keyboard Navigation**: Complete keyboard support throughout app

## [1.1.0] - 2025-11-15

### Added
- **Offline Support**: Stories are now cached in localStorage for offline browsing
- **Online/Offline Detection**: Automatic detection and handling of connection status
- **Loading States**: Visual feedback while stories are being loaded
- **Error Recovery**: Graceful degradation with user-friendly error messages
- **Storage Quota Management**: Handles localStorage quota exceeded errors
- **Data Validation**: Validates cached data to prevent corruption issues
- **bs-config.json**: Proper configuration for lite-server development
- **SETUP.md**: Comprehensive setup and troubleshooting guide
- **README.md**: Enhanced documentation with all features
- **.gitignore**: Proper exclusion of unnecessary files

### Changed
- **Refactored package.json**: Removed unnecessary webpack dependencies
- **Simplified npm scripts**: Only `start`, `dev`, and `test` commands
- **Improved error handling**: All localStorage operations wrapped in try-catch
- **Enhanced audio player**: Better error handling for broken/missing audio files
- **Better code organization**: Separated concerns and improved function structure

### Fixed
- **Build Configuration**: Removed non-existent webpack configuration
- **Missing Dependencies**: Cleaned up unused webpack and webpack-dev-server
- **Non-existent dist directory**: Removed references to build output folder
- **localStorage crashes**: All storage operations now fail gracefully
- **Uncaught audio errors**: Audio loading errors now display user-friendly messages
- **Event listener timing**: Fixed race conditions with DOM loading
- **Duplicate event listeners**: Consolidated event attachment in single function

### Removed
- **webpack**: No longer needed for static web app
- **webpack-cli**: Removed unused dependency
- **webpack-dev-server**: Removed unused dependency
- **webpack-merge**: Removed unused dependency
- **browserslist**: Not needed without build process

## [1.0.0] - Initial Release

### Added
- Basic story browsing and playback
- Favorites system with localStorage persistence
- Search functionality
- Random story feature
- Collapsible sections for better organization
- Responsive design for mobile and desktop
- 204 Croatian children's audio stories from HRT Juhuhu

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes
