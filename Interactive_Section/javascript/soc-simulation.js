// soc-simulation.js - Main functionality for SOC Analyst Simulation
// Requires: soc-data.js to be loaded first

// State management
const AppState = {
    currentPage: {
        playbooks: 1,
        cases: 1,
        reports: 1
    },
    actionsTaken: {},
    currentAlert: null,
    filters: {
        severity: ['critical', 'high', 'medium', 'low'],
        source: ['firewall', 'ids', 'endpoint', 'cloud', 'auth'],
        status: ['new']
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    renderAlerts();
    setupEventListeners();
    updateStatistics();
    showNotification('Welcome to SOC Simulation', 'Monitor alerts and respond to security threats.', 'info');
}

// ============= ALERT RENDERING =============
function renderAlerts() {
    const alertList = document.getElementById('alert-list');
    if (!alertList) return;

    alertList.innerHTML = '';
    const filteredAlerts = SOCData.getAlertsByFilter(AppState.filters);

    filteredAlerts.forEach(alert => {
        const alertElement = createAlertElement(alert);
        alertList.appendChild(alertElement);
    });

    updateStatistics();
}

function createAlertElement(alert) {
    const li = document.createElement('li');
    li.className = `alert-item ${alert.severity}`;
    li.setAttribute('data-alert-id', alert.id);
    li.setAttribute('data-severity', alert.severity);
    li.setAttribute('data-source', alert.source);
    li.setAttribute('data-status', alert.status);

    if (alert.status === 'resolved') {
        li.classList.add('resolved');
    }

    li.innerHTML = `
        <div class="alert-header">
            <span class="alert-title">${alert.title}</span>
            <span class="alert-severity ${alert.severity}">${capitalizeFirst(alert.severity)}</span>
        </div>
        <div class="alert-details">
            <span class="alert-source"><i class="fas fa-laptop"></i> ${alert.sourceDetail}</span>
            <span class="alert-time"><i class="far fa-clock"></i> ${SOCData.formatTimeAgo(alert.timestamp)}</span>
        </div>
        <div class="alert-actions">
            <button class="action-btn escalate-btn"><i class="fas fa-exclamation-circle"></i> Escalate</button>
            <button class="action-btn resolve-btn"><i class="fas fa-check-circle"></i> Resolve</button>
        </div>
    `;

    // Event listeners
    li.addEventListener('click', function(e) {
        if (!e.target.closest('.action-btn')) {
            showAlertDetail(alert.id);
        }
    });

    const resolveBtn = li.querySelector('.resolve-btn');
    resolveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resolveAlert(alert.id);
    });

    const escalateBtn = li.querySelector('.escalate-btn');
    escalateBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        escalateAlert(alert.id);
    });

    return li;
}

// ============= ALERT DETAIL VIEW =============
function showAlertDetail(alertId) {
    const alert = SOCData.getAlertById(alertId);
    if (!alert) return;

    AppState.currentAlert = alert;

    // Populate detail view
    document.querySelector('.detail-title').textContent = alert.title;
    
    // Update meta information
    const metaItems = document.querySelectorAll('.detail-meta-item span');
    if (metaItems.length >= 5) {
        metaItems[0].textContent = `Severity: ${capitalizeFirst(alert.severity)}`;
        metaItems[1].textContent = `Source: ${alert.sourceDetail}`;
        metaItems[2].textContent = `Detected: ${alert.timestamp.toLocaleString()}`;
        metaItems[3].textContent = `User: ${alert.user || 'N/A'}`;
        metaItems[4].textContent = `Alert ID: ${alert.id}`;
    }

    // Update description
    document.querySelector('.detail-description p').textContent = alert.description || 'No detailed description available.';

    // Switch to detail view
    document.getElementById('alerts-tab').classList.remove('active');
    document.getElementById('alert-detail-tab').classList.add('active');

    // Reset action buttons
    resetActionButtons();
}

function resetActionButtons() {
    AppState.actionsTaken = {};
    document.querySelectorAll('.response-actions .action-btn-large[data-action]').forEach(btn => {
        btn.disabled = false;
        const action = btn.getAttribute('data-action');
        const originalText = getActionText(action);
        btn.innerHTML = `<i class="${getActionIcon(action)}"></i> ${originalText}`;
        btn.classList.remove('success');
    });
}

function getActionText(action) {
    const texts = {
        isolate: 'Isolate Endpoint',
        disable: 'Disable User Account',
        block: 'Block C2 Address',
        scan: 'Run Enterprise Scan',
        escalate: 'Escalate to IR Team'
    };
    return texts[action] || action;
}

function getActionIcon(action) {
    const icons = {
        isolate: 'fas fa-power-off',
        disable: 'fas fa-user-lock',
        block: 'fas fa-ban',
        scan: 'fas fa-search',
        escalate: 'fas fa-exclamation-triangle'
    };
    return icons[action] || 'fas fa-check';
}

