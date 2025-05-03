document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-item a');
    const pageContents = document.querySelectorAll('.page-content');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const alertLevelBtn = document.querySelector('.alert-level');
    const viewAlertButtons = document.querySelectorAll('.view-alert');
    const actionItems = document.querySelectorAll('.action-item');
    const closeButtons = document.querySelectorAll('.close-btn, .modal-btn.btn-secondary');
    const modalActionButtons = document.querySelectorAll('.modal-btn.btn-primary, .modal-btn.btn-danger');
    const scenarioOptions = document.querySelectorAll('.scenario-option');
    const startButton = document.querySelector('.start-btn');
    const pauseButton = document.querySelector('.pause-btn');
    const resetButton = document.querySelector('.reset-btn');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const refreshBtn = document.querySelector('.refresh-btn');
    const suggestBtn = document.querySelector('.score-btn');
    const finishBtn = document.querySelector('.finish-btn');

    // Simulation state
    let simulationActive = false;
    let currentScenario = 1;
    let alertsGenerated = 8;
    let score = 70;

    // Navigation functionality
    function navigateTo(page) {
        pageContents.forEach(p => p.style.display = 'none');

        // Update sidebar active state
        sidebarLinks.forEach(l => l.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Show selected page
        if (page === 'dashboard') {
            document.getElementById('dashboard-page').style.display = 'block';
        } else if (page === 'investigation') {
            document.getElementById('investigation-page').style.display = 'block';
        } else if (page === 'response') {
            document.getElementById('response-page').style.display = 'block';
        } else if (page === 'alerts') {
            // If alerts page had its own content
            document.getElementById('dashboard-page').style.display = 'block';
        } else if (page === 'endpoints') {
            // For demonstration, show dashboard
            document.getElementById('dashboard-page').style.display = 'block';
        } else {
            // Default to dashboard
            document.getElementById('dashboard-page').style.display = 'block';
        }
    }

    // Tab switching
    function switchTab(tabName) {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        tabContents.forEach(content => content.style.display = 'none');
        document.getElementById(`${tabName}-tab`).style.display = 'block';
    }

    // Alert level cycling
    function cycleAlertLevel() {
        if (alertLevelBtn.textContent.includes('Normal')) {
            alertLevelBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: Medium';
            alertLevelBtn.classList.add('medium');
            alertLevelBtn.classList.remove('high');
        } else if (alertLevelBtn.textContent.includes('Medium')) {
            alertLevelBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: High';
            alertLevelBtn.classList.remove('medium');
            alertLevelBtn.classList.add('high');
        } else {
            alertLevelBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: Normal';
            alertLevelBtn.classList.remove('high');
            alertLevelBtn.classList.remove('medium');
        }
    }

    // Handling actions
    function showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Response actions handling
    function handleResponseAction(action) {
        // Track which actions have been taken for scoring
        const actionsTaken = document.querySelectorAll('.action-item.selected').length;

        if (action === 'kill-process') {
            showModal('process-action-modal');
        } else if (action === 'delete-file' || action === 'quarantine-file') {
            showModal('file-action-modal');
            // Update modal title based on action
            const modalTitle = document.querySelector('#file-action-modal .modal-title');
            modalTitle.textContent = action === 'delete-file' ? 'Delete File' : 'Quarantine File';

            // Update button text
            const actionButton = document.querySelector('#file-action-modal .modal-btn.btn-danger');
            actionButton.textContent = action === 'delete-file' ? 'Delete File' : 'Quarantine File';
        } else if (action === 'isolate') {
            // Network isolation doesn't need a modal
            updateScore(10);
            showNotification('Network isolation activated');
        } else if (action === 'block-hash') {
            updateScore(5);
            showNotification('File hash blocked across environment');
        } else if (action === 'block-ip') {
            updateScore(15);
            showNotification('IP address 192.168.1.100 blocked');
        } else if (action === 'full-scan') {
            updateScore(5);
            showNotification('Full system scan initiated');
        } else if (action === 'restart') {
            updateScore(-10);
            showNotification('Warning: Restarting may destroy evidence');
        }

        // Update score based on number of proper actions taken
        if (actionsTaken >= 3) {
            updateScore(5);
        }
    }

    // Simulation controls
    function startSimulation() {
        simulationActive = true;
        startButton.disabled = true;
        pauseButton.disabled = false;
        resetButton.disabled = false;
        showNotification('Simulation started - Scenario ' + currentScenario);

        // Generate new alerts based on scenario
        if (currentScenario === 1) {
            // Default scenario - already set up
        } else if (currentScenario === 2) {
            // Change some alert details for scenario 2
            document.querySelector('.alerts-table tbody tr:first-child td:nth-child(3)').textContent = 'Suspicious Registry Modification';
            document.querySelector('.alerts-table tbody tr:first-child td:nth-child(4)').textContent = 'SERVER-DB001';
        } else if (currentScenario === 3) {
            // More complex scenario with ransomware indicators
            document.querySelector('.alerts-table tbody tr:first-child td:nth-child(3)').textContent = 'Multiple File Extensions Changed';
            document.querySelector('.card-value').textContent = '12'; // More alerts
        }
    }

    function pauseSimulation() {
        simulationActive = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
        showNotification('Simulation paused');
    }

    function resetSimulation() {
        simulationActive = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
        score = 70;
        updateScoreDisplay();

        // Reset alerts table to default
        document.querySelector('.alerts-table tbody tr:first-child td:nth-child(3)').textContent = 'Suspicious PowerShell Execution';
        document.querySelector('.alerts-table tbody tr:first-child td:nth-child(4)').textContent = 'DESKTOP-HRLP421';
        document.querySelector('.card-value').textContent = '8';

        // Reset selected actions
        document.querySelectorAll('.action-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        showNotification('Simulation reset');
    }

    // Utility functions
    function updateScore(points) {
        score += points;
        if (score > 100) score = 100;
        if (score < 0) score = 0;

        updateScoreDisplay();
    }

    function updateScoreDisplay() {
        const scoreValue = document.querySelector('.score-value');
        const progressBar = document.querySelector('.progress');
        const feedback = document.querySelector('.score-feedback');

        if (scoreValue) {
            scoreValue.textContent = score + '%';
            progressBar.style.width = score + '%';

            // Update feedback based on score
            if (score < 50) {
                feedback.textContent = 'Your response needs significant improvement. Critical actions are missing.';
                progressBar.style.backgroundColor = '#dc3545';
            } else if (score < 75) {
                feedback.textContent = 'Your response is on the right track, but there are additional actions that could improve containment.';
                progressBar.style.backgroundColor = '#ffc107';
            } else {
                feedback.textContent = 'Excellent response! You\'ve effectively contained and remediated the threat.';
                progressBar.style.backgroundColor = '#28a745';
            }
        }
    }

    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Add a randomly appearing alert during simulation
    function addRandomAlert() {
        if (simulationActive && Math.random() < 0.3) {
            alertsGenerated++;

            // Update alerts count
            document.querySelector('.card-value').textContent = alertsGenerated;

            // Alert notification
            showNotification('New alert detected!');

            // Flash the alerts menu item
            const alertsMenu = document.querySelector('[data-page="alerts"]');
            alertsMenu.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Alerts (${alertsGenerated})`;
            alertsMenu.classList.add('flash');
            setTimeout(() => {
                alertsMenu.classList.remove('flash');
            }, 2000);
        }
    }

    // Event listeners
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            navigateTo(targetPage);
        });
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    alertLevelBtn.addEventListener('click', cycleAlertLevel);

    viewAlertButtons.forEach(button => {
        button.addEventListener('click', function() {
            navigateTo('investigation');
        });
    });

    actionItems.forEach(item => {
        item.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            this.classList.toggle('selected');
            handleResponseAction(action);
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', hideAllModals);
    });

    modalActionButtons.forEach(button => {
        button.addEventListener('click', function() {
            hideAllModals();
            updateScore(10); // Add points for taking action
            showNotification('Action executed successfully');
        });
    });

    scenarioOptions.forEach(option => {
        option.addEventListener('click', function() {
            scenarioOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            currentScenario = parseInt(this.getAttribute('data-scenario'));

            // Reset simulation when changing scenarios
            resetSimulation();
        });
    });

    startButton.addEventListener('click', startSimulation);
    pauseButton.addEventListener('click', pauseSimulation);
    resetButton.addEventListener('click', resetSimulation);

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Additional functionality
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            showNotification('Dashboard refreshed');
            // Simulate data refresh with a slight delay
            this.classList.add('rotating');
            setTimeout(() => {
                this.classList.remove('rotating');
                // Could update data here
            }, 1000);
        });
    }

    if (suggestBtn) {
        suggestBtn.addEventListener('click', function() {
            showNotification('Suggestion: Consider isolating the endpoint and blocking the suspicious IP address');
        });
    }

    if (finishBtn) {
        finishBtn.addEventListener('click', function() {
            const finalScore = document.querySelector('.score-value').textContent;
            alert(`Response completed with a score of ${finalScore}`);
            navigateTo('dashboard');
        });
    }

    // Set up simulation timer to periodically check for new alerts
    setInterval(addRandomAlert, 10000); // Check for new alerts every 10 seconds

    // Add some dynamic CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: opacity 0.5s;
        }
        .notification-content {
            display: flex;
            align-items: center;
        }
        .notification-content i {
            margin-right: 10px;
        }
        .fade-out {
            opacity: 0;
        }
        .flash {
            animation: flash-animation 1s infinite;
        }
        @keyframes flash-animation {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(220, 53, 69, 0.3); }
        }
        .rotating {
            animation: rotating-animation 1s linear;
        }
        @keyframes rotating-animation {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .action-item.selected {
            background-color: rgba(25, 135, 84, 0.1);
            border: 1px solid #198754;
        }
    `;
    document.head.appendChild(style);

    // Initialize with dashboard view
    navigateTo('dashboard');
});