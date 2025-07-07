#!/usr/bin/env node

const GeminiService = require("./gemini-service");
const chalk = require("chalk");

async function testAPI() {
  console.log(chalk.cyan("🧪 Testing Gemini API Connection...\n"));

  const geminiService = new GeminiService();

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
      const suggestion = await geminiService.getCommandSuggestion(input);

      if (suggestion) {
        console.log(chalk.green(`✅ Suggestion: ${suggestion}`));
      } else {
        console.log(chalk.red("❌ No suggestion received"));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }

    console.log(""); // Empty line for readability
  }

  console.log(chalk.cyan("🎉 API test completed!"));
  console.log(
    chalk.gray("If all tests passed, your terminal app should work correctly.")
  );
}

// Run the test
testAPI().catch((error) => {
  console.error(chalk.red("❌ Test failed:"), error.message);
  process.exit(1);
});
