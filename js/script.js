// Global variables
let links = [];
const favorites = [];
let playlists = {}; // Custom playlists
let playbackHistory = []; // Recently played stories
let playbackPositions = {}; // Resume positions
let isLoading = true;
let currentPage = 1;
const ITEMS_PER_PAGE = 50; // Pagination for performance
let currentFilter = '';
let shuffleHistory = []; // Track played stories in shuffle mode
let isShuffleMode = false;
let storyMetadata = []; // Extracted metadata from URLs
let activeFilters = { year: 'all', author: 'all' };

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    
    // Update mobile theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
}

function updateThemeButton(theme) {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

// Extract metadata from story URL
function extractMetadata(url) {
    try {
        // Extract year from URL path (e.g., /audio/2024/08/)
        const yearMatch = url.match(/\/audio\/(\d{4})\//);
        const year = yearMatch ? yearMatch[1] : 'Unknown';
        
        // Extract filename
        const filename = url.substring(url.lastIndexOf('/') + 1);
        const decodedFilename = decodeURIComponent(filename.replace('.mp3', ''));
        
        // Try to extract author and title
        // Common patterns: "Author_Title" or "Author_-_Title"
        let author = 'Unknown';
        let title = decodedFilename;
        
        if (decodedFilename.includes('_-_')) {
            const parts = decodedFilename.split('_-_');
            author = parts[0].replace(/_/g, ' ').trim();
            title = parts.slice(1).join(' - ').replace(/_/g, ' ').trim();
        } else if (decodedFilename.includes('_')) {
            const parts = decodedFilename.split('_');
            // First part is likely author if it looks like a name (capitalized)
            if (parts[0] && parts[0][0] === parts[0][0].toUpperCase()) {
                author = parts[0].trim();
                title = parts.slice(1).join(' ').trim();
            }
        }
        
        return {
            url,
            year,
            author,
            title,
            fullTitle: decodedFilename.replace(/_/g, ' '),
            searchText: `${year} ${author} ${title} ${decodedFilename}`.toLowerCase()
        };
    } catch (error) {
        console.error('Error extracting metadata:', error);
        return {
            url,
            year: 'Unknown',
            author: 'Unknown',
            title: decodeURIComponent(url.substring(url.lastIndexOf('/') + 1).replace('.mp3', '')).replace(/_/g, ' '),
            fullTitle: decodeURIComponent(url.substring(url.lastIndexOf('/') + 1).replace('.mp3', '')).replace(/_/g, ' '),
            searchText: url.toLowerCase()
        };
    }
}

// Build metadata index
function buildMetadataIndex() {
    storyMetadata = links.map(link => extractMetadata(link));
}

// Get unique years from metadata
function getUniqueYears() {
    const years = [...new Set(storyMetadata.map(m => m.year))];
    return years.sort((a, b) => b.localeCompare(a)); // Newest first
}

// Get unique authors from metadata
function getUniqueAuthors() {
    const authors = [...new Set(storyMetadata.map(m => m.author))];
    return authors.filter(a => a !== 'Unknown').sort();
}

// Check if user is online
function isOnline() {
    return navigator.onLine;
}

// Load stories from JSON file
async function loadStories() {
    try {
        // Check online status first
        if (!isOnline()) {
            throw new Error('No internet connection detected');
        }

        const response = await fetch('js/stories.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!data.stories || !Array.isArray(data.stories)) {
            throw new Error('Invalid data format in stories.json');
        }
        
        links = data.stories;
        isLoading = false;
        
        // Build metadata index for advanced search
        buildMetadataIndex();
        
        // Cache stories for offline use
        cacheStories(data.stories);
        
        return true;
    } catch (error) {
        console.error('Error loading stories:', error);
        isLoading = false;
        
        // Try to load from cache if available
        const cachedStories = getCachedStories();
        if (cachedStories && cachedStories.length > 0) {
            links = cachedStories;
            showWarning('Offline mode: Showing cached stories. Audio playback may not work.');
            return true;
        }
        
        // Show appropriate error message
        if (!isOnline()) {
            showError('No internet connection and no cached stories available. Please connect to the internet and refresh.');
        } else {
            showError(`Failed to load stories: ${error.message}. Please refresh the page to try again.`);
        }
        return false;
    }
}

// Cache stories for offline use
function cacheStories(stories) {
    try {
        localStorage.setItem('cachedStories', JSON.stringify(stories));
        localStorage.setItem('cacheTimestamp', Date.now().toString());
    } catch (error) {
        console.warn('Failed to cache stories:', error);
    }
}

// Get cached stories
function getCachedStories() {
    try {
        const cached = localStorage.getItem('cachedStories');
        if (cached) {
            const stories = JSON.parse(cached);
            // Build metadata for cached stories too
            links = stories;
            buildMetadataIndex();
            return stories;
        }
    } catch (error) {
        console.warn('Failed to load cached stories:', error);
    }
    return null;
}

// Show error message to user
function showError(message) {
    const linkContainer = document.getElementById('link-container');
    if (linkContainer) {
        linkContainer.innerHTML = `
            <div style="color: #e63946; padding: 20px; text-align: center; background: #ffe0e0; border-radius: 8px;">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; cursor: pointer; background: #e63946; color: white; border: none; border-radius: 4px;">Reload Page</button>
            </div>
        `;
    }
}

// Show warning message to user
function showWarning(message) {
    const linkContainer = document.getElementById('link-container');
    if (linkContainer) {
        const warningBanner = document.createElement('div');
        warningBanner.style.cssText = 'color: #856404; padding: 12px; text-align: center; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; margin-bottom: 10px;';
        warningBanner.innerHTML = `<strong>⚠️ ${message}</strong>`;
        linkContainer.insertBefore(warningBanner, linkContainer.firstChild);
    }
}
// Display links with pagination and accessibility
function displayLinks(filteredLinks = links, page = 1) {
    const linkContainer = document.getElementById('link-container');
    linkContainer.innerHTML = '<h2>All Stories</h2>';
    
    // Apply filter
    const linksToDisplay = filteredLinks;
    const totalPages = Math.ceil(linksToDisplay.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedLinks = linksToDisplay.slice(startIndex, endIndex);
    
    // Create list for better semantics
    const list = document.createElement('ul');
    list.setAttribute('role', 'list');
    list.className = 'story-list';
    
    paginatedLinks.forEach((link, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'file-link';
        listItem.setAttribute('role', 'listitem');
        
        const displayText = decodeURIComponent(
            link.substring(link.indexOf("audio/") + 14)
                .replace(".mp3", "")
                .replace(/_/g, " ")
        );
        
        const storyButton = document.createElement('button');
        storyButton.className = 'story-title';
        storyButton.textContent = displayText;
        storyButton.setAttribute('aria-label', `Play story: ${displayText}`);
        storyButton.setAttribute('tabindex', '0');
        storyButton.onclick = () => openAudioPlayer(link, displayText);
        
        // Keyboard support
        storyButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAudioPlayer(link, displayText);
            }
        });
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.innerHTML = favorites.includes(link) ? '❤️' : '♡';
        favoriteBtn.setAttribute('aria-label', 
            favorites.includes(link) ? `Remove ${displayText} from favorites` : `Add ${displayText} to favorites`
        );
        favoriteBtn.setAttribute('tabindex', '0');
        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(link);
        };
        
        listItem.appendChild(storyButton);
        listItem.appendChild(favoriteBtn);
        list.appendChild(listItem);
    });
    
    linkContainer.appendChild(list);
    
    // Add pagination controls if needed
    if (totalPages > 1) {
        const paginationDiv = createPagination(page, totalPages, linksToDisplay);
        linkContainer.appendChild(paginationDiv);
    }
    
    // Update info
    const info = document.createElement('p');
    info.className = 'results-info';
    info.textContent = `Showing ${startIndex + 1}-${Math.min(endIndex, linksToDisplay.length)} of ${linksToDisplay.length} stories`;
    info.setAttribute('aria-live', 'polite');
    linkContainer.insertBefore(info, list);
}

