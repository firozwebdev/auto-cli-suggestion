const fs = require("fs");
const axios = require("axios");
const config = require("./config");

if (require.main === module) {
  // Only runs if you execute: node gemini-service-optimized.js
  fs.writeFileSync("debug_config_output.txt", JSON.stringify(config, null, 2));
  setTimeout(() => {}, 10000); // Keeps the process alive for 10 seconds
}

const CacheManager = require("./cache-manager");
const ContextManager = require("./context-manager");

class OptimizedGeminiService {
  constructor() {
    this.apiKeys =
      Array.isArray(config.GEMINI_API_KEYS) && config.GEMINI_API_KEYS.length > 0
        ? config.GEMINI_API_KEYS
        : [config.GEMINI_API_KEY];
    this.apiUrl = config.GEMINI_API_URL;
    this.cacheManager = new CacheManager();
    this.contextManager = new ContextManager();
    this.currentKeyIndex = 0;
  }

  getCurrentApiKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  rotateApiKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }

  async postWithKeyRotation(payload, headers, attempt = 0) {
    if (attempt >= this.apiKeys.length) {
      throw new Error("All API keys exhausted or failed.");
    }
    const apiKey = this.getCurrentApiKey();
    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          ...headers,
          "X-goog-api-key": apiKey,
        },
        timeout: 15000,
      });
      return response;
    } catch (error) {
      // Rotate to next key and retry on ANY error
      this.rotateApiKey();
      return this.postWithKeyRotation(payload, headers, attempt + 1);
    }
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
      // Get contextual suggestion
      const contextualResult =
        await this.contextManager.getContextualSuggestion(userInput);

      let prompt;
      if (typeof contextualResult === "string") {
        // Direct match found, use it
        return contextualResult;
      } else {
        // Use context-aware prompt
        prompt = contextualResult.prompt;
      }

      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      };
      const headers = { "Content-Type": "application/json" };
      const response = await this.postWithKeyRotation(payload, headers);

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

  getContextDisplay() {
    return "";
  }
}

module.exports = OptimizedGeminiService;
