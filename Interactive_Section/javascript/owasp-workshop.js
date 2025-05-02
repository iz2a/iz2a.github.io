document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-item a');
    const sections = document.querySelectorAll('.workshop-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');

            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Show appropriate section
            sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            const activeSection = document.getElementById(`${targetSection}-section`);
            if (activeSection) {
                activeSection.style.display = 'block';
                activeSection.classList.add('active');

                // Update progress bar based on completed sections
                updateProgress();
            }
        });
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabContainer = this.closest('.tab-container');
            const tabContents = tabContainer.querySelectorAll('.tab-content');
            const targetTab = this.getAttribute('data-tab');

            // Update active tab
            tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show appropriate tab content
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            const tabContent = document.getElementById(`${targetTab}-tab`);
            if (tabContent) {
                tabContent.style.display = 'block';
            }
        });
    });

    // Quiz functionality
    const quizContainers = document.querySelectorAll('.quiz-container');

    quizContainers.forEach(container => {
        const options = container.querySelectorAll('.quiz-option');
        const checkButton = container.querySelector('.quiz-check');
        const nextButton = container.querySelector('.quiz-next');
        const explanation = container.querySelector('.quiz-explanation');

        // Add click event for options
        options.forEach(option => {
            option.addEventListener('click', function() {
                const optionsList = this.closest('.quiz-options').querySelectorAll('.quiz-option');
                optionsList.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        // Add click event for check button
        if (checkButton) {
            checkButton.addEventListener('click', function() {
                const selectedOption = container.querySelector('.quiz-option.selected');

                if (!selectedOption) {
                    alert('Please select an answer');
                    return;
                }

                options.forEach(option => {
                    option.style.pointerEvents = 'none';
                    if (option.hasAttribute('data-correct')) {
                        option.classList.add('correct');
                    } else if (option === selectedOption) {
                        option.classList.add('incorrect');
                    }
                });

                if (explanation) {
                    explanation.style.display = 'block';
                }

                checkButton.style.display = 'none';
                if (nextButton) {
                    nextButton.style.display = 'block';
                }
            });
        }

        // Add click event for next button
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                const progress = container.querySelector('.quiz-progress');
                const currentQuestion = parseInt(progress.textContent.match(/\d+/)[0]);
                const totalQuestions = parseInt(progress.textContent.match(/of (\d+)/)[1]);

                if (currentQuestion < totalQuestions) {
                    // Show next question (if implemented)
                    progress.textContent = `Question ${currentQuestion + 1} of ${totalQuestions}`;

                    // Reset options
                    options.forEach(option => {
                        option.classList.remove('selected', 'correct', 'incorrect');
                        option.style.pointerEvents = 'auto';
                    });

                    if (explanation) {
                        explanation.style.display = 'none';
                    }

                    nextButton.style.display = 'none';
                    checkButton.style.display = 'block';
                } else {
                    // Mark section as completed
                    const section = container.closest('.workshop-section');
                    if (section) {
                        const badge = section.querySelector('.completion-badge');
                        if (badge) {
                            badge.style.display = 'block';
                            badge.textContent = 'Completed';
                        }
                        updateProgress();
                    }
                }
            });
        }
    });

    // Section navigation
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const nextSection = this.getAttribute('data-next');
            const prevSection = this.getAttribute('data-prev');
            const targetSection = nextSection || prevSection;

            if (targetSection) {
                // Update sections
                sections.forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                });
                const activeSection = document.getElementById(`${targetSection}-section`);
                if (activeSection) {
                    activeSection.style.display = 'block';
                    activeSection.classList.add('active');

                    // Update sidebar
                    sidebarLinks.forEach(l => l.classList.remove('active'));
                    const sidebarLink = document.querySelector(`[data-section="${targetSection}"]`);
                    if (sidebarLink) {
                        sidebarLink.classList.add('active');
                    }

                    // Scroll to top
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Demo functionality for Broken Access Control
    const accessButton = document.getElementById('access-button');
    const accessResult = document.getElementById('access-result');
    const urlChange = document.getElementById('url-change');

    if (accessButton && accessResult && urlChange) {
        accessButton.addEventListener('click', function() {
            const selectedUrl = urlChange.value;
            accessResult.style.display = 'block';

            switch (selectedUrl) {
                case 'profile':
                    accessResult.innerHTML = '<strong>Access Granted</strong><br>This is your own profile - you have permission to view it.';
                    break;
                case 'other-profile':
                    accessResult.innerHTML = '<strong>Access Granted</strong><br><span style="color: #dc3545;">VULNERABILITY DETECTED:</span> You can access another user\'s profile. This is a horizontal privilege escalation vulnerability.';
                    break;
                case 'admin':
                    accessResult.innerHTML = '<strong>Access Granted</strong><br><span style="color: #dc3545;">VULNERABILITY DETECTED:</span> You can access the admin dashboard as a regular user. This is a vertical privilege escalation vulnerability.';
                    break;
                case 'settings':
                    accessResult.innerHTML = '<strong>Access Granted</strong><br>These are your own settings - you have permission to view and modify them.';
                    break;
                case 'other-settings':
                    accessResult.innerHTML = '<strong>Access Granted</strong><br><span style="color: #dc3545;">VULNERABILITY DETECTED:</span> You can access another user\'s settings. This is an example of IDOR (Insecure Direct Object Reference).';
                    break;
                default:
                    accessResult.innerHTML = '<strong>URL Not Recognized</strong>';
            }
        });
    }

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }

    // Close menu when clicking on a link
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks) {
                navLinks.classList.remove('active');
            }
        });
    });

    // Function to update progress bar
    function updateProgress() {
        const totalSections = document.querySelectorAll('.sidebar-menu-item a').length - 2; // Exclude Introduction and Additional Resources
        const completedSections = document.querySelectorAll('.completion-badge').length;
        const progressPercentage = Math.round((completedSections / totalSections) * 100);

        const progressBar = document.querySelector('.progress');
        const progressValue = document.querySelector('.progress-value');

        if (progressBar && progressValue) {
            progressBar.style.width = progressPercentage + '%';
            progressValue.textContent = progressPercentage + '%';
        }
    }

    // Initialize progress on page load
    updateProgress();
});