// Create pagination controls
function createPagination(currentPage, totalPages, filteredLinks) {
    const paginationDiv = document.createElement('nav');
    paginationDiv.className = 'pagination';
    paginationDiv.setAttribute('role', 'navigation');
    paginationDiv.setAttribute('aria-label', 'Story pages');
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.className = 'page-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.onclick = () => {
        displayLinks(filteredLinks, currentPage - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfo.setAttribute('aria-current', 'page');
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'page-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.setAttribute('aria-label', 'Next page');
    nextBtn.onclick = () => {
        displayLinks(filteredLinks, currentPage + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextBtn);
    
    return paginationDiv;
}

// Display favorites with accessibility
function displayFavorites() {
    const favoriteContainer = document.getElementById('favorite-container');
    favoriteContainer.innerHTML = '<h2>Favorite Stories</h2>';
    
    if (favorites.length === 0) {
        favoriteContainer.innerHTML += '<p class="empty-message">No favorites yet. Click ♡ to add stories!</p>';
        return;
    }
    
    const list = document.createElement('ul');
    list.setAttribute('role', 'list');
    list.className = 'story-list';
    
    favorites.forEach((link) => {
        const listItem = document.createElement('li');
        listItem.className = 'file-link';
        listItem.setAttribute('role', 'listitem');
        
        const displayText = decodeURIComponent(
            link.substring(link.indexOf("audio/") + 14)
                .replace(".mp3", "")
                .replace(/_/g, " ")
        );
        
        const storyButton = document.createElement('button');
        storyButton.className = 'story-title';
        storyButton.textContent = displayText;
        storyButton.setAttribute('aria-label', `Play story: ${displayText}`);
        storyButton.onclick = () => openAudioPlayer(link, displayText);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'favorite-btn remove-btn';
        removeBtn.innerHTML = '❌';
        removeBtn.setAttribute('aria-label', `Remove ${displayText} from favorites`);
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFavorite(link);
        };
        
        listItem.appendChild(storyButton);
        listItem.appendChild(removeBtn);
        list.appendChild(listItem);
    });
    
    favoriteContainer.appendChild(list);
}

function openAudioPlayer(link, title) {
    const audioPlayerContainer = document.getElementById('audio-player-container');
    
    // Check if we have a saved position
    const savedPosition = playbackPositions[link];
    const hasPosition = savedPosition && savedPosition.position > 5;
    
    audioPlayerContainer.innerHTML = `
        <div class="player-header">
            <h3>Now Playing: ${title}</h3>
            <button class="share-btn" id="share-story-btn"
                aria-label="Share ${title}">📤 Share</button>
        </div>
        ${hasPosition ? `<p class="resume-notice">⏸️ Resuming from ${formatTime(savedPosition.position)}</p>` : ''}
        <audio controls id="audio-player" aria-label="Audio player for ${title}">
            <source src="${link}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        <div class="player-controls">
            <button id="add-to-playlist-btn" 
                class="playlist-add-btn"
                aria-label="Add to playlist">➕ Add to Playlist</button>
        </div>
    `;
    
    // Add event listeners for buttons
    const shareBtn = document.getElementById('share-story-btn');
    if (shareBtn) {
        shareBtn.onclick = () => shareStory(link, title);
    }
    
    const addPlaylistBtn = document.getElementById('add-to-playlist-btn');
    if (addPlaylistBtn) {
        addPlaylistBtn.onclick = () => addToPlaylist(link, title);
    }
    
    // Add to history
    addToHistory(link, title);
    
    const audioElement = document.getElementById('audio-player');
    
    // Resume from saved position
    if (hasPosition) {
        audioElement.addEventListener('loadedmetadata', () => {
            audioElement.currentTime = savedPosition.position;
        }, { once: true });
    }
    
    // Save position periodically
    let saveInterval;
    audioElement.addEventListener('play', () => {
        saveInterval = setInterval(() => {
            savePlaybackPosition(link, audioElement.currentTime, audioElement.duration);
        }, 5000); // Save every 5 seconds
    });
    
    audioElement.addEventListener('pause', () => {
        clearInterval(saveInterval);
        savePlaybackPosition(link, audioElement.currentTime, audioElement.duration);
    });
    
    audioElement.addEventListener('ended', () => {
        clearInterval(saveInterval);
        savePlaybackPosition(link, audioElement.duration, audioElement.duration);
        
        // Auto-play next in shuffle mode
        if (isShuffleMode) {
            setTimeout(() => playRandomStory(true), 1000);
        }
    });
    
    // Add error handling for audio loading
    audioElement.addEventListener('error', function(e) {
        console.error('Audio loading error:', e);
        clearInterval(saveInterval);
        audioPlayerContainer.innerHTML = `
            <div role="alert" aria-live="assertive">
                <h3>Error Playing: ${title}</h3>
                <p style="color: #e63946;">Unable to load this audio file. The link may be broken or the file may have been moved.</p>
            </div>
        `;
    });
    
    // Focus on audio player for accessibility
    setTimeout(() => {
        audioElement.focus();
    }, 100);
}

// Format time helper
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toggleFavorite(link) {
if (favorites.includes(link)) {
    removeFavorite(link);
} else {
    addFavorite(link);
}
}

function addFavorite(link) {
favorites.push(link);
saveFavorites();
displayFavorites();
}

function removeFavorite(link) {
const index = favorites.indexOf(link);
if (index > -1) {
    favorites.splice(index, 1);
}
saveFavorites();
displayFavorites();
}

function addLink() {
const newLinkInput = document.getElementById('new-link');
const newLink = newLinkInput.value.trim();
if (newLink) {
    links.push(newLink);
    newLinkInput.value = '';
    displayLinks();
}
}

function saveFavorites() {
    try {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites:', error);
        
        // Handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
            alert('Storage limit reached. Unable to save more favorites. Consider removing some old favorites.');
        } else {
            console.warn('Failed to save favorites to localStorage');
        }
    }
}

