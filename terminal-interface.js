const readline = require("readline");
const chalk = require("chalk");
const cliCursor = require("cli-cursor");
const stripAnsi = require("strip-ansi");
const GeminiService = require("./gemini-service");
const config = require("./config");

class TerminalInterface {
  constructor() {
    this.geminiService = new GeminiService();
    this.currentInput = "";
    this.suggestion = "";
    this.suggestionTimeout = null;
    this.isProcessing = false;

    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "🤖 Gemini Terminal > ",
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle input
    this.rl.on("line", (input) => {
      this.handleInput(input);
    });

    // Handle Ctrl+C
    this.rl.on("SIGINT", () => {
      console.log("\n👋 Goodbye!");
      process.exit(0);
    });

    // Handle Ctrl+D
    this.rl.on("SIGTERM", () => {
      console.log("\n👋 Goodbye!");
      process.exit(0);
    });
  }

  async handleInput(input) {
    const trimmedInput = input.trim();

    if (trimmedInput === "") {
      this.displayPrompt();
      return;
    }

    if (
      trimmedInput.toLowerCase() === "exit" ||
      trimmedInput.toLowerCase() === "quit"
    ) {
      console.log("👋 Goodbye!");
      process.exit(0);
    }

    if (trimmedInput.toLowerCase() === "help") {
      this.showHelp();
      this.displayPrompt();
      return;
    }

    if (trimmedInput.toLowerCase() === "clear") {
      console.clear();
      this.displayPrompt();
      return;
    }

    // Execute the command (in a real app, you might want to actually execute it)
    console.log(chalk.green(`\n✅ Executed: ${trimmedInput}`));
    console.log(
      chalk.gray("(This is a demo - commands are not actually executed)")
    );

    this.displayPrompt();
  }

  showHelp() {
    console.log(chalk.cyan("\n🤖 Gemini Terminal Assistant - Help"));
    console.log(chalk.gray("====================================="));
    console.log(chalk.yellow("Commands:"));
    console.log("  help     - Show this help message");
    console.log("  clear    - Clear the terminal");
    console.log("  exit     - Exit the application");
    console.log("  quit     - Exit the application");
    console.log(chalk.yellow("\nFeatures:"));
    console.log("  • AI-powered command suggestions");
    console.log("  • Intelligent auto-completion");
    console.log("  • Real-time Gemini API integration");
    console.log(chalk.gray("\nStart typing to see AI suggestions!"));
  }

  displayPrompt() {
    this.rl.prompt();
  }

  async requestSuggestion(input) {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    this.suggestionTimeout = setTimeout(async () => {
      if (input.trim().length < 2) return;

      this.isProcessing = true;
      this.showProcessingIndicator();

      try {
        const suggestion = await this.geminiService.getCommandSuggestion(input);
        this.isProcessing = false;

        if (suggestion) {
          this.suggestion = suggestion;
          this.displaySuggestion(input, suggestion);
        }
      } catch (error) {
        this.isProcessing = false;
        if (config.DEBUG_MODE) {
          console.error("Suggestion error:", error.message);
        }
      }
    }, config.SUGGESTION_DELAY);
  }

  showProcessingIndicator() {
    if (config.ENABLE_COLORS) {
      process.stdout.write(chalk.gray(" 🤔 Thinking..."));
    } else {
      process.stdout.write(" 🤔 Thinking...");
    }
  }

  displaySuggestion(input, suggestion) {
    // Clear the processing indicator
    process.stdout.write("\r");

    // Display the suggestion in a subtle way
    const suggestionText = chalk.gray(`💡 Suggestion: ${suggestion}`);
    console.log(suggestionText);

    // Re-display the prompt with current input
    this.rl.prompt();
  }

  start() {
    cliCursor.hide();
    console.log(chalk.cyan("🤖 Welcome to Gemini Terminal Assistant!"));
    console.log(
      chalk.gray(
        'Type "help" for commands, or start typing to see AI suggestions.\n'
      )
    );
    this.displayPrompt();
  }
}

module.exports = TerminalInterface;
