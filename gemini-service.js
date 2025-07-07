const axios = require("axios");
const config = require("./config");
const CacheManager = require("./cache-manager");

class GeminiService {
  constructor() {
    this.apiKey = config.GEMINI_API_KEY;
    this.apiUrl = config.GEMINI_API_URL;
    this.cacheManager = new CacheManager();
  }

  async getSuggestion(userInput) {
    try {
      const prompt = `Given this partial input: "${userInput}", provide a brief, helpful suggestion to complete the thought or command. Keep it under ${config.MAX_SUGGESTION_LENGTH} characters. Only provide the suggestion text, no explanations.`;

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
        return suggestion.substring(0, config.MAX_SUGGESTION_LENGTH);
      }

      return null;
    } catch (error) {
      if (config.DEBUG_MODE) {
        console.error("Gemini API Error:", error.message);
      }
      return null;
    }
  }

  async getCommandSuggestion(userInput) {
    try {
      const prompt = `The user is typing in a terminal. Given this partial input: "${userInput}", suggest a complete command or next few words. Focus on common terminal commands, file operations, git commands, or programming tasks. Keep it under ${config.MAX_SUGGESTION_LENGTH} characters. Only provide the suggestion, no explanations.`;

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
        return suggestion.substring(0, config.MAX_SUGGESTION_LENGTH);
      }

      return null;
    } catch (error) {
      if (config.DEBUG_MODE) {
        console.error("Gemini API Error:", error.message);
      }
      return null;
    }
  }
}

module.exports = GeminiService;
