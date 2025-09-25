# Grammar Fixer Electron App

A simple Electron app that runs in the background and fixes grammar using AI when you press Ctrl+I.

## Features

- Runs in the background (hidden from dock/taskbar)
- Global hotkey: Ctrl+I
- Select text anywhere and press Ctrl+I to fix grammar using OpenAI's GPT model
- AI-powered grammar correction that preserves meaning and tone
- Automatic clipboard management for seamless text replacement

## Installation

1. Install dependencies:
```bash
npm install
```

2. Ensure you have an OpenAI API key. Update the `apiKey` in `main.js` with your actual key (currently set to a placeholder).

3. Run the app:
```bash
npm start
```

## Usage

1. Start the app - it will run in the background
2. Select any text in any application
3. Press Ctrl+I
4. The selected text will be replaced with grammar-corrected version using AI

## How It Works

- Uses OpenAI's GPT model via Baseten inference API
- Fixes grammar, spelling, punctuation, and improves English while preserving original meaning and tone
- Handles clipboard operations to copy selected text, process it, and paste back the corrected version

## Development

To run in development mode:
```bash
npm run dev
```

## Future Enhancements

- Customizable hotkeys
- UI for configuration
- Support for multiple languages
- Offline grammar checking options
