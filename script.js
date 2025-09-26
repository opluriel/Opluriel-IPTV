const m3uUrl = "https://iptv-org.github.io/iptv/index.language.m3u";

let channels = [];
let filteredChannels = [];
let showingFavorites = false;

document.addEventListener("DOMContentLoaded", () => {
  fetchPlaylist();
  setupEventListeners();
});

function fetchPlaylist() {
  fetch(m3uUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("Error loading M3U file");
      }
      return response.text();
    })
    .then(text => {
      channels = parseM3U(text);
      channels.forEach(ch => {
        ch.isFavorite = getFavoriteState(ch);
      });
      filteredChannels = channels.slice();
      populateFilters(channels);
      renderChannels(filteredChannels);
      footerSetText(`${channels.length} channels loaded.`);
    })
    .catch(err => {
      console.error("Fetch error:", err);
      footerSetText("Could not load the playlist.");
    });
}

function parseM3U(m3uText) {
  const lines = m3uText.split(/\r?\n/);
  const result = [];
  let current = null;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#EXTM3U")) {
      continue;
    }
    if (line.startsWith("#EXTINF:")) {
      const meta = line.substring(8);
      const obj = {};
      // Extract logo
      const logoMatch = meta.match(/tvg-logo="([^"]*)"/);
      obj.logo = logoMatch ? logoMatch[1] : "";
      // Extract group-title
      const groupMatch = meta.match(/group-title="([^"]*)"/);
      obj.group = groupMatch ? groupMatch[1] : "";
      // Extract name after the comma
      const commaIndex = meta.indexOf(",");
      obj.name = (commaIndex >= 0) ? meta.substring(commaIndex + 1).trim() : meta.trim();
      // Extract country if present, otherwise empty
      const countryMatch = meta.match(/country="([^"]*)"/);
      obj.country = countryMatch ? countryMatch[1] : "";
      // Extract language
      const languageMatch = meta.match(/tvg-language="([^"]*)"/);
      obj.language = languageMatch ? languageMatch[1] : "";
      
      obj.url = "";  // will be assigned on the next line
      current = obj;
    } else if (!line.startsWith("#")) {
      if (current) {
        current.url = line;
        result.push(current);
      }
      current = null;
    }
  }

  return result;
}


// --- Rendering ---

function renderChannels(list) {
  const container = document.getElementById("channelList");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>No channels match the criteria.</p>";
    return;
  }

  list.forEach(ch => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.dataset.url = ch.url; // Link card to its URL

    if (ch.logo) {
      const img = document.createElement("img");
      img.src = ch.logo;
      img.alt = ch.name;
      img.className = "logo";
      img.onerror = () => img.style.display = "none";
      card.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "info";

    const h2 = document.createElement("h2");
    h2.textContent = ch.name;
    info.appendChild(h2);

    if (ch.group) {
      const pGroup = document.createElement("p");
      pGroup.textContent = "Group: " + ch.group;
      info.appendChild(pGroup);
    }

    if (ch.country) {
      const pCountry = document.createElement("p");
      pCountry.textContent = "Country: " + ch.country;
      info.appendChild(pCountry);
    }

    if (ch.language) {
      const pLanguage = document.createElement("p");
      pLanguage.textContent = "Language: " + ch.language;
      info.appendChild(pLanguage);
    }

    card.appendChild(info);

    const btnContainer = document.createElement("div");
    btnContainer.className = "card-buttons";

    const playBtn = document.createElement("button");
    playBtn.className = "play-btn";
    playBtn.textContent = "Watch";
    playBtn.addEventListener("click", () => {
      openPlayer(ch.url);

    });
    btnContainer.appendChild(playBtn);

    const favoriteBtn = document.createElement("button");
    favoriteBtn.className = "favorite-btn";
    favoriteBtn.textContent = ch.isFavorite ? "★ Favorite" : "☆ Favorite";
    favoriteBtn.addEventListener("click", () => {
      toggleFavorite(ch);
      favoriteBtn.textContent = ch.isFavorite ? "★ Favorite" : "☆ Favorite";
    });
    btnContainer.appendChild(favoriteBtn);

    card.appendChild(btnContainer);

    container.appendChild(card);
  });
}

// --- Filtering, Searching, Sorting ---

