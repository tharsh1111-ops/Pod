// Favorites management
let favorites = JSON.parse(localStorage.getItem('favoritePodcasts')) || [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const trendingBtn = document.getElementById('trendingBtn');
const recentBtn = document.getElementById('recentBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCount = document.getElementById('resultsCount');
const resultsGrid = document.getElementById('resultsGrid');
const episodesModal = document.getElementById('episodesModal');
const closeModal = document.querySelector('.close-modal');

// Event Listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});
trendingBtn.addEventListener('click', loadTrending);
recentBtn.addEventListener('click', loadRecent);
favoritesBtn.addEventListener('click', showFavorites);
closeModal.addEventListener('click', () => episodesModal.style.display = 'none');

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === episodesModal) {
        episodesModal.style.display = 'none';
    }
});

// Search functionality
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter a search term');
        return;
    }

    showLoading();
    hideError();

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        if (data.feeds && data.feeds.length > 0) {
            displayResults(data.feeds, `Search Results for "${query}"`, data.count);
        } else {
            showError('No podcasts found. Try a different search term.');
        }
    } catch (error) {
        showError('Failed to search podcasts. Please try again.');
        console.error('Search error:', error);
    } finally {
        hideLoading();
    }
}

// Load trending podcasts
async function loadTrending() {
    showLoading();
    hideError();

    try {
        const response = await fetch('/api/trending');
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        if (data.feeds && data.feeds.length > 0) {
            displayResults(data.feeds, '🔥 Trending Podcasts', data.count);
        } else {
            showError('No trending podcasts available.');
        }
    } catch (error) {
        showError('Failed to load trending podcasts.');
        console.error('Trending error:', error);
    } finally {
        hideLoading();
    }
}

// Load recent episodes
async function loadRecent() {
    showLoading();
    hideError();

    try {
        const response = await fetch('/api/recent');
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        if (data.items && data.items.length > 0) {
            displayEpisodes(data.items, '🆕 Recent Episodes');
        } else {
            showError('No recent episodes available.');
        }
    } catch (error) {
        showError('Failed to load recent episodes.');
        console.error('Recent error:', error);
    } finally {
        hideLoading();
    }
}

// Display podcast results
function displayResults(podcasts, title, count) {
    resultsTitle.textContent = title;
    resultsCount.textContent = count ? `${count} podcasts found` : '';
    resultsGrid.innerHTML = '';

    podcasts.forEach(podcast => {
        const card = createPodcastCard(podcast);
        resultsGrid.appendChild(card);
    });

    resultsSection.style.display = 'block';
}

// Create podcast card
function createPodcastCard(podcast) {
    const isFavorite = favorites.some(fav => fav.id === podcast.id);
    
    const card = document.createElement('div');
    card.className = 'podcast-card';
    card.innerHTML = `
        <img src="${podcast.image || podcast.artwork || 'https://via.placeholder.com/150'}" 
             alt="${podcast.title}" 
             onerror="this.src='https://via.placeholder.com/150?text=Podcast'">
        <div class="podcast-info">
            <h3 class="podcast-title">${podcast.title || 'Untitled Podcast'}</h3>
            <p class="podcast-author">${podcast.author || 'Unknown Author'}</p>
            <p class="podcast-description">${truncateText(podcast.description || 'No description available', 150)}</p>
            <div class="podcast-meta">
                <span>📅 ${podcast.episodeCount || 0} episodes</span>
            </div>
            <div class="podcast-actions">
                <button class="btn-primary" onclick="viewEpisodes(${podcast.id})">View Episodes</button>
                <button class="btn-favorite ${isFavorite ? 'favorited' : ''}" 
                        onclick="toggleFavorite(${podcast.id}, '${escapeHtml(podcast.title)}', '${podcast.image || ''}', '${escapeHtml(podcast.author || '')}')">
                    ${isFavorite ? '⭐ Favorited' : '☆ Favorite'}
                </button>
            </div>
        </div>
    `;
    return card;
}

// Display episodes in modal
function displayEpisodes(episodes, title) {
    resultsTitle.textContent = title;
    resultsCount.textContent = `${episodes.length} episodes`;
    resultsGrid.innerHTML = '';

    episodes.forEach(episode => {
        const card = createEpisodeCard(episode);
        resultsGrid.appendChild(card);
    });

    resultsSection.style.display = 'block';
}

