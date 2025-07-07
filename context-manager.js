const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const chalk = require("chalk");

const execAsync = promisify(exec);

class ContextManager {
  constructor() {
    this.currentDirectory = process.cwd();
    this.recentCommands = [];
    this.fileContext = [];
    this.gitContext = null;
    this.nodeContext = null;
    this.maxRecentCommands = 10;
    this.maxFileContext = 20;
  }

  async updateContext() {
    try {
      // Update current directory
      this.currentDirectory = process.cwd();

      // Update file context
      await this.updateFileContext();

      // Update Git context
      await this.updateGitContext();

      // Update Node.js context
      await this.updateNodeContext();
    } catch (error) {
      if (process.env.DEBUG) {
        console.error("Context update error:", error.message);
      }
    }
  }

  async updateFileContext() {
    try {
      const files = await fs.readdir(this.currentDirectory);
      const fileStats = await Promise.all(
        files.slice(0, this.maxFileContext).map(async (file) => {
          try {
            const filePath = path.join(this.currentDirectory, file);
            const stat = await fs.stat(filePath);
            return {
              name: file,
              isDirectory: stat.isDirectory(),
              size: stat.size,
              modified: stat.mtime,
            };
          } catch (error) {
            return {
              name: file,
              isDirectory: false,
              size: 0,
              modified: new Date(),
            };
          }
        })
      );

      this.fileContext = fileStats;
    } catch (error) {
      this.fileContext = [];
    }
  }

  async updateGitContext() {
    try {
      const { stdout } = await execAsync("git status --porcelain", {
        cwd: this.currentDirectory,
      });
      const { stdout: branchOutput } = await execAsync(
        "git branch --show-current",
        { cwd: this.currentDirectory }
      );

      this.gitContext = {
        hasChanges: stdout.trim().length > 0,
        changes: stdout
          .trim()
          .split("\n")
          .filter((line) => line.length > 0),
        currentBranch: branchOutput.trim(),
        isGitRepo: true,
      };
    } catch (error) {
      this.gitContext = { isGitRepo: false };
    }
  }

  async updateNodeContext() {
    try {
      const packageJsonPath = path.join(this.currentDirectory, "package.json");
      const packageJson = await fs.readFile(packageJsonPath, "utf8");
      const packageData = JSON.parse(packageJson);

      this.nodeContext = {
        hasPackageJson: true,
        name: packageData.name,
        scripts: packageData.scripts || {},
        dependencies: Object.keys(packageData.dependencies || {}),
        devDependencies: Object.keys(packageData.devDependencies || {}),
      };
    } catch (error) {
      this.nodeContext = { hasPackageJson: false };
    }
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

  getContextSummary() {
    const context = {
      directory: path.basename(this.currentDirectory),
      fullPath: this.currentDirectory,
      recentCommands: this.recentCommands.slice(0, 3), // Last 3 commands
      fileCount: this.fileContext.length,
      directories: this.fileContext.filter((f) => f.isDirectory).length,
      files: this.fileContext.filter((f) => !f.isDirectory).length,
      git: this.gitContext,
      node: this.nodeContext,
    };

    return context;
  }

  buildContextPrompt(userInput) {
    const context = this.getContextSummary();
    let prompt = `Context: Working in "${context.directory}" directory. `;

    // Add Git context
    if (context.git && context.git.isGitRepo) {
      prompt += `Git repo on branch "${context.git.currentBranch}". `;
      if (context.git.hasChanges) {
        prompt += `Has uncommitted changes. `;
      }
    }

    // Add Node.js context
    if (context.node && context.node.hasPackageJson) {
      prompt += `Node.js project "${context.node.name}". `;
      const scriptCount = Object.keys(context.node.scripts).length;
      if (scriptCount > 0) {
        prompt += `Has ${scriptCount} npm scripts. `;
      }
    }

    // Add recent commands context
    if (context.recentCommands && context.recentCommands.length > 0) {
      prompt += `Recent commands: ${context.recentCommands.join(", ")}. `;
    }

    // Add file context
    if (context.files > 0 || context.directories > 0) {
      prompt += `Directory has ${context.files} files, ${context.directories} folders. `;
    }

    // Add user input
    prompt += `User input: "${userInput}". `;
    prompt += `Suggest the most relevant command completion (${config.MAX_SUGGESTION_LENGTH} chars max).`;

    return prompt;
  }

  getDirectoryType() {
    if (this.nodeContext && this.nodeContext.hasPackageJson) return "nodejs";
    if (this.gitContext && this.gitContext.isGitRepo) return "git";
    if (
      this.fileContext &&
      this.fileContext.some((f) => f.name.includes(".py"))
    )
      return "python";
    if (
      this.fileContext &&
      this.fileContext.some((f) => f.name.includes(".java"))
    )
      return "java";
    if (
      this.fileContext &&
      this.fileContext.some(
        (f) => f.name.includes(".cpp") || f.name.includes(".c")
      )
    )
      return "cpp";
    if (
      this.fileContext &&
      this.fileContext.some(
        (f) => f.name.includes(".html") || f.name.includes(".js")
      )
    )
      return "web";
    return "general";
  }

  getRelevantCommands() {
    const dirType = this.getDirectoryType();
    const commands = {
      nodejs: [
        "npm install",
        "npm start",
        "npm run dev",
        "npm test",
        "npm run build",
      ],
      git: ["git status", "git add .", "git commit", "git push", "git pull"],
      python: ["python", "pip install", "python -m venv", "python manage.py"],
      java: ["javac", "java", "mvn", "gradle"],
      cpp: ["g++", "make", "cmake", "./a.out"],
      web: ["npm install", "npm start", "npx", "yarn"],
      general: ["ls", "cd", "mkdir", "rm", "cp", "mv"],
    };

    return commands[dirType] || commands.general;
  }

  async getContextualSuggestion(userInput) {
    await this.updateContext();

    const context = this.getContextSummary();
    const relevantCommands = this.getRelevantCommands();

    // Check if input matches any relevant commands
    const matchingCommands = relevantCommands.filter((cmd) =>
      cmd.toLowerCase().startsWith(userInput.toLowerCase())
    );

    if (matchingCommands.length > 0) {
      return matchingCommands[0];
    }

    // Build context-aware prompt
    const contextPrompt = this.buildContextPrompt(userInput);

    return {
      prompt: contextPrompt,
      context: context,
    };
  }

  getContextDisplay() {
    const context = this.getContextSummary();
    let display = chalk.cyan(`📁 ${context.directory}`);

    if (context.git && context.git.isGitRepo) {
      display += chalk.green(` [git:${context.git.currentBranch}]`);
    }

    if (context.node && context.node.hasPackageJson) {
      display += chalk.yellow(` [node:${context.node.name}]`);
    }

    display += chalk.gray(` (${context.files}f, ${context.directories}d)`);

    return display;
  }
}

module.exports = ContextManager;
