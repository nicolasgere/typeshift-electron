# Grammar Fixer Electron App

A simple Electron app that runs in the background and fixes grammar when you press Ctrl+I.

## Features

- Runs in the background (hidden from dock/taskbar)
- Global hotkey: Ctrl+I
- Select text anywhere and press Ctrl+I to fix grammar
- Simple grammar fixes (capitalization, contractions, punctuation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the app:
```bash
npm start
```

## Usage

1. Start the app - it will run in the background
2. Select any text in any application
3. Press Ctrl+I
4. The selected text will be replaced with grammar-corrected version

## Current Grammar Fixes

- Capitalizes "i" to "I"
- Fixes common contractions (its → it's, youre → you're, etc.)
- Adds periods at the end of sentences if missing

## Development

To run in development mode:
```bash
npm run dev
```

## Future Enhancements

- Integration with LLM for advanced grammar checking
- More sophisticated grammar rules
- Customizable hotkeys
- UI for configuration
