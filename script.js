// Weather App JavaScript

// API Configuration
const API_CONFIG = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  weather: 'https://api.open-meteo.com/v1/forecast'
};

// Weather code mappings for icons
const WEATHER_CODES = {
  0: { description: 'Clear sky', icon: 'sunny' },
  1: { description: 'Mainly clear', icon: 'sunny' },
  2: { description: 'Partly cloudy', icon: 'partly-cloudy' },
  3: { description: 'Overcast', icon: 'overcast' },
  45: { description: 'Fog', icon: 'fog' },
  48: { description: 'Depositing rime fog', icon: 'fog' },
  51: { description: 'Light drizzle', icon: 'drizzle' },
  53: { description: 'Moderate drizzle', icon: 'drizzle' },
  55: { description: 'Dense drizzle', icon: 'drizzle' },
  56: { description: 'Light freezing drizzle', icon: 'drizzle' },
  57: { description: 'Dense freezing drizzle', icon: 'drizzle' },
  61: { description: 'Slight rain', icon: 'rain' },
  63: { description: 'Moderate rain', icon: 'rain' },
  65: { description: 'Heavy rain', icon: 'rain' },
  66: { description: 'Light freezing rain', icon: 'rain' },
  67: { description: 'Heavy freezing rain', icon: 'rain' },
  71: { description: 'Slight snow fall', icon: 'snow' },
  73: { description: 'Moderate snow fall', icon: 'snow' },
  75: { description: 'Heavy snow fall', icon: 'snow' },
  77: { description: 'Snow grains', icon: 'snow' },
  80: { description: 'Slight rain showers', icon: 'rain' },
  81: { description: 'Moderate rain showers', icon: 'rain' },
  82: { description: 'Violent rain showers', icon: 'rain' },
  85: { description: 'Slight snow showers', icon: 'snow' },
  86: { description: 'Heavy snow showers', icon: 'snow' },
  95: { description: 'Thunderstorm', icon: 'storm' },
  96: { description: 'Thunderstorm with slight hail', icon: 'storm' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'storm' }
};

// Application State
const appState = {
  currentLocation: null,
  weatherData: null,
  units: {
    temperature: 'celsius',
    windSpeed: 'kmh',
    precipitation: 'mm'
  },
  theme: 'dark',
  favorites: JSON.parse(localStorage.getItem('weatherAppFavorites') || '[]'),
  selectedDay: 0 // For hourly forecast day selection
};

// DOM Elements (will be populated when DOM is loaded)
const elements = {};

// Utility Functions
const utils = {
  // Format temperature based on current units
  formatTemperature(temp) {
    if (appState.units.temperature === 'fahrenheit') {
      return `${Math.round(temp * 9/5 + 32)}°F`;
    }
    return `${Math.round(temp)}°C`;
  },

  // Format wind speed based on current units
  formatWindSpeed(speed) {
    if (appState.units.windSpeed === 'mph') {
      return `${Math.round(speed * 0.621371)} mph`;
    }
    return `${Math.round(speed)} km/h`;
  },

  // Format precipitation based on current units
  formatPrecipitation(amount) {
    if (appState.units.precipitation === 'inches') {
      return `${(amount * 0.0393701).toFixed(1)} in`;
    }
    return `${amount.toFixed(1)} mm`;
  },

  // Get weather icon path
  getWeatherIcon(weatherCode) {
    const weather = WEATHER_CODES[weatherCode] || WEATHER_CODES[0];
    return `./assets/images/icon-${weather.icon}.webp`;
  },

  // Get weather description
  getWeatherDescription(weatherCode) {
    const weather = WEATHER_CODES[weatherCode] || WEATHER_CODES[0];
    return weather.description;
  },

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  },

  // Format time
  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    });
  },

  // Debounce function for search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show loading state
  showLoading(element) {
    element.classList.add('loading');
  },

  // Hide loading state
  hideLoading(element) {
    element.classList.remove('loading');
  },

  // Show error message
  showError(message) {
    // TODO: Implement error display
    console.error(message);
  }
};

