// automation-workshop.js

// Include this script after the html2canvas library for certificate download/share functionality:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
// <script src="/Interactive_Section/javascript/automation-workshop.js"></script>

document.addEventListener('DOMContentLoaded', () => {
  // --- Tab Navigation & Progress Bar ---
  const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));
  const progressBar = document.getElementById('progress-bar');

  function setActiveTab(tabId) {
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
    updateProgress(tabId);
  }

  function updateProgress(tabId) {
    const percentages = { overview: 25, modules: 50, resources: 75, certificate: 100 };
    progressBar.style.width = (percentages[tabId] || 0) + '%';
  }

  tabButtons.forEach((button, idx) => {
    button.tabIndex = 0;
    button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    button.addEventListener('keydown', (e) => {
      if (['ArrowRight','ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        let next = idx + (e.key === 'ArrowRight' ? 1 : -1);
        next = (next + tabButtons.length) % tabButtons.length;
        tabButtons[next].focus();
        setActiveTab(tabButtons[next].dataset.tab);
      }
    });
  });

  // Initialize default tab
  const init = tabButtons.find(btn => btn.classList.contains('active')) || tabButtons[0];
  setActiveTab(init.dataset.tab);

  // --- Learning Modules Modal & State ---
  const moduleCards = Array.from(document.querySelectorAll('.automation-card'));
  // Assign unique IDs for persistence
  moduleCards.forEach((card, i) => card.id = `module-card-${i}`);

  // Modal setup
  const modal = document.createElement('div');
  modal.id = 'module-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-dialog">
      <button class="modal-close" title="Close">&times;</button>
      <h3 class="modal-title"></h3>
      <p class="modal-desc"></p>
      <p class="modal-meta"></p>
      <button class="modal-start btn-primary">Start Module</button>
    </div>`;
  document.body.appendChild(modal);

  const titleEl = modal.querySelector('.modal-title');
  const descEl = modal.querySelector('.modal-desc');
  const metaEl = modal.querySelector('.modal-meta');
  const startBtn = modal.querySelector('.modal-start');
  const closeBtn = modal.querySelector('.modal-close');

  let activeCard = null;

  function openModal(card) {
    activeCard = card;
    titleEl.textContent = card.querySelector('h3').textContent;
    descEl.textContent = card.querySelector('.automation-card-body p').textContent;
    metaEl.textContent = card.querySelector('.automation-card-footer span').textContent;
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    activeCard = null;
  }

  moduleCards.forEach(card => {
    const hdr = card.querySelector('.automation-card-header');
    const btn = card.querySelector('.automation-card-footer .btn-primary');
    hdr.style.cursor = 'pointer';
    hdr.addEventListener('click', () => openModal(card));
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(card);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

  // Persistence: track started modules
  const STORAGE_KEY = 'startedModules';
  let started = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  started.forEach(id => {
    const c = document.getElementById(id);
    if (c) c.classList.add('started');
  });

  startBtn.addEventListener('click', () => {
    if (!activeCard) return;
    activeCard.classList.add('started');
    if (!started.includes(activeCard.id)) {
      started.push(activeCard.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(started));
    }
    closeModal();
  });

  // --- Certificate Download/Share ---
  const certSection = document.getElementById('certificate');
  if (certSection) {
    const card = certSection.querySelector('[style*="background-color: white"]');
    if (card) card.id = 'certificate-card';
    const [dlBtn, shBtn] = certSection.querySelectorAll('a.btn-primary');

    dlBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof html2canvas === 'undefined') return alert('html2canvas is required.');
      html2canvas(document.getElementById('certificate-card')).then(canvas => {
        const a = document.createElement('a');
        a.download = 'certificate.png';
        a.href = canvas.toDataURL();
        a.click();
      });
    });

    shBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof html2canvas === 'undefined') return alert('html2canvas is required.');
      html2canvas(document.getElementById('certificate-card')).then(canvas => {
        canvas.toBlob(blob => {
          const file = new File([blob], 'certificate.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            navigator.share({ files: [file], title: 'Workshop Certificate' });
          } else {
            alert('Share not supported; please download.');
          }
        });
      });
    });
  }
});
