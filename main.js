const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const os = require('os');

const THUMB_SIZE = 60;
const THUMB_DIR = path.join(app.getPath('userData'), 'thumbnails');
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 MB
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });


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

  cleanThumbnailCache();

  // Optional: re-run every hour
  // setInterval(cleanThumbnailCache, 60 * 60 * 1000);

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


ipcMain.handle('get-thumbnail-path', async (event, imagePath) => {
  try {
    const hash = Buffer.from(imagePath).toString('base64').replace(/[/+=]/g, '_');
    const thumbPath = path.join(THUMB_DIR, `${hash}.png`);

    if (!fs.existsSync(thumbPath)) {
    await sharp(imagePath)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
      .toFile(thumbPath);
  } else {
    fs.utimesSync(thumbPath, new Date(), new Date()); // 🆕 bump access time
  }


    return thumbPath;
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    return null;
  }
});

function cleanThumbnailCache() {
  try {
    const files = fs.readdirSync(THUMB_DIR).map(name => {
      const fullPath = path.join(THUMB_DIR, name);
      const stats = fs.statSync(fullPath);
      return { path: fullPath, mtime: stats.mtimeMs, size: stats.size };
    });

    let totalSize = files.reduce((sum, f) => sum + f.size, 0);

    if (totalSize <= MAX_CACHE_SIZE) return;

    // Sort by last modified (oldest first)
    files.sort((a, b) => a.mtime - b.mtime);

    for (const file of files) {
      fs.unlinkSync(file.path);
      totalSize -= file.size;
      if (totalSize <= MAX_CACHE_SIZE) break;
    }

    console.log('🧹 Thumbnail cache cleaned');
  } catch (err) {
    console.error('Error cleaning thumbnail cache:', err);
  }
}

