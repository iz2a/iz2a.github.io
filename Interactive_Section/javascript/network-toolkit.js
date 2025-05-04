document.addEventListener('DOMContentLoaded', function() {
    // Create notification container
    setupNotifications();

    // Initialize mobile menu
    setupMobileMenu();

    // Setup tool tabs
    setupToolTabs();

    // Setup sample data loading
    setupSampleDataLoading();

    // Setup Wireshark inspector tabs
    setupInspectorTabs();

    // Setup firewall configuration
    setupFirewallConfig();

    // Setup event handlers for all tables
    setupTableInteractions();

    // Setup tool controls (start, stop buttons)
    setupToolControls();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Fix packet table formatting issues
    fixPacketTableIssues();

    // Setup dark mode
    setupDarkMode();

    // Initialize from URL hash if present
    initializeFromHash();
});

// ------------------------
// Core UI Setup Functions
// ------------------------

function setupNotifications() {
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
            width: auto;
        `;
        document.body.appendChild(container);

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(50px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(50px); }
            }
            .notification {
                padding: 12px 20px;
                margin-bottom: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                font-family: inherit;
                font-size: 14px;
                position: relative;
                animation: fadeIn 0.3s ease forwards;
                display: flex;
                align-items: center;
            }
            .notification i {
                margin-right: 10px;
            }
            .notification .close-btn {
                position: absolute;
                top: 8px;
                right: 12px;
                cursor: pointer;
                font-size: 18px;
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }
}

function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                }
            });
        });
    }
}

function setupToolTabs() {
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolContents = document.querySelectorAll('.tool-content');

    if (toolTabs.length === 0 || toolContents.length === 0) return;

    toolTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            if (!tool) return;

            // Update tabs and content visibility
            toolTabs.forEach(t => t.classList.remove('active'));
            toolContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const toolContent = document.getElementById(`${tool}-tool`);
            if (toolContent) {
                toolContent.classList.add('active');

                // Update URL hash for direct linking
                history.replaceState(null, null, `#${tool}`);
            }
        });
    });
}

// ------------------------
// Tool Functionality
// ------------------------

function setupSampleDataLoading() {
    // Wireshark sample data loading
    const loadWiresharkSample = document.getElementById('load-sample-capture');
    if (loadWiresharkSample) {
        loadWiresharkSample.addEventListener('click', function() {
            const results = document.getElementById('wireshark-results');
            if (results) {
                results.style.display = 'block';
                animateElement(results);
                toggleToolButtons('wireshark', true);
                showNotification('Sample packet capture loaded successfully', 'success');
            }
        });
    }

    // Nmap sample data loading
    const loadNmapSample = document.getElementById('load-sample-nmap');
    if (loadNmapSample) {
        loadNmapSample.addEventListener('click', function() {
            const results = document.getElementById('nmap-results');
            if (results) {
                results.style.display = 'block';
                animateElement(results);
                showNotification('Sample network scan results loaded', 'success');
            }
        });
    }

    // IDS sample data loading
    const loadIdsSample = document.getElementById('load-sample-ids');
    if (loadIdsSample) {
        loadIdsSample.addEventListener('click', function() {
            const results = document.getElementById('ids-results');
            if (results) {
                results.style.display = 'block';
                animateElement(results);
                toggleToolButtons('ids', true);
                showNotification('Sample IDS alerts loaded', 'success');
            }
        });
    }
}

