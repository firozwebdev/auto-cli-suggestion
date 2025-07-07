#!/usr/bin/env node

const readline = require("readline");
const chalk = require("chalk");
const TerminalInterface = require("./terminal-interface");
const EnhancedTerminal = require("./enhanced-terminal");
const CostOptimizedTerminal = require("./cost-optimized-terminal");
const ContextAwareTerminal = require("./context-aware-terminal");
const MLEnhancedTerminal = require("./ml-enhanced-terminal");
const config = require("./config");

class Launcher {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async showMenu() {
    console.clear();
    console.log(chalk.cyan("🤖 Gemini Terminal Assistant - Launcher"));
    console.log(chalk.gray("========================================\n"));

    console.log(chalk.yellow("Choose your terminal mode:\n"));
    console.log(chalk.white("1. ") + chalk.cyan("Basic Mode"));
    console.log(chalk.gray("   • Simple command suggestions"));
    console.log(chalk.gray("   • Standard terminal experience"));
    console.log(chalk.gray("   • Good for beginners\n"));

    console.log(chalk.white("2. ") + chalk.cyan("Enhanced Mode"));
    console.log(chalk.gray("   • Real-time inline suggestions"));
    console.log(chalk.gray("   • Tab completion"));
    console.log(chalk.gray("   • Cursor navigation"));
    console.log(chalk.gray("   • Advanced terminal experience\n"));

    console.log(chalk.white("3. ") + chalk.cyan("Cost-Optimized Mode"));
    console.log(chalk.gray("   • Smart caching system"));
    console.log(chalk.gray("   • Usage tracking & cost monitoring"));
    console.log(chalk.gray("   • Rate limiting & daily limits"));
    console.log(chalk.gray("   • Best for cost-conscious users\n"));

    console.log(chalk.white("4. ") + chalk.cyan("Context-Aware Mode"));
    console.log(chalk.gray("   • Directory & Git context detection"));
    console.log(chalk.gray("   • Node.js project awareness"));
    console.log(chalk.gray("   • Recent command history"));
    console.log(chalk.gray("   • Smart contextual suggestions\n"));

    console.log(chalk.white("5. ") + chalk.cyan("ML-Enhanced Mode"));
    console.log(chalk.gray("   • Machine learning pattern recognition"));
    console.log(chalk.gray("   • Semantic similarity matching"));
    console.log(chalk.gray("   • Workflow learning & adaptation"));
    console.log(chalk.gray("   • Multi-source suggestions (ML + AI)\n"));

    console.log(chalk.white("6. ") + chalk.red("Exit"));
    console.log(chalk.gray("   • Close the application\n"));
  }

  async getUserChoice() {
    return new Promise((resolve) => {
      this.rl.question(chalk.yellow("Enter your choice (1-6): "), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async launch() {
    // Check API key(s) first
    if (
      !Array.isArray(config.GEMINI_API_KEYS) ||
      config.GEMINI_API_KEYS.length === 0 ||
      !config.GEMINI_API_KEYS[0] ||
      config.GEMINI_API_KEYS[0] === "YOUR_API_KEY_HERE"
    ) {
      console.error(
        chalk.red(
          "❌ Error: Please configure at least one Gemini API key in config.js (GEMINI_API_KEYS array)"
        )
      );
      console.log(chalk.white("📝 Steps:"));
      console.log(
        chalk.gray(
          "1. Get your API key from https://makersuite.google.com/app/apikey"
        )
      );
      console.log(
        chalk.gray("2. Add it to the GEMINI_API_KEYS array in config.js")
      );
      console.log(chalk.gray("3. Run: node launcher.js"));
      process.exit(1);
    }

    while (true) {
      await this.showMenu();
      const choice = await this.getUserChoice();

      switch (choice) {
        case "1":
          console.log(chalk.green("\n🚀 Starting Basic Mode...\n"));
          this.rl.close();
          const basicTerminal = new TerminalInterface();
          basicTerminal.start();
          return;

        case "2":
          console.log(chalk.green("\n🚀 Starting Enhanced Mode...\n"));
          this.rl.close();
          const enhancedTerminal = new EnhancedTerminal();
          enhancedTerminal.start();
          return;

        case "3":
          console.log(chalk.green("\n🚀 Starting Cost-Optimized Mode...\n"));
          this.rl.close();
          const costOptimizedTerminal = new CostOptimizedTerminal();
          costOptimizedTerminal.start();
          return;

        case "4":
          console.log(chalk.green("\n🚀 Starting Context-Aware Mode...\n"));
          this.rl.close();
          const contextAwareTerminal = new ContextAwareTerminal();
          contextAwareTerminal.start();
          return;

        case "5":
          console.log(chalk.green("\n🚀 Starting ML-Enhanced Mode...\n"));
          this.rl.close();
          const mlEnhancedTerminal = new MLEnhancedTerminal();
          mlEnhancedTerminal.start();
          return;

        case "6":
          console.log(chalk.cyan("\n👋 Goodbye!"));
          this.rl.close();
          process.exit(0);

        default:
          console.log(
            chalk.red("\n❌ Invalid choice. Please enter 1, 2, 3, 4, 5, or 6.")
          );
          await this.wait(2000);
      }
    }
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(chalk.red("❌ Uncaught Exception:"), error.message);
  if (config.DEBUG_MODE) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    chalk.red("❌ Unhandled Rejection at:"),
    promise,
    "reason:",
    reason
  );
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log(chalk.cyan("\n👋 Shutting down gracefully..."));
  process.exit(0);
});

// Start the launcher
const launcher = new Launcher();
launcher.launch().catch((error) => {
  console.error(chalk.red("❌ Failed to start launcher:"), error.message);
  if (config.DEBUG_MODE) {
    console.error(error.stack);
  }
  process.exit(1);
});
