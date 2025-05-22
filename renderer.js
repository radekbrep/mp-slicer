const { join, dirname } = window.electronAPI.path;

const fileList = document.getElementById('file-list');
const mainImage = document.getElementById('main-image');
let currentPath = '';
let imageEntries = [];
let observer;

async function loadFolder(folderPath) {
  const contents = await window.electronAPI.getFolderContents(folderPath);
  if (contents.error) {
    alert(contents.error);
    return;
  }

  currentPath = folderPath;
  imageEntries = contents.images.map(name => ({
    name,
    fullPath: join(folderPath, name),
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
    li.textContent = folder;
    li.onclick = () => loadFolder(join(folderPath, folder));
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
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
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