// API Functions
const api = {
  // Search for locations
  async searchLocations(query) {
    try {
      const response = await fetch(
        `${API_CONFIG.geocoding}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search locations');
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      utils.showError('Failed to search locations');
      return [];
    }
  },

  // Get weather data
  async getWeatherData(latitude, longitude, retryCount = 0) {
    console.log('API: Fetching weather data for:', latitude, longitude, 'Retry:', retryCount);
    try {
      const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation_probability',
          'precipitation',
          'weather_code',
          'surface_pressure',
          'wind_speed_10m',
          'wind_direction_10m'
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'sunrise',
          'sunset',
          'uv_index_max',
          'precipitation_sum',
          'wind_speed_10m_max'
        ].join(','),
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation',
          'weather_code',
          'surface_pressure',
          'wind_speed_10m',
          'wind_direction_10m',
          'visibility'
        ].join(','),
        timezone: 'auto',
        forecast_days: 7
      });

      const url = `${API_CONFIG.weather}?${params}`;
      console.log('API: Making request to:', url);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('API: Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API: Successfully received data');
      return data;
    } catch (error) {
      console.error('API: Error fetching weather data:', error);

      // Retry up to 2 times with exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s delays
        console.log(`API: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getWeatherData(latitude, longitude, retryCount + 1);
      }

      utils.showError('Failed to fetch weather data');
      return null;
    }
  }
};

// Theme Management
const theme = {
  init() {
    console.log('Initializing theme system...');
    this.bindEvents();

    const savedTheme = localStorage.getItem('weatherAppTheme');
    const autoTheme = localStorage.getItem('weatherAppAutoTheme') !== 'false';

    console.log('Saved theme:', savedTheme);
    console.log('Auto theme enabled:', autoTheme);

    if (autoTheme && !savedTheme) {
      this.setAutoTheme();
    } else {
      const themeToUse = savedTheme || 'dark';
      this.setTheme(themeToUse);
    }

    this.updateThemeIcon();
    console.log('Theme system initialized with theme:', appState.theme);
  },

  bindEvents() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggle();
      });

      // Add keyboard support
      themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    // Add keyboard shortcut (Ctrl/Cmd + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  setTheme(themeName) {
    console.log('Setting theme to:', themeName);
    appState.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('weatherAppTheme', themeName);
    localStorage.setItem('weatherAppAutoTheme', 'false');
    this.updateThemeIcon();

    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeName }
    }));
  },

  setAutoTheme() {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 18;
    const autoTheme = isNight ? 'dark' : 'light';

    appState.theme = autoTheme;
    document.documentElement.setAttribute('data-theme', autoTheme);
    localStorage.setItem('weatherAppAutoTheme', 'true');
    this.updateThemeIcon();
  },

  toggle() {
    const themeToggle = document.getElementById('themeToggle');

    // Add visual feedback
    if (themeToggle) {
      themeToggle.style.transform = 'scale(0.95)';
      setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
      }, 150);
    }

    const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);

    // Log theme change for debugging
    console.log(`Theme switched to: ${newTheme}`);
  },

  updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    const themeToggle = document.getElementById('themeToggle');

    if (themeIcon && themeToggle) {
      // Add transition class for smooth icon change
      themeIcon.style.transition = 'opacity 0.2s ease-in-out';

      if (appState.theme === 'dark') {
        themeIcon.src = './assets/images/icon-sunny.webp';
        themeIcon.alt = 'Switch to light mode';
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
        themeToggle.setAttribute('title', 'Switch to light mode');
      } else {
        themeIcon.src = './assets/images/icon-overcast.webp';
        themeIcon.alt = 'Switch to dark mode';
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        themeToggle.setAttribute('title', 'Switch to dark mode');
      }
    }
  }
};

