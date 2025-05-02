    document.addEventListener('DOMContentLoaded', function () {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
            width: auto;
        `;
            document.body.appendChild(notificationContainer);
        }

        // Mobile menu toggle
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (menuBtn) {
            menuBtn.addEventListener('click', function () {
                navLinks.classList.toggle('active');
            });
        }

        // Tool tab switching
        const toolTabs = document.querySelectorAll('.tool-tab');
        const toolContents = document.querySelectorAll('.tool-content');

        toolTabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tool = this.getAttribute('data-tool');

                // Remove active class from all tabs and contents
                toolTabs.forEach(t => t.classList.remove('active'));
                toolContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                document.getElementById(`${tool}-tool`).classList.add('active');
            });
        });

        // Sample data loading with proper error handling
        setupSampleDataLoading();

        // Inspector tabs switching
        setupInspectorTabs();

        // Setup all form functionality
        setupForms();

        // Setup all control buttons
        setupControlButtons();

        // Setup packet and alert tables
        setupTables();

        // Initialize tools based on URL hash if present
        initializeFromHash();

        // Setup window resize handler
        setupResizeHandler();
    });

    // Function to show notification instead of alert
    function showNotification(message, type = 'info', duration = 3000) {
        const notificationContainer = document.getElementById('notification-container');

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
        background-color: ${getNotificationColor(type)};
        color: ${type === 'warning' || type === 'success' ? '#212529' : 'white'};
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        font-family: inherit;
        font-size: 14px;
        position: relative;
        animation: slideIn 0.3s ease forwards;
        opacity: 0;
        transform: translateX(100%);
    `;

        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 12px;
        cursor: pointer;
        font-size: 18px;
        opacity: 0.7;
    `;
        closeBtn.addEventListener('click', function () {
            removeNotification(notification);
        });

        // Set message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        // Add icon based on type
        const icon = document.createElement('i');
        icon.className = getNotificationIcon(type);
        icon.style.marginRight = '10px';

        // Assemble notification
        notification.appendChild(icon);
        notification.appendChild(messageSpan);
        notification.appendChild(closeBtn);

        // Add to container
        notificationContainer.appendChild(notification);

        // Add keyframes if they don't exist
        if (!document.getElementById('notification-keyframes')) {
            const style = document.createElement('style');
            style.id = 'notification-keyframes';
            style.textContent = `
            @keyframes slideIn {
                0% { opacity: 0; transform: translateX(100%); }
                100% { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                0% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(100%); }
            }
        `;
            document.head.appendChild(style);
        }

        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            removeNotification(notification);
        }, duration);

        return notification;
    }

    // Function to remove notification with animation
    function removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Function to get notification background color
    function getNotificationColor(type) {
        switch (type) {
            case 'success':
                return '#20c997';
            case 'error':
                return '#dc3545';
            case 'warning':
                return '#ffc107';
            case 'info':
            default:
                return '#0d6efd';
        }
    }

    // Function to get notification icon
    function getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            case 'info':
            default:
                return 'fas fa-info-circle';
        }
    }

    // Function for confirmation dialog
    function showConfirmation(message, onConfirm, onCancel) {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
        background-color: white;
        border-radius: 4px;
        padding: 20px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;

        // Create modal content
        const modalHeader = document.createElement('div');
        modalHeader.style.marginBottom = '15px';

        const modalTitle = document.createElement('h4');
        modalTitle.textContent = 'Confirmation';
        modalTitle.style.cssText = `
        margin: 0;
        color: #212529;
        font-size: 18px;
        font-weight: bold;
    `;

        const modalBody = document.createElement('div');
        modalBody.style.cssText = `
        margin-bottom: 20px;
        color: #495057;
    `;
        modalBody.textContent = message;

        const modalFooter = document.createElement('div');
        modalFooter.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
        padding: 8px 16px;
        border: 1px solid #dee2e6;
        background-color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        color: #212529;
    `;

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.style.cssText = `
        padding: 8px 16px;
        border: none;
        background-color: #0d6efd;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;

        // Assemble modal
        modalHeader.appendChild(modalTitle);
        modalFooter.appendChild(cancelBtn);
        modalFooter.appendChild(confirmBtn);

        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);
        modal.appendChild(modalFooter);

        modalContainer.appendChild(modal);
        document.body.appendChild(modalContainer);

        // Event listeners
        cancelBtn.addEventListener('click', function () {
            closeModal();
            if (typeof onCancel === 'function') onCancel();
        });

        confirmBtn.addEventListener('click', function () {
            closeModal();
            if (typeof onConfirm === 'function') onConfirm();
        });

        // Close on background click
        modalContainer.addEventListener('click', function (e) {
            if (e.target === modalContainer) {
                closeModal();
                if (typeof onCancel === 'function') onCancel();
            }
        });

        // Close function
        function closeModal() {
            modalContainer.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => {
                document.body.removeChild(modalContainer);
            }, 300);
        }

        // Show modal with animation
        setTimeout(() => {
            modalContainer.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);
    }

    // Function to set up sample data loading
    function setupSampleDataLoading() {
        const loadSampleCapture = document.getElementById('load-sample-capture');
        if (loadSampleCapture) {
            loadSampleCapture.addEventListener('click', function () {
                const wiresharkResults = document.getElementById('wireshark-results');
                if (wiresharkResults) {
                    wiresharkResults.style.display = 'block';
                    animateElement(wiresharkResults);

                    // Enable stop button, disable start button for Wireshark
                    toggleToolButtons('wireshark', true);

                    showNotification('Sample packet capture loaded successfully', 'success');
                }
            });
        }

        const loadSampleNmap = document.getElementById('load-sample-nmap');
        if (loadSampleNmap) {
            loadSampleNmap.addEventListener('click', function () {
                const nmapResults = document.getElementById('nmap-results');
                if (nmapResults) {
                    nmapResults.style.display = 'block';
                    animateElement(nmapResults);

                    showNotification('Sample network scan results loaded', 'success');
                }
            });
        }

        const loadSampleIds = document.getElementById('load-sample-ids');
        if (loadSampleIds) {
            loadSampleIds.addEventListener('click', function () {
                const idsResults = document.getElementById('ids-results');
                if (idsResults) {
                    idsResults.style.display = 'block';
                    animateElement(idsResults);

                    // Enable stop button, disable start button for IDS
                    toggleToolButtons('ids', true);

                    showNotification('Sample IDS alerts loaded', 'success');
                }
            });
        }
    }

    // Function to animate an element appearance
    function animateElement(element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.5s ease-in-out';

        // Force reflow
        void element.offsetWidth;

        element.style.opacity = '1';
    }

    // Function to set up inspector tabs
    function setupInspectorTabs() {
        const inspectorTabs = document.querySelectorAll('.inspector-tab');

        // Create content containers for each tab if they don't exist
        if (inspectorTabs.length > 0) {
            const packetInspector = document.querySelector('.packet-inspector');

            // Check if content divs already exist
            if (!document.querySelector('.inspector-content')) {
                // Get existing content
                const existingContent = document.querySelectorAll('.layer-block');
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'inspector-content';
                contentWrapper.setAttribute('data-tab', 'details');

                // Move existing content into the details tab
                existingContent.forEach(content => {
                    const clone = content.cloneNode(true);
                    contentWrapper.appendChild(clone);
                });

                // Create hex and raw tabs content
                const hexContent = document.createElement('div');
                hexContent.className = 'inspector-content';
                hexContent.setAttribute('data-tab', 'hex');
                hexContent.style.display = 'none';
                hexContent.innerHTML = `
                <div class="layer-block">
                    <pre style="font-family: 'Courier New', monospace; line-height: 1.5; overflow-x: auto;">
0000   00 0c 29 8f 5d 10 00 50 56 c0 00 08 08 00 45 00
0010   00 44 1a 2b 40 00 40 11 6a 3b c0 a8 01 05 c0 a8
0020   01 01 d2 b0 00 35 00 30 e3 45 1a 2b 01 00 00 01
0030   00 00 00 00 00 00 07 65 78 61 6d 70 6c 65 03 63
0040   6f 6d 00 00 01 00 01
                    </pre>
                </div>
            `;

                const rawContent = document.createElement('div');
                rawContent.className = 'inspector-content';
                rawContent.setAttribute('data-tab', 'raw');
                rawContent.style.display = 'none';
                rawContent.innerHTML = `
                <div class="layer-block">
                    <div style="font-family: 'Courier New', monospace; line-height: 1.5;">
                        <p>Raw packet data - 82 bytes:</p>
                        <p style="word-break: break-all; margin-top: 10px;">
                            000c298f5d1000505?6c0000808004500004?41a2b40004011?6a3bc0a80105c0?a8010?1d2b000350?030e3451a2b0100?000100000000?00076578616d?706c6503636f?6d0000010001
                        </p>
                    </div>
                </div>
            `;

                // Clear existing content
                while (packetInspector.children.length > 2) {  // Keep title and tabs
                    packetInspector.removeChild(packetInspector.lastChild);
                }

                // Append all content
                packetInspector.appendChild(contentWrapper);
                packetInspector.appendChild(hexContent);
                packetInspector.appendChild(rawContent);
            }
        }

        // Add click events to tabs
        inspectorTabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tabId = this.getAttribute('data-tab');

                // Remove active class from all tabs
                inspectorTabs.forEach(t => t.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Show corresponding content
                const contents = document.querySelectorAll('.inspector-content');
                contents.forEach(content => {
                    if (content.getAttribute('data-tab') === tabId) {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                });
            });
        });
    }

    // Function to set up form functionality
    function setupForms() {
        // Add rule button and form in Firewall tool
        const addRuleBtn = document.querySelector('.btn-secondary[style="margin-top: 20px;"]');
        const addRuleForm = document.querySelector('.add-rule-form');

        if (addRuleBtn && addRuleForm) {
            addRuleBtn.addEventListener('click', function () {
                addRuleForm.style.display = 'block';
                animateElement(addRuleForm);

                // Scroll to form
                addRuleForm.scrollIntoView({behavior: 'smooth', block: 'start'});
            });

            // Cancel button in the form
            const cancelBtn = addRuleForm.querySelector('.btn-secondary');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function () {
                    addRuleForm.style.display = 'none';
                });
            }

            // Add Rule button in the form
            const submitRuleBtn = addRuleForm.querySelector('.btn-primary');
            if (submitRuleBtn) {
                submitRuleBtn.addEventListener('click', function () {
                    // Get form values
                    const formGroups = addRuleForm.querySelectorAll('.form-group');
                    const values = Array.from(formGroups).map(group => {
                        const input = group.querySelector('input, select');
                        return input ? input.value : '';
                    });

                    // Add the rule to the table (in a real implementation)
                    addFirewallRule(values);

                    // Hide the form
                    addRuleForm.style.display = 'none';
                });
            }
        }

        // Reset buttons for all tools
        const resetButtons = document.querySelectorAll('.btn-secondary[title="Reset settings"]');
        resetButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                // Find the closest form and reset its inputs
                const toolBody = this.closest('.tool-body');
                if (toolBody) {
                    const inputs = toolBody.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        if (input.tagName === 'SELECT') {
                            input.selectedIndex = 0;
                        } else {
                            input.value = '';
                        }
                    });

                    showNotification('Settings have been reset', 'info');
                }
            });
        });

        // Handle filter inputs
        setupFilterInputs();
    }

    // Function to add a firewall rule (simulated)
    function addFirewallRule(values) {
        // Get the table
        const ruleTable = document.querySelector('.rule-table tbody');
        if (!ruleTable) return;

        // Get the number of existing rows to create a new priority number
        const priority = ruleTable.children.length + 1;

        // Create a new row
        const newRow = document.createElement('tr');

        // Determine action class
        const actionClass = values[0].toLowerCase();

        // Create row HTML
        newRow.innerHTML = `
        <td>${priority}</td>
        <td><span class="rule-action ${actionClass}">${values[0]}</span></td>
        <td>${values[1]}</td>
        <td>${values[2]}</td>
        <td>${values[3]}</td>
        <td>${values[4]}</td>
        <td>${values[5]}</td>
        <td>
            <div class="rule-controls">
                <button class="rule-btn"><i class="fas fa-edit"></i></button>
                <button class="rule-btn"><i class="fas fa-trash-alt"></i></button>
            </div>
        </td>
    `;

        // Add event listeners to new buttons
        const buttons = newRow.querySelectorAll('.rule-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();

                if (this.querySelector('.fa-edit')) {
                    // Edit button clicked
                    showNotification('Edit rule functionality would open here', 'info');
                } else if (this.querySelector('.fa-trash-alt')) {
                    // Delete button clicked
                    showConfirmation('Are you sure you want to delete this rule?', function () {
                        ruleTable.removeChild(newRow);
                        showNotification('Rule deleted successfully', 'success');
                    });
                }
            });
        });

        // Add row to table
        ruleTable.appendChild(newRow);

        // Show confirmation
        showNotification('New firewall rule added successfully', 'success');
    }

    // Function to set up filter inputs
    function setupFilterInputs() {
        // Wireshark display filter
        const displayFilter = document.querySelector('#wireshark-results .form-control');
        if (displayFilter) {
            displayFilter.addEventListener('keyup', function (e) {
                if (e.key === 'Enter') {
                    // Apply filter simulation
                    const filtered = applyFilter(this.value, '.packet-table tbody tr');
                    showNotification(`Filter applied: ${filtered} packets match "${this.value}"`, 'info');
                }
            });
        }

        // IDS alert filter
        const alertFilter = document.querySelector('#ids-results .form-control');
        if (alertFilter) {
            alertFilter.addEventListener('keyup', function (e) {
                if (e.key === 'Enter') {
                    // Apply filter simulation
                    const filtered = applyFilter(this.value, '.alert-table tbody tr');
                    showNotification(`Filter applied: ${filtered} alerts match "${this.value}"`, 'info');
                }
            });
        }
    }

    // Function to simulate filtering of table rows
    function applyFilter(filterText, selector) {
        let count = 0;

        if (!filterText) {
            // Show all rows if filter is empty
            document.querySelectorAll(selector).forEach(row => {
                row.style.display = '';
                count++;
            });
            return count;
        }

        // Filter rows based on text content (case insensitive)
        const lowerFilter = filterText.toLowerCase();
        document.querySelectorAll(selector).forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(lowerFilter)) {
                row.style.display = '';
                count++;
            } else {
                row.style.display = 'none';
            }
        });

        return count;
    }

    // Function to set up all control buttons
    function setupControlButtons() {
        // Wireshark controls
        setupToolControls('wireshark');

        // Nmap controls
        setupToolControls('nmap');

        // IDS controls
        setupToolControls('ids');

        // Firewall controls
        setupToolControls('firewall');

        // Setup existing rule buttons
        const ruleButtons = document.querySelectorAll('.rule-btn');
        ruleButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();

                if (this.querySelector('.fa-edit')) {
                    // Edit button clicked
                    showNotification('Edit rule functionality would open here', 'info');
                } else if (this.querySelector('.fa-trash-alt')) {
                    // Delete button clicked
                    const row = this.closest('tr');
                    if (row) {
                        showConfirmation('Are you sure you want to delete this rule?', function () {
                            const table = row.closest('tbody');
                            if (table) {
                                table.removeChild(row);
                                showNotification('Rule deleted successfully', 'success');
                            }
                        });
                    }
                }
            });
        });
    }

    // Function to set up tool control buttons
    function setupToolControls(toolName) {
        const controlBtns = document.querySelectorAll(`.tool-header.${toolName} .tool-btn`);

        controlBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                if (this.hasAttribute('disabled')) return;

                const action = this.getAttribute('title');
                const buttonIcon = this.querySelector('i');

                if (buttonIcon && buttonIcon.classList.contains('fa-play')) {
                    // Start button clicked
                    toggleToolButtons(toolName, true);

                    // Show simulated activity
                    if (toolName === 'wireshark') {
                        simulateCapture();
                    } else if (toolName === 'nmap') {
                        simulateScan();
                    } else if (toolName === 'ids') {
                        simulateIdsMonitoring();
                    }

                    showNotification(`${capitalizeFirstLetter(toolName)} ${action.toLowerCase()}`, 'success');
                } else if (buttonIcon && buttonIcon.classList.contains('fa-stop')) {
                    // Stop button clicked
                    toggleToolButtons(toolName, false);
                    showNotification(`${capitalizeFirstLetter(toolName)} ${action.toLowerCase()}`, 'info');
                } else if (buttonIcon && buttonIcon.classList.contains('fa-redo')) {
                    // Restart button clicked
                    const resultsDiv = document.getElementById(`${toolName}-results`);
                    if (resultsDiv && resultsDiv.style.display === 'block') {
                        resultsDiv.style.display = 'none';
                        setTimeout(() => {
                            resultsDiv.style.display = 'block';
                            animateElement(resultsDiv);
                        }, 500);
                    }

                    showNotification(`${capitalizeFirstLetter(toolName)} restarted`, 'info');
                } else if (buttonIcon && buttonIcon.classList.contains('fa-save')) {
                    // Save button clicked
                    showNotification(`${action} functionality would save the current data to a file`, 'info');
                } else if (buttonIcon && buttonIcon.classList.contains('fa-check')) {
                    // Apply button clicked (firewall)
                    showNotification('Firewall configuration applied successfully', 'success');
                } else if (buttonIcon && buttonIcon.classList.contains('fa-undo')) {
                    // Reset button clicked (firewall)
                    showConfirmation('Are you sure you want to reset to default configuration?', function () {
                        showNotification('Firewall configuration reset to defaults', 'success');
                    });
                } else if (buttonIcon && buttonIcon.classList.contains('fa-trash-alt')) {
                    // Clear alerts button (IDS)
                    const idsResults = document.getElementById('ids-results');
                    if (idsResults && idsResults.style.display === 'block') {
                        showConfirmation('Are you sure you want to clear all alerts?', function () {
                            document.querySelectorAll('.alert-table tbody tr').forEach(row => {
                                row.style.display = 'none';
                            });

                            // Hide detail view if visible
                            const detailView = document.getElementById('alert-detail-view');
                            if (detailView) {
                                detailView.style.display = 'none';
                            }

                            showNotification('All alerts have been cleared', 'success');
                        });
                    } else {
                        showNotification('No alerts to clear', 'warning');
                    }
                }
            });
        });
    }

    // Function to toggle start/stop buttons
    function toggleToolButtons(toolName, isRunning) {
        const controlBtns = document.querySelectorAll(`.tool-header.${toolName} .tool-btn`);

        controlBtns.forEach(btn => {
            const buttonIcon = btn.querySelector('i');

            if (buttonIcon) {
                if (buttonIcon.classList.contains('fa-play')) {
                    // Start button
                    btn.disabled = isRunning;
                    btn.setAttribute('disabled', isRunning ? 'disabled' : null);
                } else if (buttonIcon.classList.contains('fa-stop')) {
                    // Stop button
                    btn.disabled = !isRunning;
                    btn.setAttribute('disabled', !isRunning ? 'disabled' : null);
                }
            }
        });
    }

    // Function to simulate packet capture
    function simulateCapture() {
        const wiresharkResults = document.getElementById('wireshark-results');
        if (wiresharkResults) {
            if (wiresharkResults.style.display !== 'block') {
                wiresharkResults.style.display = 'block';
                animateElement(wiresharkResults);
            }

            // Could add dynamic packet simulation here
        }
    }

    // Function to simulate network scan
    function simulateScan() {
        const nmapResults = document.getElementById('nmap-results');
        if (nmapResults) {
            if (nmapResults.style.display !== 'block') {
                nmapResults.style.display = 'block';
                animateElement(nmapResults);
            }

            // Update terminal with live scan simulation
            const terminal = document.querySelector('.terminal');
            if (terminal) {
                let originalContent = terminal.innerHTML;
                let scanProgress = 0;

                // Clear terminal first
                terminal.innerHTML = '<span class="terminal-prompt">$ </span><span class="terminal-command">nmap -sS -sV -O 192.168.1.0/24</span>\n\nStarting Nmap 7.93 ( https://nmap.org ) at 2025-05-01 14:30 EDT\nScanning 256 IP addresses...\n';

                // Create progress notification
                const progressNotification = showNotification('Scan in progress: 0%', 'info', 0);

                const scanInterval = setInterval(() => {
                    scanProgress += Math.floor(Math.random() * 5) + 1;
                    if (scanProgress >= 100) {
                        clearInterval(scanInterval);
                        terminal.innerHTML = originalContent;

                        // Update and remove progress notification
                        if (progressNotification) {
                            progressNotification.querySelector('span').textContent = 'Scan completed: 100%';
                            progressNotification.className = progressNotification.className.replace('info', 'success');
                            setTimeout(() => {
                                removeNotification(progressNotification);
                            }, 1500);
                        }
                    } else {
                        terminal.innerHTML = `<span class="terminal-prompt">$ </span><span class="terminal-command">nmap -sS -sV -O 192.168.1.0/24</span>\n\nStarting Nmap 7.93 ( https://nmap.org ) at 2025-05-01 14:30 EDT\nScanning 256 IP addresses... ${scanProgress}% complete\n`;

                        // Update progress notification
                        if (progressNotification) {
                            progressNotification.querySelector('span').textContent = `Scan in progress: ${scanProgress}%`;
                        }
                    }
                }, 500);
            }
        }
    }

    // Function to simulate IDS monitoring
    function simulateIdsMonitoring() {
        const idsResults = document.getElementById('ids-results');
        if (idsResults) {
            if (idsResults.style.display !== 'block') {
                idsResults.style.display = 'block';
                animateElement(idsResults);
            }

            // Could add dynamic alert generation here
        }
    }

    // Function to set up packet and alert tables
    // Function to set up packet and alert tables
    function setupTables() {
        // Make packet table rows clickable
        const packetRows = document.querySelectorAll('.packet-table tbody tr');
        packetRows.forEach(row => {
            row.addEventListener('click', function () {
                selectPacket(this);
            });
        });

        // Make alert table rows clickable
        const alertRows = document.querySelectorAll('.alert-table tbody tr');
        alertRows.forEach(row => {
            row.addEventListener('click', function () {
                // Highlight selected row
                alertRows.forEach(r => r.classList.remove('selected'));
                this.classList.add('selected');

                // Show alert details
                showAlertDetail();
            });
        });

        // Back button in alert detail view
        const backButton = document.querySelector('#alert-detail-view .btn-secondary');
        if (backButton) {
            backButton.addEventListener('click', function () {
                hideAlertDetail();
            });
        }
    }

    // Function to select a packet in Wireshark
    function selectPacket(element) {
        // Remove selected class from all packets
        const packets = document.querySelectorAll('.packet-table tbody tr');
        packets.forEach(packet => {
            packet.classList.remove('selected');
        });

        // Add selected class to clicked packet
        element.classList.add('selected');

        // Update packet inspector title to show the selected packet number
        const packetNumber = element.querySelector('td:first-child').textContent;
        const inspectorTitle = document.querySelector('.inspector-title');
        if (inspectorTitle) {
            inspectorTitle.textContent = `Packet Inspector - Packet #${packetNumber}`;

            // Simulate loading packet data
            const layerBlocks = document.querySelectorAll('.layer-block');
            layerBlocks.forEach(block => {
                block.style.opacity = '0.5';
            });

            setTimeout(() => {
                layerBlocks.forEach(block => {
                    block.style.opacity = '1';
                });
            }, 300);
        }

        // Show a subtle notification
        showNotification(`Packet #${packetNumber} selected`, 'info', 1500);
    }

    // Function to show alert detail view
    function showAlertDetail() {
        const alertDetailView = document.getElementById('alert-detail-view');
        if (alertDetailView) {
            alertDetailView.style.display = 'block';
            animateElement(alertDetailView);

            // Scroll to detail view
            alertDetailView.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    }

    // Function to hide alert detail view
    function hideAlertDetail() {
        const alertDetailView = document.getElementById('alert-detail-view');
        if (alertDetailView) {
            alertDetailView.style.display = 'none';

            // Remove selected class from alert rows
            document.querySelectorAll('.alert-table tbody tr').forEach(row => {
                row.classList.remove('selected');
            });

            showNotification('Returned to alerts overview', 'info', 1500);
        }
    }

    // Initialize tools based on URL hash if present
    function initializeFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const toolName = hash.replace('-tool', '');
            const toolTab = document.querySelector(`.tool-tab[data-tool="${toolName}"]`);
            if (toolTab) {
                toolTab.click();
                showNotification(`Loaded ${capitalizeFirstLetter(toolName)} tool`, 'info', 2000);
            }
        }
    }

    // Set up window resize handler
    function setupResizeHandler() {
        window.addEventListener('resize', function () {
            const width = window.innerWidth;
            const navLinks = document.querySelector('.nav-links');

            if (width > 768 && navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    }

    // Utility function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Global function to reset all tools
    function resetAllTools() {
        // Reset all result displays
        document.getElementById('wireshark-results').style.display = 'none';
        document.getElementById('nmap-results').style.display = 'none';
        document.getElementById('ids-results').style.display = 'none';

        // Hide any detail views
        const alertDetailView = document.getElementById('alert-detail-view');
        if (alertDetailView) {
            alertDetailView.style.display = 'none';
        }

        // Hide add rule form
        const addRuleForm = document.querySelector('.add-rule-form');
        if (addRuleForm) {
            addRuleForm.style.display = 'none';
        }

        // Reset all form inputs
        document.querySelectorAll('.form-control').forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });

        // Reset all tool buttons
        ['wireshark', 'nmap', 'ids'].forEach(tool => {
            toggleToolButtons(tool, false);
        });

        // Show all table rows (clear filters)
        document.querySelectorAll('.packet-table tbody tr, .alert-table tbody tr').forEach(row => {
            row.style.display = '';
            row.classList.remove('selected');
        });

        showNotification('All tools have been reset to their default state', 'success');
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        // Escape key to close modal dialogs and detail views
        if (e.key === 'Escape') {
            // Check if alert detail view is open
            const alertDetailView = document.getElementById('alert-detail-view');
            if (alertDetailView && alertDetailView.style.display === 'block') {
                hideAlertDetail();
                return;
            }

            // Check if add rule form is open
            const addRuleForm = document.querySelector('.add-rule-form');
            if (addRuleForm && addRuleForm.style.display === 'block') {
                addRuleForm.style.display = 'none';
                return;
            }

            // Close any visible modals
            const modalContainer = document.querySelector('[style*="position: fixed"][style*="background-color: rgba(0, 0, 0, 0.5)"]');
            if (modalContainer) {
                document.body.removeChild(modalContainer);
                return;
            }
        }

        // Ctrl + S for save functionality
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault(); // Prevent browser save dialog

            // Find the active tool
            const activeToolContent = document.querySelector('.tool-content.active');
            if (activeToolContent) {
                const toolId = activeToolContent.id;
                const toolName = toolId.replace('-tool', '');

                // Find the save button in the active tool
                const saveBtn = document.querySelector(`.tool-header.${toolName} .tool-btn [class*="fa-save"]`);
                if (saveBtn) {
                    saveBtn.closest('.tool-btn').click();
                } else {
                    showNotification(`Save functionality not available for ${capitalizeFirstLetter(toolName)}`, 'warning');
                }
            }
        }

        // Ctrl + F for focus on filter input
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault(); // Prevent browser find dialog

            // Find the active tool
            const activeToolContent = document.querySelector('.tool-content.active');
            if (activeToolContent) {
                // Find filter input in the active tool results
                const filterInput = activeToolContent.querySelector('.tool-results .form-control');
                if (filterInput) {
                    filterInput.focus();
                    showNotification('Filter focused, type your query and press Enter', 'info', 2000);
                }
            }
        }
    });

    // Add a tooltip system
    function createTooltip(element, text) {
        // Only add if element doesn't already have a tooltip
        if (element.getAttribute('data-has-tooltip')) return;

        element.setAttribute('data-has-tooltip', 'true');

        element.addEventListener('mouseenter', function (e) {
            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            tooltip.style.cssText = `
            position: absolute;
            background-color: #212529;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
            white-space: nowrap;
        `;

            document.body.appendChild(tooltip);

            // Position the tooltip
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 5 + window.scrollY}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + window.scrollX}px`;

            // Show the tooltip
            setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 10);

            // Store tooltip reference
            element.tooltip = tooltip;
        });

        element.addEventListener('mouseleave', function () {
            if (element.tooltip) {
                element.tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (element.tooltip.parentNode) {
                        element.tooltip.parentNode.removeChild(element.tooltip);
                    }
                    element.tooltip = null;
                }, 200);
            }
        });
    }

    // Apply tooltips to all control buttons
    document.addEventListener('DOMContentLoaded', function () {
        // Add tooltips to all buttons with title attributes
        document.querySelectorAll('[title]').forEach(element => {
            const tooltipText = element.getAttribute('title');
            createTooltip(element, tooltipText);

            // Remove title attribute to prevent default browser tooltip
            element.removeAttribute('title');
        });

        // Add tooltips to other interactive elements
        document.querySelectorAll('.packet-table tbody tr').forEach(row => {
            createTooltip(row, 'Click to inspect packet details');
        });

        document.querySelectorAll('.alert-table tbody tr').forEach(row => {
            createTooltip(row, 'Click to view alert details');
        });

        document.querySelectorAll('.rule-table tbody tr').forEach(row => {
            createTooltip(row, 'Firewall rule');
        });

        document.querySelectorAll('.tool-tab').forEach(tab => {
            const toolName = tab.getAttribute('data-tool');
            createTooltip(tab, `Switch to ${capitalizeFirstLetter(toolName)} tool`);
        });
    });

    // Add a dark mode toggle
    function setupDarkMode() {
        // Create dark mode toggle button
        const darkModeToggle = document.createElement('button');
        darkModeToggle.className = 'dark-mode-toggle';
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #212529;
        color: white;
        border: none;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;

        document.body.appendChild(darkModeToggle);

        // Create dark mode stylesheet
        const darkModeStyle = document.createElement('style');
        darkModeStyle.id = 'dark-mode-style';
        darkModeStyle.textContent = `
        body.dark-mode {
            background-color: #121212;
            color: #e0e0e0;
        }

        body.dark-mode .tool-interface,
        body.dark-mode .tool-tab,
        body.dark-mode .packet-inspector,
        body.dark-mode .host-block,
        body.dark-mode .add-rule-form,
        body.dark-mode .alert-detail {
            background-color: #1e1e1e;
            color: #e0e0e0;
        }

        body.dark-mode .form-control {
            background-color: #2d2d2d;
            color: #e0e0e0;
            border-color: #444;
        }

        body.dark-mode .btn-secondary {
            background-color: #3d3d3d;
            color: #e0e0e0;
        }

        body.dark-mode .packet-table th,
        body.dark-mode .rule-table th,
        body.dark-mode .alert-table th,
        body.dark-mode .port-table th {
            background-color: #2d2d2d;
            color: #e0e0e0;
        }

        body.dark-mode .packet-table td,
        body.dark-mode .rule-table td,
        body.dark-mode .alert-table td,
        body.dark-mode .port-table td {
            border-color: #444;
        }

        body.dark-mode .packet-table tbody tr:hover,
        body.dark-mode .rule-table tbody tr:hover,
        body.dark-mode .alert-table tbody tr:hover {
            background-color: #2d2d2d;
        }

        body.dark-mode .packet-table tbody tr.selected {
            background-color: rgba(22, 121, 167, 0.3);
        }

        body.dark-mode .host-header {
            background-color: #2d2d2d;
            border-color: #444;
        }

        body.dark-mode .host-details {
            background-color: #1e1e1e;
        }

        body.dark-mode .dark-mode-toggle {
            background-color: #e0e0e0;
            color: #121212;
        }

        body.dark-mode .dark-mode-toggle i {
            transform: rotate(180deg);
        }
    `;

        document.head.appendChild(darkModeStyle);

        // Toggle dark mode on button click
        darkModeToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');

            if (document.body.classList.contains('dark-mode')) {
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('dark-mode', 'enabled');
                showNotification('Dark mode enabled', 'info', 1500);
            } else {
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('dark-mode', 'disabled');
                showNotification('Light mode enabled', 'info', 1500);
            }
        });

        // Check user preference
        if (localStorage.getItem('dark-mode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        // Add tooltip to toggle
        createTooltip(darkModeToggle, 'Toggle dark mode');
    }

    // Initialize dark mode toggle
    document.addEventListener('DOMContentLoaded', function () {
        setupDarkMode();
    });