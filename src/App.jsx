import { useEffect, useState, useCallback } from "react";
import "./App.css";

// Utility function to debounce input actions
const debounce = (func, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const App = () => {
  const [apiData, setApiData] = useState(null);
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [autoList, setAutoList] = useState([]);
  console.log("App  autoList:", autoList);

  // Handle city input change
  const handleCityChange = (event) => {
    setCity(event.target.value);
    fetchAutoCity(event.target.value); // Fetch auto-suggestions
    setError(""); // Reset error on input change
  };

  // Fetch city suggestions based on input
  const fetchAutoCity = async (query) => {
    if (!query.trim()) return; // Skip if input is empty or only whitespace
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=49ceb120245f40c8857100408240811&q=${query}`
      );
      if (!response.ok) throw new Error("Failed to fetch city suggestions");
      const data = await response.json();
      setAutoList(data);
    } catch (err) {
      setError("Error fetching city data");
    }
  };

  // Fetch weather data for the given city or coordinates
  const fetchWeatherData = async (query) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=49ceb120245f40c8857100408240811&q=${query}&aqi=yes`
      );
      const data = await response.json();
      if (response.ok) {
        setApiData(data);
        setError(""); // Clear any previous error
      } else {
        setError(data.error.message || "Failed to fetch weather data");
        setApiData(null);
      }
    } catch (err) {
      setError("Network error or invalid request");
      setApiData(null);
    }
  };

  // Handle search on button click
  const handleSearch = () => {
    if (city.trim()) {
      fetchWeatherData(city);
    }
  };

  // Fetch weather by location (geolocation)
  const fetchWeatherByLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          fetchWeatherData(`${latitude},${longitude}`);
        },
        () => setError("Failed to retrieve your location")
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  // Debounce the fetchCity request to limit the number of API calls
  useEffect(() => {
    const debouncedFetchAutoCity = debounce(fetchAutoCity, 300);
    if (city) debouncedFetchAutoCity(city);
  }, [city]);

  // Fetch weather based on user's geolocation on initial render
  useEffect(() => {
    fetchWeatherByLocation();
  }, [fetchWeatherByLocation]);

  // Handle city selection from suggestions
  const handleCitySelect = (selectedCity) => {
    fetchWeatherData(selectedCity);
    setAutoList([]); // Clear suggestions
  };

  return (
    <div className="app-container min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="weather-card bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h1 className="app-title text-2xl font-bold text-center text-gray-800 mb-4">
          Weather App
        </h1>
        <input
          className="city-input w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={handleCityChange}
        />

        {error && (
          <p className="error-message text-red-500 text-center mt-4">{error}</p>
        )}

        {autoList.length > 0 && (
          <div className="auto-suggestions  border border-gray-300 rounded-md shadow-md">
            {autoList.map((item) => (
              <div
                key={item.id}
                className="auto-suggestion-item p-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => handleCitySelect(item.name)}
              >
                {item.name}
              </div>
            ))}
          </div>
        )}

        <button
          className="search-btn w-full py-2 mt-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleSearch}
        >
          Search
        </button>

        {apiData && (
          <div className="weather-info mt-6 text-center">
            <img
              className="weather-icon mx-auto mb-4"
              src={apiData.current.condition.icon}
              alt={apiData.current.condition.text}
            />
            <h2 className="temp text-4xl font-semibold text-gray-800">
              {apiData.current.temp_c}°C
            </h2>
            <p className="location text-lg text-gray-600">
              {apiData.location.name}, {apiData.location.region}
            </p>
            <p className="condition text-sm text-gray-500 mt-2">
              {apiData.current.condition.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
