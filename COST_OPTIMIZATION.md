# 💰 Cost Optimization Guide

## 🎯 Why Cost Optimization Matters

Gemini API costs can add up quickly with frequent usage. This guide shows you how to use the terminal app efficiently while minimizing costs.

## 🚀 Cost Optimization Features

### 1. **Smart Caching System**

- **What it does**: Stores suggestions for 1 hour to avoid duplicate API calls
- **Cost savings**: Up to 90% reduction in API calls for repeated inputs
- **How it works**: When you type the same command again, it uses cached results

### 2. **Rate Limiting**

- **Request cooldown**: 5 seconds between API calls
- **Daily limit**: 100 requests per day (configurable)
- **Minimum input**: 3 characters before requesting suggestions

### 3. **Optimized Prompts**

- **Shorter prompts**: Reduced from 50+ words to 10-15 words
- **Token efficiency**: ~60% fewer tokens per request
- **Focused responses**: Only command suggestions, no explanations

### 4. **Real-time Cost Tracking**

- **Live cost display**: Shows current cost in the prompt
- **Usage statistics**: Track total requests, cache hits, and estimated costs
- **Daily monitoring**: Reset counters daily to track usage patterns

## 📊 Cost Breakdown

### Gemini 2.0 Flash Pricing (as of 2024)

- **Input tokens**: $0.000075 per 1M tokens
- **Output tokens**: $0.0003 per 1M tokens

### Typical Costs

- **Basic suggestion**: ~$0.000001-0.000005 per request
- **With caching**: ~$0.000001 per 10 requests (same input)
- **Daily usage (100 requests)**: ~$0.0001-0.0005

## ⚙️ Configuration Options

Edit `config.js` to customize cost controls:

```javascript
// Cost Optimization Settings
SUGGESTION_DELAY: 2000,        // Delay before requesting suggestions (ms)
MIN_INPUT_LENGTH: 3,           // Minimum characters before requesting
MAX_SUGGESTION_LENGTH: 30,     // Maximum suggestion length
ENABLE_SUGGESTIONS: true,      // Toggle suggestions on/off
MAX_DAILY_REQUESTS: 100,       // Daily request limit
REQUEST_COOLDOWN: 5000,        // Cooldown between requests (ms)

// Caching Settings
ENABLE_CACHE: true,            // Enable suggestion caching
CACHE_DURATION: 3600000,       // Cache duration in ms (1 hour)
MAX_CACHE_SIZE: 1000,          // Maximum cached suggestions
```

## 🎮 How to Use Cost-Optimized Mode

### Starting the Mode

```bash
npm run optimized
# or
npm run launch  # then choose option 3
```

### Available Commands

- `stats` - Show usage statistics and costs
- `cache` - Show cache information and hit rates
- `help` - Show all available commands

### Cost Monitoring

The prompt shows real-time cost: `🤖 Gemini Terminal > [$0.000123]`

## 💡 Cost-Saving Tips

### 1. **Use Caching Effectively**

- Type the same commands multiple times to build cache
- Common commands like `git`, `npm`, `ls` will be cached quickly
- Check cache hit rate with `cache` command

### 2. **Optimize Your Workflow**

- Use Tab completion to accept suggestions quickly
- Type at least 3 characters before expecting suggestions
- Wait 2 seconds between different commands

### 3. **Monitor Usage**

- Check `stats` regularly to track costs
- Set daily limits based on your budget
- Use `cache` command to see cache effectiveness

### 4. **Disable When Not Needed**

```javascript
// In config.js
ENABLE_SUGGESTIONS: false,  // Turn off suggestions completely
```

## 🔧 Advanced Configuration

### Custom Daily Limits

```javascript
MAX_DAILY_REQUESTS: 50,  // Reduce to 50 requests per day
```

### Longer Cache Duration

```javascript
CACHE_DURATION: 7200000,  // Cache for 2 hours instead of 1
```

### Shorter Cooldown (Use with caution)

```javascript
REQUEST_COOLDOWN: 2000,  // 2 seconds between requests
```

## 📈 Performance Metrics

### Expected Results

- **Cache hit rate**: 70-90% after regular usage
- **Cost reduction**: 60-90% compared to no caching
- **Response time**: Faster for cached suggestions
- **API calls**: 70-90% reduction in actual API requests

### Monitoring Your Usage

```bash
# Check current stats
stats

# Example output:
📊 Usage Statistics
==================
Total Requests: 45
Daily Requests: 23/100
Cache Hit Rate: 78.3%
Estimated Cost: $0.000234
Cache Hits: 35
```

## 🚨 Cost Alerts

### Warning Signs

- Daily requests approaching limit
- Low cache hit rate (<50%)
- High estimated costs (>$0.001)

### Solutions

1. **Increase cache duration** for better hit rates
2. **Reduce daily limit** if costs are too high
3. **Disable suggestions** temporarily
4. **Use basic mode** instead of enhanced mode

## 🎯 Best Practices

1. **Start with cost-optimized mode** for new users
2. **Monitor stats weekly** to track usage patterns
3. **Adjust limits** based on your actual usage
4. **Use caching** by repeating common commands
5. **Set reasonable daily limits** based on your budget

## 💰 Cost Comparison

| Mode           | Requests/Day | Estimated Cost  | Cache Hit Rate |
| -------------- | ------------ | --------------- | -------------- |
| Basic          | 50-100       | $0.0001-0.0005  | 0%             |
| Enhanced       | 50-100       | $0.0001-0.0005  | 0%             |
| Cost-Optimized | 20-50        | $0.00005-0.0002 | 70-90%         |

## 🔄 Migration Guide

### From Basic/Enhanced to Cost-Optimized

1. **Install dependencies**: `npm install`
2. **Start launcher**: `npm run launch`
3. **Choose option 3**: Cost-Optimized Mode
4. **Monitor stats**: Use `stats` command regularly
5. **Adjust settings**: Modify `config.js` as needed

---

**💡 Remember**: The goal is to get the most value from AI suggestions while keeping costs minimal. Start with conservative limits and adjust based on your actual usage patterns!