function loadFavorites() {
    try {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
            const parsed = JSON.parse(storedFavorites);
            
            // Validate that it's an array
            if (Array.isArray(parsed)) {
                favorites.push(...parsed);
            } else {
                console.warn('Invalid favorites data in localStorage');
                // Clear corrupted data
                localStorage.removeItem('favorites');
            }
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        // Clear corrupted data
        try {
            localStorage.removeItem('favorites');
        } catch (e) {
            console.error('Failed to clear corrupted favorites');
        }
    }
}

// Load playback history
function loadPlaybackHistory() {
    try {
        const stored = localStorage.getItem('playbackHistory');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                playbackHistory = parsed;
            }
        }
    } catch (error) {
        console.error('Error loading playback history:', error);
        localStorage.removeItem('playbackHistory');
    }
}

// Save playback history
function savePlaybackHistory() {
    try {
        // Keep only last 50 items
        const trimmed = playbackHistory.slice(0, 50);
        localStorage.setItem('playbackHistory', JSON.stringify(trimmed));
    } catch (error) {
        console.error('Error saving playback history:', error);
    }
}

// Add to playback history
function addToHistory(link, title) {
    const historyItem = {
        link,
        title,
        timestamp: Date.now(),
        playCount: 1
    };
    
    // Check if already in history
    const existingIndex = playbackHistory.findIndex(item => item.link === link);
    if (existingIndex !== -1) {
        // Update existing entry
        playbackHistory[existingIndex].timestamp = Date.now();
        playbackHistory[existingIndex].playCount++;
        // Move to top
        const item = playbackHistory.splice(existingIndex, 1)[0];
        playbackHistory.unshift(item);
    } else {
        // Add new entry at top
        playbackHistory.unshift(historyItem);
    }
    
    savePlaybackHistory();
}

