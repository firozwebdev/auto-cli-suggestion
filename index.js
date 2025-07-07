#!/usr/bin/env node

const TerminalInterface = require("./terminal-interface");
const config = require("./config");

// Check if API key is configured
if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
  console.error("❌ Error: Please configure your Gemini API key in config.js");
  console.log("📝 Steps:");
  console.log(
    "1. Get your API key from https://makersuite.google.com/app/apikey"
  );
  console.log("2. Update the GEMINI_API_KEY in config.js");
  console.log("3. Run: npm start");
  process.exit(1);
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  if (config.DEBUG_MODE) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

// Start the application
try {
  const terminal = new TerminalInterface();
  terminal.start();
} catch (error) {
  console.error("❌ Failed to start terminal:", error.message);
  if (config.DEBUG_MODE) {
    console.error(error.stack);
  }
  process.exit(1);
}