// Create episode card
function createEpisodeCard(episode) {
    const card = document.createElement('div');
    card.className = 'podcast-card episode-card';
    
    const duration = episode.duration ? formatDuration(episode.duration) : '';
    const pubDate = episode.datePublished ? new Date(episode.datePublished * 1000).toLocaleDateString() : '';
    
    card.innerHTML = `
        <img src="${episode.feedImage || episode.image || 'https://via.placeholder.com/150'}" 
             alt="${episode.title}" 
             onerror="this.src='https://via.placeholder.com/150?text=Episode'">
        <div class="podcast-info">
            <h3 class="podcast-title">${episode.title || 'Untitled Episode'}</h3>
            <p class="podcast-author">${episode.feedTitle || 'Unknown Podcast'}</p>
            <p class="podcast-description">${truncateText(episode.description || 'No description available', 150)}</p>
            <div class="podcast-meta">
                ${pubDate ? `<span>📅 ${pubDate}</span>` : ''}
                ${duration ? `<span>⏱️ ${duration}</span>` : ''}
            </div>
            ${episode.enclosureUrl ? `
                <div class="podcast-actions">
                    <a href="${episode.enclosureUrl}" target="_blank" class="btn-primary">Listen</a>
                </div>
            ` : ''}
        </div>
    `;
    return card;
}

// View episodes for a podcast
async function viewEpisodes(podcastId) {
    const modalContent = document.getElementById('episodesList');
    const modalHeader = document.getElementById('modalHeader');
    
    modalHeader.innerHTML = '<div class="spinner"></div><p>Loading episodes...</p>';
    modalContent.innerHTML = '';
    episodesModal.style.display = 'block';

    try {
        const response = await fetch(`/api/podcast/${podcastId}/episodes`);
        const data = await response.json();

        if (data.error) {
            modalHeader.innerHTML = `<p class="error">Error: ${data.error}</p>`;
            return;
        }

        if (data.items && data.items.length > 0) {
            modalHeader.innerHTML = `
                <h2>${data.items[0].feedTitle || 'Episodes'}</h2>
                <p>${data.items.length} episodes</p>
            `;

            data.items.forEach(episode => {
                const episodeCard = createEpisodeListItem(episode);
                modalContent.appendChild(episodeCard);
            });
        } else {
            modalHeader.innerHTML = '<p>No episodes found</p>';
        }
    } catch (error) {
        modalHeader.innerHTML = '<p class="error">Failed to load episodes</p>';
        console.error('Episodes error:', error);
    }
}

// Create episode list item for modal
function createEpisodeListItem(episode) {
    const item = document.createElement('div');
    item.className = 'episode-item';
    
    const duration = episode.duration ? formatDuration(episode.duration) : '';
    const pubDate = episode.datePublished ? new Date(episode.datePublished * 1000).toLocaleDateString() : '';
    
    item.innerHTML = `
        <div class="episode-header">
            <h4>${episode.title || 'Untitled Episode'}</h4>
            <div class="episode-meta">
                ${pubDate ? `<span>📅 ${pubDate}</span>` : ''}
                ${duration ? `<span>⏱️ ${duration}</span>` : ''}
            </div>
        </div>
        <p class="episode-description">${truncateText(episode.description || '', 200)}</p>
        ${episode.enclosureUrl ? `
            <a href="${episode.enclosureUrl}" target="_blank" class="btn-listen">▶️ Listen</a>
        ` : ''}
    `;
    return item;
}

// Toggle favorite
function toggleFavorite(id, title, image, author) {
    const existingIndex = favorites.findIndex(fav => fav.id === id);
    
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({ id, title, image, author });
    }
    
    localStorage.setItem('favoritePodcasts', JSON.stringify(favorites));
    
    // Refresh current view if showing favorites
    if (resultsTitle.textContent === '⭐ Your Favorite Podcasts') {
        showFavorites();
    } else {
        // Update button state
        const btn = event.target;
        const isFavorite = existingIndex === -1;
        btn.textContent = isFavorite ? '⭐ Favorited' : '☆ Favorite';
        btn.classList.toggle('favorited', isFavorite);
    }
}

// Show favorites
function showFavorites() {
    if (favorites.length === 0) {
        showError('No favorite podcasts yet. Add some by clicking the Favorite button!');
        resultsSection.style.display = 'none';
        return;
    }

    hideError();
    displayResults(favorites, '⭐ Your Favorite Podcasts', favorites.length);
}

// Utility functions
function showLoading() {
    loadingSpinner.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function truncateText(text, maxLength) {
    const cleaned = text.replace(/<[^>]*>/g, '');
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Load trending on page load
window.addEventListener('DOMContentLoaded', () => {
    loadTrending();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
});