function setupInspectorTabs() {
    const inspectorTabs = document.querySelectorAll('.inspector-tab');
    if (inspectorTabs.length === 0) return;

    // Create content containers for each tab if they don't exist
    const packetInspector = document.querySelector('.packet-inspector');
    if (!packetInspector) return;

    // Check if content divs already exist
    if (!document.querySelector('.inspector-content')) {
        // Structure the inspector content
        const tabIds = ['details', 'hex', 'raw'];
        const tabContents = {
            'details': Array.from(packetInspector.querySelectorAll('.layer-block')),
            'hex': `<div class="layer-block">
                <pre style="font-family: 'Courier New', monospace; line-height: 1.5; overflow-x: auto;">
0000   00 0c 29 8f 5d 10 00 50 56 c0 00 08 08 00 45 00
0010   00 44 1a 2b 40 00 40 11 6a 3b c0 a8 01 05 c0 a8
0020   01 01 d2 b0 00 35 00 30 e3 45 1a 2b 01 00 00 01
0030   00 00 00 00 00 00 07 65 78 61 6d 70 6c 65 03 63
0040   6f 6d 00 00 01 00 01
                </pre>
            </div>`,
            'raw': `<div class="layer-block">
                <div style="font-family: 'Courier New', monospace; line-height: 1.5;">
                    <p>Raw packet data - 82 bytes:</p>
                    <p style="word-break: break-all; margin-top: 10px;">
                        000c298f5d1000505?6c0000808004500004?41a2b40004011?6a3bc0a80105c0?a8010?1d2b000350?030e3451a2b0100?000100000000?00076578616d?706c6503636f?6d0000010001
                    </p>
                </div>
            </div>`
        };

        // Remove existing layer blocks from inspector
        tabContents['details'].forEach(block => {
            if (block.parentNode === packetInspector) {
                packetInspector.removeChild(block);
            }
        });

        // Create content wrappers
        tabIds.forEach(tabId => {
            const content = document.createElement('div');
            content.className = 'inspector-content';
            content.setAttribute('data-tab', tabId);
            content.style.display = tabId === 'details' ? 'block' : 'none';

            if (tabId === 'details') {
                tabContents[tabId].forEach(block => {
                    content.appendChild(block.cloneNode(true));
                });
            } else {
                content.innerHTML = tabContents[tabId];
            }

            packetInspector.appendChild(content);
        });
    }

    // Set up tab switching
    inspectorTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;

            // Update active tab
            inspectorTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding content
            const contents = document.querySelectorAll('.inspector-content');
            contents.forEach(content => {
                content.style.display = content.getAttribute('data-tab') === tabId ? 'block' : 'none';
            });
        });
    });
}

function setupFirewallConfig() {
    // Add rule button
    const addRuleBtn = document.querySelector('.btn-secondary[style="margin-top: 20px;"]');
    const addRuleForm = document.querySelector('.add-rule-form');

    if (addRuleBtn && addRuleForm) {
        // Show form on add rule button click
        addRuleBtn.addEventListener('click', function() {
            addRuleForm.style.display = 'block';
            animateElement(addRuleForm);
            addRuleForm.scrollIntoView({behavior: 'smooth', block: 'start'});
        });

        // Cancel button
        const cancelBtn = addRuleForm.querySelector('.btn-secondary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                addRuleForm.style.display = 'none';
            });
        }

        // Add rule button
        const submitRuleBtn = addRuleForm.querySelector('.btn-primary');
        if (submitRuleBtn) {
            submitRuleBtn.addEventListener('click', function() {
                const formGroups = addRuleForm.querySelectorAll('.form-group');
                const values = Array.from(formGroups).map(group => {
                    const input = group.querySelector('input, select');
                    return input ? input.value : '';
                });

                // Validate values
                if (values.some(value => value.trim() === '')) {
                    showNotification('Please fill in all fields', 'warning');
                    return;
                }

                // Add rule to table
                addFirewallRule(values);

                // Reset and hide form
                formGroups.forEach(group => {
                    const input = group.querySelector('input');
                    if (input) input.value = '';
                });
                addRuleForm.style.display = 'none';
            });
        }
    }

    // Setup existing rule buttons
    setupRuleButtons();
}

function setupRuleButtons() {
    const ruleButtons = document.querySelectorAll('.rule-btn');
    ruleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            const row = this.closest('tr');
            if (!row) return;

            if (this.querySelector('.fa-edit')) {
                // Edit button functionality
                showNotification('Edit rule functionality would open here', 'info');
            } else if (this.querySelector('.fa-trash-alt')) {
                // Delete button functionality
                showConfirmation('Are you sure you want to delete this rule?', function() {
                    const table = row.closest('tbody');
                    if (table) {
                        table.removeChild(row);
                        showNotification('Rule deleted successfully', 'success');

                        // Update priority numbers
                        renumberRules(table);
                    }
                });
            }
        });
    });
}

function setupTableInteractions() {
    // Packet table rows
    const packetRows = document.querySelectorAll('.packet-table tbody tr');
    packetRows.forEach(row => {
        // Fix any duplicated cells
        fixRowCells(row);

        // Add click handler
        row.addEventListener('click', function() {
            selectPacket(this);
        });
    });

    // Alert table rows
    const alertRows = document.querySelectorAll('.alert-table tbody tr');
    alertRows.forEach(row => {
        row.addEventListener('click', function() {
            // Select row
            alertRows.forEach(r => r.classList.remove('selected'));
            this.classList.add('selected');

            // Show alert details
            showAlertDetail();
        });
    });

    // Back button in alert detail view
    const backButton = document.querySelector('#alert-detail-view .btn-secondary');
    if (backButton) {
        backButton.addEventListener('click', hideAlertDetail);
    }

    // Setup form filter inputs
    setupFilterInputs();
}

