# Feature Documentation

## Complete Feature List

### Core Features

#### 📚 Story Library
- **204 Croatian Children's Stories** from HRT Juhuhu
- **Automatic Metadata Extraction** - Year, author, and title parsed from URLs
- **Pagination** - 50 stories per page for optimal performance
- **Collapsible Sections** - Clean, organized interface

#### 🔍 Search & Filtering
- **Real-time Search** - Debounced search (300ms) for smooth performance
- **Fuzzy Matching** - Finds stories even if words are in different order
- **Year Filter** - Filter by publication year (2022-2024)
- **Author Filter** - Filter by extracted author names
- **Combined Filters** - All filters work together
- **Results Count** - Shows "Found X of Y stories"

#### 🎵 Audio Playback
- **HTML5 Audio Player** - Native browser controls
- **Auto-Resume** - Continues from where you left off
- **Position Saving** - Saves every 5 seconds
- **Resume Notice** - Shows "⏸️ Resuming from MM:SS"
- **Error Handling** - User-friendly messages for broken links
- **Focus Management** - Player auto-focuses for accessibility

#### ❤️ Favorites System
- **One-Click Favorites** - Heart icon to save stories
- **Persistent Storage** - Saved in localStorage
- **Remove Function** - Easy removal with ❌ button
- **Separate View** - Dedicated favorites section
- **Visual Feedback** - Heart changes from ♡ to ❤️

### Advanced Features

#### ⏯️ Resume Playback
**How It Works:**
- Position saved every 5 seconds during playback
- Automatically loads saved position on replay
- Shows visual notice with timestamp
- Clears position when story finishes (last 5 seconds)
- Handles pause events to save immediately

**Storage:**
- Key: `playbackPositions`
- Format: `{ [url]: { position, duration, timestamp } }`
- Auto-cleanup when story completes

#### 📜 Playback History
**Features:**
- Tracks all played stories
- Play count increment
- Timestamp of last play
- Sorted by most recent
- Limited to 50 items

**Display:**
- Shows up to 20 recent stories
- "X plays" counter
- "Just now" / "5 min ago" / "2 days ago" timestamps
- Click to replay

**Storage:**
- Key: `playbackHistory`
- Format: `[{ link, title, timestamp, playCount }]`

#### 🎵 Custom Playlists
**Creation:**
1. Play any story
2. Click "➕ Add to Playlist"
3. Modal shows existing playlists
4. Create new or add to existing

**Management:**
- View all playlists
- Story count display
- Numbered story list
- Remove individual stories
- Delete entire playlist
- Play stories from playlist

**Storage:**
- Key: `playlists`
- Format: `{ [name]: [url1, url2, ...] }`

#### 🔀 Shuffle Mode
**Algorithm:**
- Fisher-Yates-inspired random selection
- Tracks played stories in session
- Prevents repeats until 50% played
- Resets when all stories played
- Auto-plays next when current ends

**User Experience:**
- Toggle button in header
- Green when active
- Auto-play with 1-second delay
- Visual feedback

**Storage:**
- Session-only (shuffleHistory array)
- Resets when toggled off

#### 📤 Share Functionality
**Methods:**
1. **Web Share API** (if available)
   - Native share menu
   - Includes title, text, URL
   
2. **Clipboard Fallback**
   - Copies title + URL
   - Shows success alert
   
3. **Final Fallback**
   - Shows URL in prompt box

**Share Data:**
- Title: "Priča: [Story Name]"
- Text: "Listen to [Story Name] from Priče za Velike i Male"
- URL: Direct audio link

#### 💾 Export/Import System
**Export:**
- Downloads JSON file
- Filename: `prica-backup-YYYY-MM-DD.json`
- Includes:
  - Favorites array
  - Playlists object
  - Playback history
  - Playback positions
  - Export date (ISO format)
  - Version number

**Import:**
- File picker for JSON files
- Validates data structure
- Merges/overwrites existing data
- Shows success/error alerts
- Updates all displays

**Data Structure:**
```json
{
  "favorites": [],
  "playlists": {},
  "playbackHistory": [],
  "playbackPositions": {},
  "exportDate": "2025-11-15T12:00:00.000Z",
  "version": "1.0"
}
```

### User Experience Features

#### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + R` | Random story |
| `Ctrl/Cmd + S` | Toggle shuffle |
| `Enter` / `Space` | Activate button |
| `Escape` | Clear search |
| `Tab` | Navigate elements |

