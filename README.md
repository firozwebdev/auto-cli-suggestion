# 🤖 Gemini Terminal Assistant

A smart terminal application with AI-powered auto-suggestions using Google's Gemini API.

## ✨ Features

- **AI-Powered Suggestions**: Get intelligent command suggestions as you type
- **Real-time Processing**: Suggestions appear after a brief delay while typing
- **Beautiful UI**: Colored output with emojis and clear formatting
- **Command History**: Built-in help and navigation commands
- **Error Handling**: Robust error handling and graceful shutdown

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gemini API key from Google AI Studio

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure your API key**:

   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Update the `GEMINI_API_KEY` in `config.js`

4. **Start the application**:
   ```bash
   npm start
   ```

## 📖 Usage

### Basic Commands

- `help` - Show help information
- `clear` - Clear the terminal screen
- `exit` or `quit` - Exit the application
- `Ctrl+C` - Force exit

### How It Works

1. **Start typing** any command or text
2. **Wait for suggestions** - AI will analyze your input and suggest completions
3. **See the suggestions** appear below your input in gray text
4. **Continue typing** or use the suggestions as inspiration

### Example Session

```
🤖 Gemini Terminal > git
💡 Suggestion: git status
🤖 Gemini Terminal > npm install
💡 Suggestion: npm install --save-dev
🤖 Gemini Terminal > ls -la
💡 Suggestion: ls -la | grep node_modules
```

## ⚙️ Configuration

Edit `config.js` to customize the application:

```javascript
module.exports = {
  GEMINI_API_KEY: "your-api-key-here",
  GEMINI_API_URL:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  SUGGESTION_DELAY: 1000, // Delay before requesting suggestions (ms)
  MAX_SUGGESTION_LENGTH: 50, // Maximum suggestion length
  ENABLE_COLORS: true, // Enable colored output
  DEBUG_MODE: false, // Enable debug logging
};
```

## 🛠️ Development

### Project Structure

```
├── index.js              # Main entry point
├── terminal-interface.js # Terminal UI and interaction logic
├── gemini-service.js     # Gemini API integration
├── config.js            # Configuration settings
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start with nodemon for development

### Adding Features

The application is modular and easy to extend:

1. **New Commands**: Add to `handleInput()` in `terminal-interface.js`
2. **API Changes**: Modify `gemini-service.js`
3. **UI Updates**: Edit `terminal-interface.js`

## 🔧 Troubleshooting

### Common Issues

1. **"API key not configured"**

   - Make sure you've updated the API key in `config.js`
   - Verify the key is valid at Google AI Studio

2. **"Module not found" errors**

   - Run `npm install` to install dependencies

3. **Suggestions not appearing**
   - Check your internet connection
   - Verify API key has proper permissions
   - Enable `DEBUG_MODE: true` in config for more info

### Debug Mode

Enable debug mode in `config.js`:

```javascript
DEBUG_MODE: true;
```

This will show detailed error messages and API responses.

## 📝 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Security Notes

- **Never commit your API key** to version control
- **Regenerate your API key** if it gets exposed
- **Use environment variables** in production

## 🎯 Future Enhancements

- [ ] Command execution capability
- [ ] Suggestion acceptance with Tab key
- [ ] Command history navigation
- [ ] Multiple AI model support
- [ ] Plugin system for custom commands
- [ ] Configuration file support
- [ ] Cross-platform compatibility improvements

---

**Enjoy your AI-powered terminal experience! 🚀**
