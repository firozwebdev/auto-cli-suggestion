const fs = require("fs").promises;
const path = require("path");
const config = require("./config");

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.usageStats = {
      totalRequests: 0,
      cachedHits: 0,
      dailyRequests: 0,
      lastReset: new Date().toDateString(),
      costEstimate: 0,
    };
    this.lastRequestTime = 0;
    this.loadCache();
    this.loadUsageStats();
  }

  async loadCache() {
    try {
      const cacheFile = path.join(__dirname, "suggestion-cache.json");
      const data = await fs.readFile(cacheFile, "utf8");
      const cacheData = JSON.parse(data);

      // Only load cache entries that haven't expired
      const now = Date.now();
      for (const [key, value] of Object.entries(cacheData)) {
        if (now - value.timestamp < config.CACHE_DURATION) {
          this.cache.set(key, value);
        }
      }
    } catch (error) {
      // Cache file doesn't exist or is invalid, start fresh
      if (config.DEBUG_MODE) {
        console.log("No existing cache found, starting fresh");
      }
    }
  }

  async saveCache() {
    try {
      const cacheFile = path.join(__dirname, "suggestion-cache.json");
      const cacheData = {};

      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = value;
      }

      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      if (config.DEBUG_MODE) {
        console.error("Failed to save cache:", error.message);
      }
    }
  }

  async loadUsageStats() {
    try {
      const usageFile = path.join(__dirname, config.USAGE_FILE);
      const data = await fs.readFile(usageFile, "utf8");
      this.usageStats = JSON.parse(data);

      // Reset daily count if it's a new day
      const today = new Date().toDateString();
      if (this.usageStats.lastReset !== today) {
        this.usageStats.dailyRequests = 0;
        this.usageStats.lastReset = today;
      }
    } catch (error) {
      // Usage file doesn't exist, start fresh
      if (config.DEBUG_MODE) {
        console.log("No existing usage stats found, starting fresh");
      }
    }
  }

  async saveUsageStats() {
    try {
      const usageFile = path.join(__dirname, config.USAGE_FILE);
      await fs.writeFile(usageFile, JSON.stringify(this.usageStats, null, 2));
    } catch (error) {
      if (config.DEBUG_MODE) {
        console.error("Failed to save usage stats:", error.message);
      }
    }
  }

  getCacheKey(input) {
    // Create a normalized cache key
    return input.trim().toLowerCase();
  }

  get(input) {
    if (!config.ENABLE_CACHE) return null;

    const key = this.getCacheKey(input);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < config.CACHE_DURATION) {
      this.usageStats.cachedHits++;
      return cached.suggestion;
    }

    return null;
  }

  set(input, suggestion) {
    if (!config.ENABLE_CACHE) return;

    const key = this.getCacheKey(input);

    // Remove oldest entries if cache is full
    if (this.cache.size >= config.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      suggestion,
      timestamp: Date.now(),
    });

    this.saveCache();
  }

  canMakeRequest() {
    // Check daily limit
    if (this.usageStats.dailyRequests >= config.MAX_DAILY_REQUESTS) {
      return false;
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastRequestTime < config.REQUEST_COOLDOWN) {
      return false;
    }

    return true;
  }

  recordRequest(tokenCount = 0) {
    this.usageStats.totalRequests++;
    this.usageStats.dailyRequests++;
    this.lastRequestTime = Date.now();

    // Rough cost estimation (Gemini 2.0 Flash pricing)
    // Input: $0.000075 / 1M tokens, Output: $0.0003 / 1M tokens
    const inputCost = (tokenCount * 0.000075) / 1000000;
    const outputCost = (tokenCount * 0.0003) / 1000000;
    this.usageStats.costEstimate += inputCost + outputCost;

    this.saveUsageStats();
  }

  getUsageStats() {
    return {
      ...this.usageStats,
      cacheHitRate:
        this.usageStats.totalRequests > 0
          ? (
              (this.usageStats.cachedHits / this.usageStats.totalRequests) *
              100
            ).toFixed(1)
          : 0,
      estimatedCost: this.usageStats.costEstimate.toFixed(6),
    };
  }

  clearCache() {
    this.cache.clear();
    this.saveCache();
  }

  resetUsageStats() {
    this.usageStats = {
      totalRequests: 0,
      cachedHits: 0,
      dailyRequests: 0,
      lastReset: new Date().toDateString(),
      costEstimate: 0,
    };
    this.saveUsageStats();
  }
}

module.exports = CacheManager;