// ============= ALERT ACTIONS =============
function resolveAlert(alertId) {
    const alert = SOCData.getAlertById(alertId);
    if (!alert) return;

    SOCData.updateAlertStatus(alertId, 'resolved');
    showNotification('Alert Resolved', `"${alert.title}" has been marked as resolved.`, 'success');
    
    setTimeout(() => {
        renderAlerts();
    }, 500);
}

function escalateAlert(alertId) {
    const alert = SOCData.getAlertById(alertId);
    if (!alert) return;

    showNotification('Alert Escalated', `"${alert.title}" has been escalated to senior analysts.`, 'info');
}

// ============= RESPONSE ACTIONS =============
function executeResponseAction(action) {
    if (AppState.actionsTaken[action]) {
        showNotification('Already Executed', `This action has already been performed.`, 'info');
        return;
    }

    const btn = document.querySelector(`[data-action="${action}"]`);
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

    setTimeout(() => {
        AppState.actionsTaken[action] = true;
        btn.innerHTML = `<i class="fas fa-check"></i> ${getActionText(action)} - Completed`;
        btn.classList.add('success');

        const messages = {
            isolate: 'Endpoint has been successfully isolated from the network.',
            disable: 'User account has been disabled. Password reset required.',
            block: 'IP address has been blocked at the firewall level.',
            scan: 'Enterprise-wide scan initiated. Results will be available in 15-20 minutes.',
            escalate: 'Incident has been escalated to the Incident Response Team with all relevant data.'
        };

        showNotification('Action Completed', messages[action], 'success');
    }, 1500);
}

// ============= PAGINATION =============
function renderPaginatedContent(type, page) {
    const data = SOCData[type];
    const tableId = `${type}-table`;
    const table = document.getElementById(tableId);
    
    if (!table || !data || !data[page - 1]) return;

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    const pageData = data[page - 1];
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        
        if (type === 'playbooks') {
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.updated}</td>
                <td><span class="status-badge ${item.status}">${capitalizeFirst(item.status)}</span></td>
            `;
            row.addEventListener('click', () => viewPlaybook(item));
        } else if (type === 'cases') {
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>${item.severity}</td>
                <td>${item.assigned}</td>
                <td><span class="status-badge ${item.status}">${formatStatus(item.status)}</span></td>
            `;
            row.addEventListener('click', () => viewCase(item));
        } else if (type === 'reports') {
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.date}</td>
                <td><button class="action-btn download-btn"><i class="fas fa-download"></i> Download</button></td>
            `;
            const downloadBtn = row.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadReport(item);
            });
        }
        
        tbody.appendChild(row);
    });

    AppState.currentPage[type] = page;
    updatePaginationButtons(type, page, data.length);
}

function updatePaginationButtons(type, currentPage, totalPages) {
    const tabContent = document.getElementById(`${type}-tab`);
    if (!tabContent) return;

    const pagination = tabContent.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('div');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            renderPaginatedContent(type, currentPage - 1);
        }
    });
    if (currentPage === 1) prevBtn.style.opacity = '0.3';
    pagination.appendChild(prevBtn);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = 'page-btn';
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            renderPaginatedContent(type, i);
        });
        pagination.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('div');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderPaginatedContent(type, currentPage + 1);
        }
    });
    if (currentPage === totalPages) nextBtn.style.opacity = '0.3';
    pagination.appendChild(nextBtn);
}

// ============= DOWNLOAD FUNCTIONALITY =============
function downloadReport(report) {
    // Create report content
    const reportContent = generateReportContent(report);
    
    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}_${report.date.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Download Started', `Downloading "${report.name}"...`, 'success');
}

function generateReportContent(report) {
    let content = `=========================================\n`;
    content += `${report.content.title || report.name}\n`;
    content += `=========================================\n\n`;
    content += `Report Type: ${report.type}\n`;
    content += `Generated: ${report.date}\n`;
    content += `\n-----------------------------------\n\n`;

    if (report.content.summary) {
        content += `SUMMARY:\n${report.content.summary}\n\n`;
    }

    if (report.content.metrics) {
        content += `METRICS:\n`;
        Object.entries(report.content.metrics).forEach(([key, value]) => {
            content += `  - ${formatMetricName(key)}: ${value}\n`;
        });
        content += `\n`;
    }

    if (report.content.threats) {
        content += `IDENTIFIED THREATS:\n`;
        report.content.threats.forEach((threat, idx) => {
            content += `  ${idx + 1}. ${threat}\n`;
        });
        content += `\n`;
    }

    if (report.content.details) {
        content += `DETAILS:\n${report.content.details}\n`;
    }

    content += `\n-----------------------------------\n`;
    content += `Report generated by SOC Simulation System\n`;
    content += `© 2025 Aziz Alghamdi - Security Operations Center\n`;

    return content;
}

function formatMetricName(key) {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
}

// ============= VIEW PLAYBOOK/CASE =============
function viewPlaybook(playbook) {
    const modal = createModal('Playbook: ' + playbook.name, playbook.content);
    document.body.appendChild(modal);
    showNotification('Playbook Opened', `Viewing "${playbook.name}"`, 'info');
}

function viewCase(caseItem) {
    const caseContent = `
