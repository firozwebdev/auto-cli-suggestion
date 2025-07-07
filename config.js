module.exports = {
  GEMINI_API_KEY: "AIzaSyBtO2J8lMY7hakS-LeBBhy-Zqhzpb-Iw98", // Replace with your API key
  GEMINI_API_URL:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",

  // Cost Optimization Settings
  SUGGESTION_DELAY: 2000, // Increased delay to reduce API calls (ms)
  MIN_INPUT_LENGTH: 3, // Minimum characters before requesting suggestions
  MAX_SUGGESTION_LENGTH: 30, // Reduced max length to save tokens
  ENABLE_SUGGESTIONS: true, // Toggle suggestions on/off
  MAX_DAILY_REQUESTS: 100, // Daily request limit
  REQUEST_COOLDOWN: 5000, // Cooldown between requests (ms)

  // Caching Settings
  ENABLE_CACHE: true, // Enable suggestion caching
  CACHE_DURATION: 3600000, // Cache duration in ms (1 hour)
  MAX_CACHE_SIZE: 1000, // Maximum cached suggestions

  // UI Settings
  ENABLE_COLORS: true,
  DEBUG_MODE: false,

  // Cost Tracking
  TRACK_USAGE: true, // Track API usage for cost monitoring
  USAGE_FILE: "usage.json", // File to store usage statistics
};
