# Weather Application

![Design preview for the Weather app coding challenge](./preview.jpg)

A comprehensive, responsive weather application built with vanilla HTML, CSS, and JavaScript. Features real-time weather data, location search, favorites system, and delightful animations.

## 🌟 Features Implemented

### Core Requirements ✅
- **Location Search**: Search for weather information by entering any location
- **Current Weather**: Temperature, weather icon, and location details
- **Weather Metrics**: "Feels like" temperature, humidity, wind speed, precipitation
- **7-Day Forecast**: Daily high/low temperatures with weather icons
- **Hourly Forecast**: Temperature changes throughout the day with day selector
- **Units System**: Toggle between Imperial/Metric units with granular control
- **Responsive Design**: Optimal layout for mobile, tablet, and desktop
- **Interactive States**: Hover and focus states for all interactive elements

### Enhanced Features 🚀
- **Geolocation Support**: Automatic current location detection
- **Favorites System**: Save and quickly access frequently checked locations
- **Dark/Light Mode**: Automatic theme switching based on time of day
- **Weather Animations**: Dynamic backgrounds and particles based on conditions
- **Additional Data**: UV index, visibility, air pressure, sunrise/sunset times
- **Accessibility**: Full keyboard navigation, screen reader support, reduced motion
- **Performance**: Debounced search, efficient DOM updates, optimized animations

| Desktop design | Mobile design |
| ------- | ------ |
| ![Desktop](https://github.com/Ayokanmi-Adejola/Weather-App/blob/main/design/desktop-design-imperial.jpg?raw=true) | ![Mobile](https://github.com/Ayokanmi-Adejola/Weather-App/blob/main/design/mobile-design-imperial.jpg?raw=true) |

## 🚀 Getting Started

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. Allow location access for automatic weather detection (optional)
4. Start exploring weather data for any location!

## 🛠️ Technical Implementation

### APIs Used
- **Open-Meteo Weather API**: Free weather data with no API key required
- **Open-Meteo Geocoding API**: Location search and coordinates

### Browser Support
- Chrome 90+ | Firefox 88+ | Safari 14+ | Edge 90+

### Architecture
- **Vanilla JavaScript**: No frameworks, pure ES6+ features
- **CSS Custom Properties**: Consistent design system
- **Semantic HTML**: Accessible and SEO-friendly structure
- **Progressive Enhancement**: Works without JavaScript for basic content

## 📱 Responsive Design

- **Mobile**: 320px - 768px (Touch-optimized interface)
- **Tablet**: 768px - 1024px (Hybrid layout)
- **Desktop**: 1024px+ (Full feature set)

## ♿ Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Mode**: Enhanced visibility for visual impairments
- **Reduced Motion**: Respects user's motion preferences
- **Skip Links**: Quick navigation for assistive technologies

## 🎨 Design System

### Colors
- **Neutral Palette**: 9 shades from `hsl(243, 96%, 9%)` to `hsl(0, 0%, 100%)`
- **Accent Colors**: Blue `hsl(233, 67%, 56%)` and Orange `hsl(28, 100%, 52%)`
- **Weather Themes**: Dynamic backgrounds based on weather conditions

### Typography
- **Primary Font**: DM Sans (300, 500, 600, 700)
- **Display Font**: Bricolage Grotesque (700)
- **Base Size**: 18px with responsive scaling

### Spacing & Layout
- **Consistent Scale**: 0.5rem to 4rem using CSS custom properties
- **Grid System**: CSS Grid for responsive layouts
- **Component-based**: Reusable card and button components

## 🌦️ Weather Data

### Current Conditions
- Temperature and "feels like" temperature
- Weather description with animated icon
- Humidity, wind speed, precipitation
- UV index, visibility, air pressure
- Sunrise and sunset times

### Forecasts
- **Daily**: 7-day forecast with high/low temperatures
- **Hourly**: 24-hour detailed forecast with day selector

## 🔧 Customization

### Adding Weather Icons
1. Add icon files to `assets/images/`
2. Update `WEATHER_CODES` object in `script.js`
3. Map weather codes to new icons

### Modifying Themes
1. Update CSS custom properties in `:root` and `[data-theme]` selectors
2. Add theme variants in theme management system

### Extending API Data
1. Modify API parameters in `getWeatherData` function
2. Update display functions for new data
3. Add corresponding HTML elements and CSS styles

## 🚀 Performance Features

- **Debounced Search**: Reduces API calls during typing
- **Efficient DOM Updates**: Minimal reflows and repaints
- **Optimized Animations**: Uses `requestAnimationFrame` and CSS transforms
- **Lazy Loading**: Weather particles created on demand
- **Local Storage**: Caches user preferences and favorites

## 🐛 Known Issues & Limitations

- Weather particles may impact performance on older devices
- Some weather data may not be available for all locations
- Geolocation requires HTTPS in production environments
- API rate limits may apply for excessive usage

## 🚀 Future Enhancements

- Weather alerts and notifications
- Historical weather data visualization
- Interactive weather maps
- Social sharing capabilities
- Offline support with service workers
- Weather widgets for embedding
- Multi-language support
- Weather-based recommendations

## 📄 Project Structure

```
weather-app-main/
├── index.html          # Main HTML file
├── styles.css          # Complete CSS with design system
├── script.js           # JavaScript functionality
├── assets/
│   └── images/         # Weather icons and UI assets
├── style-guide.md      # Design specifications
└── README.md           # This file
```

## 🙏 Acknowledgments

- **Frontend Mentor**: Original challenge and design inspiration
- **Open-Meteo**: Free weather API with comprehensive data
- **Google Fonts**: Typography (DM Sans, Bricolage Grotesque)
- **Community**: Feedback and support during development

## 📞 Support & Troubleshooting

### Common Issues
1. **Location not found**: Try different search terms or check spelling
2. **Weather data not loading**: Check internet connection and browser console
3. **Geolocation not working**: Ensure HTTPS and location permissions
4. **Performance issues**: Disable animations in accessibility settings

### Browser Console
Check the browser developer tools console for detailed error messages and debugging information.


## 🌟 Frontend Mentor Challenge

This project was built as a solution to the [Frontend Mentor Weather App Challenge](https://www.frontendmentor.io).

**Challenge completed with enhanced features beyond requirements:**
- ✅ All original requirements implemented
- 🚀 Additional features: Geolocation, Favorites, Themes, Animations
- ♿ Enhanced accessibility and performance
- 📱 Improved responsive design
