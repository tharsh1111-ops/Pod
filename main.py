from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

# iTunes Podcast API - No API key required!
ITUNES_API_BASE = 'https://itunes.apple.com'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search')
def search_podcasts():
    """Search for podcasts by term"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'error': 'No search query provided'}), 400
    
    try:
        url = f'{ITUNES_API_BASE}/search'
        params = {
            'term': query,
            'media': 'podcast',
            'entity': 'podcast',
            'limit': 50
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Transform iTunes response to match our frontend format
        transformed = {
            'feeds': [transform_itunes_podcast(item) for item in data.get('results', [])],
            'count': data.get('resultCount', 0)
        }
        
        return jsonify(transformed)
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

def transform_itunes_podcast(podcast):
    """Transform iTunes podcast format to our app format"""
    return {
        'id': podcast.get('collectionId'),
        'title': podcast.get('collectionName', 'Untitled'),
        'author': podcast.get('artistName', 'Unknown'),
        'description': podcast.get('collectionName', ''),
        'image': podcast.get('artworkUrl600', podcast.get('artworkUrl100', '')),
        'artwork': podcast.get('artworkUrl600', podcast.get('artworkUrl100', '')),
        'episodeCount': podcast.get('trackCount', 0),
        'feedUrl': podcast.get('feedUrl', '')
    }

@app.route('/api/podcast/<int:podcast_id>/episodes')
def get_episodes(podcast_id):
    """Get episodes for a specific podcast"""
    try:
        url = f'{ITUNES_API_BASE}/lookup'
        params = {
            'id': podcast_id,
            'entity': 'podcastEpisode',
            'limit': 20
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        results = data.get('results', [])
        
        # First result is the podcast itself, rest are episodes
        episodes = [transform_itunes_episode(item) for item in results[1:] if item.get('kind') == 'podcast-episode']
        
        transformed = {
            'items': episodes,
            'count': len(episodes)
        }
        
        return jsonify(transformed)
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

def transform_itunes_episode(episode):
    """Transform iTunes episode format to our app format"""
    return {
        'id': episode.get('trackId'),
        'title': episode.get('trackName', 'Untitled Episode'),
        'description': episode.get('description', ''),
        'datePublished': int(episode.get('releaseDate', '').replace('T', ' ').replace('Z', '').split()[0].replace('-', '')) if episode.get('releaseDate') else 0,
        'duration': int(episode.get('trackTimeMillis', 0) / 1000),
        'enclosureUrl': episode.get('episodeUrl', ''),
        'feedTitle': episode.get('collectionName', ''),
        'feedImage': episode.get('artworkUrl600', episode.get('artworkUrl60', '')),
        'image': episode.get('artworkUrl600', episode.get('artworkUrl60', ''))
    }

@app.route('/api/trending')
def get_trending():
    """Get popular podcasts"""
    try:
        # iTunes doesn't have a trending endpoint, so we'll search for popular topics
        url = f'{ITUNES_API_BASE}/search'
        params = {
            'term': 'top podcasts',
            'media': 'podcast',
            'entity': 'podcast',
            'limit': 20
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        transformed = {
            'feeds': [transform_itunes_podcast(item) for item in data.get('results', [])],
            'count': data.get('resultCount', 0)
        }
        
        return jsonify(transformed)
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recent')
def get_recent():
    """Get recent popular episodes"""
    try:
        # Search for recent popular content
        url = f'{ITUNES_API_BASE}/search'
        params = {
            'term': 'podcast',
            'media': 'podcast',
            'entity': 'podcastEpisode',
            'limit': 20
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Transform episodes
        episodes = [transform_itunes_episode(item) for item in data.get('results', []) if item.get('kind') == 'podcast-episode']
        
        transformed = {
            'items': episodes,
            'count': len(episodes)
        }
        
        return jsonify(transformed)
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
