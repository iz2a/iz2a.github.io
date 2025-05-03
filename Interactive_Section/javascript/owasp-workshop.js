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

                // Update progress
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
                content.classList.remove('active');
            });
            const activeContent = document.getElementById(`${targetTab}-tab`);
            if (activeContent) {
                activeContent.style.display = 'block';
                activeContent.classList.add('active');
            }
        });
    });

    // Quiz functionality
    initializeQuizzes();

    // Section navigation
    initializeNavigation();

    // Demo functionality for Broken Access Control
    initializeAccessDemo();

    // Mobile menu toggle
    initializeMobileMenu();

    // Mark sections as completed when viewed
    trackCompletedSections();

    // Initial progress update
    updateProgress();
});

// Initialize all quizzes on the page
function initializeQuizzes() {
    document.querySelectorAll('.quiz-container').forEach((quizContainer, quizIndex) => {
        const options = quizContainer.querySelectorAll('.quiz-option');
        const checkButton = quizContainer.querySelector('.quiz-check');
        const nextButton = quizContainer.querySelector('.quiz-next');
        const explanation = quizContainer.querySelector('.quiz-explanation');

        // Option selection
        options.forEach(option => {
            option.addEventListener('click', function() {
                const allOptions = this.closest('.quiz-options').querySelectorAll('.quiz-option');
                allOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        // Check answer
        if (checkButton) {
            checkButton.addEventListener('click', function() {
                const selectedOption = quizContainer.querySelector('.quiz-option.selected');

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

                // Mark current section as completed when quiz is answered
                const currentSection = quizContainer.closest('.workshop-section');
                if (currentSection) {
                    markSectionCompleted(currentSection.id.replace('-section', ''));
                }
            });
        }

        // Next question button
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                // Get current quiz number from progress indicator
                const progressText = quizContainer.querySelector('.quiz-progress');
                if (progressText) {
                    const match = progressText.textContent.match(/Question (\d+) of (\d+)/);
                    if (match) {
                        const currentQuestion = parseInt(match[1]);
                        const totalQuestions = parseInt(match[2]);

                        if (currentQuestion < totalQuestions) {
                            // Update to next question (this would require additional HTML structure)
                            progressText.textContent = `Question ${currentQuestion + 1} of ${totalQuestions}`;

                            // Reset quiz state
                            options.forEach(option => {
                                option.classList.remove('selected', 'correct', 'incorrect');
                                option.style.pointerEvents = 'auto';
                            });

                            explanation.style.display = 'none';
                            nextButton.style.display = 'none';
                            checkButton.style.display = 'block';

                            // Update question content (assuming structure)
                            // This would depend on how questions are structured in your HTML
                        } else {
                            // Last question completed, mark section as done
                            const currentSection = quizContainer.closest('.workshop-section');
                            if (currentSection) {
                                markSectionCompleted(currentSection.id.replace('-section', ''));
                            }
                        }
                    }
                }
            });
        }
    });
}

// Initialize section navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('.workshop-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-item a');

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

                    // Mark as completed if navigating to next
                    if (nextSection) {
                        markSectionCompleted(prevSection || '');
                    }

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

                    // Update progress
                    updateProgress();
                }
            }
        });
    });
}

// Initialize the access control demo
function initializeAccessDemo() {
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
                    accessResult.innerHTML = '<strong>Error</strong><br>Invalid URL selected.';
            }

            // Mark current section as interacted with
            const currentSection = accessButton.closest('.workshop-section');
            if (currentSection) {
                markSectionCompleted(currentSection.id.replace('-section', ''));
            }
        });
    }
}

// Initialize mobile menu
function initializeMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
}

// Track completed sections
function trackCompletedSections() {
    // Initialize completed sections in localStorage if not present
    if (!localStorage.getItem('completedSections')) {
        localStorage.setItem('completedSections', JSON.stringify([]));
    }

    // Load and display completed badges
    displayCompletionBadges();

    // Mark sections as completed when scrolled to bottom
    const sections = document.querySelectorAll('.workshop-section');

    sections.forEach(section => {
        const sectionContent = section.querySelector('.section-content');

        if (sectionContent) {
            // Use Intersection Observer to detect when user has viewed the section
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // If user has scrolled to bottom of section, mark as viewed
                            const sectionId = section.id.replace('-section', '');
                            setTimeout(() => {
                                markSectionCompleted(sectionId);
                            }, 5000); // Mark as completed after 5 seconds of viewing

                            // Stop observing once marked
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.8 // 80% of section must be visible
                }
            );

            observer.observe(sectionContent);
        }
    });
}

// Mark a section as completed
function markSectionCompleted(sectionId) {
    if (!sectionId) return;

    // Get current completed sections
    let completedSections = JSON.parse(localStorage.getItem('completedSections') || '[]');

    // Add section if not already in list
    if (!completedSections.includes(sectionId)) {
        completedSections.push(sectionId);
        localStorage.setItem('completedSections', JSON.stringify(completedSections));

        // Update UI
        displayCompletionBadges();
        updateProgress();
    }
}

// Display completion badges for completed sections
function displayCompletionBadges() {
    const completedSections = JSON.parse(localStorage.getItem('completedSections') || '[]');

    // Hide all badges first
    document.querySelectorAll('.completion-badge').forEach(badge => {
        badge.classList.remove('active');
    });

    // Show badges for completed sections
    completedSections.forEach(sectionId => {
        const section = document.getElementById(`${sectionId}-section`);
        if (section) {
            const badge = section.querySelector('.completion-badge');
            if (badge) {
                badge.classList.add('active');
            }
        }
    });
}

// Update progress bar
function updateProgress() {
    const progressBar = document.querySelector('.progress');
    const progressValue = document.querySelector('.progress-value');

    if (progressBar && progressValue) {
        const totalSections = document.querySelectorAll('.workshop-section').length;
        const completedSections = JSON.parse(localStorage.getItem('completedSections') || '[]').length;

        // Calculate percentage
        const percentage = Math.round((completedSections / totalSections) * 100);

        // Update progress bar and text
        progressBar.style.width = `${percentage}%`;
        progressValue.textContent = `${percentage}%`;
    }
}

// Function to reset all progress (useful for testing)
function resetProgress() {
    localStorage.removeItem('completedSections');
    displayCompletionBadges();
    updateProgress();
}

// Add a global reset function for debugging
window.resetWorkshopProgress = resetProgress;