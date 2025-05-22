const { join, dirname } = window.electronAPI.path;

const fileList = document.getElementById('file-list');
const mainImage = document.getElementById('main-image');
let currentPath = '';

async function loadFolder(folderPath) {
  const contents = await window.electronAPI.getFolderContents(folderPath);
  console.log('Contents:', contents);
  if (contents.error) {
    alert(contents.error);
    return;
  }

  currentPath = folderPath;
  fileList.innerHTML = '';

  // ".." to go up
  if (folderPath !== '/') {
    const parentLi = document.createElement('li');
    parentLi.textContent = '.. (Up)';
    parentLi.onclick = () => loadFolder(dirname(folderPath));
    fileList.appendChild(parentLi);
  }

  // Folders
  contents.folders.forEach(folder => {
    const li = document.createElement('li');
    li.textContent = folder;
    li.onclick = () => loadFolder(join(folderPath, folder));
    fileList.appendChild(li);
  });

  // Images
  contents.images.forEach(image => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    const imgPath = join(folderPath, image);
    img.src = `file://${imgPath}`;
    li.appendChild(img);
    li.onclick = () => {
      mainImage.src = `file://${imgPath}`;
    };
    fileList.appendChild(li);
  });
}


window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
  const startPath = await window.electronAPI.getInitialFolder();
  loadFolder(startPath);
});