const readline = require("readline");
const chalk = require("chalk");
const cliCursor = require("cli-cursor");
const GeminiService = require("./gemini-service");
const config = require("./config");

class EnhancedTerminal {
  constructor() {
    this.geminiService = new GeminiService();
    this.currentInput = "";
    this.suggestion = "";
    this.suggestionTimeout = null;
    this.isProcessing = false;
    this.cursorPosition = 0;

    // Setup readline with custom prompt handling
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
      if (this.currentInput.trim().length < 2) {
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
        if (config.DEBUG_MODE) {
          console.error("Suggestion error:", error.message);
        }
      }
    }, config.SUGGESTION_DELAY);
  }

  redraw() {
    // Clear current line
    process.stdout.write("\r\x1b[K");

    // Draw prompt
    process.stdout.write(chalk.cyan("🤖 Gemini Terminal > "));

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
      chalk.cyan("🤖 Gemini Terminal > ").length + this.cursorPosition;
    process.stdout.write(`\r\x1b[${cursorPos}C`);
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

  showHelp() {
    console.log(chalk.cyan("\n🤖 Enhanced Gemini Terminal Assistant - Help"));
    console.log(chalk.gray("==============================================="));
    console.log(chalk.yellow("Commands:"));
    console.log("  help     - Show this help message");
    console.log("  clear    - Clear the terminal");
    console.log("  exit     - Exit the application");
    console.log("  quit     - Exit the application");
    console.log(chalk.yellow("\nNavigation:"));
    console.log("  Tab      - Accept current suggestion");
    console.log("  ← →      - Move cursor left/right");
    console.log("  Backspace- Delete character");
    console.log("  Enter    - Execute command");
    console.log("  Ctrl+C   - Force exit");
    console.log(chalk.yellow("\nFeatures:"));
    console.log("  • Real-time AI suggestions");
    console.log("  • Inline suggestion display");
    console.log("  • Tab completion");
    console.log("  • Cursor navigation");
    console.log(chalk.gray("\nStart typing to see AI suggestions!"));
  }

  cleanup() {
    cliCursor.show();
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  start() {
    cliCursor.hide();
    console.log(
      chalk.cyan("🤖 Welcome to Enhanced Gemini Terminal Assistant!")
    );
    console.log(
      chalk.gray(
        'Type "help" for commands, or start typing to see AI suggestions.\n'
      )
    );
    this.redraw();
  }
}

module.exports = EnhancedTerminal;
