# 🚀 Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure API Key

Edit `config.js` and replace the API key:

```javascript
GEMINI_API_KEY: "your-actual-api-key-here";
```

## 3. Test the API (Optional)

```bash
npm test
```

## 4. Start the Application

### Option A: Launcher (Recommended)

```bash
npm run launch
```

Then choose between Basic and Enhanced modes.

### Option B: Direct Start

```bash
# Basic mode
npm start

# Enhanced mode
npm run enhanced
```

## 🎯 What You'll Get

- **Basic Mode**: Simple command suggestions below your input
- **Enhanced Mode**: Real-time inline suggestions with Tab completion

## 🎮 Controls

### Basic Mode

- Type commands and see suggestions
- `help` - Show help
- `clear` - Clear screen
- `exit` - Quit

### Enhanced Mode

- **Tab** - Accept suggestion
- **← →** - Move cursor
- **Backspace** - Delete character
- **Enter** - Execute command
- **Ctrl+C** - Force exit

## 🔧 Troubleshooting

If you get errors:

1. Check your API key in `config.js`
2. Run `npm test` to verify API connection
3. Make sure you have Node.js v14+

## 🎉 Enjoy!

Start typing to see AI-powered suggestions! 🤖
