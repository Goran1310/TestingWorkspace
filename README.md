# Priča za Velike i Male (Stories for Big and Small)

A web application for browsing and playing Croatian children's audio stories from HRT's "Juhuhu" collection.

## Features

- 📚 **204 Audio Stories** - Collection of Croatian children's stories from HRT Juhuhu
- ❤️ **Favorites System** - Mark and save your favorite stories
- 🎲 **Random Story** - Play a random story with one click
- 🔀 **Shuffle Mode** - Auto-play random stories without repeats
- 🔍 **Advanced Search** - Fuzzy search with year and author filters
- 📊 **Metadata Extraction** - Automatic extraction of year, author, and title
- 📜 **Playback History** - Track recently played stories with play counts
- ⏯️ **Resume Playback** - Continue from where you left off
- 🎵 **Custom Playlists** - Create and manage your own playlists
- 📤 **Share Stories** - Share via Web Share API or copy to clipboard
- 💾 **Export/Import** - Backup and restore all your data
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **Offline Support** - Stories cached for offline viewing
- ♿ **Fully Accessible** - ARIA labels, keyboard navigation, screen reader support
- ⚡ **Performance** - Pagination for smooth browsing (50 stories per page)
- ⌨️ **Keyboard Shortcuts**:
  - `Ctrl/Cmd + K` - Focus search
  - `Ctrl/Cmd + R` - Random story
  - `Ctrl/Cmd + S` - Toggle shuffle mode
  - `Enter/Space` - Activate buttons
  - `Escape` - Clear search

## Recent Improvements (November 2025)

### ✅ Fixed Build Configuration
- **Removed unnecessary webpack** dependencies and configuration
- **Cleaned up package.json** to only include what's needed (lite-server)
- **Added bs-config.json** for proper lite-server configuration
- **Simplified npm scripts** - `npm start` or `npm run dev` to run locally
- No build process needed - pure static web app

### ✅ Moved Hardcoded Links to External JSON
- All 204 audio links extracted to `js/stories.json`
- Async loading with proper error handling
- Better maintainability - easy to update links
- Reduced JavaScript file size significantly

### ✅ Comprehensive Error Handling
- **Offline Support** - Stories cached for offline viewing
- **Online/Offline Detection** - Automatic reconnection handling
- **localStorage Protection** - Try-catch on all storage operations
- **Quota Management** - Handles storage limit errors gracefully
- **Audio Loading Errors** - User-friendly error messages for broken links
- **Loading States** - Visual feedback during data loading
- **Data Validation** - Checks for corrupted cache/favorites data

### ✅ Code Quality Improvements
- **Removed duplicate displayLinks() function**
- **Cleaned dead code** from HTML (commented sections)
- **Removed inline event handlers** - All events use proper listeners
- **Added debouncing** for search input (300ms)
- **Better code organization** and consistency

### ✅ Accessibility Enhancements
- **ARIA labels** on all interactive elements
- **Semantic HTML** - proper header, main, section, nav elements
- **Keyboard navigation** - Full keyboard support throughout
- **Focus management** - Visible focus indicators
- **Screen reader support** - Descriptive labels and live regions
- **Proper language attribute** - `lang="hr"` for Croatian content

### ✅ Performance Optimizations
- **Pagination** - 50 stories per page instead of rendering all 200+
- **Lazy rendering** - Only visible stories are in the DOM
- **Debounced search** - Reduced unnecessary re-renders
- **Efficient event delegation** - Better memory management

### ✅ Mobile UX Improvements
- **Larger touch targets** - Minimum 48x48px (56px on mobile)
- **Increased mobile max-height** - 400px from 200px
- **Better spacing** - Improved padding and margins
- **Responsive pagination** - Stacks vertically on mobile
- **Optimized font sizes** - Better readability on small screens

### ✅ NEW: Advanced Features (Latest Update)
- **Playback History** - Tracks recently played stories with timestamps and play counts
- **Resume Playback** - Automatically saves and resumes from last position (every 5 seconds)
- **Custom Playlists** - Create, manage, and delete custom playlists
- **Shuffle Mode** - Auto-play next story with repeat prevention
- **Share Functionality** - Share stories via Web Share API or clipboard
- **Export/Import** - Backup all data (favorites, playlists, history, positions) to JSON
- **Metadata Extraction** - Parses URLs to extract year, author, and title
- **Advanced Filters** - Filter stories by year and author using dropdown selects
- **Fuzzy Search** - Search matches all query words in any order
- **.editorconfig** - Consistent code style configuration
- **LICENSE** - MIT license with HRT attribution

## Project Structure

```
Prica_za_velike_i_male/
├── index.html           # Main HTML file
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── script.js       # Main application logic
│   └── stories.json    # Audio story links database
└── README.md           # This file
```

## How to Use

1. **Open the App**: Simply open `index.html` in a web browser
2. **Browse Stories**: Scroll through "All Stories" section
3. **Play a Story**: Click on any story title to start playing
4. **Add to Favorites**: Click the ❤️ button next to any story
5. **Random Story**: Click the 🎲 button in the header
6. **Shuffle Mode**: Click the 🔀 button to enable auto-play without repeats
7. **Search**: Use the search bar to filter stories by name
8. **Filter**: Use year and author dropdowns to narrow results
9. **Create Playlists**: Click "➕ Add to Playlist" in the audio player
10. **Resume Stories**: Stories automatically resume from where you left off
11. **Share Stories**: Click the 📤 Share button in the audio player
12. **Backup Data**: Use Export/Import buttons to backup favorites and playlists

## Running Locally

### Option 1: Direct File Access
Simply open `index.html` in your web browser.

> **Note**: Some browsers may block fetch requests when opening files directly (CORS policy). If you encounter issues loading stories, use Option 2 below.

### Option 2: Using Local Development Server (Recommended)
```bash
# Install dependencies (first time only)
npm install

# Start the development server
npm start
# OR
npm run dev
```

The app will open automatically at `http://localhost:3000`

### No Build Process Required
This is a pure static web app - no compilation or bundling needed!

## Updating Stories

To add or update audio links:

1. Open `js/stories.json`
2. Add/edit URLs in the `stories` array
3. Save the file
4. Refresh the app

Example format:
```json
{
  "stories": [
    "https://juhuhu.hrt.hr/media/uploads/juhuhu/audio/YYYY/MM/Story_Name.mp3",
    ...
  ]
}
```

## Technical Details

- **No Build Process Required** - Pure HTML/CSS/JavaScript
- **No External Dependencies** - Runs entirely in the browser
- **Local Storage API** - For persisting favorites
- **Fetch API** - For loading story database
- **Responsive CSS** - Mobile-friendly design

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Requires JavaScript enabled
- ⚠️ Requires localStorage support

## Future Improvements

- [ ] Modular architecture (split into app.js, storage.js, player.js, ui.js)
- [ ] Playback speed controls
- [ ] Dark mode
- [ ] Multiple language support
- [ ] Keyboard shortcuts help modal
- [ ] Advanced statistics dashboard

## License

MIT License - See LICENSE file for details.

All audio content belongs to HRT (Hrvatska radiotelevizija). This application is a third-party interface and is not affiliated with or endorsed by HRT.

## Credits

Audio stories provided by HRT's Juhuhu platform: https://juhuhu.hrt.hr/
