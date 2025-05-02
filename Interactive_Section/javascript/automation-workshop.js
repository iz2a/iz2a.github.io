        document.addEventListener('DOMContentLoaded', function() {
            // Tab navigation
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons and tabs
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));

                    // Add active class to clicked button
                    this.classList.add('active');

                    // Show corresponding tab content
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');

                    // Update progress bar
                    updateProgress(tabId);
                });
            });

            // Progress bar function
            function updateProgress(tabId) {
                const progressBar = document.getElementById('progress-bar');

                switch(tabId) {
                    case 'overview':
                        progressBar.style.width = '25%';
                        break;
                    case 'modules':
                        progressBar.style.width = '50%';
                        break;
                    case 'resources':
                        progressBar.style.width = '75%';
                        break;
                    case 'certificate':
                        progressBar.style.width = '100%';
                        break;
                    default:
                        progressBar.style.width = '25%';
                }
            }
        });