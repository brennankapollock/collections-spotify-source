# Spotify Collections Scripts

A collection of JavaScript scripts for interacting with the Spotify Web API to search, retrieve, and manage music data.

## Features

- **Spotify Authentication**: Automatic handling of OAuth 2.0 authentication with client credentials flow
- **Album Search**: Search for albums using natural language queries
- **Album Details**: Retrieve detailed information about specific albums including:
  - Track listings
  - Artist information
  - Cover artwork
  - Release date
  - Genre information

## Scripts

- `spotify-library.js`: Core library containing API interaction logic and data models
- `spotify-search.js`: Script for performing Spotify album searches
- `spotify-document.js`: Script for generating structured album documents with metadata

## Setup

1. Register your application on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Update the `clientId` and `clientSecret` in `spotify-library.js` with your credentials
3. The scripts will automatically handle token management and authentication

## Usage

### Search for Albums
```javascript
let results = app.api.spotify.search("query");
```

### Get Album Details
```javascript
let album = app.api.spotify.getAlbum("album_id");
```

### Create Album Document
```javascript
let builder = app.document.builder();
builder.setString(album.data.name, 'title');
builder.setString(album.data.artists[0].name, 'artist');
// ... additional metadata
```

## API Reference

The scripts provide a clean interface to the following Spotify Web API endpoints:
- Search API
- Albums API

## Dependencies
- Built on top of the app framework
- Requires Spotify Developer credentials
- No external npm packages required

## License
This project is for personal use. All rights reserved.

---
*Note: Make sure to keep your Spotify API credentials secure and never commit them to version control.*
