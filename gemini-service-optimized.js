const axios = require("axios");
const config = require("./config");
const CacheManager = require("./cache-manager");
const ContextManager = require("./context-manager");

class OptimizedGeminiService {
  constructor() {
    this.apiKey = config.GEMINI_API_KEY;
    this.apiUrl = config.GEMINI_API_URL;
    this.cacheManager = new CacheManager();
    this.contextManager = new ContextManager();
  }

  async getCommandSuggestion(userInput) {
    // Check if suggestions are enabled
    if (!config.ENABLE_SUGGESTIONS) {
      return null;
    }

    // Check minimum input length
    if (userInput.trim().length < config.MIN_INPUT_LENGTH) {
      return null;
    }

    // Check cache first
    const cachedSuggestion = this.cacheManager.get(userInput);
    if (cachedSuggestion) {
      return cachedSuggestion;
    }

    // Check if we can make a request
    if (!this.cacheManager.canMakeRequest()) {
      return null;
    }

    try {
      // Optimized prompt - shorter and more focused
      const prompt = `Complete: "${userInput}" (${config.MAX_SUGGESTION_LENGTH} chars max)`;

      const response = await axios.post(
        this.apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": this.apiKey,
          },
          timeout: 5000,
        }
      );

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0]
      ) {
        const suggestion =
          response.data.candidates[0].content.parts[0].text.trim();
        const finalSuggestion = suggestion.substring(
          0,
          config.MAX_SUGGESTION_LENGTH
        );

        // Cache the result
        this.cacheManager.set(userInput, finalSuggestion);

        // Record usage
        const tokenCount = response.data.usageMetadata?.totalTokenCount || 0;
        this.cacheManager.recordRequest(tokenCount);

        return finalSuggestion;
      }

      return null;
    } catch (error) {
      if (config.DEBUG_MODE) {
        console.error("Gemini API Error:", error.message);
      }
      return null;
    }
  }

  getUsageStats() {
    return this.cacheManager.getUsageStats();
  }

  clearCache() {
    this.cacheManager.clearCache();
  }

  resetUsageStats() {
    this.cacheManager.resetUsageStats();
  }
}

module.exports = OptimizedGeminiService;