Case ID: ${caseItem.id}
Title: ${caseItem.title}
Severity: ${caseItem.severity}
Assigned To: ${caseItem.assigned}
Status: ${formatStatus(caseItem.status)}

This is a placeholder for full case details. In a real system, 
this would show complete investigation notes, evidence, timeline, 
and all related information.
    `;
    const modal = createModal('Case: ' + caseItem.id, caseContent);
    document.body.appendChild(modal);
    showNotification('Case Opened', `Viewing case "${caseItem.id}"`, 'info');
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    modalContent.innerHTML = `
        <button style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        " class="modal-close">&times;</button>
        <h2 style="margin-bottom: 20px; color: #212529; font-size: 24px;">${title}</h2>
        <pre style="
            white-space: pre-wrap;
            font-family: 'Times New Roman', serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
        ">${content}</pre>
    `;

    modal.appendChild(modalContent);

    const closeBtn = modalContent.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    return modal;
}

// ============= SEARCH FUNCTIONALITY =============
function setupSearch(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;

    function performSearch() {
        const searchTerm = input.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        if (input.value) {
            showNotification('Search Results', `Found ${visibleCount} matching items.`, 'info');
        }
    }

    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    const searchBtn = input.nextElementSibling;
    if (searchBtn && searchBtn.classList.contains('search-btn')) {
        searchBtn.addEventListener('click', performSearch);
    }
}

// ============= FILTER FUNCTIONALITY =============
function applyFilters() {
    // Update filter state
    AppState.filters.severity = getCheckedValues('severity');
    AppState.filters.source = getCheckedValues('source');
    AppState.filters.status = getCheckedValues('status');

    // Re-render alerts
    renderAlerts();
}

function getCheckedValues(filterType) {
    const values = [];
    document.querySelectorAll(`input[id^="${filterType}-"]:checked`).forEach(checkbox => {
        const value = checkbox.id.replace(`${filterType}-`, '');
        values.push(value);
    });
    return values;
}

// ============= STATISTICS =============
function updateStatistics() {
    const stats = SOCData.getStatistics();
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-new').textContent = stats.new;
    document.getElementById('stat-critical').textContent = stats.critical;
    
    // Update dashboard if exists
    const dashboardTotal = document.getElementById('dashboard-total');
    const dashboardCritical = document.getElementById('dashboard-critical');
    if (dashboardTotal) dashboardTotal.textContent = stats.total;
    if (dashboardCritical) dashboardCritical.textContent = stats.critical;
}

// ============= NOTIFICATION SYSTEM =============
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    notification.className = `notification ${type} show`;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ============= EVENT LISTENERS =============
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');

            // Load paginated content when switching to these tabs
            if (['playbooks', 'cases', 'reports'].includes(tabId)) {
                renderPaginatedContent(tabId, AppState.currentPage[tabId]);
            }
        });
    });

    // Mobile menu
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });
    }

    // Filter checkboxes
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Back to alerts button
    const backBtn = document.getElementById('back-to-alerts');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('alert-detail-tab').classList.remove('active');
            document.getElementById('alerts-tab').classList.add('active');
        });
    }

    // Response action buttons
    document.querySelectorAll('.response-actions .action-btn-large[data-action]').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            executeResponseAction(action);
        });
    });

    // Time selectors
    document.querySelectorAll('.time-option').forEach(option => {
        option.addEventListener('click', function() {
            const container = this.closest('.chart-container');
            container.querySelectorAll('.time-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            const timeFrame = this.getAttribute('data-time');
            showNotification('Chart Updated', `Chart updated to show ${timeFrame} data.`, 'info');
        });
    });

    // Search functionality
    setupSearch('playbooks-search', 'playbooks-table');
    setupSearch('cases-search', 'cases-table');
    setupSearch('reports-search', 'reports-table');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to go back
        if (e.key === 'Escape') {
            if (document.getElementById('alert-detail-tab').classList.contains('active')) {
                document.getElementById('back-to-alerts').click();
            }
        }
        
        // Number keys 1-5 for tab switching
        if (e.key >= '1' && e.key <= '5') {
            const tabs = document.querySelectorAll('.tab');
            if (tabs[parseInt(e.key) - 1]) {
                tabs[parseInt(e.key) - 1].click();
            }
        }
    });

    // Initialize paginated content
    renderPaginatedContent('playbooks', 1);
    renderPaginatedContent('cases', 1);
    renderPaginatedContent('reports', 1);
}

// ============= UTILITY FUNCTIONS =============
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatStatus(status) {
    return status.split('-').map(capitalizeFirst).join(' ');
}

// ============= AUTO-REFRESH =============


setInterval(() => {
    updateStatistics();
    showNotification('Data Refreshed', 'Alert data has been updated.', 'info');
}, 30000);