// Load playback positions
function loadPlaybackPositions() {
    try {
        const stored = localStorage.getItem('playbackPositions');
        if (stored) {
            playbackPositions = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading playback positions:', error);
        localStorage.removeItem('playbackPositions');
    }
}

// Save playback position
function savePlaybackPosition(link, position, duration) {
    try {
        // Only save if more than 5 seconds played and not finished
        if (position > 5 && position < duration - 5) {
            playbackPositions[link] = {
                position,
                duration,
                timestamp: Date.now()
            };
            localStorage.setItem('playbackPositions', JSON.stringify(playbackPositions));
        } else if (position >= duration - 5) {
            // Remove position if finished
            delete playbackPositions[link];
            localStorage.setItem('playbackPositions', JSON.stringify(playbackPositions));
        }
    } catch (error) {
        console.error('Error saving playback position:', error);
    }
}

// Load playlists
function loadPlaylists() {
    try {
        const stored = localStorage.getItem('playlists');
        if (stored) {
            playlists = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        localStorage.removeItem('playlists');
    }
}

// Save playlists
function savePlaylists() {
    try {
        localStorage.setItem('playlists', JSON.stringify(playlists));
    } catch (error) {
        console.error('Error saving playlists:', error);
    }
}

// Export data to JSON
function exportData() {
    const exportObj = {
        favorites: favorites,
        playlists: playlists,
        playbackHistory: playbackHistory,
        playbackPositions: playbackPositions,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prica-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import data from JSON
function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Validate structure
            if (imported.favorites && Array.isArray(imported.favorites)) {
                favorites.length = 0;
                favorites.push(...imported.favorites);
                saveFavorites();
            }
            
            if (imported.playlists && typeof imported.playlists === 'object') {
                playlists = imported.playlists;
                savePlaylists();
            }
            
            if (imported.playbackHistory && Array.isArray(imported.playbackHistory)) {
                playbackHistory = imported.playbackHistory;
                savePlaybackHistory();
            }
            
            if (imported.playbackPositions && typeof imported.playbackPositions === 'object') {
                playbackPositions = imported.playbackPositions;
                localStorage.setItem('playbackPositions', JSON.stringify(playbackPositions));
            }
            
            alert('Data imported successfully!');
            displayFavorites();
            displayPlaylists();
            displayHistory();
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Failed to import data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// Share story
async function shareStory(link, title) {
    const shareData = {
        title: `Priča: ${title}`,
        text: `Listen to "${title}" from Priče za Velike i Male`,
        url: link
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(`${title}\n${link}`);
            alert('Story link copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing:', error);
        // Final fallback - show link in alert
        prompt('Copy this link:', link);
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function searchLinks() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    currentFilter = query;
    
    // Apply filters
    let filteredData = storyMetadata;
    
    // Filter by year
    if (activeFilters.year !== 'all') {
        filteredData = filteredData.filter(m => m.year === activeFilters.year);
    }
    
    // Filter by author
    if (activeFilters.author !== 'all') {
        filteredData = filteredData.filter(m => m.author === activeFilters.author);
    }
    
    // Apply text search
    if (query !== '') {
        // Fuzzy search: check if all query words appear in searchText
        const queryWords = query.split(/\s+/);
        filteredData = filteredData.filter(metadata => {
            return queryWords.every(word => metadata.searchText.includes(word));
        });
    }
    
    // Extract URLs from filtered metadata
    const filteredLinks = filteredData.map(m => m.url);
    
    displayLinks(filteredLinks, 1);
    updateResultsInfo(filteredData.length, storyMetadata.length);
}

// Update filter controls
function updateFilterControls() {
    const years = getUniqueYears();
    const authors = getUniqueAuthors();
    
    const yearSelect = document.getElementById('year-filter');
    const authorSelect = document.getElementById('author-filter');
    
    if (yearSelect) {
        yearSelect.innerHTML = '<option value="all">All Years</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        yearSelect.value = activeFilters.year;
    }
    
    if (authorSelect) {
        authorSelect.innerHTML = '<option value="all">All Authors</option>';
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            authorSelect.appendChild(option);
        });
        authorSelect.value = activeFilters.author;
    }
}

// Update results info
function updateResultsInfo(filtered, total) {
    const info = document.getElementById('search-results-info');
    if (info) {
        if (filtered === total) {
            info.textContent = `Showing all ${total} stories`;
        } else {
            info.textContent = `Found ${filtered} of ${total} stories`;
        }
    }
}

function playRandomStory(preventRepeat = false) {
    if (links.length === 0) return;
    
    let availableLinks = links;
    
    // In shuffle mode with repeat prevention
    if (preventRepeat && shuffleHistory.length > 0) {
        // Filter out recently played stories
        availableLinks = links.filter(link => !shuffleHistory.includes(link));
        
        // Reset if all stories have been played
        if (availableLinks.length === 0) {
            shuffleHistory = [];
            availableLinks = links;
        }
    }
    
    const randomIndex = Math.floor(Math.random() * availableLinks.length);
    const randomLink = availableLinks[randomIndex];
    const displayText = decodeURIComponent(randomLink.substring(randomLink.indexOf("audio/") + 14).replace(".mp3", "").replace(/_/g, " "));
    
    // Add to shuffle history
    if (preventRepeat) {
        shuffleHistory.push(randomLink);
        // Keep shuffle history reasonable size
        if (shuffleHistory.length > Math.min(50, Math.floor(links.length / 2))) {
            shuffleHistory.shift();
        }
    }
    
    openAudioPlayer(randomLink, displayText);
}

// Toggle shuffle mode
function toggleShuffleMode() {
    isShuffleMode = !isShuffleMode;
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.classList.toggle('active', isShuffleMode);
        shuffleBtn.setAttribute('aria-pressed', isShuffleMode);
        shuffleBtn.innerHTML = isShuffleMode ? '🔀 Shuffle ON' : '🔀 Shuffle OFF';
    }
    
    if (!isShuffleMode) {
        shuffleHistory = [];
    }
}

// Add story to playlist
function addToPlaylist(link, title) {
    // Show playlist selector
    const playlistNames = Object.keys(playlists);
    
    let playlistHTML = `
        <div class="playlist-modal" role="dialog" aria-labelledby="playlist-dialog-title">
            <div class="playlist-modal-content">
                <h3 id="playlist-dialog-title">Add to Playlist</h3>
                <div class="playlist-list">
    `;
    
    if (playlistNames.length === 0) {
        playlistHTML += '<p>No playlists yet. Create one first!</p>';
    } else {
        playlistNames.forEach(name => {
            playlistHTML += `
                <button class="playlist-item" data-playlist="${name}">
                    ${name} (${playlists[name].length} stories)
                </button>
            `;
        });
    }
    
    playlistHTML += `
                </div>
                <div class="playlist-actions">
                    <input type="text" id="new-playlist-name" placeholder="New playlist name..." />
                    <button id="create-playlist-btn">Create New</button>
                    <button id="close-playlist-modal">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = document.createElement('div');
    modal.innerHTML = playlistHTML;
    document.body.appendChild(modal);
    
    // Add event listeners
    document.querySelectorAll('.playlist-item').forEach(btn => {
        btn.onclick = () => {
            const playlistName = btn.dataset.playlist;
            if (!playlists[playlistName].includes(link)) {
                playlists[playlistName].push(link);
                savePlaylists();
                alert(`Added to "${playlistName}"!`);
            } else {
                alert(`Already in "${playlistName}"`);
            }
            modal.remove();
        };
    });
    
    const createBtn = document.getElementById('create-playlist-btn');
    if (createBtn) {
        createBtn.onclick = () => {
            const input = document.getElementById('new-playlist-name');
            const name = input.value.trim();
            if (name) {
                if (!playlists[name]) {
                    playlists[name] = [link];
                    savePlaylists();
                    alert(`Created playlist "${name}" and added story!`);
                    modal.remove();
                    displayPlaylists();
                } else {
                    alert('Playlist already exists!');
                }
            }
        };
    }
    
    const closeBtn = document.getElementById('close-playlist-modal');
    if (closeBtn) {
        closeBtn.onclick = () => modal.remove();
    }
}

// Display playlists section
function displayPlaylists() {
    const playlistContainer = document.getElementById('playlist-container');
    if (!playlistContainer) return;
    
    playlistContainer.innerHTML = '<h2>Playlists</h2>';
    
    const playlistNames = Object.keys(playlists);
    
    if (playlistNames.length === 0) {
        playlistContainer.innerHTML += '<p class="empty-message">No playlists yet. Add stories from the player!</p>';
        return;
    }
    
    const list = document.createElement('div');
    list.className = 'playlists-list';
    
    playlistNames.forEach(name => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'playlist-item-container';
        
        const header = document.createElement('div');
        header.className = 'playlist-header';
        header.innerHTML = `
            <h3>${name}</h3>
            <span>${playlists[name].length} stories</span>
            <button onclick="deletePlaylist('${name}')" class="delete-playlist-btn">🗑️ Delete</button>
        `;
        
        const storyList = document.createElement('ul');
        storyList.className = 'playlist-stories';
        
        playlists[name].forEach((link, index) => {
            const displayText = decodeURIComponent(
                link.substring(link.indexOf("audio/") + 14)
                    .replace(".mp3", "")
                    .replace(/_/g, " ")
            );
            
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="playlist-story-number">${index + 1}.</span>
                <button class="story-title" onclick="openAudioPlayer('${link}', '${displayText}')">
                    ${displayText}
                </button>
                <button class="remove-from-playlist-btn" onclick="removeFromPlaylist('${name}', '${link}')" aria-label="Remove from playlist">❌</button>
            `;
            storyList.appendChild(li);
        });
        
        playlistDiv.appendChild(header);
        playlistDiv.appendChild(storyList);
        list.appendChild(playlistDiv);
    });
    
    playlistContainer.appendChild(list);
}