function setupToolControls() {
    const toolNames = ['wireshark', 'nmap', 'ids', 'firewall'];

    toolNames.forEach(toolName => {
        const controlBtns = document.querySelectorAll(`.tool-header.${toolName} .tool-btn`);

        controlBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.hasAttribute('disabled')) return;

                const action = this.getAttribute('title');
                const buttonIcon = this.querySelector('i');

                if (!buttonIcon) return;

                // Handle different button actions
                if (buttonIcon.classList.contains('fa-play')) {
                    // Start button
                    toggleToolButtons(toolName, true);

                    if (toolName === 'wireshark') {
                        simulateCapture();
                    } else if (toolName === 'nmap') {
                        simulateScan();
                    } else if (toolName === 'ids') {
                        simulateIdsMonitoring();
                    }

                    showNotification(`${capitalizeFirstLetter(toolName)} ${action.toLowerCase()}`, 'success');

                } else if (buttonIcon.classList.contains('fa-stop')) {
                    // Stop button
                    toggleToolButtons(toolName, false);
                    showNotification(`${capitalizeFirstLetter(toolName)} ${action.toLowerCase()}`, 'info');

                } else if (buttonIcon.classList.contains('fa-redo')) {
                    // Restart button
                    const resultsDiv = document.getElementById(`${toolName}-results`);
                    if (resultsDiv && resultsDiv.style.display === 'block') {
                        resultsDiv.style.display = 'none';
                        setTimeout(() => {
                            resultsDiv.style.display = 'block';
                            animateElement(resultsDiv);
                        }, 300);
                    }

                    showNotification(`${capitalizeFirstLetter(toolName)} restarted`, 'info');

                } else if (buttonIcon.classList.contains('fa-save')) {
                    // Save button
                    showNotification(`${action} functionality would save the current data to a file`, 'info');

                } else if (buttonIcon.classList.contains('fa-check')) {
                    // Apply button (firewall)
                    showNotification('Firewall configuration applied successfully', 'success');

                } else if (buttonIcon.classList.contains('fa-undo')) {
                    // Reset button (firewall)
                    showConfirmation('Are you sure you want to reset to default configuration?', function() {
                        showNotification('Firewall configuration reset to defaults', 'success');
                    });

                } else if (buttonIcon.classList.contains('fa-trash-alt')) {
                    // Clear alerts button (IDS)
                    const idsResults = document.getElementById('ids-results');
                    if (idsResults && idsResults.style.display === 'block') {
                        showConfirmation('Are you sure you want to clear all alerts?', function() {
                            document.querySelectorAll('.alert-table tbody tr').forEach(row => {
                                row.style.display = 'none';
                            });

                            // Hide detail view
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
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Skip if focused on input elements
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        // Escape key to close modals/details
        if (e.key === 'Escape') {
            // Check if alert detail is visible
            const alertDetail = document.getElementById('alert-detail-view');
            if (alertDetail && alertDetail.style.display === 'block') {
                hideAlertDetail();
                return;
            }

            // Check if add rule form is visible
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

        // Number keys 1-4 for switching tools
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            const toolTabs = document.querySelectorAll('.tool-tab');
            if (toolTabs.length > index) {
                toolTabs[index].click();
            }
            return;
        }

        // Ctrl + F for focus on filter
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();

            const activeToolContent = document.querySelector('.tool-content.active');
            if (activeToolContent) {
                const filterInput = activeToolContent.querySelector('.tool-results .form-control');
                if (filterInput) {
                    filterInput.focus();
                    showNotification('Filter focused, type your query and press Enter', 'info', 2000);
                }
            }
            return;
        }
    });
}

function setupDarkMode() {
    // Create dark mode toggle button if it doesn't exist
    if (!document.querySelector('.dark-mode-toggle')) {
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

        // Create dark mode styles
        if (!document.getElementById('dark-mode-styles')) {
            const style = document.createElement('style');
            style.id = 'dark-mode-styles';
            style.textContent = `
                body.dark-mode {
                    background-color: #121212;
                    color: #e0e0e0;
                }
                
                body.dark-mode .section-title,
                body.dark-mode .section-subtitle {
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
                    border-color: #444;
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
                body.dark-mode .port-table th,
                body.dark-mode .host-header {
                    background-color: #2d2d2d;
                    color: #e0e0e0;
                    border-color: #444;
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
                
                body.dark-mode .dark-mode-toggle {
                    background-color: #e0e0e0;
                    color: #121212;
                }
                
                body.dark-mode .dark-mode-toggle i {
                    transform: rotate(180deg);
                }
                
                body.dark-mode .terminal,
                body.dark-mode .packet-data {
                    background-color: #000000;
                    border: 1px solid #444;
                }
            `;
            document.head.appendChild(style);
        }

        // Toggle dark mode on button click
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');

            if (document.body.classList.contains('dark-mode')) {
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('dark-mode', 'enabled');
                showNotification('Dark mode enabled', 'info');
            } else {
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('dark-mode', 'disabled');
                showNotification('Light mode enabled', 'info');
            }
        });

        // Apply saved preference
        if (localStorage.getItem('dark-mode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
}

function fixPacketTableIssues() {
    // Fix any issues with the packet table
    const packetTable = document.querySelector('.packet-table');
    if (!packetTable) return;

    // Fix duplicate columns in specific rows
    const problematicRows = packetTable.querySelectorAll('tbody tr');
    problematicRows.forEach(row => {
        fixRowCells(row);
    });
}

function fixRowCells(row) {
    // Check for exact issues in packet #9
    if (row.querySelector('td:first-child')?.textContent === '9') {
        // Check if this row has too many or duplicate cells
        if (row.cells.length > 7) {
            // Create a fixed version of the row
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>9</td>
                <td class="packet-time">0.206102</td>
                <td class="packet-src">192.168.1.5</td>
                <td class="packet-dst">93.184.216.34</td>
                <td class="packet-protocol tcp">TCP</td>
                <td>66</td>
                <td class="packet-info">58172 → 80 [ACK] Seq=106 Ack=432 Win=64240 Len=0</td>
            `;

            // Replace the old row with the fixed one
            newRow.addEventListener('click', function() {
                selectPacket(this);
            });

            if (row.parentNode) {
                row.parentNode.replaceChild(newRow, row);
            }
        }
    }
}

// ------------------------
// Utility Functions
// ------------------------

function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return null;

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.backgroundColor = getNotificationColor(type);

    // Icon
    const icon = document.createElement('i');
    icon.className = getNotificationIcon(type);
    notification.appendChild(icon);

    // Message
    const text = document.createElement('span');
    text.textContent = message;
    notification.appendChild(text);

    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close-btn';
    closeBtn.addEventListener('click', () => removeNotification(notification));
    notification.appendChild(closeBtn);

    // Add to container
    container.appendChild(notification);

    // Auto remove after duration (if positive)
    if (duration > 0) {
        setTimeout(() => removeNotification(notification), duration);
    }

    return notification;
}

function removeNotification(notification) {
    if (!notification || !notification.parentNode) return;

    notification.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#20c997';
        case 'error': return '#dc3545';
        case 'warning': return '#ffc107';
        case 'info': default: return '#0d6efd';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': default: return 'fas fa-info-circle';
    }
}

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
    `;

    // Create modal content
    modal.innerHTML = `
        <h4 style="margin-top: 0; margin-bottom: 15px; color: #212529; font-size: 18px; font-weight: bold;">Confirmation</h4>
        <div style="margin-bottom: 20px; color: #495057;">${message}</div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #dee2e6; background-color: white; border-radius: 4px; cursor: pointer; font-size: 14px; color: #212529;">Cancel</button>
            <button id="confirm-btn" style="padding: 8px 16px; border: none; background-color: #0d6efd; color: white; border-radius: 4px; cursor: pointer; font-size: 14px;">Confirm</button>
        </div>
    `;

    modalContainer.appendChild(modal);
    document.body.appendChild(modalContainer);

    // Add event listeners
    const cancelBtn = document.getElementById('cancel-btn');
    const confirmBtn = document.getElementById('confirm-btn');

    cancelBtn.addEventListener('click', function() {
        document.body.removeChild(modalContainer);
        if (typeof onCancel === 'function') onCancel();
    });

    confirmBtn.addEventListener('click', function() {
        document.body.removeChild(modalContainer);
        if (typeof onConfirm === 'function') onConfirm();
    });

    // Close on background click
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) {
            document.body.removeChild(modalContainer);
            if (typeof onCancel === 'function') onCancel();
        }
    });

    // Close on Escape key
    const handleKeyDown = function(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modalContainer);
            if (typeof onCancel === 'function') onCancel();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    // Set up keyboard events for confirmation dialog
    document.addEventListener('keydown', handleKeyDown);

    return {
        confirm: function() {
            document.body.removeChild(modalContainer);
            document.removeEventListener('keydown', handleKeyDown);
            if (typeof onConfirm === 'function') onConfirm();
        },
        cancel: function() {
            document.body.removeChild(modalContainer);
            document.removeEventListener('keydown', handleKeyDown);
            if (typeof onCancel === 'function') onCancel();
        }
    };
}

function animateElement(element) {
    if (!element) return;

    // Set initial state
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.5s ease-in-out';

    // Force reflow
    void element.offsetWidth;

    // Animate to visible
    element.style.opacity = '1';
}

function capitalizeFirstLetter(string) {
    if (typeof string !== 'string' || !string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ------------------------
// Tool-specific Functions
// ------------------------

function selectPacket(element) {
    if (!element) return;

    // Remove selected class from all packets
    const packets = document.querySelectorAll('.packet-table tbody tr');
    packets.forEach(p => p.classList.remove('selected'));

    // Add selected class to this packet
    element.classList.add('selected');

    // Update inspector title with packet number
    const packetNumber = element.querySelector('td:first-child')?.textContent;
    if (!packetNumber) return;

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

    // Show notification
    showNotification(`Packet #${packetNumber} selected`, 'info', 1500);
}

function showAlertDetail() {
    const alertDetailView = document.getElementById('alert-detail-view');
    if (!alertDetailView) return;

    // Show alert detail view
    alertDetailView.style.display = 'block';
    animateElement(alertDetailView);

    // Scroll to the detail view
    alertDetailView.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function hideAlertDetail() {
    const alertDetailView = document.getElementById('alert-detail-view');
    if (!alertDetailView) return;

    // Hide the detail view
    alertDetailView.style.display = 'none';

    // Deselect all alert rows
    document.querySelectorAll('.alert-table tbody tr').forEach(row => {
        row.classList.remove('selected');
    });

    showNotification('Returned to alerts overview', 'info', 1500);
}

function addFirewallRule(values) {
    // Get the rule table
    const ruleTable = document.querySelector('.rule-table tbody');
    if (!ruleTable) return;

    // Get next rule priority number
    const priority = ruleTable.children.length + 1;

    // Determine action class (ALLOW, DENY, LOG)
    const actionClass = values[0].toLowerCase();

    // Create new row
    const newRow = document.createElement('tr');
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

    // Add event listeners to the new buttons
    const buttons = newRow.querySelectorAll('.rule-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            if (this.querySelector('.fa-edit')) {
                showNotification('Edit rule functionality would open here', 'info');
            } else if (this.querySelector('.fa-trash-alt')) {
                const row = this.closest('tr');
                showConfirmation('Are you sure you want to delete this rule?', function() {
                    const table = row.closest('tbody');
                    if (table) {
                        table.removeChild(row);
                        showNotification('Rule deleted successfully', 'success');
                        renumberRules(table);
                    }
                });
            }
        });
    });

    // Add the new row to the table
    ruleTable.appendChild(newRow);

    // Show success notification
    showNotification('New firewall rule added successfully', 'success');
}

function renumberRules(table) {
    // Update rule priority numbers
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const priorityCell = row.cells[0];
        if (priorityCell) {
            priorityCell.textContent = index + 1;
        }
    });
}

