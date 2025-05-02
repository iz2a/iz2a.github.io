 document.addEventListener('DOMContentLoaded', function () {
        // Tab switching functionality
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tabId = this.getAttribute('data-tab');

                // Hide alert detail view if switching tabs
                if (tabId !== 'alerts') {
                    document.getElementById('alert-detail-view').style.display = 'none';
                    document.getElementById('alerts-tab').style.display = 'block';
                }

                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });

        // Mobile menu toggle
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (menuBtn) {
            menuBtn.addEventListener('click', function () {
                navLinks.classList.toggle('active');
            });
        }

        // Time selector in dashboard
        const timeOptions = document.querySelectorAll('.time-option');
        timeOptions.forEach(option => {
            option.addEventListener('click', function () {
                // Find the parent chart container
                const chartContainer = this.closest('.chart-container');
                // Get all time options within this chart container
                const siblingOptions = chartContainer.querySelectorAll('.time-option');

                // Remove active class from all options in this container
                siblingOptions.forEach(o => o.classList.remove('active'));

                // Add active class to clicked option
                this.classList.add('active');

                // Here you could also update the chart based on the selected time period
                const timeFrame = this.textContent.trim().toLowerCase();
                const chartElement = chartContainer.querySelector('.chart');

                // Update chart visualization based on time frame (placeholder)
                if (chartElement) {
                    // This would be replaced with actual chart update logic
                    console.log(`Updating chart ${chartElement.id} to show ${timeFrame} data`);
                }
            });
        });

        // Filter options functionality
        const filterOptions = document.querySelectorAll('.filter-option input[type="checkbox"]');
        filterOptions.forEach(filter => {
            filter.addEventListener('change', function () {
                applyFilters();
            });
        });

        // Alert item click handler for all alert items
        const alertItems = document.querySelectorAll('.alert-item');
        alertItems.forEach(item => {
            item.addEventListener('click', function () {
                showAlertDetail();
            });
        });

        // Action buttons within alerts
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                // Prevent the click from bubbling up to the alert item
                e.stopPropagation();

                const action = this.textContent.trim();
                const alertItem = this.closest('.alert-item');
                const alertTitle = alertItem.querySelector('.alert-title').textContent;

                // Handle the action (placeholder)
                console.log(`${action} action performed on alert: ${alertTitle}`);

                // For example, if it's "Resolve" button, you could mark the alert as resolved
                if (action.includes('Resolve')) {
                    alertItem.style.opacity = '0.5';
                    // Here you would typically update the alert status in your backend
                }
            });
        });

        // Response action buttons in the detail view
        const responseButtons = document.querySelectorAll('.action-btn-large');
        responseButtons.forEach(button => {
            button.addEventListener('click', function () {
                const action = this.textContent.trim();

                // Display an action confirmation (placeholder)
                alert(`${action} action will be performed. In a real SOC environment, this would trigger the corresponding security response.`);
            });
        });

        // Back button for alert detail view
        // Add this button to your HTML if it doesn't exist:
        // <button id="back-to-alerts" class="action-btn-large"><i class="fas fa-arrow-left"></i> Back to Alerts</button>
        const backButton = document.createElement('button');
        backButton.id = 'back-to-alerts';
        backButton.className = 'action-btn-large';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Alerts';

        // Insert back button at the beginning of response actions
        const responseActions = document.querySelector('.response-actions');
        if (responseActions) {
            responseActions.prepend(backButton);

            // Add event listener to the back button
            backButton.addEventListener('click', function () {
                document.getElementById('alert-detail-view').style.display = 'none';
                document.getElementById('alerts-tab').style.display = 'block';
            });
        }

        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        const searchButtons = document.querySelectorAll('.search-btn');

        // Set up each search input/button pair
        for (let i = 0; i < searchButtons.length; i++) {
            if (searchInputs[i] && searchButtons[i]) {
                searchButtons[i].addEventListener('click', function () {
                    performSearch(searchInputs[i]);
                });

                // Also trigger search on Enter key
                searchInputs[i].addEventListener('keyup', function (e) {
                    if (e.key === 'Enter') {
                        performSearch(this);
                    }
                });
            }
        }

        // Pagination functionality
        const pageButtons = document.querySelectorAll('.page-btn');
        pageButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Don't do anything for the active page or navigation buttons in this demo
                if (this.classList.contains('active') || this.querySelector('i')) {
                    return;
                }

                // Update active page
                const paginationContainer = this.closest('.pagination');
                const siblingButtons = paginationContainer.querySelectorAll('.page-btn');

                siblingButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Here you would typically load the corresponding page data
                console.log(`Navigating to page ${this.textContent.trim()}`);
            });
        });
    });

    // Function to show alert detail view
    function showAlertDetail() {
        document.getElementById('alerts-tab').style.display = 'none';
        document.getElementById('alert-detail-view').style.display = 'block';
    }

    // Function to apply filters to the alert list
    function applyFilters() {
        // Get all selected severity filters
        const selectedSeverities = getSelectedFilters('severity');
        // Get all selected source filters
        const selectedSources = getSelectedFilters('source');
        // Get all selected status filters
        const selectedStatuses = getSelectedFilters('status');

        // Get all alert items
        const alertItems = document.querySelectorAll('.alert-item');

        // Loop through each alert item and check if it matches the filters
        alertItems.forEach(item => {
            // Get the severity and source of this alert
            const severity = getSeverityFromItem(item);
            const source = getSourceFromItem(item);
            const status = 'new'; // This would typically come from your data

            // Show the item if it matches all selected filters
            const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(severity);
            const matchesSource = selectedSources.length === 0 || selectedSources.includes(source);
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);

            if (matchesSeverity && matchesSource && matchesStatus) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // Update filter stats
        updateFilterStats();
    }

    // Helper function to get selected filters by type
    function getSelectedFilters(filterType) {
        const selectedFilters = [];
        const checkboxes = document.querySelectorAll(`input[id^="${filterType}-"]:checked`);

        checkboxes.forEach(checkbox => {
            // Extract the filter value from the ID (e.g., "severity-critical" -> "critical")
            const filterValue = checkbox.id.replace(`${filterType}-`, '');
            selectedFilters.push(filterValue);
        });

        return selectedFilters;
    }

    // Helper function to get the severity from an alert item
    function getSeverityFromItem(item) {
        if (item.classList.contains('critical')) return 'critical';
        if (item.classList.contains('high')) return 'high';
        if (item.classList.contains('medium')) return 'medium';
        if (item.classList.contains('low')) return 'low';
        return '';
    }

    // Helper function to get the source from an alert item
    function getSourceFromItem(item) {
        const sourceText = item.querySelector('.alert-source')?.textContent.toLowerCase() || '';

        if (sourceText.includes('firewall')) return 'firewall';
        if (sourceText.includes('ids') || sourceText.includes('ips')) return 'ids';
        if (sourceText.includes('edr') || sourceText.includes('endpoint')) return 'endpoint';
        if (sourceText.includes('cloud')) return 'cloud';
        if (sourceText.includes('auth') || sourceText.includes('vpn') || sourceText.includes('office 365')) return 'auth';

        return '';
    }

    // Function to update the filter stats
    function updateFilterStats() {
        // This would typically come from your actual data
        // For now, we'll just count visible alerts
        const visibleAlerts = document.querySelectorAll('.alert-item:not([style*="display: none"])');
        const criticalAlerts = document.querySelectorAll('.alert-item.critical:not([style*="display: none"])');

        // Update stat values
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 2) {
            statValues[0].textContent = visibleAlerts.length; // Total alerts
            statValues[2].textContent = criticalAlerts.length; // Critical alerts
        }
    }

    // Function to perform search on tables
    function performSearch(inputElement) {
        const searchTerm = inputElement.value.toLowerCase();
        const tableContainer = inputElement.closest('div').nextElementSibling;

        if (!tableContainer) return;

        const tableRows = tableContainer.querySelectorAll('tbody tr');

        tableRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }