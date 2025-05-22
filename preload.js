const { contextBridge, ipcRenderer } = require('electron');
console.log('✅ Preload script loaded');

const path = require('path'); // <--- This line was commented out

console.log('Preload running, path.join:', path.join(__dirname, 'test'));

contextBridge.exposeInMainWorld('electronAPI', {
  getFolderContents: (dirPath) => ipcRenderer.invoke('get-folder-contents', dirPath),
  getInitialFolder: () => ipcRenderer.invoke('get-initial-folder'),
  path: {
    join: (...args) => path.join(...args),
    dirname: (p) => path.dirname(p),
    basename: (p) => path.basename(p),
    extname: (p) => path.extname(p),
  }
});
