const { join, dirname } = window.electronAPI.path;

const fileList = document.getElementById('file-list');
const mainImage = document.getElementById('main-image');
let currentPath = '';
let imageEntries = [];
let observer;
let currentSort = 'name';

async function loadFolder(folderPath) {
  const contents = await window.electronAPI.getFolderContents(folderPath);
  if (contents.error) {
    alert(contents.error);
    return;
  }

  currentPath = folderPath;

  // Sort folders
  contents.folders.sort((a, b) => {
    return currentSort === 'name'
      ? a.name.localeCompare(b.name)
      : b.mtime - a.mtime;
  });

  // Sort images
  contents.images.sort((a, b) => {
    return currentSort === 'name'
      ? a.name.localeCompare(b.name)
      : b.mtime - a.mtime;
  });

  imageEntries = contents.images.map(entry => ({
    name: entry.name,
    fullPath: join(folderPath, entry.name)
  }));

  renderFileList(folderPath, contents.folders);
}

function renderFileList(folderPath, folders) {
  fileList.innerHTML = '';
  if (observer) observer.disconnect();

  // ".." parent folder
  if (folderPath !== '/') {
    const up = document.createElement('li');
    up.textContent = '.. (Up)';
    up.onclick = () => loadFolder(dirname(folderPath));
    fileList.appendChild(up);
  }

  // Folders
  folders.forEach(folder => {
    const li = document.createElement('li');
    li.textContent = folder.name;
    li.onclick = () => loadFolder(join(folderPath, folder.name));
    fileList.appendChild(li);
});
  

  // Lazy-render placeholder divs
  imageEntries.forEach(entry => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.alt = entry.name;
    img.dataset.src = `file://${entry.fullPath}`; // Do not set .src yet
    li.appendChild(img);
    li.onclick = () => {
      mainImage.src = `file://${entry.fullPath}`;
    };
    fileList.appendChild(li);
  });

  setupLazyLoading();
}

function setupLazyLoading() {
  const images = document.querySelectorAll('#file-list img[data-src]');

  observer = new IntersectionObserver(entries => {
    entries.forEach(async entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const originalPath = img.dataset.src.replace('file://', '');

        // Ask main process for cached thumbnail path
        const thumbPath = await window.electronAPI.getThumbnailPath(originalPath);

        if (thumbPath) {
          img.src = `file://${thumbPath}`;
        } else {
          img.src = img.dataset.src; // fallback
        }

        observer.unobserve(img);
      }
    });
  }, {
    root: document.getElementById('left-pane'),
    rootMargin: '100px'
  });

  images.forEach(img => observer.observe(img));
}


window.addEventListener('DOMContentLoaded', async () => {
  const startPath = await window.electronAPI.getInitialFolder();
  loadFolder(startPath);
});

document.getElementById('sortSelect').addEventListener('change', e => {
  currentSort = e.target.value;
  loadFolder(currentPath);
});