// Animations and Visual Effects
const animations = {
  init() {
    this.app = document.getElementById('app');
    this.particlesContainer = document.getElementById('weatherParticles');
  },

  setWeatherBackground(weatherCode) {
    if (!this.app) return;

    // Remove existing weather classes
    this.app.classList.remove('weather-clear', 'weather-cloudy', 'weather-rainy', 'weather-snowy', 'weather-stormy');

    // Add appropriate weather class based on weather code
    if (weatherCode === 0 || weatherCode === 1) {
      this.app.classList.add('weather-clear');
      this.createParticles('clear');
    } else if (weatherCode === 2 || weatherCode === 3) {
      this.app.classList.add('weather-cloudy');
      this.createParticles('cloudy');
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      this.app.classList.add('weather-rainy');
      this.createParticles('rain');
    } else if (weatherCode >= 71 && weatherCode <= 86) {
      this.app.classList.add('weather-snowy');
      this.createParticles('snow');
    } else if (weatherCode >= 95) {
      this.app.classList.add('weather-stormy');
      this.createParticles('storm');
    } else {
      this.app.classList.add('weather-cloudy');
      this.createParticles('cloudy');
    }
  },

  createParticles(weatherType) {
    if (!this.particlesContainer) return;

    // Clear existing particles
    this.particlesContainer.innerHTML = '';

    let particleCount = 0;
    let particleClass = '';

    switch (weatherType) {
      case 'rain':
        particleCount = 50;
        particleClass = 'rain';
        break;
      case 'snow':
        particleCount = 30;
        particleClass = 'snow';
        break;
      case 'clear':
        particleCount = 10;
        particleClass = 'clear';
        break;
      case 'storm':
        particleCount = 60;
        particleClass = 'rain';
        break;
      default:
        particleCount = 5;
        particleClass = 'clear';
    }

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = `particle ${particleClass}`;

      // Random positioning
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 3 + 's';
      particle.style.animationDuration = (Math.random() * 2 + 1) + 's';

      if (particleClass === 'clear') {
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
      }

      this.particlesContainer.appendChild(particle);
    }
  },

  animateValue(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const startValue = parseFloat(start) || 0;
    const endValue = parseFloat(end) || 0;
    const difference = endValue - startValue;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (difference * easeOut);

      if (element.textContent.includes('°')) {
        element.textContent = Math.round(currentValue) + '°';
      } else if (element.textContent.includes('%')) {
        element.textContent = Math.round(currentValue) + '%';
      } else {
        element.textContent = Math.round(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
};

// Favorites Management
const favorites = {
  init() {
    this.bindEvents();
    this.updateUI();
  },

  bindEvents() {
    // Favorite button in current weather
    const favoriteButton = document.getElementById('favoriteButton');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', () => {
        this.toggleCurrentLocation();
      });
    }

    // Favorites dropdown
    const favoritesButton = document.getElementById('favoritesButton');
    const favoritesMenu = document.getElementById('favoritesMenu');

    if (favoritesButton && favoritesMenu) {
      favoritesButton.addEventListener('click', () => {
        const isOpen = favoritesMenu.classList.contains('active');
        if (isOpen) {
          favoritesMenu.classList.remove('active');
          favoritesButton.setAttribute('aria-expanded', 'false');
        } else {
          favoritesMenu.classList.add('active');
          favoritesButton.setAttribute('aria-expanded', 'true');
          this.updateFavoritesList();
        }
      });

      // Close favorites menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!favoritesButton.contains(e.target) && !favoritesMenu.contains(e.target)) {
          favoritesMenu.classList.remove('active');
          favoritesButton.setAttribute('aria-expanded', 'false');
        }
      });
    }
  },

  toggleCurrentLocation() {
    if (!appState.currentLocation) return;

    const favoriteButton = document.getElementById('favoriteButton');

    if (this.isFavorite(appState.currentLocation)) {
      this.remove(appState.currentLocation);
      favoriteButton.classList.remove('active');
      favoriteButton.setAttribute('aria-label', 'Add to favorites');
    } else {
      this.add(appState.currentLocation);
      favoriteButton.classList.add('active');
      favoriteButton.setAttribute('aria-label', 'Remove from favorites');
    }
  },

  add(location) {
    const favorite = {
      id: Date.now(),
      name: location.name,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude
    };

    appState.favorites.push(favorite);
    this.save();
    this.updateUI();
  },

  remove(location) {
    appState.favorites = appState.favorites.filter(fav =>
      !(fav.latitude === location.latitude && fav.longitude === location.longitude)
    );
    this.save();
    this.updateUI();
  },

  removeById(id) {
    appState.favorites = appState.favorites.filter(fav => fav.id !== id);
    this.save();
    this.updateUI();
  },

  save() {
    localStorage.setItem('weatherAppFavorites', JSON.stringify(appState.favorites));
  },

  isFavorite(location) {
    return appState.favorites.some(fav =>
      fav.latitude === location.latitude && fav.longitude === location.longitude
    );
  },

  updateUI() {
    // Update favorite button state
    const favoriteButton = document.getElementById('favoriteButton');
    if (favoriteButton && appState.currentLocation) {
      if (this.isFavorite(appState.currentLocation)) {
        favoriteButton.classList.add('active');
        favoriteButton.setAttribute('aria-label', 'Remove from favorites');
      } else {
        favoriteButton.classList.remove('active');
        favoriteButton.setAttribute('aria-label', 'Add to favorites');
      }
    }
  },

  updateFavoritesList() {
    const favoritesList = document.getElementById('favoritesList');
    const noFavorites = document.getElementById('noFavorites');

    if (!favoritesList) return;

    if (appState.favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="no-favorites">
          <p>No saved locations yet</p>
          <p class="text-small">Add locations to your favorites for quick access</p>
        </div>
      `;
    } else {
      const favoritesHTML = appState.favorites.map(favorite => `
        <div class="favorite-item" data-favorite-id="${favorite.id}">
          <div class="favorite-info">
            <div class="favorite-name">${favorite.name}</div>
            <div class="favorite-country">${favorite.country}</div>
          </div>
          <button class="favorite-remove" data-favorite-id="${favorite.id}" aria-label="Remove ${favorite.name} from favorites">
            ×
          </button>
        </div>
      `).join('');

      favoritesList.innerHTML = favoritesHTML;

      // Add event listeners
      favoritesList.querySelectorAll('.favorite-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.classList.contains('favorite-remove')) return;

          const favoriteId = parseInt(item.dataset.favoriteId);
          const favorite = appState.favorites.find(fav => fav.id === favoriteId);

          if (favorite) {
            appState.currentLocation = favorite;
            weather.loadWeatherData(favorite.latitude, favorite.longitude);

            // Close favorites menu
            const favoritesMenu = document.getElementById('favoritesMenu');
            const favoritesButton = document.getElementById('favoritesButton');
            if (favoritesMenu && favoritesButton) {
              favoritesMenu.classList.remove('active');
              favoritesButton.setAttribute('aria-expanded', 'false');
            }
          }
        });
      });

      favoritesList.querySelectorAll('.favorite-remove').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const favoriteId = parseInt(button.dataset.favoriteId);
          this.removeById(favoriteId);
        });
      });
    }
  }
};

// Geolocation
const geolocation = {
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  },

  async loadCurrentLocationWeather() {
    console.log('Attempting to get current location...');
    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      console.log('Got current position:', latitude, longitude);

      // Get location name from reverse geocoding (simplified)
      appState.currentLocation = {
        name: 'Current Location',
        latitude,
        longitude
      };

      await weather.loadWeatherData(latitude, longitude);
    } catch (error) {
      console.log('Could not get current location:', error.message);

      // Provide more specific error handling
      if (error.code === 1) {
        console.log('Geolocation permission denied, using default location');
      } else if (error.code === 2) {
        console.log('Geolocation position unavailable, using default location');
      } else if (error.code === 3) {
        console.log('Geolocation timeout, using default location');
      }

      // Fallback to default location (Berlin)
      console.log('Falling back to default location...');
      await this.loadDefaultLocation();
    }
  },

  async loadDefaultLocation() {
    console.log('Loading default location (Berlin)...');
    appState.currentLocation = {
      name: 'Berlin',
      country: 'Germany',
      latitude: 52.52437,
      longitude: 13.41053
    };

    try {
      await weather.loadWeatherData(52.52437, 13.41053);
    } catch (error) {
      console.error('Failed to load default location weather:', error);
      // Show sample data for demonstration purposes
      console.log('Showing sample data for demonstration...');
      weather.showSampleData();
    }
  }
};

// Search functionality
const search = {
  init() {
    elements.searchInput = document.getElementById('searchInput');
    elements.searchButton = document.getElementById('searchButton');
    elements.searchResults = document.getElementById('searchResults');

    if (!elements.searchInput || !elements.searchButton || !elements.searchResults) {
      console.error('Search elements not found');
      return;
    }

    // Debounced search function
    const debouncedSearch = utils.debounce(this.performSearch.bind(this), 300);

    // Event listeners
    elements.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        debouncedSearch(query);
      } else {
        this.hideResults();
      }
    });

    elements.searchButton.addEventListener('click', () => {
      const query = elements.searchInput.value.trim();
      if (query) {
        this.performSearch(query);
      }
    });

    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = elements.searchInput.value.trim();
        if (query) {
          this.performSearch(query);
        }
      } else if (e.key === 'Escape') {
        this.hideResults();
      }
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      if (!elements.searchInput.contains(e.target) && !elements.searchResults.contains(e.target)) {
        this.hideResults();
      }
    });

    // Handle keyboard navigation in search results
    elements.searchInput.addEventListener('keydown', (e) => {
      const results = elements.searchResults.querySelectorAll('.search-result-item');
      const activeResult = elements.searchResults.querySelector('.search-result-item.active');
      let currentIndex = Array.from(results).indexOf(activeResult);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, results.length - 1);
        this.highlightResult(results, currentIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        this.highlightResult(results, currentIndex);
      } else if (e.key === 'Enter' && activeResult) {
        e.preventDefault();
        activeResult.click();
      }
    });
  },

  async performSearch(query) {
    try {
      utils.showLoading(elements.searchButton);
      const locations = await api.searchLocations(query);
      this.displayResults(locations);
    } catch (error) {
      console.error('Search failed:', error);
      this.showSearchError();
    } finally {
      utils.hideLoading(elements.searchButton);
    }
  },

  displayResults(locations) {
    if (!locations || locations.length === 0) {
      this.showNoResults();
      return;
    }

    const resultsHTML = locations.map(location => `
      <div class="search-result-item" data-location='${JSON.stringify(location)}'>
        <div class="search-result-name">${location.name}</div>
        <div class="search-result-details">
          ${location.admin1 ? location.admin1 + ', ' : ''}${location.country}
        </div>
      </div>
    `).join('');

    elements.searchResults.innerHTML = resultsHTML;
    this.showResults();

    // Add click listeners to results
    elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const location = JSON.parse(item.dataset.location);
        this.selectLocation(location);
      });
    });
  },

  selectLocation(location) {
    appState.currentLocation = location;
    elements.searchInput.value = `${location.name}, ${location.country}`;
    this.hideResults();

    // Load weather for selected location
    weather.loadWeatherData(location.latitude, location.longitude);
  },

  showResults() {
    elements.searchResults.classList.add('active');
  },

  hideResults() {
    elements.searchResults.classList.remove('active');
  },

  showNoResults() {
    elements.searchResults.innerHTML = `
      <div class="search-result-item">
        <div class="search-result-name">No results found</div>
        <div class="search-result-details">Try a different search term</div>
      </div>
    `;
    this.showResults();
  },

  showSearchError() {
    elements.searchResults.innerHTML = `
      <div class="search-result-item">
        <div class="search-result-name">Search failed</div>
        <div class="search-result-details">Please try again</div>
      </div>
    `;
    this.showResults();
  },

  highlightResult(results, index) {
    results.forEach((result, i) => {
      if (i === index) {
        result.classList.add('active');
        result.scrollIntoView({ block: 'nearest' });
      } else {
        result.classList.remove('active');
      }
    });
  }
};

// Weather data management
const weather = {
  async loadWeatherData(latitude, longitude) {
    console.log('Loading weather data for:', latitude, longitude);
    try {
      this.showLoading();
      const data = await api.getWeatherData(latitude, longitude);
      console.log('Weather data received:', data);

      if (data) {
        appState.weatherData = data;
        this.displayWeatherData(data);
        this.showWeatherData();
        console.log('Weather data displayed successfully');
      } else {
        console.log('No weather data received');
        this.showError('Unable to load weather data. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('Weather loading failed:', error);
      this.showError('Unable to connect to weather service. Please check your internet connection and try again.');
    }
  },

  displayWeatherData(data) {
    // Update current weather
    this.updateCurrentWeather(data);

    // Update metrics
    this.updateMetrics(data);

    // Update forecasts
    this.updateDailyForecast(data);
    this.updateHourlyForecast(data);

    // Update favorites UI
    favorites.updateUI();

    // Update weather animations
    if (data.current && data.current.weather_code !== undefined) {
      animations.setWeatherBackground(data.current.weather_code);
    }
  },

  updateCurrentWeather(data) {
    const current = data.current;
    const location = appState.currentLocation;

    if (elements.currentLocation) {
      elements.currentLocation.textContent = location ?
        `${location.name}, ${location.country}` : 'Current Location';
    }

    if (elements.currentDate) {
      elements.currentDate.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    if (elements.currentTemp) {
      elements.currentTemp.textContent = utils.formatTemperature(current.temperature_2m);
    }

    if (elements.currentWeatherIcon) {
      elements.currentWeatherIcon.src = utils.getWeatherIcon(current.weather_code);
      elements.currentWeatherIcon.alt = utils.getWeatherDescription(current.weather_code);
    }

    if (elements.currentDescription) {
      elements.currentDescription.textContent = utils.getWeatherDescription(current.weather_code);
    }
  },

  updateMetrics(data) {
    const current = data.current;
    const daily = data.daily;

    if (elements.feelsLike) {
      elements.feelsLike.textContent = utils.formatTemperature(current.apparent_temperature);
    }

    if (elements.humidity) {
      elements.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    }

    if (elements.windSpeed) {
      elements.windSpeed.textContent = utils.formatWindSpeed(current.wind_speed_10m);
    }

    if (elements.precipitation) {
      elements.precipitation.textContent = utils.formatPrecipitation(current.precipitation || 0);
    }

    // Additional metrics
    if (elements.uvIndex && daily && daily.uv_index_max) {
      elements.uvIndex.textContent = Math.round(daily.uv_index_max[0]);
    }

    if (elements.visibility && current.visibility) {
      const visibilityKm = (current.visibility / 1000).toFixed(1);
      elements.visibility.textContent = `${visibilityKm} km`;
    }

    if (elements.pressure) {
      elements.pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;
    }

    // Sun times
    if (elements.sunrise && elements.sunset && daily) {
      const sunrise = new Date(daily.sunrise[0]);
      const sunset = new Date(daily.sunset[0]);

      elements.sunrise.textContent = sunrise.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      elements.sunset.textContent = sunset.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  },

  updateDailyForecast(data) {
    const daily = data.daily;
    if (!elements.forecastDays || !daily) return;

    const forecastHTML = daily.time.slice(0, 7).map((date, index) => `
      <div class="forecast-day" data-day="${index}">
        <div class="day-name">${utils.formatDate(date).split(',')[0]}</div>
        <img src="${utils.getWeatherIcon(daily.weather_code[index])}"
             alt="${utils.getWeatherDescription(daily.weather_code[index])}"
             class="day-icon">
        <div class="day-temps">
          <span class="temp-high">${utils.formatTemperature(daily.temperature_2m_max[index])}</span>
          <span class="temp-low">${utils.formatTemperature(daily.temperature_2m_min[index])}</span>
        </div>
      </div>
    `).join('');

    elements.forecastDays.innerHTML = forecastHTML;

    // Add click listeners for day selection
    elements.forecastDays.querySelectorAll('.forecast-day').forEach(day => {
      day.addEventListener('click', () => {
        const dayIndex = parseInt(day.dataset.day);
        appState.selectedDay = dayIndex;
        this.updateHourlyForecast(data, dayIndex);
        this.updateDaySelector(dayIndex);
      });
    });
  },

  updateHourlyForecast(data, selectedDay = 0) {
    const hourly = data.hourly;
    if (!elements.forecastHours || !hourly) return;

    // Get hours for selected day (24 hours starting from selected day)
    const startIndex = selectedDay * 24;
    const endIndex = startIndex + 24;

    const hoursHTML = hourly.time.slice(startIndex, endIndex).map((time, index) => {
      const actualIndex = startIndex + index;
      return `
        <div class="forecast-hour">
          <div class="hour-time">${utils.formatTime(time)}</div>
          <img src="${utils.getWeatherIcon(hourly.weather_code[actualIndex])}"
               alt="${utils.getWeatherDescription(hourly.weather_code[actualIndex])}"
               class="hour-icon">
          <div class="hour-temp">${utils.formatTemperature(hourly.temperature_2m[actualIndex])}</div>
        </div>
      `;
    }).join('');

    elements.forecastHours.innerHTML = hoursHTML;
  },

  updateDaySelector(selectedDay) {
    if (elements.daySelector) {
      elements.daySelector.selectedIndex = selectedDay;
    }
  },

  showLoading() {
    if (elements.loadingState) elements.loadingState.classList.remove('hidden');
    if (elements.weatherData) elements.weatherData.classList.add('hidden');
    if (elements.errorState) elements.errorState.classList.add('hidden');
  },

  showWeatherData() {
    if (elements.loadingState) elements.loadingState.classList.add('hidden');
    if (elements.weatherData) elements.weatherData.classList.remove('hidden');
    if (elements.errorState) elements.errorState.classList.add('hidden');
  },

  showError(message) {
    console.log('Showing error:', message);
    console.log('Elements available:', {
      loadingState: !!elements.loadingState,
      weatherData: !!elements.weatherData,
      errorState: !!elements.errorState
    });

    if (elements.loadingState) elements.loadingState.classList.add('hidden');
    if (elements.weatherData) elements.weatherData.classList.add('hidden');
    if (elements.errorState) {
      elements.errorState.classList.remove('hidden');
      const errorMessage = elements.errorState.querySelector('#errorMessage');
      if (errorMessage) {
        errorMessage.textContent = message;
        console.log('Error message updated to:', message);
      } else {
        console.log('Error message element not found');
      }
    } else {
      console.log('Error state element not found');
    }
  },

  showSampleData() {
    console.log('Showing sample data for demonstration...');

    // Hide loading and error states
    if (elements.loadingState) elements.loadingState.classList.add('hidden');
    if (elements.errorState) elements.errorState.classList.add('hidden');

    // Show weather data
    if (elements.weatherData) elements.weatherData.classList.remove('hidden');

    // Update current weather with sample data
    if (elements.currentLocation) elements.currentLocation.textContent = 'Berlin, Germany';
    if (elements.currentDate) elements.currentDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    if (elements.currentTemp) elements.currentTemp.textContent = '20°';
    if (elements.currentDescription) elements.currentDescription.textContent = 'Clear sky';

    // Update metrics with sample data
    if (elements.feelsLike) elements.feelsLike.textContent = '18°';
    if (elements.humidity) elements.humidity.textContent = '65%';
    if (elements.windSpeed) elements.windSpeed.textContent = '12 km/h';
    if (elements.precipitation) elements.precipitation.textContent = '0%';
    if (elements.uvIndex) elements.uvIndex.textContent = '5';
    if (elements.visibility) elements.visibility.textContent = '10 km';
    if (elements.pressure) elements.pressure.textContent = '1013 hPa';
    if (elements.sunrise) elements.sunrise.textContent = '6:30 AM';
    if (elements.sunset) elements.sunset.textContent = '8:15 PM';

    // Show sample hourly forecast
    this.showSampleHourlyForecast();

    // Show sample daily forecast
    this.showSampleDailyForecast();
  },

  showSampleHourlyForecast() {
    if (!elements.forecastHours) return;

    const sampleHours = [
      { time: '3 PM', temp: '20°', icon: './assets/images/icon-sunny.webp', alt: 'Sunny' },
      { time: '4 PM', temp: '21°', icon: './assets/images/icon-sunny.webp', alt: 'Sunny' },
      { time: '5 PM', temp: '20°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { time: '6 PM', temp: '19°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { time: '7 PM', temp: '18°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { time: '8 PM', temp: '17°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { time: '9 PM', temp: '16°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { time: '10 PM', temp: '15°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' }
    ];

    const hoursHTML = sampleHours.map(hour => `
      <div class="forecast-hour">
        <div class="hour-time">${hour.time}</div>
        <img src="${hour.icon}" alt="${hour.alt}" class="hour-icon">
        <div class="hour-temp">${hour.temp}</div>
      </div>
    `).join('');

    elements.forecastHours.innerHTML = hoursHTML;
  },

  showSampleDailyForecast() {
    if (!elements.forecastDays) return;

    const sampleDays = [
      { day: 'Today', high: '20°', low: '12°', icon: './assets/images/icon-sunny.webp', alt: 'Sunny' },
      { day: 'Wed', high: '22°', low: '14°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { day: 'Thu', high: '18°', low: '10°', icon: './assets/images/icon-rainy.webp', alt: 'Rainy' },
      { day: 'Fri', high: '25°', low: '16°', icon: './assets/images/icon-sunny.webp', alt: 'Sunny' },
      { day: 'Sat', high: '23°', low: '15°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { day: 'Sun', high: '21°', low: '13°', icon: './assets/images/icon-overcast.webp', alt: 'Overcast' },
      { day: 'Mon', high: '19°', low: '11°', icon: './assets/images/icon-rainy.webp', alt: 'Rainy' }
    ];

    const daysHTML = sampleDays.map((day, index) => `
      <div class="forecast-day" data-day="${index}">
        <div class="day-name">${day.day}</div>
        <img src="${day.icon}" alt="${day.alt}" class="day-icon">
        <div class="day-temps">
          <span class="temp-high">${day.high}</span>
          <span class="temp-low">${day.low}</span>
        </div>
      </div>
    `).join('');

    elements.forecastDays.innerHTML = daysHTML;
  }
};

// Units management
const units = {
  init() {
    // Load saved units from localStorage
    const savedUnits = localStorage.getItem('weatherAppUnits');
    if (savedUnits) {
      appState.units = { ...appState.units, ...JSON.parse(savedUnits) };
    }

    this.updateUI();
    this.bindEvents();
  },

  bindEvents() {
    // Listen for unit changes
    const unitInputs = document.querySelectorAll('input[name="system"], input[name="temperature"], input[name="windSpeed"], input[name="precipitation"]');

    unitInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleUnitChange(e.target.name, e.target.value);
      });
    });
  },

  handleUnitChange(unitType, value) {
    // Handle system-wide changes
    if (unitType === 'system') {
      if (value === 'imperial') {
        appState.units.temperature = 'fahrenheit';
        appState.units.windSpeed = 'mph';
        appState.units.precipitation = 'inches';
      } else {
        appState.units.temperature = 'celsius';
        appState.units.windSpeed = 'kmh';
        appState.units.precipitation = 'mm';
      }
    } else {
      // Handle individual unit changes
      appState.units[unitType] = value;
    }

    this.updateUI();
    this.saveUnits();

    // Refresh weather display if data is available
    if (appState.weatherData) {
      weather.displayWeatherData(appState.weatherData);
    }
  },

  updateUI() {
    // Update radio button states
    const systemRadios = document.querySelectorAll('input[name="system"]');
    const tempRadios = document.querySelectorAll('input[name="temperature"]');
    const windRadios = document.querySelectorAll('input[name="windSpeed"]');
    const precipRadios = document.querySelectorAll('input[name="precipitation"]');

    // Determine system setting
    const isImperial = appState.units.temperature === 'fahrenheit' &&
                      appState.units.windSpeed === 'mph' &&
                      appState.units.precipitation === 'inches';

    systemRadios.forEach(radio => {
      if (radio.value === 'imperial' && isImperial) {
        radio.checked = true;
      } else if (radio.value === 'metric' && !isImperial) {
        radio.checked = true;
      }
    });

    // Update individual unit radios
    tempRadios.forEach(radio => {
      radio.checked = radio.value === appState.units.temperature;
    });

    windRadios.forEach(radio => {
      radio.checked = radio.value === appState.units.windSpeed;
    });

    precipRadios.forEach(radio => {
      radio.checked = radio.value === appState.units.precipitation;
    });
  },

  saveUnits() {
    localStorage.setItem('weatherAppUnits', JSON.stringify(appState.units));
  }
};

// Initialize DOM elements
const initializeElements = () => {
  console.log('Initializing DOM elements...');

  // Weather display elements
  elements.currentLocation = document.getElementById('currentLocation');
  elements.currentDate = document.getElementById('currentDate');
  elements.currentTemp = document.getElementById('currentTemp');
  elements.currentWeatherIcon = document.getElementById('currentWeatherIcon');
  elements.currentDescription = document.getElementById('currentDescription');

  // Metrics elements
  elements.feelsLike = document.getElementById('feelsLike');
  elements.humidity = document.getElementById('humidity');
  elements.windSpeed = document.getElementById('windSpeed');
  elements.precipitation = document.getElementById('precipitation');
  elements.uvIndex = document.getElementById('uvIndex');
  elements.visibility = document.getElementById('visibility');
  elements.pressure = document.getElementById('pressure');
  elements.sunrise = document.getElementById('sunrise');
  elements.sunset = document.getElementById('sunset');

  // Forecast elements
  elements.forecastDays = document.getElementById('forecastDays');
  elements.forecastHours = document.getElementById('forecastHours');
  elements.daySelector = document.getElementById('daySelector');

  // State elements
  elements.loadingState = document.getElementById('loadingState');
  elements.weatherData = document.getElementById('weatherData');
  elements.errorState = document.getElementById('errorState');
  elements.retryButton = document.getElementById('retryButton');

  // Units elements
  elements.unitsButton = document.getElementById('unitsButton');
  elements.unitsMenu = document.getElementById('unitsMenu');

  // Favorites elements
  elements.favoriteButton = document.getElementById('favoriteButton');
  elements.favoritesButton = document.getElementById('favoritesButton');
  elements.favoritesMenu = document.getElementById('favoritesMenu');
  elements.favoritesList = document.getElementById('favoritesList');

  // Debug: Check if critical elements are found
  console.log('Critical elements found:');
  console.log('- loadingState:', !!elements.loadingState);
  console.log('- weatherData:', !!elements.weatherData);
  console.log('- errorState:', !!elements.errorState);
  console.log('- retryButton:', !!elements.retryButton);
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing weather app...');

  // Initialize DOM elements
  initializeElements();
  console.log('DOM elements initialized');

  // Initialize components
  theme.init();
  console.log('Theme initialized');

  search.init();
  console.log('Search initialized');

  units.init();
  console.log('Units initialized');

  favorites.init();
  console.log('Favorites initialized');

  animations.init();
  console.log('Animations initialized');

  // Initialize units dropdown
  if (elements.unitsButton && elements.unitsMenu) {
    elements.unitsButton.addEventListener('click', () => {
      const isOpen = elements.unitsMenu.classList.contains('active');
      if (isOpen) {
        elements.unitsMenu.classList.remove('active');
        elements.unitsButton.setAttribute('aria-expanded', 'false');
      } else {
        elements.unitsMenu.classList.add('active');
        elements.unitsButton.setAttribute('aria-expanded', 'true');
      }
    });

    // Close units menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!elements.unitsButton.contains(e.target) && !elements.unitsMenu.contains(e.target)) {
        elements.unitsMenu.classList.remove('active');
        elements.unitsButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Initialize day selector
  if (elements.daySelector) {
    elements.daySelector.addEventListener('change', (e) => {
      const selectedDay = parseInt(e.target.value);
      appState.selectedDay = selectedDay;
      if (appState.weatherData) {
        weather.updateHourlyForecast(appState.weatherData, selectedDay);
      }
    });
  }

  // Initialize retry button
  if (elements.retryButton) {
    elements.retryButton.addEventListener('click', () => {
      if (appState.currentLocation) {
        weather.loadWeatherData(appState.currentLocation.latitude, appState.currentLocation.longitude);
      } else {
        geolocation.loadCurrentLocationWeather();
      }
    });
  }

  // Try to load current location weather
  geolocation.loadCurrentLocationWeather().catch(error => {
    console.error('Failed to initialize geolocation:', error);
  });

  console.log('Weather App initialized successfully');
});