// Delete entire playlist
function deletePlaylist(name) {
    if (confirm(`Delete playlist "${name}"?`)) {
        delete playlists[name];
        savePlaylists();
        displayPlaylists();
    }
}

// Remove story from playlist
function removeFromPlaylist(playlistName, link) {
    const playlist = playlists[playlistName];
    const index = playlist.indexOf(link);
    if (index > -1) {
        playlist.splice(index, 1);
        savePlaylists();
        displayPlaylists();
    }
}

// Display playback history
function displayHistory() {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '<h2>Recently Played</h2>';
    
    if (playbackHistory.length === 0) {
        historyContainer.innerHTML += '<p class="empty-message">No playback history yet.</p>';
        return;
    }
    
    const list = document.createElement('ul');
    list.className = 'history-list';
    
    playbackHistory.slice(0, 20).forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const date = new Date(item.timestamp);
        const timeAgo = getTimeAgo(item.timestamp);
        
        li.innerHTML = `
            <button class="story-title" onclick="openAudioPlayer('${item.link}', '${item.title}')">
                ${item.title}
            </button>
            <div class="history-meta">
                <span class="play-count">🎵 ${item.playCount} play${item.playCount > 1 ? 's' : ''}</span>
                <span class="timestamp">${timeAgo}</span>
            </div>
        `;
        
        list.appendChild(li);
    });
    
    historyContainer.appendChild(list);
}