#### ♿ Accessibility
- **ARIA Labels** - All interactive elements
- **Semantic HTML** - Proper heading hierarchy
- **Keyboard Navigation** - Full keyboard support
- **Focus Indicators** - Visible 3px outline
- **Screen Reader Support** - Descriptive labels
- **Live Regions** - Dynamic content announcements
- **Language Attribute** - `lang="hr"` for Croatian

#### 📱 Responsive Design
**Desktop (800px+):**
- Side-by-side layouts
- Hover effects
- Larger spacing

**Tablet (600-800px):**
- Adjusted layouts
- Medium touch targets

**Mobile (<600px):**
- Stacked layouts
- 56px minimum touch targets
- 400px container heights
- Larger text
- Full-width controls

#### 💾 Offline Support
**Caching:**
- Stories list cached on first load
- Timestamp tracking
- Fallback to cache if offline
- Warning banner when offline

**Offline Capabilities:**
- Browse cached story list
- View favorites
- View history
- View playlists
- Search cached stories

**Limitations:**
- Cannot play audio offline
- Cannot load new stories
- Cache updates when online

#### 🎨 Visual Design
**Color Scheme:**
- Primary: `#007bff` (Blue)
- Success: `#28a745` (Green)
- Danger: `#dc3545` (Red)
- Warning: `#ffcc00` (Yellow)
- Secondary: `#6c757d` (Gray)

**Animations:**
- 0.2s transitions
- Smooth hover effects
- Transform animations
- Collapsible sections

**Typography:**
- Base: Arial, sans-serif
- Headings: Bold, larger sizes
- Consistent hierarchy
- Readable line heights

### Technical Features

#### Performance Optimizations
- **Pagination** - 50 items per page
- **Debouncing** - 300ms search delay
- **Lazy Rendering** - Only visible items in DOM
- **Event Delegation** - Efficient event handling
- **Metadata Indexing** - Pre-computed search data

#### Error Handling
- **Try-Catch Blocks** - All localStorage operations
- **Validation** - Data structure checks
- **User Feedback** - Clear error messages
- **Graceful Degradation** - Fallbacks for missing features
- **Console Logging** - Detailed error info

#### Browser Compatibility
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **HTML5 Audio** - Required for playback
- **localStorage** - Required for persistence
- **Fetch API** - Required for story loading
- **CSS Grid/Flexbox** - For layout

## Feature Status

✅ **Implemented (9/10)**
- Playback history
- Resume playback
- Custom playlists
- Shuffle mode
- Share functionality
- Export/Import
- Metadata extraction
- Advanced filters
- .editorconfig & LICENSE

🔄 **Pending (1/10)**
- Modular architecture (app.js, storage.js, player.js, ui.js)

## Future Enhancements

### Planned
- Playback speed controls (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Dark mode toggle
- Statistics dashboard (most played, total listen time, etc.)
- Keyboard shortcuts help modal
- Multiple language support (English, Croatian)

### Under Consideration
- Download for offline listening (requires file handling)
- User accounts and cloud sync (requires backend)
- Comments and ratings (requires backend)
- Playlist sharing (requires backend or URL encoding)
- Sleep timer
- Repeat single story mode

## Performance Metrics

### Load Time
- **Initial Load**: <1s (cached), 2-3s (first time)
- **Story Database**: ~50KB JSON
- **JavaScript**: ~20KB
- **CSS**: ~10KB

### Storage Usage
- **Stories Cache**: ~50KB
- **Favorites**: ~1-5KB (depends on count)
- **Playlists**: ~2-10KB (depends on usage)
- **History**: ~5-10KB (50 items max)
- **Positions**: ~2-5KB
- **Total**: ~60-80KB typical usage

### Accessibility Score
- **WCAG 2.1 Level AA**: ✅ Compliant
- **Keyboard Navigation**: ✅ Full support
- **Screen Reader**: ✅ Fully labeled
- **Color Contrast**: ✅ Meets standards

## User Guide Quick Reference

### Getting Started
1. Open app in browser
2. Browse "All Stories" section
3. Click story to play
4. Use favorites ❤️ to save

### Power User Tips
- Use `Ctrl+K` for quick search
- Enable shuffle mode for continuous play
- Export data regularly for backup
- Use filters to narrow large searches
- Create playlists for organized listening

### Troubleshooting
- **Stories won't load**: Check internet, refresh page
- **Audio won't play**: Check connection, try another story
- **Favorites not saving**: Check localStorage enabled
- **Slow performance**: Reduce items per page in code