function toggleToolButtons(toolName, isRunning) {
    // Toggle start/stop buttons for the specified tool
    const startBtn = document.querySelector(`.tool-header.${toolName} .tool-btn [class*="fa-play"]`)?.closest('.tool-btn');
    const stopBtn = document.querySelector(`.tool-header.${toolName} .tool-btn [class*="fa-stop"]`)?.closest('.tool-btn');

    if (startBtn) {
        startBtn.disabled = isRunning;
        if (isRunning) {
            startBtn.setAttribute('disabled', 'disabled');
        } else {
            startBtn.removeAttribute('disabled');
        }
    }

    if (stopBtn) {
        stopBtn.disabled = !isRunning;
        if (!isRunning) {
            stopBtn.setAttribute('disabled', 'disabled');
        } else {
            stopBtn.removeAttribute('disabled');
        }
    }
}

function setupFilterInputs() {
    // Wireshark display filter
    const wiresharkFilter = document.querySelector('#wireshark-results .form-control');
    if (wiresharkFilter) {
        wiresharkFilter.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const matches = filterTableRows('.packet-table tbody tr', this.value);
                showNotification(`Filter applied: ${matches} packets match "${this.value}"`, 'info');
            }
        });
    }

    // IDS alert filter
    const idsFilter = document.querySelector('#ids-results .form-control');
    if (idsFilter) {
        idsFilter.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const matches = filterTableRows('.alert-table tbody tr', this.value);
                showNotification(`Filter applied: ${matches} alerts match "${this.value}"`, 'info');
            }
        });
    }
}

