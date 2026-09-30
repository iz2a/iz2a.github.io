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
/* ==========================================================================
   File Integrity Monitoring module (absorbed from the FIM Challenge).
   Adds a "File Integrity" page to the EDR console: baseline SHA-256 hashes for
   critical files, a scan that detects modified / new / deleted files, and an
   investigate action. Modeled on Tripwire / OSSEC / Wazuh FIM.
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }

    var FILES = [
        { path:'C:\\Windows\\System32\\drivers\\etc\\hosts', base:'a1f0...9c22', now:'7be3...41da', status:'modified',
          note:'Two entries were appended redirecting login.gulfpay.local and update.microsoft.com to 185.225.19.44. Classic credential-phishing / update-hijack redirect.', sev:'critical' },
        { path:'C:\\inetpub\\wwwroot\\index.html', base:'3c9d...77ab', now:'c40e...1f90', status:'modified',
          note:'A hidden iframe and an obfuscated <script> block were injected into the homepage. Consistent with a web defacement or drive-by backdoor.', sev:'high' },
        { path:'C:\\Windows\\Temp\\svchost.exe', base:'(not in baseline)', now:'ee91...b7c3', status:'new',
          note:'A new executable named to impersonate the legitimate svchost.exe, but located in Temp and unsigned. Very likely malware.', sev:'critical' },
        { path:'C:\\Program Files\\GulfPay\\app.config', base:'5d21...09ff', now:'5d21...09ff', status:'unchanged',
          note:'Matches baseline. No action needed.', sev:'ok' },
        { path:'C:\\Windows\\System32\\cmd.exe', base:'9a77...2b10', now:'9a77...2b10', status:'unchanged',
          note:'Matches baseline. No action needed.', sev:'ok' },
        { path:'C:\\Windows\\System32\\config\\SAM', base:'b0c4...5e6a', now:'DELETED', status:'deleted',
          note:'The SAM registry hive backup was removed. Could indicate anti-forensics after credential theft.', sev:'high' }
    ];
    var SEVC={critical:'#d64545',high:'#e8833a',medium:'#e0a94a',ok:'#2e9e6b'};
    var STATUSC={modified:'#e0a94a',new:'#d64545',deleted:'#6c757d',unchanged:'#2e9e6b'};
    var acknowledged={};

    ready(function(){
        var menu=document.querySelector('.sidebar-menu');
        if(!menu || document.getElementById('integrity-page')) return;
        var links=Array.prototype.slice.call(menu.querySelectorAll('a[data-page]'));
        var epLink=links.filter(function(a){return a.getAttribute('data-page')==='endpoints';})[0];
        var li=document.createElement('li'); li.className='sidebar-menu-item';
        li.innerHTML='<a href="#" data-page="integrity"><i class="fas fa-fingerprint"></i> File Integrity</a>';
        if(epLink && epLink.parentNode){ epLink.parentNode.parentNode.insertBefore(li, epLink.parentNode.nextSibling); }
        else { menu.appendChild(li); }

        var dash=document.getElementById('dashboard-page');
        var page=document.createElement('div'); page.className='page-content'; page.id='integrity-page'; page.style.display='none';
        if(dash && dash.parentNode) dash.parentNode.appendChild(page); else document.querySelector('main,.main-content,body').appendChild(page);

        menu.addEventListener('click', function(e){
            var a=e.target.closest ? e.target.closest('a[data-page]') : null;
            if(!a) return;
            if(a.getAttribute('data-page')==='integrity'){
                e.preventDefault();
                menu.querySelectorAll('a[data-page]').forEach(function(x){x.classList.remove('active');});
                a.classList.add('active');
                document.querySelectorAll('.page-content').forEach(function(p){p.style.display='none';});
                page.style.display='block';
                render();
            } else {
                // another page selected: hide FIM page and drop its active state
                page.style.display='none';
                var fim=menu.querySelector('a[data-page="integrity"]'); if(fim) fim.classList.remove('active');
            }
        });

        function counts(){ var c={modified:0,new:0,deleted:0,unchanged:0}; FILES.forEach(function(f){c[f.status]++;}); return c; }

        function render(){
            var c=counts();
            var changed=FILES.filter(function(f){return f.status!=='unchanged';}).length;
            var rows=FILES.map(function(f,i){
                var isAck=acknowledged[i];
                return '<tr style="border-top:1px solid #eceff2;vertical-align:top;'+(f.status!=='unchanged'?'background:#fffdf7;':'')+'">'+
                    '<td style="padding:11px 12px;font-family:monospace;font-size:13px;color:#212529;">'+f.path+'</td>'+
                    '<td style="padding:11px 12px;font-family:monospace;font-size:12px;color:#6c757d;">'+f.base+'<br>'+ (f.now==='DELETED'?'<span style="color:#d64545;">DELETED</span>':f.now)+'</td>'+
                    '<td style="padding:11px 12px;text-align:center;"><span style="background:'+STATUSC[f.status]+';color:#fff;border-radius:6px;padding:3px 9px;font-size:12px;font-weight:600;text-transform:capitalize;">'+f.status+'</span></td>'+
                    '<td style="padding:11px 12px;color:#6c757d;font-size:13px;">'+f.note+'</td>'+
                    '<td style="padding:11px 12px;text-align:center;">'+ (f.status==='unchanged'?'<span style="color:#adb5bd;">&mdash;</span>' : (isAck?'<span style="color:#2e9e6b;font-size:13px;"><i class="fas fa-check"></i> Logged</span>':'<button class="fim-ack" data-i="'+i+'" style="background:#212529;color:#fff;border:0;border-radius:6px;padding:6px 11px;font-size:12px;cursor:pointer;">Investigate</button>')) +'</td>'+
                '</tr>';
            }).join('');
            page.innerHTML=''+
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'+
                    '<div><h2 class="page-title" style="margin:0;">File Integrity Monitoring</h2>'+
                    '<p class="page-description" style="margin:4px 0 0;color:#6c757d;">Baseline SHA-256 hashes are compared against the current file system on monitored endpoints. Any drift is flagged for review.</p></div>'+
                    '<button id="fim-scan" style="background:#212529;color:#fff;border:0;border-radius:8px;padding:11px 18px;font-weight:600;cursor:pointer;"><i class="fas fa-magnifying-glass"></i> Run integrity scan</button>'+
                '</div>'+
                '<div id="fim-summary" style="margin:16px 0;color:#6c757d;">Click <strong>Run integrity scan</strong> to compare '+FILES.length+' monitored files against their baseline.</div>'+
                '<div id="fim-table" style="display:none;">'+
                    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'+
                        '<span style="background:'+STATUSC.modified+';color:#fff;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;">'+c.modified+' modified</span>'+
                        '<span style="background:'+STATUSC.new+';color:#fff;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;">'+c.new+' new</span>'+
                        '<span style="background:'+STATUSC.deleted+';color:#fff;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;">'+c.deleted+' deleted</span>'+
                        '<span style="background:'+STATUSC.unchanged+';color:#fff;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;">'+c.unchanged+' unchanged</span>'+
                    '</div>'+
                    '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3e7ec;border-radius:8px;overflow:hidden;">'+
                        '<thead><tr style="background:#f1f3f6;">'+
                            '<th style="text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6c757d;">File</th>'+
                            '<th style="text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6c757d;">Baseline / current</th>'+
                            '<th style="text-align:center;padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6c757d;">Status</th>'+
                            '<th style="text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6c757d;">Analysis</th>'+
                            '<th style="text-align:center;padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6c757d;">Action</th>'+
                        '</tr></thead><tbody>'+rows+'</tbody></table>';
            var scanBtn=page.querySelector('#fim-scan');
            scanBtn.addEventListener('click', function(){
                scanBtn.disabled=true; scanBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Scanning...';
                setTimeout(function(){
                    page.querySelector('#fim-table').style.display='block';
                    page.querySelector('#fim-summary').innerHTML='Scan complete. <strong style="color:#d64545;">'+changed+' of '+FILES.length+' monitored files changed</strong> since the last baseline. Investigate the critical and high items first.';
                    scanBtn.innerHTML='<i class="fas fa-check"></i> Scan complete';
                    page.querySelectorAll('.fim-ack').forEach(function(bn){ bn.addEventListener('click', function(){ acknowledged[bn.dataset.i]=true; render(); page.querySelector('#fim-table').style.display='block'; }); });
                }, 800);
            });
            page.querySelectorAll('.fim-ack').forEach(function(bn){ bn.addEventListener('click', function(){ acknowledged[bn.dataset.i]=true; render(); }); });
        }
    });
})();
