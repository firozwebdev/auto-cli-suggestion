#!/usr/bin/env node

const GeminiService = require("./gemini-service");
const OptimizedGeminiService = require("./gemini-service-optimized");
const config = require("./config");
const axios = require("axios");
const chalk = require("chalk");

async function testAPI() {
  console.log(chalk.cyan("🧪 Testing Gemini API Connection...\n"));

  // Use the first key from the array for direct test
  const apiKey = config.GEMINI_API_KEYS[0];
  const apiUrl = config.GEMINI_API_URL;

  const testInputs = [
    "git",
    "npm install",
    "ls -la",
    "docker run",
    "echo hello",
  ];

  for (const input of testInputs) {
    console.log(chalk.yellow(`Testing: "${input}"`));
    try {
      const payload = {
        contents: [
          {
            parts: [
              {
                text: input,
              },
            ],
          },
        ],
      };
      const response = await axios.post(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        timeout: 15000,
      });
      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0]
      ) {
        const suggestion =
          response.data.candidates[0].content.parts[0].text.trim();
        if (suggestion) {
          console.log(chalk.green(`✅ Suggestion: ${suggestion}`));
        } else {
          console.log(chalk.red("❌ No suggestion received"));
        }
      } else {
        console.log(chalk.red("❌ No suggestion received"));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
      if (config.DEBUG_MODE && error.response && error.response.data) {
        console.log(chalk.red(JSON.stringify(error.response.data, null, 2)));
      }
    }
    console.log(""); // Empty line for readability
  }

  console.log(chalk.cyan("🎉 API test completed!"));
  console.log(
    chalk.gray("If all tests passed, your terminal app should work correctly.")
  );
}

testAPI().catch((error) => {
  console.error(chalk.red("❌ Test failed:"), error.message);
  process.exit(1);
});
