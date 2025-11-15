# Quick Setup Guide

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js and npm (optional, only for development server)

### Installation

1. **Clone or download** this repository

2. **Option A: Run directly** (Simple)
   - Open `index.html` in your web browser
   - That's it! No setup required.
   
   > ⚠️ **Note**: If stories don't load, your browser may be blocking local file access. Use Option B instead.

3. **Option B: Run with development server** (Recommended)
   ```bash
   # Install dependencies (first time only)
   npm install
   
   # Start the server
   npm start
   ```
   
   The app will automatically open at `http://localhost:3000`

## Features Overview

### 🎵 Browse & Play Stories
- Click any story title to start playing
- Audio player appears at the bottom of the page
- Controls: play/pause, volume, progress bar

### ❤️ Manage Favorites
- Click the ❤️ button to add stories to favorites
- Favorites section shows all your saved stories
- Click ❌ to remove from favorites
- Favorites are saved locally (persist across sessions)

### 🎲 Random Story
- Click the 🎲 button in the header
- Plays a random story from the collection

### 🔍 Search
- Use the search bar to filter stories by name
- Search is case-insensitive
- Results update as you type (with 300ms debounce)
- Press `Escape` to clear search

### ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + K** - Focus search bar
- **Ctrl/Cmd + R** - Play random story
- **Ctrl/Cmd + S** - Toggle shuffle mode
- **Enter or Space** - Activate buttons and links
- **Escape** - Clear search input
- **Tab** - Navigate between interactive elements
- All interactive elements support keyboard navigation

### 🔀 Shuffle Mode (NEW)
- Click the 🔀 button in header (or press Ctrl+S)
- Button turns green when active
- Plays random stories without repeating
- Auto-plays next story when current one ends

### 📊 Advanced Search & Filters (NEW)
- **Year Filter** - Dropdown to filter by year (2022-2024)
- **Author Filter** - Dropdown to filter by author name
- **Fuzzy Search** - Matches all search words in any order
- Filters work together with text search

### ⏯️ Resume Playback (NEW)
- Stories automatically save your position
- Resume from where you left off when replaying
- Position saved every 5 seconds
- Shows "⏸️ Resuming from MM:SS" notice

### 📜 Playback History (NEW)
- Tracks recently played stories
- Shows play count and last played time
- View up to 20 recent stories
- Located in "Recently Played" section

### 🎵 Custom Playlists (NEW)
1. Play any story to open audio player
2. Click "➕ Add to Playlist" button
3. Create new playlist or add to existing
4. Manage playlists in "Playlists" section
5. Reorder, remove, or delete playlists

### 📤 Share Stories (NEW)
1. Play any story
2. Click "📤 Share" button in player
3. Uses native share menu if available
4. Falls back to clipboard copy

### 💾 Export/Import Data (NEW)
- **Export** - Downloads JSON file with all data:
  - Favorites, playlists, history, positions
  - Includes export date and version
- **Import** - Restore from backup:
  - Click "📂 Import Data"
  - Select exported JSON file
  - All data will be restored

### 📡 Offline Support
- Stories are cached after first load
- Browse your favorites offline
- Playback requires internet connection

## Troubleshooting

### Stories Won't Load
1. Check your internet connection
2. Try refreshing the page (Ctrl+R or Cmd+R)
3. Check browser console for errors (F12)
4. Use the development server (Option B above)

### Audio Won't Play
1. Ensure you have an internet connection
2. Check browser console for errors
3. The audio link may be broken - try another story
4. Check your browser's autoplay settings

### Favorites Not Saving
1. Ensure cookies/localStorage is enabled
2. Check browser privacy settings
3. You may have reached storage quota (remove some favorites)

### Development Server Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if port 3000 is already in use
# You can change it in bs-config.json
```

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 90+            | ✅ Fully supported |
| Firefox | 88+            | ✅ Fully supported |
| Safari  | 14+            | ✅ Fully supported |
| Edge    | 90+            | ✅ Fully supported |

## File Structure

```
Prica_za_velike_i_male/
├── index.html              # Main HTML file
├── package.json           # npm configuration
├── bs-config.json         # Development server config
├── README.md              # Project documentation
├── SETUP.md              # This file
├── .gitignore            # Git ignore rules
├── css/
│   └── styles.css        # Styling
└── js/
    ├── script.js         # Application logic
    └── stories.json      # Audio stories database
```

## Updating Stories

To add or modify audio links:

1. Open `js/stories.json`
2. Add/edit URLs in the `"stories"` array:
   ```json
   {
     "stories": [
       "https://example.com/audio/story1.mp3",
       "https://example.com/audio/story2.mp3"
     ]
   }
   ```
3. Save and refresh the app

## Privacy & Data

- **All data stored locally** - No external servers
- **Favorites** - Stored in browser's localStorage
- **Cache** - Stories list cached for offline use
- **No tracking** - No analytics or cookies
- **Audio source** - All audio from HRT Juhuhu platform

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Open browser console (F12) and check for errors
3. Ensure you're using a supported browser version
4. Try clearing browser cache and localStorage

## License

This project is for personal/educational use. All audio content belongs to HRT (Hrvatska radiotelevizija).
