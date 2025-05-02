        document.addEventListener('DOMContentLoaded', function() {
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
                    } else if (targetPage === 'investigation') {
                        document.getElementById('investigation-page').style.display = 'block';
                    } else if (targetPage === 'response') {
                        document.getElementById('response-page').style.display = 'block';
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
                if (this.textContent.includes('Normal')) {
                    this.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: Medium';
                    this.classList.add('medium');
                } else if (this.textContent.includes('Medium')) {
                    this.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: High';
                    this.classList.remove('medium');
                    this.classList.add('high');
                } else {
                    this.innerHTML = '<i class="fas fa-shield-alt"></i> Alert Level: Normal';
                    this.classList.remove('high');
                }
            });

            // View Alert Button
            const viewAlertButtons = document.querySelectorAll('.view-alert');
            viewAlertButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Show investigation page
                    pageContents.forEach(page => {
                        page.style.display = 'none';
                    });
                    document.getElementById('investigation-page').style.display = 'block';

                    // Update sidebar active link
                    sidebarLinks.forEach(l => l.classList.remove('active'));
                    document.querySelector('[data-page="investigation"]').classList.add('active');
                });
            });

            // Response Action Items
            const actionItems = document.querySelectorAll('.action-item');
            actionItems.forEach(item => {
                item.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');

                    if (action === 'kill-process') {
                        document.getElementById('process-action-modal').style.display = 'block';
                    } else if (action === 'delete-file' || action === 'quarantine-file') {
                        document.getElementById('file-action-modal').style.display = 'block';
                    }
                });
            });

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
                    // Hide the modal
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });

                    // Show success message (could be enhanced)
                    alert('Action executed successfully');
                });
            });

            // Simulation Controls
            const scenarioOptions = document.querySelectorAll('.scenario-option');
            scenarioOptions.forEach(option => {
                option.addEventListener('click', function() {
                    scenarioOptions.forEach(o => o.classList.remove('active'));
                    this.classList.add('active');
                });
            });

            const startButton = document.querySelector('.start-btn');
            const pauseButton = document.querySelector('.pause-btn');
            const resetButton = document.querySelector('.reset-btn');

            startButton.addEventListener('click', function() {
                this.disabled = true;
                pauseButton.disabled = false;
                alert('Simulation started');
            });

            pauseButton.addEventListener('click', function() {
                this.disabled = true;
                startButton.disabled = false;
                alert('Simulation paused');
            });

            resetButton.addEventListener('click', function() {
                startButton.disabled = false;
                pauseButton.disabled = true;
                alert('Simulation reset');
            });

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