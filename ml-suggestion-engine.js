const natural = require("natural");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");

const execAsync = promisify(exec);

class MLSuggestionEngine {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.commandPatterns = new Map();
    this.userBehaviorModel = new Map();
    this.similarityThreshold = 0.7;
    this.maxSuggestions = 5;

    // Initialize command patterns
    this.initializeCommandPatterns();
  }

  initializeCommandPatterns() {
    // Git workflow patterns
    this.commandPatterns.set("git_workflow", {
      patterns: [
        { input: "git status", next: ["git add .", "git commit", "git push"] },
        { input: "git add", next: ["git add .", "git add -A", "git commit"] },
        { input: "git commit", next: ["git push", "git log", "git status"] },
        { input: "git push", next: ["git pull", "git status", "git log"] },
      ],
      weight: 0.9,
    });

    // Node.js development patterns
    this.commandPatterns.set("nodejs_workflow", {
      patterns: [
        {
          input: "npm install",
          next: ["npm start", "npm run dev", "npm test"],
        },
        {
          input: "npm start",
          next: ["npm run dev", "npm test", "npm run build"],
        },
        {
          input: "npm run dev",
          next: ["npm test", "npm run build", "git add ."],
        },
        {
          input: "npm test",
          next: ["npm run build", "git add .", "git commit"],
        },
      ],
      weight: 0.8,
    });

    // File operation patterns
    this.commandPatterns.set("file_operations", {
      patterns: [
        { input: "ls", next: ["cd", "cat", "vim", "nano"] },
        { input: "cd", next: ["ls", "pwd", "find"] },
        { input: "mkdir", next: ["cd", "ls", "touch"] },
        { input: "touch", next: ["vim", "nano", "cat", "ls"] },
      ],
      weight: 0.7,
    });

    // Docker patterns
    this.commandPatterns.set("docker_workflow", {
      patterns: [
        {
          input: "docker build",
          next: ["docker run", "docker images", "docker ps"],
        },
        {
          input: "docker run",
          next: ["docker ps", "docker logs", "docker stop"],
        },
        {
          input: "docker ps",
          next: ["docker logs", "docker exec", "docker stop"],
        },
        {
          input: "docker-compose up",
          next: ["docker-compose down", "docker-compose logs", "docker ps"],
        },
      ],
      weight: 0.8,
    });

    // Python patterns
    this.commandPatterns.set("python_workflow", {
      patterns: [
        {
          input: "python",
          next: ["pip install", "python -m venv", "python manage.py"],
        },
        { input: "pip install", next: ["python", "pip list", "pip freeze"] },
        {
          input: "python -m venv",
          next: ["source venv/bin/activate", "pip install", "python"],
        },
        {
          input: "python manage.py",
          next: [
            "python manage.py runserver",
            "python manage.py migrate",
            "python manage.py collectstatic",
          ],
        },
      ],
      weight: 0.8,
    });
  }

  async analyzeUserBehavior(recentCommands) {
    const behavior = {
      preferredTools: new Map(),
      workflowPatterns: [],
      commandFrequency: new Map(),
      timePatterns: new Map(),
    };

    // Analyze command frequency
    recentCommands.forEach((cmd) => {
      const baseCmd = cmd.split(" ")[0];
      behavior.commandFrequency.set(
        baseCmd,
        (behavior.commandFrequency.get(baseCmd) || 0) + 1
      );
    });

    // Detect workflow patterns
    for (let i = 0; i < recentCommands.length - 1; i++) {
      const current = recentCommands[i];
      const next = recentCommands[i + 1];
      const pattern = `${current} -> ${next}`;
      behavior.workflowPatterns.push(pattern);
    }

    // Detect preferred tools
    const toolPatterns = {
      git: ["git"],
      nodejs: ["npm", "node", "yarn"],
      python: ["python", "pip"],
      docker: ["docker", "docker-compose"],
      system: ["ls", "cd", "mkdir", "rm", "cp", "mv"],
    };

    Object.entries(toolPatterns).forEach(([tool, commands]) => {
      const usage = commands.reduce(
        (sum, cmd) => sum + (behavior.commandFrequency.get(cmd) || 0),
        0
      );
      if (usage > 0) {
        behavior.preferredTools.set(tool, usage);
      }
    });

    return behavior;
  }

  calculateSimilarity(input, pattern) {
    const inputTokens = this.tokenizer.tokenize(input.toLowerCase());
    const patternTokens = this.tokenizer.tokenize(pattern.toLowerCase());

    // Calculate Jaccard similarity
    const intersection = inputTokens.filter((token) =>
      patternTokens.includes(token)
    );
    const union = [...new Set([...inputTokens, ...patternTokens])];

    return intersection.length / union.length;
  }

  async getContextualSuggestions(userInput, context, recentCommands) {
    const suggestions = [];
    const userBehavior = await this.analyzeUserBehavior(recentCommands);

    // 1. Pattern-based suggestions
    const patternSuggestions = this.getPatternBasedSuggestions(
      userInput,
      userBehavior
    );
    suggestions.push(...patternSuggestions);

    // 2. Context-aware suggestions
    const contextSuggestions = this.getContextAwareSuggestions(
      userInput,
      context,
      userBehavior
    );
    suggestions.push(...contextSuggestions);

    // 3. Semantic similarity suggestions
    const semanticSuggestions = await this.getSemanticSuggestions(
      userInput,
      context
    );
    suggestions.push(...semanticSuggestions);

    // 4. File-based suggestions
    const fileSuggestions = await this.getFileBasedSuggestions(
      userInput,
      context
    );
    suggestions.push(...fileSuggestions);

    // Remove duplicates and rank
    const uniqueSuggestions = this.removeDuplicates(suggestions);
    const rankedSuggestions = this.rankSuggestions(
      uniqueSuggestions,
      userInput,
      userBehavior
    );

    return rankedSuggestions.slice(0, this.maxSuggestions);
  }

  getPatternBasedSuggestions(userInput, userBehavior) {
    const suggestions = [];

    // Check workflow patterns
    this.commandPatterns.forEach((patternData, category) => {
      patternData.patterns.forEach((pattern) => {
        const similarity = this.calculateSimilarity(userInput, pattern.input);
        if (similarity >= this.similarityThreshold) {
          pattern.next.forEach((nextCmd) => {
            suggestions.push({
              command: nextCmd,
              score: similarity * patternData.weight,
              type: "pattern",
              category: category,
            });
          });
        }
      });
    });

    return suggestions;
  }

  getContextAwareSuggestions(userInput, context, userBehavior) {
    const suggestions = [];

    // Git context suggestions
    if (context.git && context.git.isGitRepo) {
      if (userInput.toLowerCase().includes("git")) {
        if (context.git.hasChanges) {
          suggestions.push({
            command: "git add .",
            score: 0.9,
            type: "context",
            category: "git",
          });
          suggestions.push({
            command: "git status",
            score: 0.8,
            type: "context",
            category: "git",
          });
        } else {
          suggestions.push({
            command: "git status",
            score: 0.9,
            type: "context",
            category: "git",
          });
        }
      }
    }

    // Node.js context suggestions
    if (context.node && context.node.hasPackageJson) {
      if (userInput.toLowerCase().includes("npm")) {
        const scripts = Object.keys(context.node.scripts);
        scripts.forEach((script) => {
          suggestions.push({
            command: `npm run ${script}`,
            score: 0.8,
            type: "context",
            category: "nodejs",
          });
        });
      }
    }

    return suggestions;
  }

  async getSemanticSuggestions(userInput, context) {
    const suggestions = [];

    // Create semantic embeddings for user input
    const inputTokens = this.tokenizer.tokenize(userInput.toLowerCase());

    // Define semantic command groups
    const semanticGroups = {
      file_management: ["ls", "cd", "mkdir", "rm", "cp", "mv", "touch", "find"],
      text_editing: ["vim", "nano", "cat", "echo", "grep", "sed", "awk"],
      process_management: ["ps", "kill", "top", "htop", "pkill"],
      network: ["ping", "curl", "wget", "ssh", "scp", "netstat"],
      system_info: ["uname", "whoami", "pwd", "df", "du", "free"],
    };

    // Find semantic matches
    Object.entries(semanticGroups).forEach(([group, commands]) => {
      const groupTokens = commands.join(" ").toLowerCase().split(" ");
      const similarity = this.calculateSimilarity(
        inputTokens.join(" "),
        groupTokens.join(" ")
      );

      if (similarity > 0.3) {
        commands.forEach((cmd) => {
          if (cmd.startsWith(userInput.toLowerCase())) {
            suggestions.push({
              command: cmd,
              score: similarity * 0.7,
              type: "semantic",
              category: group,
            });
          }
        });
      }
    });

    return suggestions;
  }

  async getFileBasedSuggestions(userInput, context) {
    const suggestions = [];

    try {
      if (context.fileContext && context.fileContext.length > 0) {
        // Suggest commands based on file types
        const fileTypes = new Set();
        context.fileContext.forEach((file) => {
          const ext = path.extname(file.name);
          if (ext) fileTypes.add(ext);
        });

        // Suggest appropriate commands for file types
        fileTypes.forEach((ext) => {
          switch (ext) {
            case ".js":
            case ".ts":
              if (
                userInput.toLowerCase().includes("node") ||
                userInput.toLowerCase().includes("npm")
              ) {
                suggestions.push({
                  command: "node index.js",
                  score: 0.7,
                  type: "file",
                  category: "nodejs",
                });
              }
              break;
            case ".py":
              if (userInput.toLowerCase().includes("python")) {
                suggestions.push({
                  command: "python main.py",
                  score: 0.7,
                  type: "file",
                  category: "python",
                });
              }
              break;
            case ".json":
              if (userInput.toLowerCase().includes("npm")) {
                suggestions.push({
                  command: "npm install",
                  score: 0.6,
                  type: "file",
                  category: "nodejs",
                });
              }
              break;
          }
        });
      }
    } catch (error) {
      // Ignore file-based suggestion errors
    }

    return suggestions;
  }

  removeDuplicates(suggestions) {
    const seen = new Set();
    return suggestions.filter((suggestion) => {
      const key = suggestion.command;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  rankSuggestions(suggestions, userInput, userBehavior) {
    return suggestions
      .map((suggestion) => {
        let score = suggestion.score;

        // Boost based on user preferences
        const preferredTools = Array.from(
          userBehavior.preferredTools.entries()
        );
        preferredTools.forEach(([tool, usage]) => {
          if (
            suggestion.command.includes(tool) ||
            (tool === "nodejs" && suggestion.command.includes("npm"))
          ) {
            score += 0.1 * Math.min(usage / 10, 1); // Cap the boost
          }
        });

        // Boost based on recent usage
        if (
          userBehavior.commandFrequency.has(suggestion.command.split(" ")[0])
        ) {
          score += 0.05;
        }

        // Penalize very long commands
        if (suggestion.command.length > 50) {
          score -= 0.1;
        }

        return { ...suggestion, score: Math.min(score, 1.0) };
      })
      .sort((a, b) => b.score - a.score);
  }

  async learnFromUserAction(userInput, executedCommand, success = true) {
    // Store user action for future learning
    const action = {
      input: userInput,
      executed: executedCommand,
      success: success,
      timestamp: Date.now(),
    };

    // Update user behavior model
    if (!this.userBehaviorModel.has(userInput)) {
      this.userBehaviorModel.set(userInput, []);
    }
    this.userBehaviorModel.get(userInput).push(action);

    // Keep only recent actions (last 100)
    const actions = this.userBehaviorModel.get(userInput);
    if (actions.length > 100) {
      this.userBehaviorModel.set(userInput, actions.slice(-100));
    }
  }

  getLearningStats() {
    const stats = {
      totalActions: 0,
      successRate: 0,
      mostUsedPatterns: [],
      learningAccuracy: 0,
    };

    let totalSuccess = 0;
    const patternUsage = new Map();

    this.userBehaviorModel.forEach((actions, input) => {
      stats.totalActions += actions.length;
      actions.forEach((action) => {
        if (action.success) totalSuccess++;

        const pattern = `${input} -> ${action.executed}`;
        patternUsage.set(pattern, (patternUsage.get(pattern) || 0) + 1);
      });
    });

    if (stats.totalActions > 0) {
      stats.successRate = totalSuccess / stats.totalActions;
    }

    // Get most used patterns
    const sortedPatterns = Array.from(patternUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    stats.mostUsedPatterns = sortedPatterns.map(([pattern, count]) => ({
      pattern,
      count,
    }));

    return stats;
  }
}

module.exports = MLSuggestionEngine;