function setupEventListeners() {
  document.getElementById("searchBox").addEventListener("input", applyAllFilters);
  document.getElementById("countryFilter").addEventListener("input", applyAllFilters);
  document.getElementById("groupLangFilter").addEventListener("input", applyAllFilters);
  document.getElementById("sortSelect").addEventListener("change", () => {
    applyAllFilters();
  });
  document.getElementById("showFavoritesBtn").addEventListener("click", () => {
    showingFavorites = true;
    document.getElementById("showFavoritesBtn").classList.add("hidden");
    document.getElementById("showAllBtn").classList.remove("hidden");
    applyAllFilters();
  });
  document.getElementById("showAllBtn").addEventListener("click", () => {
    showingFavorites = false;
    document.getElementById("showAllBtn").classList.add("hidden");
    document.getElementById("showFavoritesBtn").classList.remove("hidden");
    applyAllFilters();
  });

  // Player close, PiP, and controls management
  document.getElementById("closePlayerBtn").addEventListener("click", closePlayer);
  document.getElementById("pipBtn").addEventListener("click", togglePiP);
  setupDraggablePlayer(); // Initialize drag and resize logic
  setupHeaderToggle(); // Initialize header toggle logic
  setupFeedbackForm(); // Initialize feedback form logic

  // PiP events for better UX
  const videoPlayer = document.getElementById("videoPlayer");
  videoPlayer.addEventListener('enterpictureinpicture', () => {
    document.getElementById('playerContainer').classList.add('hidden');
  });

  videoPlayer.addEventListener('leavepictureinpicture', () => {
    if (videoPlayer.src) {
      document.getElementById('playerContainer').classList.remove('hidden');
    }
  });
}

function applyAllFilters() {
  const searchValue = document.getElementById("searchBox").value.toLowerCase();
  const countryVal = document.getElementById("countryFilter").value.toLowerCase();
  const groupLangVal = document.getElementById("groupLangFilter").value.toLowerCase();
  const sortVal = document.getElementById("sortSelect").value;

  filteredChannels = channels.filter(ch => {
    if (showingFavorites && !ch.isFavorite) return false;
    if (searchValue && !ch.name.toLowerCase().includes(searchValue)) return false;
    
    // Use 'includes' for partial matching on all filters
    if (countryVal && !(ch.country || '').toLowerCase().includes(countryVal)) return false;
    if (groupLangVal && 
        !(ch.group || '').toLowerCase().includes(groupLangVal) && 
        !(ch.language || '').toLowerCase().includes(groupLangVal)) {
      return false;
    }

    return true;
  });

  // Sort
  filteredChannels.sort((a, b) => {
    switch (sortVal) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'country_asc':
        return (a.country || "").localeCompare(b.country || "");
      case 'country_desc':
        return (b.country || "").localeCompare(a.country || "");
      case 'group_asc':
        return (a.group || "").localeCompare(b.group || "");
      case 'group_desc':
        return (b.group || "").localeCompare(a.group || "");
      case 'language_asc':
        return (a.language || "").localeCompare(b.language || "");
      case 'language_desc':
        return (b.language || "").localeCompare(a.language || "");
      default:
        return 0;
    }
  });

  renderChannels(filteredChannels);
}

// --- Favorites ---

function getFavoriteState(channel) {
  try {
    const favs = JSON.parse(localStorage.getItem('iptvFavorites')) || {};
    const key = favoriteKey(channel);
    return !!favs[key];
  } catch(e) {
    console.error("Error reading favorites", e);
    return false;
  }
}

function toggleFavorite(channel) {
  const key = favoriteKey(channel);
  const favs = JSON.parse(localStorage.getItem('iptvFavorites')) || {};
  if (channel.isFavorite) {
    delete favs[key];
    channel.isFavorite = false;
  } else {
    favs[key] = {
      name: channel.name,
      url: channel.url,
      group: channel.group,
      country: channel.country,
      logo: channel.logo
    };
    channel.isFavorite = true;
  }
  localStorage.setItem('iptvFavorites', JSON.stringify(favs));
}

function favoriteKey(channel) {
  // Simple unique key
  return channel.url;
}

// --- Integrated Player ---

let hls = null; // Keep a reference to the HLS instance
let currentPlayingUrl = null;

function openPlayer(streamUrl) {
  const playerContainer = document.getElementById("playerContainer");
  const videoPlayer = document.getElementById("videoPlayer");

  // Remove indicator from previous channel
  if (currentPlayingUrl) {
    const previousCard = document.querySelector(`.channel-card[data-url="${currentPlayingUrl}"]`);
    if (previousCard) {
      previousCard.classList.remove('playing');
    }
  }

  // Add indicator to current channel
  const currentCard = document.querySelector(`.channel-card[data-url="${streamUrl}"]`);
  if (currentCard) {
    currentCard.classList.add('playing');
  }
  currentPlayingUrl = streamUrl;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
    hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(videoPlayer);
    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      videoPlayer.play();
    });
  } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    // For Safari and other browsers that support HLS natively
    videoPlayer.src = streamUrl;
    videoPlayer.addEventListener('loadedmetadata', function() {
      videoPlayer.play();
    });
  } else {
    // For other stream types
    videoPlayer.src = streamUrl;
    videoPlayer.play();
  }

  // Show the player ONLY if not already in PiP mode
  if (!document.pictureInPictureElement) {
    playerContainer.classList.remove("hidden");
  }
}

