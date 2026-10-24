import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchWeather = async (e) => {
    e.preventDefault();

    const cityName = city.trim();

    if (!cityName) {
      setError("Please enter a city name.");
      setWeather(null);
      return;
    }

    // Reject numbers and invalid city names
    if (!/^[a-zA-Z\s.-]+$/.test(cityName)) {
      setError("Please enter a valid city name.");
      setWeather(null);
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // Search for the city
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cityName
        )}&count=10&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Unable to search city. Please try again.");
      }

      const geoData = await geoResponse.json();

      // Find an exact city-name match
      const results = geoData.results || [];

      const matchingCity = results.find(
        (place) => place.name.toLowerCase() === cityName.toLowerCase()
      );

      if (!matchingCity) {
        throw new Error("City not found. Please enter a valid city name.");
      }

      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${matchingCity.latitude}&longitude=${matchingCity.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to fetch weather. Please try again.");
      }

      const weatherData = await weatherResponse.json();

      if (!weatherData.current) {
        throw new Error("Weather data is currently unavailable.");
      }

      setWeather({
        name: matchingCity.name,
        country: matchingCity.country || "",
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        feelsLike: weatherData.current.apparent_temperature,
        windSpeed: weatherData.current.wind_speed_10m,
        pressure: weatherData.current.surface_pressure,
        code: weatherData.current.weather_code,
        isDay: weatherData.current.is_day,
      });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Network error. Please check your internet connection."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const getCondition = (code) => {
    if (code === 0) return "Clear Sky";
    if ([1, 2].includes(code)) return "Partly Cloudy";
    if (code === 3) return "Overcast";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67].includes(code)) return "Rainy";
    if ([71, 73, 75, 77].includes(code)) return "Snowy";
    if ([80, 81, 82].includes(code)) return "Rain Showers";
    if ([85, 86].includes(code)) return "Snow Showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";

    return "Weather Unavailable";
  };

  const getIcon = (code, isDay) => {
    if ([95, 96, 99].includes(code)) return "⛈️";

    if (
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
    ) {
      return "🌧️";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return "❄️";
    }

    if ([45, 48].includes(code)) return "🌫️";

    if (code === 0) return isDay ? "☀️" : "🌙";

    if ([1, 2].includes(code)) {
      return isDay ? "🌤️" : "☁️";
    }

    return "☁️";
  };

  return (
    <div className="app">
      <div className="weather-container">
        <header className="header">
          <h1>WeatherSphere</h1>
          <p>Discover the current weather in your city</p>
        </header>

        <form className="search-form" onSubmit={searchWeather}>
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City name"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {loading && <p className="loading-message">Loading weather...</p>}

        {weather && !loading && (
          <div className="weather-card">
            <div className="location">
              <h2>
                {weather.name}
                {weather.country ? `, ${weather.country}` : ""}
              </h2>

              <p>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            <div className="weather-main">
              <span className="weather-icon">
                {getIcon(weather.code, weather.isDay)}
              </span>

              <div>
                <h3>{Math.round(weather.temperature)}°C</h3>
                <p className="condition">{getCondition(weather.code)}</p>
              </div>
            </div>

            <p className="feels-like">
              Feels like {Math.round(weather.feelsLike)}°C
            </p>

            <div className="weather-details">
              <div className="detail-box">
                <span>💧</span>
                <p>Humidity</p>
                <h4>{weather.humidity}%</h4>
              </div>

              <div className="detail-box">
                <span>💨</span>
                <p>Wind Speed</p>
                <h4>{weather.windSpeed.toFixed(1)} km/h</h4>
              </div>

              <div className="detail-box">
                <span>🌡️</span>
                <p>Pressure</p>
                <h4>{Math.round(weather.pressure)} hPa</h4>
              </div>

              <div className="detail-box">
                <span>📍</span>
                <p>Location</p>
                <h4>{weather.country || "Available"}</h4>
              </div>
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <div className="welcome-message">
            <span>🌦️</span>
            <h2>Check the Weather</h2>
            <p>Search for any city to discover its current weather.</p>
          </div>
        )}

        <footer className="footer">
          <p>Weather data powered by Open-Meteo</p>
        </footer>
      </div>
    </div>
  );
}

export default App;