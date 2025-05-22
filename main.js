const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
  nodeIntegration: false, // this is OK
  enableRemoteModule: false // this is also OK
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
console.log('Preload path:', path.join(__dirname, 'preload.js'));

  console.log('App is ready');

  ipcMain.handle('get-folder-contents', async (event, folderPath) => {
    console.log('Getting folder contents for:', folderPath);
    const result = { folders: [], images: [] };
    try {
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        const stat = fs.statSync(fullPath);
        if (entry.isDirectory()) {
            result.folders.push({ name: entry.name, mtime: stat.mtimeMs });
        } else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(entry.name)) {
            result.images.push({ name: entry.name, mtime: stat.mtimeMs });
        }
        }
        return result;
    } catch (e) {
        return { error: e.message };
    }
});

  ipcMain.handle('get-initial-folder', () => {
    console.log('Getting initial folder' + app.getPath('pictures'));
    return "p:"; // app.getPath('pictures'); // Start from Pictures folder
  });
});
