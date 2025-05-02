// Hide challenge content initially
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('challenge-content').style.display = 'none';

    // Hide all file details
    const fileDetails = document.querySelectorAll('.file-details');
    fileDetails.forEach(detail => {
        detail.style.display = 'none';
    });
});

// Challenge tab navigation
function showTab(tabId) {
    // Hide all tabs
    const challengeContainers = document.querySelectorAll('.challenge-container');
    challengeContainers.forEach(container => {
        container.classList.remove('challenge-active');
    });

    // Show selected tab
    document.getElementById(tabId).classList.add('challenge-active');

    // Update active tab button
    const tabButtons = document.querySelectorAll('.challenge-tab');
    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        }
    });

    // Update progress bar
    updateProgress(tabId);
}

// Tab click event
const tabButtons = document.querySelectorAll('.challenge-tab');
tabButtons.forEach(button => {
    button.addEventListener('click', function () {
        const tabId = this.getAttribute('data-tab');
        showTab(tabId);
    });
});

// Start challenge
function startChallenge() {
    document.getElementById('start-challenge-btn').style.display = 'none';
    document.getElementById('challenge-content').style.display = 'block';
    document.getElementById('progress-bar').style.width = '16%';
}

// Show file details
function showFileDetails(fileId) {
    // Hide all file details
    const fileDetails = document.querySelectorAll('.file-details');
    fileDetails.forEach(detail => {
        detail.style.display = 'none';
    });

    // Show selected file details
    document.getElementById(fileId + '-details').style.display = 'block';
}

// Complete phases
function completeSetup() {
    showTab('baseline');
    document.getElementById('progress-bar').style.width = '33%';
}

function completeBaseline() {
    showTab('detection');
    document.getElementById('progress-bar').style.width = '50%';
}

function completeDetection() {
    showTab('investigation');
    document.getElementById('progress-bar').style.width = '66%';
}

function completeInvestigation() {
    showTab('completion');
    document.getElementById('progress-bar').style.width = '100%';
    document.querySelector('.progress-container').classList.add('success');
}

// Update progress based on tab
function updateProgress(tabId) {
    switch (tabId) {
        case 'intro':
            document.getElementById('progress-bar').style.width = '16%';
            break;
        case 'setup':
            document.getElementById('progress-bar').style.width = '33%';
            break;
        case 'baseline':
            document.getElementById('progress-bar').style.width = '50%';
            break;
        case 'detection':
            document.getElementById('progress-bar').style.width = '66%';
            break;
        case 'investigation':
            document.getElementById('progress-bar').style.width = '83%';
            break;
        case 'completion':
            document.getElementById('progress-bar').style.width = '100%';
            document.querySelector('.progress-container').classList.add('success');
            break;
    }
}

async function downloadPDF() {
    const {jsPDF} = window.jspdf;
    const cert = document.querySelector('.certificate');
    const canvas = await html2canvas(cert);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('2 x 3', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 40, pdfWidth, pdfHeight);
    pdf.save('Certificate_of_Completion.pdf');
}