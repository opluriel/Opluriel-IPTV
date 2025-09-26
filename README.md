# IPTV Player

This is a simple and feature-rich IPTV web player built with HTML, CSS, and vanilla JavaScript. It allows you to load an M3U playlist, browse channels, and watch streams directly in your browser.

## Features

- **M3U Playlist Parsing**: Loads channels from a remote `.m3u` file.
- **Channel Listing**: Displays channels in a clean, card-based layout.
- **Advanced Filtering**:
  - Search by channel name.
  - Filter by Country.
  - Filter by Group or Language.
- **Sorting**: Sort channels by name, country, group, or language in ascending or descending order.
- **Favorites**: Mark channels as favorites for quick access. Favorites are saved in the browser's `localStorage`.
- **Integrated Video Player**:
  - Powered by **HLS.js** for broad compatibility with HLS streams.
  - The player is draggable and resizable, allowing you to position it anywhere on the screen.
  - Supports **Picture-in-Picture (PiP)** mode.
- **Responsive UI**:
  - A fixed header that can be toggled to maximize screen space.
  - A fixed footer with a feedback form.
  - The layout adapts to different screen sizes, from desktops to mobile devices.
- **Custom Styling**: Includes custom scrollbars and a modern design.

## How to Use

1.  Clone or download the repository.
2.  Open the `index.html` file in a modern web browser.
3.  The player will automatically fetch the default M3U playlist and display the channels.

## Project Structure

- `index.html`: The main HTML file containing the structure of the web application.
- `styles.css`: The stylesheet responsible for the application's appearance, layout, and responsiveness.
- `script.js`: The core JavaScript file that handles all the logic, including:
  - Fetching and parsing the M3U playlist.
  - Rendering channel cards.
  - Handling all user interactions (filtering, sorting, playing, favorites).
  - Managing the video player.
- `README.md`: This file.

## Customization

To use your own M3U playlist, simply change the `m3uUrl` constant at the top of the `script.js` file:

```javascript
const m3uUrl = "https://your-playlist-url.com/playlist.m3u";
```
