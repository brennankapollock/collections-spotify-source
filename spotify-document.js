let album = app.api.spotify.getAlbum(app.params.id);

let cover_art = app.image.fromURL(album.data.images[0].url);
let raw_date = new Date(album.data.release_date);

if (album == undefined) {
  app.fail();
}

let builder = app.document.builder();

builder.setString(album.data.name, 'title');
builder.setString(album.data.artists[0].name, 'artist');
builder.setImage(cover_art, 'cover');
builder.setInteger(album.data.total_tracks, 'tracks');
builder.setDate(raw_date, 'release_date');

app.result(builder);
