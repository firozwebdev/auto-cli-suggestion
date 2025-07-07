const readline = require("readline");
const chalk = require("chalk");
const cliCursor = require("cli-cursor");
const OptimizedGeminiService = require("./gemini-service-optimized");
const config = require("./config");

class ContextAwareTerminal {
  constructor() {
    this.geminiService = new OptimizedGeminiService();
    this.currentInput = "";
    this.suggestion = "";
    this.suggestionTimeout = null;
    this.isProcessing = false;
    this.cursorPosition = 0;

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

    // Tab key - accept suggestion
    if (keyCode === 9) {
      this.acceptSuggestion();
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
      // Could implement command history here
    } else if (key === "\u001b[B") {
      // Down arrow
      // Could implement command history here
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
      this.requestSuggestion();
    }
  }

  addCharacter(char) {
    this.currentInput =
      this.currentInput.slice(0, this.cursorPosition) +
      char +
      this.currentInput.slice(this.cursorPosition);
    this.cursorPosition++;
    this.redraw();
    this.requestSuggestion();
  }

  acceptSuggestion() {
    if (this.suggestion) {
      this.currentInput = this.suggestion;
      this.cursorPosition = this.currentInput.length;
      this.suggestion = "";
      this.redraw();
    }
  }

  async requestSuggestion() {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    this.suggestionTimeout = setTimeout(async () => {
      if (this.currentInput.trim().length < config.MIN_INPUT_LENGTH) {
        this.suggestion = "";
        this.redraw();
        return;
      }

      this.isProcessing = true;
      this.redraw();

      try {
        const suggestion = await this.geminiService.getCommandSuggestion(
          this.currentInput
        );
        this.isProcessing = false;

        if (suggestion && suggestion !== this.currentInput) {
          this.suggestion = suggestion;
        } else {
          this.suggestion = "";
        }
        this.redraw();
      } catch (error) {
        this.isProcessing = false;
        this.suggestion = "";
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
      process.stdout.write(chalk.cyan("🤖 AI Terminal > ") + costInfo + " ");

      // Draw input
      process.stdout.write(this.currentInput);

      // Draw suggestion if available
      if (this.suggestion && this.suggestion !== this.currentInput) {
        const remainingSuggestion = this.suggestion.substring(
          this.currentInput.length
        );
        if (remainingSuggestion) {
          process.stdout.write(chalk.gray(remainingSuggestion));
        }
      }

      // Draw processing indicator
      if (this.isProcessing) {
        process.stdout.write(chalk.gray(" 🤔"));
      }

      // Position cursor
      const cursorPos =
        chalk.cyan("🤖 AI Terminal > ").length +
        costInfo.length +
        2 +
        this.cursorPosition;
      process.stdout.write(`\r\x1b[${cursorPos}C`);
    } catch (error) {
      process.stdout.write("\r\x1b[K🤖 AI Terminal > ");
    }
  }

  executeCommand() {
    const command = this.currentInput.trim();

    if (command === "") {
      this.currentInput = "";
      this.cursorPosition = 0;
      this.suggestion = "";
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

    if (command.toLowerCase() === "context") {
      this.showContext();
      this.resetInput();
      return;
    }

    // Add command to recent history
    this.geminiService.addRecentCommand(command);

    // Execute command (demo mode)
    console.log(chalk.green(`\n✅ Executed: ${command}`));
    console.log(
      chalk.gray("(This is a demo - commands are not actually executed)")
    );

    this.resetInput();
  }

  resetInput() {
    this.currentInput = "";
    this.cursorPosition = 0;
    this.suggestion = "";
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
    console.log(chalk.gray('• Use "context" to see current context'));
    console.log(chalk.gray("• Suggestions are context-aware"));
    console.log(chalk.gray("• Daily limit: 100 requests"));
  }

  showContext() {
    const contextDisplay = this.geminiService.getContextDisplay();
    console.log(chalk.cyan("\n🔍 Current Context"));
    console.log(chalk.gray("================"));
    console.log(contextDisplay);
    console.log(
      chalk.gray("\n💡 Context helps AI provide better suggestions!")
    );
  }

  showHelp() {
    console.log(chalk.cyan("\n🤖 Context-Aware AI Terminal - Help"));
    console.log(chalk.gray("===================================="));
    console.log(chalk.yellow("Commands:"));
    console.log("  help     - Show this help message");
    console.log("  clear    - Clear the terminal");
    console.log("  stats    - Show usage statistics");
    console.log("  context  - Show current context info");
    console.log("  exit     - Exit the application");
    console.log("  quit     - Exit the application");
    console.log(chalk.yellow("\nNavigation:"));
    console.log("  Tab      - Accept current suggestion");
    console.log("  ← →      - Move cursor left/right");
    console.log("  Backspace- Delete character");
    console.log("  Enter    - Execute command");
    console.log("  Ctrl+C   - Force exit");
    console.log(chalk.yellow("\nContext Features:"));
    console.log("  • Automatic directory detection");
    console.log("  • Git repository status");
    console.log("  • Node.js project detection");
    console.log("  • Recent command history");
    console.log("  • File and folder context");
    console.log("  • Smart command suggestions");
    console.log(chalk.gray("\nStart typing to see context-aware suggestions!"));
  }

  cleanup() {
    cliCursor.show();
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  start() {
    try {
      cliCursor.hide();
      console.log(chalk.cyan("🤖 Welcome to Context-Aware AI Terminal!"));
      console.log(
        chalk.gray('Type "help" for commands, "context" for context info.\n')
      );
      this.redraw();
    } catch (error) {
      cliCursor.show();
      process.exit(1);
    }
  }
}

module.exports = ContextAwareTerminal;
