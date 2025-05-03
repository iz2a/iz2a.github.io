document.addEventListener('DOMContentLoaded', function() {
    // Store state for the simulation
    const labState = {
        currentScenario: '1',
        simulationRunning: false,
        alertLevel: 'Normal',
        selectedActions: [],
        completedActions: []
    };

    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-item a');
    const pageContents = document.querySelectorAll('.page-content');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');

            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Show appropriate page
            pageContents.forEach(page => {
                page.style.display = 'none';
            });

            if (targetPage === 'dashboard') {
                document.getElementById('dashboard-page').style.display = 'block';
            } else if (targetPage === 'alerts') {
                showAlertsPage();
            } else if (targetPage === 'endpoints') {
                showEndpointsPage();
            } else if (targetPage === 'investigation') {
                document.getElementById('investigation-page').style.display = 'block';
            } else if (targetPage === 'response') {
                document.getElementById('response-page').style.display = 'block';
            } else if (targetPage === 'reports') {
                showReportsPage();
            } else if (targetPage === 'settings') {
                showSettingsPage();
            }
        });
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show appropriate tab content
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${targetTab}-tab`).style.display = 'block';
        });
    });

    // Alert Level Button
    const alertLevelBtn = document.querySelector('.alert-level');
    alertLevelBtn.addEventListener('click', function() {
        if (labState.alertLevel === 'Normal') {
            this.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: Medium';
            this.classList.add('medium');
            labState.alertLevel = 'Medium';
        } else if (labState.alertLevel === 'Medium') {
            this.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: High';
            this.classList.remove('medium');
            this.classList.add('high');
            labState.alertLevel = 'High';
        } else {
            this.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: Normal';
            this.classList.remove('high');
            labState.alertLevel = 'Normal';
        }
    });

    // Refresh Button
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.addEventListener('click', function() {
        // Add a spinning animation to show refresh
        this.querySelector('i').classList.add('fa-spin');

        // Simulate refresh delay
        setTimeout(() => {
            this.querySelector('i').classList.remove('fa-spin');
            updateDashboardData();
        }, 1000);
    });

    // Function to update dashboard data
    function updateDashboardData() {
        // Update card values based on current scenario and simulation state
        const activeAlertsValue = document.querySelector('.dashboard-card:nth-child(1) .card-value');
        const protectedEndpointsValue = document.querySelector('.dashboard-card:nth-child(2) .card-value');
        const threatsBlockedValue = document.querySelector('.dashboard-card:nth-child(3) .card-value');

        // For demonstration, update values based on current scenario
        if (labState.simulationRunning) {
            if (labState.currentScenario === '1') {
                activeAlertsValue.textContent = '8';
            } else if (labState.currentScenario === '2') {
                activeAlertsValue.textContent = '12';
            } else if (labState.currentScenario === '3') {
                activeAlertsValue.textContent = '5';
            }
        } else {
            activeAlertsValue.textContent = '8'; // Default value
        }
    }

    // View Alert Button
    const viewAlertButtons = document.querySelectorAll('.view-alert');
    viewAlertButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alertId = this.getAttribute('data-alert-id');

            // Show investigation page
            pageContents.forEach(page => {
                page.style.display = 'none';
            });
            document.getElementById('investigation-page').style.display = 'block';

            // Update sidebar active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            document.querySelector('[data-page="investigation"]').classList.add('active');

            // If viewing from alerts page, scroll to the appropriate section based on alert
            if (alertId === '001') {
                // For the PowerShell alert, focus on the process tab
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelector('[data-tab="processes"]').classList.add('active');

                tabContents.forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById('processes-tab').style.display = 'block';
            }
        });
    });

    // Response Action Items
    const actionItems = document.querySelectorAll('.action-item');

    actionItems.forEach(item => {
        item.addEventListener('click', function() {
            const action = this.getAttribute('data-action');

            // Toggle selection state for the action item
            if (!this.classList.contains('selected')) {
                this.classList.add('selected');
                labState.selectedActions.push(action);
                updateResponseScore();
            } else {
                this.classList.remove('selected');
                const index = labState.selectedActions.indexOf(action);
                if (index !== -1) {
                    labState.selectedActions.splice(index, 1);
                }
                updateResponseScore();
            }

            // Show appropriate modal based on action
            if (action === 'kill-process') {
                document.getElementById('process-action-modal').style.display = 'block';
            } else if (action === 'delete-file' || action === 'quarantine-file') {
                document.getElementById('file-action-modal').style.display = 'block';
            } else if (action === 'isolate') {
                // Just mark as selected, no modal needed
                showNotification('Network isolation initiated');
            } else if (action === 'block-hash') {
                showNotification('File hash added to block list');
            } else if (action === 'block-ip') {
                showNotification('IP address blocked across network');
            } else if (action === 'full-scan') {
                showNotification('Full system scan initiated');
            } else if (action === 'restart') {
                showNotification('System restart scheduled');
            }
        });
    });

    // Update response score based on selected actions
    function updateResponseScore() {
        const scoreValue = document.querySelector('.score-value');
        const progressBar = document.querySelector('.progress');
        const scoreFeedback = document.querySelector('.score-feedback');

        // Calculate score based on scenario and selected actions
        // For scenario 1 (PowerShell attack), best actions are:
        // isolate, kill-process, delete-file, block-hash, block-ip, full-scan

        let score = 0;
        const maxScore = 100;

        if (labState.currentScenario === '1') {
            // Critical actions
            if (labState.selectedActions.includes('isolate')) score += 20;
            if (labState.selectedActions.includes('kill-process')) score += 15;
            if (labState.selectedActions.includes('delete-file')) score += 15;

            // Important actions
            if (labState.selectedActions.includes('block-hash')) score += 10;
            if (labState.selectedActions.includes('block-ip')) score += 10;

            // Additional actions
            if (labState.selectedActions.includes('full-scan')) score += 10;
            if (labState.selectedActions.includes('quarantine-file')) score += 10;
            if (labState.selectedActions.includes('restart')) score += 10;
        }

        // Cap at 100
        score = Math.min(score, 100);

        // Update UI
        scoreValue.textContent = score + '%';
        progressBar.style.width = score + '%';

        // Change progress bar color based on score
        if (score < 50) {
            progressBar.style.backgroundColor = '#dc3545'; // Red
        } else if (score < 75) {
            progressBar.style.backgroundColor = '#ffc107'; // Yellow
        } else {
            progressBar.style.backgroundColor = '#28a745'; // Green
        }

        // Update feedback text
        if (score < 50) {
            scoreFeedback.textContent = 'Your response needs improvement. Consider critical containment actions.';
        } else if (score < 75) {
            scoreFeedback.textContent = 'Your response is on the right track, but there are additional actions that could improve containment.';
        } else if (score < 100) {
            scoreFeedback.textContent = 'Good response! You\'ve covered most of the necessary actions.';
        } else {
            scoreFeedback.textContent = 'Excellent response! You\'ve taken all recommended actions.';
        }

        // Update metric scores based on selected actions
        const threatContainment = document.querySelector('.score-metric:nth-child(1) .metric-value');
        const evidencePreservation = document.querySelector('.score-metric:nth-child(2) .metric-value');
        const businessImpact = document.querySelector('.score-metric:nth-child(3) .metric-value');

        let containmentScore = 0;
        if (labState.selectedActions.includes('isolate')) containmentScore += 40;
        if (labState.selectedActions.includes('kill-process')) containmentScore += 30;
        if (labState.selectedActions.includes('block-ip')) containmentScore += 30;
        containmentScore = Math.min(containmentScore, 100);
        threatContainment.textContent = containmentScore + '%';

        let preservationScore = 0;
        if (labState.selectedActions.includes('quarantine-file')) preservationScore += 50;
        if (!labState.selectedActions.includes('delete-file')) preservationScore += 30;
        if (!labState.selectedActions.includes('restart')) preservationScore += 20;
        evidencePreservation.textContent = preservationScore + '%';

        let impactScore = 100;
        if (labState.selectedActions.includes('isolate')) impactScore -= 30;
        if (labState.selectedActions.includes('restart')) impactScore -= 30;
        businessImpact.textContent = impactScore + '%';
    }

    // Close Modal
    const closeButtons = document.querySelectorAll('.close-btn, .modal-btn.btn-secondary');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Modal Action Buttons
    const modalActionButtons = document.querySelectorAll('.modal-btn.btn-primary, .modal-btn.btn-danger');
    modalActionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get modal type and form values
            const modal = this.closest('.modal');
            const modalType = modal.id === 'process-action-modal' ? 'process' : 'file';

            // Process form values (could be enhanced)
            if (modalType === 'process') {
                const processSelect = modal.querySelector('.form-select');
                const processId = processSelect.value;
                const processName = processSelect.options[processSelect.selectedIndex].text;
                const forceKill = modal.querySelector('#force-kill').checked;
                const killChildren = modal.querySelector('#kill-children').checked;
                const createMemoryDump = modal.querySelector('#create-memory-dump').checked;

                // Add to completed actions
                labState.completedActions.push({
                    type: 'kill-process',
                    details: {
                        process: processName,
                        options: { forceKill, killChildren, createMemoryDump }
                    }
                });

                showNotification(`Process ${processName} terminated successfully`);
            } else if (modalType === 'file') {
                const fileSelect = modal.querySelector('.form-select');
                const fileId = fileSelect.value;
                const filePath = fileSelect.options[fileSelect.selectedIndex].text;
                const backupFile = modal.querySelector('#backup-file').checked;
                const secureDelete = modal.querySelector('#secure-delete').checked;

                // Add to completed actions
                labState.completedActions.push({
                    type: this.textContent.includes('Delete') ? 'delete-file' : 'quarantine-file',
                    details: {
                        file: filePath,
                        options: { backupFile, secureDelete }
                    }
                });

                const actionText = this.textContent.includes('Delete') ? 'deleted' : 'quarantined';
                showNotification(`File successfully ${actionText}`);
            }

            // Hide the modal
            modal.style.display = 'none';
        });
    });

    // Simulation Controls
    const scenarioOptions = document.querySelectorAll('.scenario-option');
    scenarioOptions.forEach(option => {
        option.addEventListener('click', function() {
            scenarioOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');

            labState.currentScenario = this.getAttribute('data-scenario');
            resetSimulation();
        });
    });

    const startButton = document.querySelector('.start-btn');
    const pauseButton = document.querySelector('.pause-btn');
    const resetButton = document.querySelector('.reset-btn');

    startButton.addEventListener('click', function() {
        this.disabled = true;
        pauseButton.disabled = false;
        labState.simulationRunning = true;
        showNotification('Simulation started');

        // Start scenario-specific events
        runScenarioEvents();
    });

    pauseButton.addEventListener('click', function() {
        this.disabled = true;
        startButton.disabled = false;
        labState.simulationRunning = false;
        showNotification('Simulation paused');
    });

    resetButton.addEventListener('click', function() {
        resetSimulation();
        showNotification('Simulation reset');
    });

    function resetSimulation() {
        startButton.disabled = false;
        pauseButton.disabled = true;
        labState.simulationRunning = false;
        labState.selectedActions = [];
        labState.completedActions = [];

        // Reset UI states
        actionItems.forEach(item => {
            item.classList.remove('selected');
        });

        // Reset score
        updateResponseScore();

        // Reset to default dashboard
        updateDashboardData();
    }

    function runScenarioEvents() {
        if (labState.currentScenario === '1') {
            // PowerShell attack scenario - already set up in HTML
        } else if (labState.currentScenario === '2') {
            // Could implement different scenarios here
            showNotification('Scenario 2: Ransomware attack simulation loaded');
        } else if (labState.currentScenario === '3') {
            showNotification('Scenario 3: Data exfiltration simulation loaded');
        }
    }

    // Helper function to show notifications
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

        // Add to document
        document.body.appendChild(notification);

        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Score improvement button
    const suggestImprovementsBtn = document.querySelector('.score-btn:not(.finish-btn)');
    suggestImprovementsBtn.addEventListener('click', function() {
        const missingActions = [];

        if (labState.currentScenario === '1') {
            if (!labState.selectedActions.includes('isolate')) {
                missingActions.push('Network Isolation');
            }
            if (!labState.selectedActions.includes('kill-process')) {
                missingActions.push('Kill Process');
            }
            if (!labState.selectedActions.includes('delete-file') && !labState.selectedActions.includes('quarantine-file')) {
                missingActions.push('Delete or Quarantine Malicious Files');
            }
            if (!labState.selectedActions.includes('block-ip')) {
                missingActions.push('Block Suspicious IP Address');
            }
        }

        if (missingActions.length > 0) {
            showNotification(`Suggested actions: ${missingActions.join(', ')}`);
        } else {
            showNotification('Your response plan is comprehensive');
        }
    });

    // Complete response button
    const completeResponseBtn = document.querySelector('.finish-btn');
    completeResponseBtn.addEventListener('click', function() {
        const score = parseInt(document.querySelector('.score-value').textContent);

        if (score >= 75) {
            showNotification('Excellent! Threat has been successfully contained');
            // Could navigate to a results or summary page
        } else {
            showNotification('Response incomplete. Consider additional containment measures');
        }
    });

    // Placeholder functions for pages not implemented in original HTML
    function showAlertsPage() {
        // We'll use the dashboard page but could create a dedicated alerts page
        document.getElementById('dashboard-page').style.display = 'block';
        showNotification('Viewing all active alerts');
    }

    function showEndpointsPage() {
        // Show dashboard for now
        document.getElementById('dashboard-page').style.display = 'block';
        showNotification('Endpoint inventory would be displayed here');
    }

    function showReportsPage() {
        document.getElementById('dashboard-page').style.display = 'block';
        showNotification('Reports and analytics would be displayed here');
    }

    function showSettingsPage() {
        document.getElementById('dashboard-page').style.display = 'block';
        showNotification('EDR configuration settings would be displayed here');
    }

    // Add custom CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.3s ease-out;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
        }
        
        .notification-content i {
            margin-right: 10px;
            font-size: 18px;
        }
        
        .action-item {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .action-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        }
        
        .action-item.selected {
            border: 2px solid #28a745;
            background-color: rgba(40, 167, 69, 0.1);
        }
        
        .process-suspicious, .file-malicious, .connection-suspicious {
            background-color: rgba(220, 53, 69, 0.1);
            border-left: 3px solid #dc3545;
        }
    `;
    document.head.appendChild(style);

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Close menu when clicking on a link
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
});