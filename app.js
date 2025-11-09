// --- app.js: Case management logic (separate file) ---

let cases = [];

// DOM elements
const caseForm = document.getElementById('caseForm');
const caseListBody = document.getElementById('caseListBody');
const searchBar = document.getElementById('searchBar');
const noCasesMessage = document.getElementById('noCasesMessage');

/* -------------------------
   Local Storage Management
   ------------------------- */
function saveCases() {
  try {
    localStorage.setItem('judiciaryCases', JSON.stringify(cases));
  } catch (e) {
    console.error('Could not save to localStorage:', e);
    displayMessage('Error: Could not save data.', 'error');
  }
}

function loadCases() {
  const stored = localStorage.getItem('judiciaryCases');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      cases = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing stored cases:', e);
      cases = [];
    }
  } else {
    cases = [];
  }
  renderCaseList(cases);
}

/* -------------------------
   UI helpers
   ------------------------- */
function getStatusClass(status) {
  switch (status) {
    case 'Filed': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'In Progress': return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'Adjourned': return 'bg-red-100 text-red-800 border border-red-300';
    case 'Closed': return 'bg-green-100 text-green-800 border border-green-300';
    default: return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
}

function sanitize(str) {
  return String(str === undefined || str === null ? '' : str);
}

/* -------------------------
   Rendering
   ------------------------- */
function renderCaseList(casesToRender) {
  caseListBody.innerHTML = '';

  if (!Array.isArray(casesToRender) || casesToRender.length === 0) {
    noCasesMessage.classList.remove('hidden');
  } else {
    noCasesMessage.classList.add('hidden');
  }

  // sort by hearing date (optional)
  const sorted = Array.isArray(casesToRender) ? [...casesToRender].sort((a, b) => {
    if (!a.hearingDate) return 1;
    if (!b.hearingDate) return -1;
    return String(a.hearingDate).localeCompare(String(b.hearingDate));
  }) : [];

  sorted.forEach(item => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 transition duration-100';
    const statusClass = getStatusClass(item.status || '');

    const caseId = sanitize(item.caseId);
    const title = sanitize(item.title);
    const parties = sanitize(item.parties);
    const hearingDate = sanitize(item.hearingDate);

    // escape single quotes for onclick attribute
    const safeCaseIdForOnclick = caseId.replace(/'/g, "\\'");

    row.innerHTML = `
      <td class="font-mono text-sm text-gray-700">${caseId}</td>
      <td class="text-gray-900 font-medium">${title}</td>
      <td class="text-gray-600">${parties}</td>
      <td><span class="status-badge ${statusClass}">${sanitize(item.status)}</span></td>
      <td class="font-semibold text-sm text-gray-700">${hearingDate}</td>
      <td>
        <button onclick="deleteCase('${safeCaseIdForOnclick}')"
                class="btn-delete bg-red-600 text-white text-xs font-semibold py-2 px-4 rounded-lg transition duration-150">
          Delete
        </button>
      </td>
    `;
    caseListBody.appendChild(row);
  });
}

/* -------------------------
   CRUD operations
   ------------------------- */
function addCase(e) {
  e.preventDefault();

  const caseIdRaw = document.getElementById('caseId').value.trim();
  if (!caseIdRaw) {
    displayMessage('Please provide a valid Case ID.', 'error');
    return;
  }
  const caseId = caseIdRaw.toUpperCase();
  const title = document.getElementById('title').value.trim();
  const parties = document.getElementById('parties').value.trim();
  const status = document.getElementById('status').value;
  const hearingDate = document.getElementById('hearingDate').value;

  // uniqueness check (case-insensitive)
  if (cases.some(c => String(c.caseId).toUpperCase() === caseId)) {
    displayMessage(`Error: Case ID ${caseId} already exists.`, 'error');
    return;
  }

  const newCase = { caseId, title, parties, status, hearingDate };
  cases.push(newCase);

  saveCases();
  renderCaseList(cases);
  caseForm.reset();
  displayMessage('Case registered successfully!', 'success');
}

function deleteCase(caseId) {
  if (!confirm(`Are you sure you want to delete case ${caseId}? This action cannot be undone.`)) return;

  const initialLength = cases.length;
  cases = cases.filter(item => String(item.caseId).toUpperCase() !== String(caseId).toUpperCase());

  if (cases.length < initialLength) {
    saveCases();
    renderCaseList(cases);
    displayMessage('Case deleted successfully.', 'success');
  } else {
    displayMessage('Error: Case not found.', 'error');
  }
}

/* -------------------------
   Search/filter
   ------------------------- */
function filterCases() {
  const term = (searchBar.value || '').toLowerCase().trim();
  const filtered = cases.filter(item =>
    sanitize(item.caseId).toLowerCase().includes(term) ||
    sanitize(item.title).toLowerCase().includes(term) ||
    sanitize(item.parties).toLowerCase().includes(term)
  );
  renderCaseList(filtered);

  if (filtered.length === 0) {
    noCasesMessage.textContent = 'No matching cases found.';
    noCasesMessage.classList.remove('hidden');
  } else {
    noCasesMessage.textContent = 'No cases currently registered in the system.';
  }
}

/* -------------------------
   Notifications
   ------------------------- */
function displayMessage(message, type) {
  let msgBox = document.getElementById('appMessage');
  if (!msgBox) {
    msgBox = document.createElement('div');
    msgBox.id = 'appMessage';
    document.body.appendChild(msgBox);
  }

  msgBox.className = 'fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 p-4 rounded-lg z-50 transition-opacity duration-300 text-white font-medium shadow-xl';
  msgBox.textContent = message;

  // remove possible prior bg classes to avoid accumulation
  msgBox.classList.remove('bg-green-600', 'bg-red-600', 'bg-blue-600');

  if (type === 'success') msgBox.classList.add('bg-green-600');
  else if (type === 'error') msgBox.classList.add('bg-red-600');
  else msgBox.classList.add('bg-blue-600');

  msgBox.classList.remove('hidden', 'opacity-0');
  msgBox.classList.add('opacity-100');

  setTimeout(() => {
    msgBox.classList.remove('opacity-100');
    msgBox.classList.add('opacity-0');
    setTimeout(() => msgBox.classList.add('hidden'), 300);
  }, 4000);
}

/* -------------------------
   Initialization
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Attach listeners
  caseForm.addEventListener('submit', addCase);
  searchBar.addEventListener('input', filterCases);

  // Load any saved cases
  loadCases();
});
