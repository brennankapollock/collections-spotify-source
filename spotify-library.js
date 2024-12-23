// Spotify library (1.0)

app.api.spotify = {
  clientId: 'b8244e4327204bc2b36a83ac8d1a5185',
  clientSecret: '5cecdb866a84465d94ce62e3cc2a1254',
  accessToken: undefined,
  tokenExpiry: undefined,

  // Base64 encode function since btoa is not available
  base64Encode(str) {
    const base64chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < str.length) {
      const char1 = str.charCodeAt(i++);
      const char2 = i < str.length ? str.charCodeAt(i++) : NaN;
      const char3 = i < str.length ? str.charCodeAt(i++) : NaN;

      const enc1 = char1 >> 2;
      const enc2 = ((char1 & 3) << 4) | (char2 >> 4);
      const enc3 = ((char2 & 15) << 2) | (char3 >> 6);
      const enc4 = char3 & 63;

      result +=
        base64chars.charAt(enc1) +
        base64chars.charAt(enc2) +
        (isNaN(char2) ? '=' : base64chars.charAt(enc3)) +
        (isNaN(char3) ? '=' : base64chars.charAt(enc4));
    }

    return result;
  },

  // Build query string from params object
  buildQueryString(params) {
    return Object.keys(params)
      .filter((key) => params[key] !== undefined)
      .map((key) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(params[key]);
        return `${encodedKey}=${encodedValue}`;
      })
      .join('&');
  },

  getAccessToken() {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = this.base64Encode(`${this.clientId}:${this.clientSecret}`);
    const response = app.request('https://accounts.spotify.com/api/token');
    response.method = 'POST';
    response.addHeaderValue(`Basic ${auth}`, 'Authorization');
    response.addHeaderValue(
      'application/x-www-form-urlencoded',
      'Content-Type'
    );
    response.body = 'grant_type=client_credentials';

    const result = response.send();
    if (!result.success) {
      return undefined;
    }

    const data = result.json();
    if (!data) {
      return undefined;
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    return this.accessToken;
  },

  makeRequest(endpoint, params = {}) {
    const token = this.getAccessToken();
    if (!token) {
      return undefined;
    }

    const queryString = this.buildQueryString(params);
    const url = `https://api.spotify.com/v1${endpoint}${
      queryString ? '?' + queryString : ''
    }`;

    const request = app.request(url);
    request.addHeaderValue(`Bearer ${token}`, 'Authorization');
    const response = request.send();

    if (!response.success) {
      return undefined;
    }

    const data = response.json();
    if (!data) {
      return undefined;
    }
    return data;
  },

  searchRequest(query) {
    return this.makeRequest('/search', {
      q: query.value,
      type: 'album',
      limit: 20,
    });
  },

  albumRequest(albumId) {
    return this.makeRequest(`/albums/${albumId}`);
  },

  search(query) {
    let searchResults = [];

    let response = this.searchRequest(query);
    if (response && response.albums && response.albums.items) {
      for (let item of response.albums.items) {
        let album = new app.classes.api.spotify.albumResult(item);

        let searchResult = app.searchResult.new();
        searchResult.title = album.title;
        searchResult.subtitle = album.artists;
        searchResult.imageURL = album.imageURL;

        let params = {
          id: album.id,
        };
        if (app.query.isBarcode()) {
          params.barcode = app.query.value;
        }
        searchResult.params = params;

        searchResults.push(searchResult);
      }
    }
    return searchResults;
  },

  getAlbum(albumId) {
    let response = this.albumRequest(albumId);
    if (response) {
      return new app.classes.api.spotify.album(response);
    }
    return undefined;
  },
};

app.classes.api.spotify = {};

app.classes.api.spotify.albumResult = class {
  constructor(data) {
    this.data = data;
    this.id = data.id;
    this.title = data.name;
  }

  get artists() {
    return this.data.artists.map((artist) => artist.name).join(', ');
  }

  get imageURL() {
    return this.data.images && this.data.images.length > 0
      ? this.data.images[0].url
      : undefined;
  }
};

app.classes.api.spotify.album = class {
  constructor(data) {
    this.data = data;
  }

  get id() {
    return this.data.id;
  }

  get title() {
    return this.data.name;
  }

  get artists() {
    let artists = [];
    if (this.data.artists) {
      for (let data of this.data.artists) {
        let artist = app.document.builder();
        artist.setIdentifier('spotify-id');
        artist.setString(data.name, 'name');
        artist.setString(data.id.toString(), 'spotify-id');
        artists.push(artist);
      }
    }
    return artists;
  }

  get tracks() {
    let tracks = [];
    let items = this.data.tracks?.items;
    if (items) {
      for (let data of items) {
        let track = app.document.builder();
        track.setString(data.name, 'title');
        track.setString(data.track_number.toString(), 'position');
        if (data.duration_ms) {
          track.setDecimal(data.duration_ms / 1000, 'duration');
        }
        tracks.push(track);
      }
    }
    return tracks;
  }

  requestImage() {
    let images = this.data.images;
    if (images && images.length > 0) {
      return app.image.fromURL(images[0].url);
    }
    return undefined;
  }

  get genres() {
    let suggestions = [];
    if (this.data.genres) {
      for (let genre of this.data.genres) {
        suggestions.push(app.listItem.suggest(genre, genre));
      }
    }
    return suggestions;
  }

  get year() {
    const releaseDate = this.data.release_date;
    return releaseDate ? parseInt(releaseDate.split('-')[0]) : undefined;
  }
};

// Helper function to format track duration
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}