function closePlayer() {
  const playerContainer = document.getElementById("playerContainer");
  const videoPlayer = document.getElementById("videoPlayer");
  
  if (hls) {
    hls.destroy();
    hls = null;
  }

  videoPlayer.pause();
  videoPlayer.src = "";
  playerContainer.classList.add("hidden");

  // Remove playing indicator
  if (currentPlayingUrl) {
    const previousCard = document.querySelector(`.channel-card[data-url="${currentPlayingUrl}"]`);
    if (previousCard) {
      previousCard.classList.remove('playing');
    }
    currentPlayingUrl = null;
  }

  // Reset position and size
  playerContainer.style.top = '50%';
  playerContainer.style.left = '50%';
  playerContainer.style.width = '800px';
  playerContainer.style.height = '480px';
  playerContainer.style.transform = 'translate(-50%, -50%)';
}

// --- Picture-in-Picture ---

function togglePiP() {
  const videoPlayer = document.getElementById("videoPlayer");

  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(err => {
      console.error("Error exiting PiP mode:", err);
    });
  } else {
    if (document.pictureInPictureEnabled && videoPlayer.src) {
      videoPlayer.requestPictureInPicture().catch(err => {
        console.error("Error entering PiP mode:", err);
      });
    }
  }
}

// --- Drag and Resize Player ---

function setupDraggablePlayer() {
  const playerContainer = document.getElementById('playerContainer');
  const resizeHandle = document.querySelector('.resize-handle');
  const videoPlayer = document.getElementById('videoPlayer');

  let isDragging = false;
  let isResizing = false;
  let offsetX, offsetY;

  // --- DRAG LOGIC ---
  playerContainer.addEventListener('mousedown', (e) => {
    // Don't start dragging if clicking on the video, buttons, or handle
    if (e.target === videoPlayer || e.target.tagName === 'BUTTON' || e.target === resizeHandle) {
      return;
    }
    
    isDragging = true;
    playerContainer.style.transform = ''; // Remove transform for direct positioning
    offsetX = e.clientX - playerContainer.offsetLeft;
    offsetY = e.clientY - playerContainer.offsetTop;
    playerContainer.style.cursor = 'grabbing';
  });

  // --- RESIZE LOGIC ---
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault(); // Prevent container dragging
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      playerContainer.style.left = `${e.clientX - offsetX}px`;
      playerContainer.style.top = `${e.clientY - offsetY}px`;
    }
    if (isResizing) {
      const newWidth = e.clientX - playerContainer.offsetLeft;
      const newHeight = e.clientY - playerContainer.offsetTop;
      playerContainer.style.width = `${newWidth}px`;
      playerContainer.style.height = `${newHeight}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    playerContainer.style.cursor = 'move';
  });
}

// --- Header Toggle ---

function setupHeaderToggle() {
  const header = document.querySelector('header');
  const toggleBtn = document.getElementById('headerToggleBtn');
  const body = document.body;

  toggleBtn.addEventListener('click', () => {
    header.classList.toggle('header-hidden');
    const isHidden = header.classList.contains('header-hidden');
    
    if (isHidden) {
      body.style.paddingTop = '0';
      toggleBtn.innerHTML = '▼';
      toggleBtn.style.transform = 'rotate(180deg)';
    } else {
      // Recalculate padding based on header height
      body.style.paddingTop = `${header.offsetHeight}px`;
      toggleBtn.innerHTML = '▲';
      toggleBtn.style.transform = 'rotate(0deg)';
    }
  });

  // Adjust padding on window resize
  window.addEventListener('resize', () => {
    if (!header.classList.contains('header-hidden')) {
      body.style.paddingTop = `${header.offsetHeight}px`;
    }
  });
}

// --- Dynamic Filters ---

function populateFilters(list) {
  const countries = new Set();
  const groups = new Set();
  const languages = new Set();

  list.forEach(ch => {
    if (ch.country && ch.country.trim() !== "") countries.add(ch.country);
    if (ch.group && ch.group.trim() !== "") groups.add(ch.group);
    if (ch.language && ch.language.trim() !== "") languages.add(ch.language);
  });

  const countryList = document.getElementById("countryList");
  const groupLangList = document.getElementById("groupLangList");

  // Clear old ones
  countryList.innerHTML = '';
  groupLangList.innerHTML = '';

  Array.from(countries).sort().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    countryList.appendChild(opt);
  });

  Array.from(groups).sort().forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    groupLangList.appendChild(opt);
  });

  Array.from(languages).sort().forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    groupLangList.appendChild(opt);
  });
}

// --- Utilities ---

function footerSetText(txt) {
  const f = document.getElementById("footerText");
  if (f) f.textContent = txt;
}

function setupFeedbackForm() {
  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const messageInput = feedbackForm.querySelector('textarea');
      const submitButton = feedbackForm.querySelector('button');
      const originalButtonText = submitButton.textContent;
      
      // Here you would typically send the data to a server
      // For this example, we'll just log it to the console
      console.log('Feedback submitted:', messageInput.value);
      
      // Provide user feedback
      messageInput.value = '';
      submitButton.textContent = 'Merci!';
      submitButton.disabled = true;
      
      // Reset the button after a few seconds
      setTimeout(() => {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }, 3000);
    });
  }
}
