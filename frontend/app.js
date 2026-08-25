const API_BASE = window.CATALOGGUARD_API || 'http://127.0.0.1:8000';
const fileInput = document.querySelector('#file-input');
const dropZone = document.querySelector('#drop-zone');
const filePreview = document.querySelector('#file-preview');
const submitButton = document.querySelector('#submit-upload');
const formMessage = document.querySelector('#form-message');
const historySearch = document.querySelector('#history-search');
let selectedFile = null;
let uploadHistory = [];

lucide.createIcons();
document.querySelector('#today').textContent = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
document.querySelector('#hero-upload').addEventListener('click', () => document.querySelector('#upload-panel').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('.help-button').addEventListener('click', () => window.open(`${API_BASE}/docs`, '_blank', 'noopener'));
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', () => setFile(fileInput.files[0]));
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragover'); }));
dropZone.addEventListener('drop', (event) => setFile(event.dataTransfer.files[0]));
document.querySelector('#clear-file').addEventListener('click', clearFile);
submitButton.addEventListener('click', uploadFile);
document.querySelector('#refresh-history').addEventListener('click', loadHistory);
document.querySelector('#refresh-service').addEventListener('click', checkService);
historySearch.addEventListener('input', renderHistory);

function setFile(file) {
  if (!file) return;
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(extension)) return showMessage('Choose a CSV or Excel file.', true);
  selectedFile = file;
  document.querySelector('#file-name').textContent = file.name;
  document.querySelector('#file-size').textContent = formatBytes(file.size);
  filePreview.classList.remove('hidden');
  submitButton.disabled = false;
  showMessage('Ready to process.');
}
function clearFile() { selectedFile = null; fileInput.value = ''; filePreview.classList.add('hidden'); submitButton.disabled = true; showMessage(''); }
function formatBytes(bytes) { if (!bytes) return '0 KB'; return `${(bytes / 1024).toFixed(1)} KB`; }
function showMessage(message, error = false) { formMessage.textContent = message; formMessage.className = `form-message${error ? ' error' : ''}`; }

async function uploadFile() {
  if (!selectedFile) return;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i data-lucide="loader-circle"></i> Processing...';
  lucide.createIcons();
  const body = new FormData(); body.append('file', selectedFile);
  try {
    const response = await fetch(`${API_BASE}/api/v1/catalogs/upload`, { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'The catalog could not be processed.');
    showMessage(`${data.filename} processed successfully: ${data.total_products} products ingested.`);
    clearFile();
    await loadHistory();
  } catch (error) { showMessage(error.message || 'Could not connect to the API.', true); }
  submitButton.innerHTML = '<i data-lucide="arrow-up-right"></i>Process catalog';
  lucide.createIcons();
  submitButton.disabled = !selectedFile;
}

async function loadHistory() {
  const body = document.querySelector('#history-body');
  try {
    const response = await fetch(`${API_BASE}/api/v1/catalogs`);
    if (!response.ok) throw new Error('History unavailable');
    uploadHistory = await response.json();
    renderHistory();
  } catch (error) { body.innerHTML = `<tr><td colspan="5" class="empty-state"><i data-lucide="cloud-off"></i><strong>History is unavailable</strong><span>Start the API and refresh this view.</span></td></tr>`; lucide.createIcons(); }
}

function renderHistory() {
  const body = document.querySelector('#history-body');
  const query = historySearch.value.trim().toLowerCase();
  const uploads = uploadHistory.filter((upload) => [upload.filename, upload.file_type, upload.status].some((value) => String(value || '').toLowerCase().includes(query)));
  body.innerHTML = uploads.length ? uploads.map((upload) => `<tr><td>${escapeHtml(upload.filename)}</td><td><span class="format">${escapeHtml(upload.file_type)}</span></td><td>${upload.total_products}</td><td><span class="status">${escapeHtml(upload.status)}</span></td><td>${formatDate(upload.created_at)}</td></tr>`).join('') : query ? emptySearchHistory() : emptyHistory();
  const total = uploadHistory.reduce((sum, upload) => sum + (upload.total_products || 0), 0);
  document.querySelector('#upload-count').textContent = uploadHistory.length;
    document.querySelector('#product-count').textContent = total.toLocaleString();
  document.querySelector('#nav-count').textContent = uploadHistory.length;
  lucide.createIcons();
}
function emptyHistory() { return '<tr><td colspan="5" class="empty-state"><i data-lucide="inbox"></i><strong>No catalogs yet</strong><span>Your processed uploads will appear here.</span></td></tr>'; }
function emptySearchHistory() { return '<tr><td colspan="5" class="empty-state"><i data-lucide="search-x"></i><strong>No matching uploads</strong><span>Try a different filename, format, or status.</span></td></tr>'; }
function formatDate(value) { if (!value) return '—'; return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

async function checkService() {
  const label = document.querySelector('#service-status'); const dot = document.querySelector('#service-dot');
  try { const response = await fetch(`${API_BASE}/health`); if (!response.ok) throw new Error(); label.textContent = 'Connected'; dot.classList.remove('off'); }
  catch (error) { label.textContent = 'Offline'; dot.classList.add('off'); }
}
loadHistory(); checkService();