function filterTableRows(selector, filterText) {
    let matchCount = 0;
    const rows = document.querySelectorAll(selector);

    // If filter is empty, show all rows
    if (!filterText) {
        rows.forEach(row => {
            row.style.display = '';
            matchCount++;
        });
        return matchCount;
    }

    // Apply the filter (case insensitive)
    const lowerFilter = filterText.toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(lowerFilter)) {
            row.style.display = '';
            matchCount++;
        } else {
            row.style.display = 'none';
        }
    });

    return matchCount;
}

function simulateCapture() {
    const wiresharkResults = document.getElementById('wireshark-results');
    if (!wiresharkResults || wiresharkResults.style.display === 'none') {
        wiresharkResults.style.display = 'block';
        animateElement(wiresharkResults);
    }

    // Add simulated packets
    const packetTable = wiresharkResults.querySelector('.packet-table tbody');
    if (!packetTable) return;

    const protocols = ['TCP', 'UDP', 'DNS', 'HTTP', 'HTTPS', 'ICMP'];
    const sources = ['192.168.1.5', '192.168.1.10', '192.168.1.15', '192.168.1.24', '93.184.216.34'];
    const destinations = ['192.168.1.1', '93.184.216.34', '172.217.169.36', '52.85.83.228'];

    // Get the current packet count
    let packetCount = packetTable.querySelectorAll('tr').length;

    // Add a simulated packet
    function addPacket() {
        // Generate random packet data
        const protocol = protocols[Math.floor(Math.random() * protocols.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const dest = destinations[Math.floor(Math.random() * destinations.length)];
        const time = (Math.random() * 10).toFixed(6);
        const length = Math.floor(Math.random() * 500) + 60;

        // Create packet info based on protocol
        let info = '';
        if (protocol === 'TCP') {
            const port1 = Math.floor(Math.random() * 60000) + 1024;
            const port2 = [80, 443, 22, 8080][Math.floor(Math.random() * 4)];
            const flags = ['SYN', 'ACK', 'FIN, ACK', 'SYN, ACK', 'PSH, ACK'][Math.floor(Math.random() * 5)];
            info = `${port1} → ${port2} [${flags}] Seq=${Math.floor(Math.random() * 10000)} Win=64240`;
        } else if (protocol === 'UDP') {
            const port1 = Math.floor(Math.random() * 60000) + 1024;
            const port2 = [53, 67, 123, 161][Math.floor(Math.random() * 4)];
            info = `${port1} → ${port2} Len=${Math.floor(Math.random() * 100)}`;
        } else if (protocol === 'DNS') {
            const hosts = ['example.com', 'google.com', 'github.com', 'microsoft.com'];
            const host = hosts[Math.floor(Math.random() * hosts.length)];
            info = `Standard query 0x${Math.floor(Math.random() * 65535).toString(16)} A ${host}`;
        } else if (protocol === 'HTTP') {
            const methods = ['GET', 'POST', 'PUT', 'DELETE'];
            const method = methods[Math.floor(Math.random() * methods.length)];
            info = `${method} / HTTP/1.1`;
        } else if (protocol === 'HTTPS') {
            info = 'TLSv1.2 Application Data';
        } else if (protocol === 'ICMP') {
            const types = ['Echo request', 'Echo reply', 'Destination unreachable'];
            info = types[Math.floor(Math.random() * types.length)];
        }

        // Create new row
        packetCount++;
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${packetCount}</td>
            <td class="packet-time">${time}</td>
            <td class="packet-src">${source}</td>
            <td class="packet-dst">${dest}</td>
            <td class="packet-protocol ${protocol.toLowerCase()}">${protocol}</td>
            <td>${length}</td>
            <td class="packet-info">${info}</td>
        `;

        // Add click handler
        newRow.addEventListener('click', function() {
            selectPacket(this);
        });

        // Add to the beginning of the table
        if (packetTable.firstChild) {
            packetTable.insertBefore(newRow, packetTable.firstChild);
        } else {
            packetTable.appendChild(newRow);
        }
    }

    // Add packets at intervals
    let packetCounter = 0;
    const packetInterval = setInterval(() => {
        addPacket();
        packetCounter++;

        // Stop after adding 5 packets
        if (packetCounter >= 5) {
            clearInterval(packetInterval);
        }
    }, 2000);
}

function simulateScan() {
    const nmapResults = document.getElementById('nmap-results');
    if (!nmapResults) return;

    // Show the results container
    if (nmapResults.style.display === 'none') {
        nmapResults.style.display = 'block';
        animateElement(nmapResults);
    }

    // Simulate a scan in the terminal
    const terminal = nmapResults.querySelector('.terminal');
    if (!terminal) return;

    // Save original content to restore later
    const originalContent = terminal.innerHTML;

    // Show progress
    let progress = 0;
    const notification = showNotification('Scan in progress: 0%', 'info', 0);

    terminal.innerHTML = '<span class="terminal-prompt">$ </span><span class="terminal-command">nmap -sS -sV -O 192.168.1.0/24</span>\n\nStarting Nmap 7.93 ( https://nmap.org ) at 2025-05-01 14:30 EDT\nScanning 256 IP addresses...\n';

    const progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 1;

        if (progress >= 100) {
            clearInterval(progressInterval);
            terminal.innerHTML = originalContent;

            // Update notification
            if (notification) {
                const messageSpan = notification.querySelector('span');
                if (messageSpan) {
                    messageSpan.textContent = 'Scan completed: 100%';
                }
                setTimeout(() => removeNotification(notification), 1500);
            }
        } else {
            terminal.innerHTML = `<span class="terminal-prompt">$ </span><span class="terminal-command">nmap -sS -sV -O 192.168.1.0/24</span>\n\nStarting Nmap 7.93 ( https://nmap.org ) at 2025-05-01 14:30 EDT\nScanning 256 IP addresses... ${progress}% complete\n`;

            // Occasionally add a discovered host
            if (Math.random() > 0.7) {
                const ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
                terminal.innerHTML += `\nDiscovered open port 22/tcp on ${ip}\n`;
            }

            // Update notification
            if (notification) {
                const messageSpan = notification.querySelector('span');
                if (messageSpan) {
                    messageSpan.textContent = `Scan in progress: ${progress}%`;
                }
            }
        }
    }, 500);
}

function simulateIdsMonitoring() {
    const idsResults = document.getElementById('ids-results');
    if (!idsResults) return;

    // Show the results container
    if (idsResults.style.display === 'none') {
        idsResults.style.display = 'block';
        animateElement(idsResults);
    }

    // Generate simulated alerts
    const alertTable = idsResults.querySelector('.alert-table tbody');
    if (!alertTable) return;

    // Sample alerts to add
    const alertTemplates = [
        {
            severity: 'low',
            source: '192.168.1.45',
            destination: '239.255.255.250',
            message: 'ET POLICY UPnP Traffic Detected'
        },
        {
            severity: 'medium',
            source: '192.168.1.15',
            destination: '93.184.216.34',
            message: 'POLICY SSH Outbound Connection'
        },
        {
            severity: 'high',
            source: '203.0.113.42',
            destination: '192.168.1.24',
            message: 'ET EXPLOIT MS17-010 SMB RCE Attempt'
        },
        {
            severity: 'medium',
            source: '198.51.100.12',
            destination: '192.168.1.15',
            message: 'ET WEB_SERVER SQL Injection Attempt'
        }
    ];

    // Add alerts at intervals
    let alertCount = 0;
    const alertInterval = setInterval(() => {
        // Get current time
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Select random alert template
        const alert = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];

        // Create new alert row
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="alert-time">${timeStr}</td>
            <td><span class="alert-severity ${alert.severity}">${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</span></td>
            <td class="alert-src">${alert.source}</td>
            <td class="alert-dst">${alert.destination}</td>
            <td class="alert-message">${alert.message}</td>
        `;

        // Add click handler
        newRow.addEventListener('click', function() {
            // Highlight selected row
            alertTable.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
            this.classList.add('selected');

            // Show alert details
            showAlertDetail();
        });

        // Add to the beginning of the table
        if (alertTable.firstChild) {
            alertTable.insertBefore(newRow, alertTable.firstChild);
        } else {
            alertTable.appendChild(newRow);
        }

        // Show notification for high severity alerts
        if (alert.severity === 'high') {
            showNotification(`High severity alert detected: ${alert.message}`, 'error', 3000);
        }

        alertCount++;

        // Stop after adding 4 alerts
        if (alertCount >= 4) {
            clearInterval(alertInterval);
        }
    }, 5000);
}

function initializeFromHash() {
    // Check for URL hash and set active tool
    const hash = window.location.hash.substring(1);
    if (hash) {
        const toolName = hash.replace('-tool', '');
        const toolTab = document.querySelector(`.tool-tab[data-tool="${toolName}"]`);
        if (toolTab) {
            toolTab.click();
        }
    }
}

// ------------------------------------
// Execute when document is fully loaded
// ------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // Additional setup for better UX

    // Add help button
    addHelpButton();

    // Fix any additional layout issues
    setTimeout(fixPageLayout, 500);
});

function addHelpButton() {
    if (document.querySelector('.help-button')) return;

    const helpButton = document.createElement('button');
    helpButton.className = 'help-button';
    helpButton.innerHTML = '<i class="fas fa-question-circle"></i>';
    helpButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 70px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #0d6efd;
        color: white;
        border: none;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(helpButton);

    // Add click handler to show help
    helpButton.addEventListener('click', function() {
        showHelpDialog();
    });
}

function showHelpDialog() {
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
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 25px;
        width: 600px;
        max-width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <h2 style="margin-top: 0; color: #212529;">Network Security Toolkit Help</h2>
        
        <h3>Tool Overview</h3>
        <ul style="padding-left: 20px;">
            <li><strong>Wireshark:</strong> Analyze network traffic and packet captures</li>
            <li><strong>Nmap:</strong> Scan networks to discover hosts, services, and vulnerabilities</li>
            <li><strong>Firewall:</strong> Configure network access control rules</li>
            <li><strong>IDS/IPS:</strong> Monitor for suspicious network activity</li>
        </ul>
        
        <h3>Keyboard Shortcuts</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #dee2e6;">Key</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #dee2e6;">Action</th>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><code>1</code> - <code>4</code></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Switch between tools</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><code>Esc</code></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Close dialogs/details</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><code>Ctrl</code> + <code>F</code></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Focus on filter input</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><code>Alt</code> + <code>D</code></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Toggle dark mode</td>
            </tr>
        </table>
        
        <h3>Tips</h3>
        <ul style="padding-left: 20px;">
            <li>Click on packet or alert rows to view details</li>
            <li>Use the filter inputs to search through data</li>
            <li>The "Load Sample" button loads pre-configured data</li>
            <li>Try adding a new firewall rule in the Firewall Configuration tool</li>
        </ul>
        
        <div style="text-align: right; margin-top: 20px;">
            <button id="help-close-btn" style="padding: 8px 16px; background-color: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;

    modalContainer.appendChild(modal);
    document.body.appendChild(modalContainer);

    // Add close button handler
    document.getElementById('help-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalContainer);
    });

    // Close on background click
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) {
            document.body.removeChild(modalContainer);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function closeHelp(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modalContainer)) {
                document.body.removeChild(modalContainer);
            }
            document.removeEventListener('keydown', closeHelp);
        }
    });
}

function fixPageLayout() {
    // Fix specific issues with network-toolkit.html that might be causing problems

    // Fix duplicate cells in packet #9 row
    const packetNine = document.querySelector('.packet-table tbody tr:nth-child(9)');
    if (packetNine && packetNine.cells.length > 7) {
        fixRowCells(packetNine);
    }

    // Ensure all tool buttons are properly initialized
    const toolButtons = document.querySelectorAll('.tool-header .tool-btn');
    toolButtons.forEach(btn => {
        // Fix disabled state
        if (btn.querySelector('.fa-stop')) {
            btn.disabled = true;
            btn.setAttribute('disabled', 'disabled');
        }
    });

    // Ensure packet and alert tables have proper event handlers
    setupTableInteractions();

    // Fix any duplicate elements if needed
    removeDuplicateElements();
}

function removeDuplicateElements() {
    // Fix any duplicate IDs
    const allElements = document.querySelectorAll('[id]');
    const idMap = {};

    allElements.forEach(el => {
        const id = el.id;
        if (idMap[id]) {
            console.warn(`Duplicate ID found: ${id}`);
            // Generate a new unique ID
            el.id = id + '-' + Math.floor(Math.random() * 1000);
        } else {
            idMap[id] = true;
        }
    });
}

// Add event listener for keyboard shortcuts related to dark mode
document.addEventListener('keydown', function(e) {
    // Alt+D to toggle dark mode
    if (e.altKey && e.key === 'd') {
        const darkModeToggle = document.querySelector('.dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.click();
        }
    }
});