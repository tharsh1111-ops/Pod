PODCAST SEARCH APPLICATION
==========================

A web application for searching and exploring podcasts using the iTunes/Apple Podcasts API.

FEATURES
--------
- Search podcasts by keyword
- Browse popular podcasts
- View recent episodes across all podcasts
- View episodes for specific podcasts
- Save favorite podcasts (stored in browser localStorage)
- Responsive design for mobile and desktop

SETUP INSTRUCTIONS
------------------

1. NO API KEY NEEDED! 
   This app uses the free iTunes/Apple Podcasts API which requires no registration.

2. Install Dependencies:
   pip install -r requirements.txt

3. Run the Application:
   python main.py

4. Open Browser:
   Navigate to http://localhost:5001

USAGE
-----
- Search: Enter keywords to find podcasts
- Trending: Click "Trending" to see popular podcasts
- Recent: View the latest episodes from all podcasts
- Favorites: Click the star icon to save favorites
- Episodes: Click "View Episodes" on any podcast to see its episode list
- Listen: Click "Listen" on episodes to play them in a new tab

TECHNOLOGIES
------------
- Backend: Python Flask
- Frontend: Vanilla JavaScript, HTML5, CSS3
- API: iTunes/Apple Podcasts API (completely free, no registration)
- Storage: LocalStorage for favorites

PROJECT STRUCTURE
-----------------
podcastapp/
├── main.py                 # Flask backend server
├── requirements.txt        # Python dependencies
├── README.txt             # This file
├── static/
│   ├── app.js            # Frontend JavaScript
│   └── style.css         # Styling
└── templates/
    └── index.html        # Main HTML template

API ENDPOINTS
-------------
GET /                      - Main page
GET /api/search?q=term    - Search podcasts
GET /api/podcast/<id>/episodes - Get episodes for podcast
GET /api/trending         - Get trending podcasts
GET /api/recent          - Get recent episodes

NOTES
-----
- The app runs on port 5001 by default
- Favorites are stored locally in your browser
- No API key or registration required!
- Uses Apple's public iTunes API

TROUBLESHOOTING
---------------
- Make sure port 5001 is not in use
- Check that all dependencies are installed
- Verify your internet connection for API access

For more information about the iTunes Search API:
https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