// Get human-readable time ago
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return new Date(timestamp).toLocaleDateString();
}

// Initialize app
async function initApp() {
    // Show loading state
    showLoading();
    
    // Initialize theme first
    initTheme();
    
    // Load all saved data (works offline)
    loadFavorites();
    loadPlaylists();
    loadPlaybackHistory();
    loadPlaybackPositions();
    
    // Try to load stories
    const success = await loadStories();
    
    if (success && links.length > 0) {
        displayLinks();
        displayFavorites();
        displayPlaylists();
        displayHistory();
        updateFilterControls();
    } else if (links.length === 0) {
        showError('No stories found in the database.');
    }
    
    // Set up event listeners after DOM elements are available
    setupEventListeners();
}

// Show loading state
function showLoading() {
    const linkContainer = document.getElementById('link-container');
    if (linkContainer) {
        linkContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>Loading stories...</h3>
                <p>Please wait</p>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.onclick = toggleTheme;
    }
    
    // Random story button
    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
        randomBtn.onclick = playRandomStory;
    }
    
    // Shuffle mode button
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.onclick = toggleShuffleMode;
    }
    
    // Export data button
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.onclick = exportData;
    }
    
    // Import data button
    const importBtn = document.getElementById('import-data-btn');
    const importFile = document.getElementById('import-file-input');
    if (importBtn && importFile) {
        importBtn.onclick = () => importFile.click();
        importFile.onchange = (e) => {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
            }
        };
    }
    
    // Search input with debouncing
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const debouncedSearch = debounce(searchLinks, 300);
        searchInput.addEventListener('input', debouncedSearch);
        
        // Clear search on Escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchLinks();
            }
        });
    }
    
    // Filter selects
    const yearFilter = document.getElementById('year-filter');
    const authorFilter = document.getElementById('author-filter');
    
    if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
            activeFilters.year = e.target.value;
            searchLinks();
        });
    }
    
    if (authorFilter) {
        authorFilter.addEventListener('change', (e) => {
            activeFilters.author = e.target.value;
            searchLinks();
        });
    }
    
    // Collapsible sections with ARIA updates
    document.querySelectorAll('.collapsible-toggle').forEach((btn) => {
        btn.addEventListener('click', function () {
            const content = btn.nextElementSibling;
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            
            btn.classList.toggle('active');
            content.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', !isExpanded);
        });
        
        // Keyboard support for collapsibles
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
        
        // Ctrl/Cmd + R for random story
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            playRandomStory();
        }
        
        // Ctrl/Cmd + S for shuffle toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            toggleShuffleMode();
        }
        
        // Ctrl/Cmd + T for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    // Online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
}

// Handle online event
function handleOnline() {
    console.log('Connection restored');
    // Reload stories when coming back online
    if (links.length === 0) {
        initApp();
    }
}

// Handle offline event
function handleOffline() {
    console.log('Connection lost');
    showWarning('You are offline. Some features may not work properly.');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

