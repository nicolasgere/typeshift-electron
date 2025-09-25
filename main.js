const { app, globalShortcut, clipboard, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require("electron");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
const OpenAI = require("openai");

let client;

let mainWindow;
let settingsWindow = null;
let customPrompt = "You are a grammar and English correction assistant. Fix grammar, spelling, punctuation, and correct English if needed. If there is clearly bad utilization of English, change it to proper English. Do NOT change the meaning, tone, or rewrite the content. Only make necessary corrections to improve grammar and English language. Return only the corrected text, nothing else.";
let apiKey = "";
let baseURL = "";

function createWindow() {
  // Create a hidden window that runs in the background
  mainWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Hide the window from the dock/taskbar
  mainWindow.setSkipTaskbar(true);
  mainWindow.hide();
}

function registerGlobalShortcut() {
  // Register Ctrl+I as global shortcut
  const ret = globalShortcut.register("CommandOrControl+I", () => {
    console.log("Ctrl+I pressed!");
    handleGrammarFix();
  });

  if (!ret) {
    console.log("Registration failed");
  }
}

async function handleGrammarFix() {
  try {
    // Store current clipboard content
    const originalClipboard = clipboard.readText();

    // Simulate Cmd+C to copy selected text
    exec(
      'osascript -e "tell application \\"System Events\\" to keystroke \\"c\\" using command down"',
      async (error) => {
        if (error) {
          console.error("Error simulating Cmd+C:", error);
          return;
        }

        // Wait a moment for the copy to complete
        setTimeout(async () => {
          const selectedText = clipboard.readText();

          if (selectedText && selectedText !== originalClipboard) {
            console.log("Selected text:", selectedText);

            try {
              // Call LLM to fix grammar while preserving meaning
              const response = await client.chat.completions.create({
                model: "openai/gpt-oss-120b",
                 messages: [
                   {
                     role: "system",
                     content: customPrompt,
                   },
                  {
                    role: "user",
                    content: selectedText,
                  },
                ],
                stop: [],
                stream: false,
                top_p: 1,
                max_tokens: 1000,
                temperature: 0.3,
                presence_penalty: 0,
                frequency_penalty: 0,
              });

              const fixedText = response.choices[0].message.content.trim();
              console.log("Grammar fixed text:", fixedText);

              // Put the fixed text in clipboard
              clipboard.clear();
              clipboard.writeText(fixedText);

              // Wait a moment for clipboard to update
              setTimeout(() => {
                // Simulate Cmd+V to paste and replace the selected text
                exec(
                  'osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"',
                  (pasteError) => {
                    if (pasteError) {
                      console.error("Error simulating Cmd+V:", pasteError);
                      return;
                    }

                    console.log("Text replaced with grammar corrections!");
                    console.log("Replaced text:", fixedText);

                    // Restore original clipboard after a delay
                    setTimeout(() => {
                      if (originalClipboard) {
                        clipboard.writeText(originalClipboard);
                      }
                    }, 500);
                  },
                );
              }, 50);
            } catch (llmError) {
              console.error("Error calling LLM:", llmError);
              // Fallback to original text if LLM fails
              clipboard.writeText(selectedText);
            }
          } else {
            console.log("No text selected or same as clipboard");
            // Restore original clipboard if no new text was selected
            if (originalClipboard) {
              clipboard.writeText(originalClipboard);
            }
          }
        }, 100); // Small delay to ensure copy operation completes
      },
    );
  } catch (error) {
    console.error("Error in handleGrammarFix:", error);
  }
}

function fixGrammar(text) {
  // Simple grammar fixes (placeholder - you can enhance this later)
  let fixed = text;

  // Basic fixes
  fixed = fixed.replace(/\bi\b/g, "I"); // Capitalize 'i'
  fixed = fixed.replace(/\b(its)\b/g, "it's"); // Fix its/it's
  fixed = fixed.replace(/\b(youre)\b/g, "you're"); // Fix youre/you're
  fixed = fixed.replace(/\b(dont)\b/g, "don't"); // Fix dont/don't
  fixed = fixed.replace(/\b(cant)\b/g, "can't"); // Fix cant/can't
  fixed = fixed.replace(/\b(wont)\b/g, "won't"); // Fix wont/won't
  fixed = fixed.replace(/\b(shouldnt)\b/g, "shouldn't"); // Fix shouldnt/shouldn't
  fixed = fixed.replace(/\b(couldnt)\b/g, "couldn't"); // Fix couldnt/couldn't
  fixed = fixed.replace(/\b(wouldnt)\b/g, "wouldn't"); // Fix wouldnt/wouldn't

  // Add period at the end if missing
  if (
    fixed.length > 0 &&
    !fixed.endsWith(".") &&
    !fixed.endsWith("!") &&
    !fixed.endsWith("?")
  ) {
    fixed += ".";
  }

  return fixed;
}

app.whenReady().then(() => {
  app.dock.hide(); // Hide from dock on macOS
  createWindow();
  registerGlobalShortcut();

  // Load config
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    customPrompt = config.prompt || customPrompt;
    apiKey = config.apiKey || apiKey;
    baseURL = config.baseURL || baseURL;
  } catch (e) {}

  // Create OpenAI client
  client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  // Create tray icon
  let icon = nativeImage.createFromPath(__dirname + '/icon.png');
  if (icon.isEmpty()) {
    // Fallback to a minimal transparent icon
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    icon = nativeImage.createFromBuffer(buffer);
  } else {
    // Resize if too large
    const size = icon.getSize();
    if (size.width > 32 || size.height > 32) {
      icon = icon.resize({ width: 16, height: 16 });
    }
  }
  const tray = new Tray(icon);
  tray.setToolTip('Grammar Fixer');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Settings', click: () => openSettings() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);

  console.log("Grammar Fixer is running in the background!");
  console.log("Press Ctrl+I to fix selected text");
});

// IPC handlers
ipcMain.on('save-settings', (event, data) => {
  customPrompt = data.prompt;
  apiKey = data.apiKey;
  baseURL = data.baseURL;
  const configPath = path.join(app.getPath('userData'), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({ prompt: customPrompt, apiKey, baseURL }));
  // Recreate client
  client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
  if (settingsWindow) settingsWindow.close();
});

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 400,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  settingsWindow.loadURL(`data:text/html,
<html>
<body>
<h3>Custom Prompt</h3>
<textarea id="prompt" style="width:100%;height:150px"></textarea><br>
<h3>API Key</h3>
<input id="apiKey" type="password" style="width:100%"><br>
<h3>Base URL</h3>
<input id="baseURL" style="width:100%"><br><br>
<button onclick="save()">Save</button>
</body>
<script>
const { ipcRenderer } = require('electron');
ipcRenderer.on('load-settings', (event, data) => {
  document.getElementById('prompt').value = data.prompt;
  document.getElementById('apiKey').value = data.apiKey;
  document.getElementById('baseURL').value = data.baseURL;
});
function save() {
  const data = {
    prompt: document.getElementById('prompt').value,
    apiKey: document.getElementById('apiKey').value,
    baseURL: document.getElementById('baseURL').value,
  };
  ipcRenderer.send('save-settings', data);
}
</script>
</html>`);
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    settingsWindow.webContents.send('load-settings', { prompt: customPrompt, apiKey, baseURL });
  });
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

app.on("window-all-closed", () => {
  // Keep the app running even when all windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});
