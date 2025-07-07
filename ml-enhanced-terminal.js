const readline = require("readline");
const chalk = require("chalk");
const cliCursor = require("cli-cursor");
const OptimizedGeminiService = require("./gemini-service-optimized");
const MLSuggestionEngine = require("./ml-suggestion-engine");
const config = require("./config");

class MLEnhancedTerminal {
  constructor() {
    this.geminiService = new OptimizedGeminiService();
    this.mlEngine = new MLSuggestionEngine();
    this.currentInput = "";
    this.suggestions = [];
    this.selectedSuggestionIndex = 0;
    this.suggestionTimeout = null;
    this.isProcessing = false;
    this.cursorPosition = 0;
    this.recentCommands = [];
    this.maxRecentCommands = 20;

    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "",
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle raw input for better control
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (key) => {
      this.handleKeyPress(key);
    });

    // Handle process termination
    process.on("SIGINT", () => {
      this.cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      this.cleanup();
      process.exit(0);
    });
  }

  handleKeyPress(key) {
    const keyCode = key.charCodeAt(0);

    // Ctrl+C
    if (keyCode === 3) {
      this.cleanup();
      process.exit(0);
    }

    // Enter key
    if (keyCode === 13) {
      this.executeCommand();
      return;
    }

    // Backspace
    if (keyCode === 127) {
      this.handleBackspace();
      return;
    }

    // Tab key - cycle through suggestions
    if (keyCode === 9) {
      this.cycleSuggestions();
      return;
    }

    // Arrow keys
    if (keyCode === 27 && key.length > 1) {
      this.handleArrowKeys(key);
      return;
    }

    // Regular character input
    if (keyCode >= 32 && keyCode <= 126) {
      this.addCharacter(key);
    }
  }

  handleArrowKeys(key) {
    if (key === "\u001b[A") {
      // Up arrow
      this.cycleSuggestions(-1);
    } else if (key === "\u001b[B") {
      // Down arrow
      this.cycleSuggestions(1);
    } else if (key === "\u001b[C") {
      // Right arrow
      if (this.cursorPosition < this.currentInput.length) {
        this.cursorPosition++;
        this.redraw();
      }
    } else if (key === "\u001b[D") {
      // Left arrow
      if (this.cursorPosition > 0) {
        this.cursorPosition--;
        this.redraw();
      }
    }
  }

  handleBackspace() {
    if (this.cursorPosition > 0) {
      this.currentInput =
        this.currentInput.slice(0, this.cursorPosition - 1) +
        this.currentInput.slice(this.cursorPosition);
      this.cursorPosition--;
      this.redraw();
      this.requestSuggestions();
    }
  }

  addCharacter(char) {
    this.currentInput =
      this.currentInput.slice(0, this.cursorPosition) +
      char +
      this.currentInput.slice(this.cursorPosition);
    this.cursorPosition++;
    this.redraw();
    this.requestSuggestions();
  }

  cycleSuggestions(direction = 1) {
    if (this.suggestions.length > 0) {
      this.selectedSuggestionIndex =
        (this.selectedSuggestionIndex + direction + this.suggestions.length) %
        this.suggestions.length;
      this.redraw();
    }
  }

  async requestSuggestions() {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    this.suggestionTimeout = setTimeout(async () => {
      if (this.currentInput.trim().length < config.MIN_INPUT_LENGTH) {
        this.suggestions = [];
        this.selectedSuggestionIndex = 0;
        this.redraw();
        return;
      }

      this.isProcessing = true;
      this.redraw();

      try {
        // Get context
        const context = this.geminiService.getContextDisplay();

        // Get ML-based suggestions
        const mlSuggestions = await this.mlEngine.getContextualSuggestions(
          this.currentInput,
          { git: { isGitRepo: true }, node: { hasPackageJson: true } }, // Simplified context
          this.recentCommands
        );

        // Get Gemini AI suggestions
        const aiSuggestion = await this.geminiService.getCommandSuggestion(
          this.currentInput
        );

        // Combine suggestions
        this.suggestions = [];

        // Add ML suggestions
        mlSuggestions.forEach((suggestion) => {
          this.suggestions.push({
            command: suggestion.command,
            type: suggestion.type,
            category: suggestion.category,
            score: suggestion.score,
            source: "ML",
          });
        });

        // Add AI suggestion if different
        if (
          aiSuggestion &&
          !this.suggestions.some((s) => s.command === aiSuggestion)
        ) {
          this.suggestions.push({
            command: aiSuggestion,
            type: "ai",
            category: "gemini",
            score: 0.8,
            source: "AI",
          });
        }

        this.selectedSuggestionIndex = 0;
        this.isProcessing = false;
        this.redraw();
      } catch (error) {
        this.isProcessing = false;
        this.suggestions = [];
        this.redraw();
      }
    }, config.SUGGESTION_DELAY);
  }

  redraw() {
    try {
      // Clear current line
      process.stdout.write("\r\x1b[K");

      // Draw context info
      const contextDisplay = this.geminiService.getContextDisplay();
      process.stdout.write(contextDisplay + "\n");

      // Draw prompt with cost info
      const usageStats = this.geminiService.getUsageStats();
      const costInfo = chalk.gray(`[$${usageStats.estimatedCost}]`);
      process.stdout.write(chalk.cyan("🤖 ML Terminal > ") + costInfo + " ");

      // Draw input
      process.stdout.write(this.currentInput);

      // Draw current suggestion if available
      if (
        this.suggestions.length > 0 &&
        this.selectedSuggestionIndex < this.suggestions.length
      ) {
        const currentSuggestion =
          this.suggestions[this.selectedSuggestionIndex];
        const remainingSuggestion = currentSuggestion.command.substring(
          this.currentInput.length
        );
        if (remainingSuggestion) {
          const sourceColor =
            currentSuggestion.source === "ML" ? chalk.blue : chalk.magenta;
          process.stdout.write(sourceColor(remainingSuggestion));
        }
      }

      // Draw processing indicator
      if (this.isProcessing) {
        process.stdout.write(chalk.gray(" 🤔"));
      }

      // Draw suggestion info
      if (this.suggestions.length > 1) {
        const current = this.selectedSuggestionIndex + 1;
        const total = this.suggestions.length;
        process.stdout.write(chalk.gray(` [${current}/${total}]`));
      }

      // Position cursor
      const cursorPos =
        chalk.cyan("🤖 ML Terminal > ").length +
        costInfo.length +
        2 +
        this.cursorPosition;
      process.stdout.write(`\r\x1b[${cursorPos}C`);
    } catch (error) {
      process.stdout.write("\r\x1b[K🤖 ML Terminal > ");
    }
  }

  executeCommand() {
    const command = this.currentInput.trim();

    if (command === "") {
      this.currentInput = "";
      this.cursorPosition = 0;
      this.suggestions = [];
      this.selectedSuggestionIndex = 0;
      this.redraw();
      return;
    }

    if (command.toLowerCase() === "exit" || command.toLowerCase() === "quit") {
      this.cleanup();
      console.log("\n👋 Goodbye!");
      process.exit(0);
    }

    if (command.toLowerCase() === "help") {
      this.showHelp();
      this.resetInput();
      return;
    }

    if (command.toLowerCase() === "clear") {
      console.clear();
      this.resetInput();
      return;
    }

    if (command.toLowerCase() === "stats") {
      this.showStats();
      this.resetInput();
      return;
    }

    if (command.toLowerCase() === "ml-stats") {
      this.showMLStats();
      this.resetInput();
      return;
    }

    if (command.toLowerCase() === "suggestions") {
      this.showSuggestions();
      this.resetInput();
      return;
    }

    // Add command to recent history
    this.addRecentCommand(command);

    // Learn from user action
    this.mlEngine.learnFromUserAction(this.currentInput, command, true);

    // Execute command (demo mode)
    console.log(chalk.green(`\n✅ Executed: ${command}`));
    console.log(
      chalk.gray("(This is a demo - commands are not actually executed)")
    );

    this.resetInput();
  }

  addRecentCommand(command) {
    this.recentCommands.unshift(command);
    if (this.recentCommands.length > this.maxRecentCommands) {
      this.recentCommands = this.recentCommands.slice(
        0,
        this.maxRecentCommands
      );
    }
  }

  resetInput() {
    this.currentInput = "";
    this.cursorPosition = 0;
    this.suggestions = [];
    this.selectedSuggestionIndex = 0;
    this.redraw();
  }

  showStats() {
    const stats = this.geminiService.getUsageStats();
    console.log(chalk.cyan("\n📊 Usage Statistics"));
    console.log(chalk.gray("=================="));
    console.log(chalk.yellow("Total Requests:"), stats.totalRequests);
    console.log(
      chalk.yellow("Daily Requests:"),
      `${stats.dailyRequests}/${config.MAX_DAILY_REQUESTS}`
    );
    console.log(chalk.yellow("Cache Hit Rate:"), `${stats.cacheHitRate}%`);
    console.log(chalk.yellow("Estimated Cost:"), `$${stats.estimatedCost}`);
    console.log(chalk.yellow("Cache Hits:"), stats.cachedHits);
    console.log(chalk.gray("\n💡 Tips:"));
    console.log(chalk.gray('• Use "ml-stats" to see ML learning stats'));
    console.log(chalk.gray('• Use "suggestions" to see current suggestions'));
    console.log(chalk.gray("• Tab to cycle through suggestions"));
  }

  showMLStats() {
    const mlStats = this.mlEngine.getLearningStats();
    console.log(chalk.cyan("\n🧠 ML Learning Statistics"));
    console.log(chalk.gray("========================"));
    console.log(chalk.yellow("Total Actions:"), mlStats.totalActions);
    console.log(
      chalk.yellow("Success Rate:"),
      `${(mlStats.successRate * 100).toFixed(1)}%`
    );
    console.log(
      chalk.yellow("Learning Accuracy:"),
      `${(mlStats.learningAccuracy * 100).toFixed(1)}%`
    );

    if (mlStats.mostUsedPatterns.length > 0) {
      console.log(chalk.yellow("\nMost Used Patterns:"));
      mlStats.mostUsedPatterns.forEach((pattern, index) => {
        console.log(
          chalk.gray(
            `  ${index + 1}. ${pattern.pattern} (${pattern.count} times)`
          )
        );
      });
    }

    console.log(
      chalk.gray("\n💡 The ML engine learns from your command patterns!")
    );
  }

  showSuggestions() {
    if (this.suggestions.length === 0) {
      console.log(
        chalk.gray(
          "\nNo suggestions available. Start typing to see suggestions!"
        )
      );
      return;
    }

    console.log(chalk.cyan("\n💡 Current Suggestions"));
    console.log(chalk.gray("===================="));

    this.suggestions.forEach((suggestion, index) => {
      const isSelected = index === this.selectedSuggestionIndex;
      const prefix = isSelected ? chalk.green("→ ") : chalk.gray("  ");
      const sourceColor =
        suggestion.source === "ML" ? chalk.blue : chalk.magenta;
      const score = chalk.gray(`(${(suggestion.score * 100).toFixed(0)}%)`);

      console.log(
        `${prefix}${suggestion.command} ${sourceColor(
          `[${suggestion.source}]`
        )} ${score}`
      );
    });

    console.log(chalk.gray("\n💡 Use Tab to cycle through suggestions"));
  }

  showHelp() {
    console.log(chalk.cyan("\n🤖 ML-Enhanced AI Terminal - Help"));
    console.log(chalk.gray("=================================="));
    console.log(chalk.yellow("Commands:"));
    console.log("  help         - Show this help message");
    console.log("  clear        - Clear the terminal");
    console.log("  stats        - Show usage statistics");
    console.log("  ml-stats     - Show ML learning statistics");
    console.log("  suggestions  - Show current suggestions");
    console.log("  exit         - Exit the application");
    console.log("  quit         - Exit the application");
    console.log(chalk.yellow("\nNavigation:"));
    console.log("  Tab          - Cycle through suggestions");
    console.log("  ↑ ↓          - Navigate suggestions");
    console.log("  ← →          - Move cursor left/right");
    console.log("  Backspace    - Delete character");
    console.log("  Enter        - Execute command");
    console.log("  Ctrl+C       - Force exit");
    console.log(chalk.yellow("\nML Features:"));
    console.log("  • Pattern recognition from your workflow");
    console.log("  • Semantic similarity matching");
    console.log("  • Context-aware suggestions");
    console.log("  • Learning from your command history");
    console.log("  • Multiple suggestion sources (ML + AI)");
    console.log(chalk.gray("\nStart typing to see ML-powered suggestions!"));
  }

  cleanup() {
    cliCursor.show();
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  start() {
    try {
      cliCursor.hide();
      console.log(chalk.cyan("🤖 Welcome to ML-Enhanced AI Terminal!"));
      console.log(
        chalk.gray('Type "help" for commands, "ml-stats" for learning info.\n')
      );
      this.redraw();
    } catch (error) {
      cliCursor.show();
      process.exit(1);
    }
  }
}

module.exports = MLEnhancedTerminal;
