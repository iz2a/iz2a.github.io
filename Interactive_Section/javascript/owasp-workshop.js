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
                    activeSection.style.display = 'block';
                    activeSection.classList.add('active');
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
                    document.getElementById(`${targetTab}-tab`).style.display = 'block';
                });
            });

            // Quiz functionality
            const quizCheckButtons = document.querySelectorAll('.quiz-check');
            const quizNextButtons = document.querySelectorAll('.quiz-next');

            quizCheckButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const quizContainer = this.closest('.quiz-container');
                    const selectedOption = quizContainer.querySelector('.quiz-option.selected');

                    if (!selectedOption) {
                        alert('Please select an answer');
                        return;
                    }

                    const options = quizContainer.querySelectorAll('.quiz-option');
                    options.forEach(option => {
                        option.style.pointerEvents = 'none';
                        if (option.hasAttribute('data-correct')) {
                            option.classList.add('correct');
                        } else if (option === selectedOption) {
                            option.classList.add('incorrect');
                        }
                    });

                    quizContainer.querySelector('.quiz-explanation').style.display = 'block';
                    this.style.display = 'none';
                    quizContainer.querySelector('.quiz-next').style.display = 'block';
                });
            });

            // Option selection
            const quizOptions = document.querySelectorAll('.quiz-option');
            quizOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const options = this.closest('.quiz-options').querySelectorAll('.quiz-option');
                    options.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                });
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
                        activeSection.style.display = 'block';
                        activeSection.classList.add('active');

                        // Update sidebar
                        sidebarLinks.forEach(l => l.classList.remove('active'));
                        document.querySelector(`[data-section="${targetSection}"]`).classList.add('active');

                        // Scroll to top
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Demo functionality for Broken Access Control
            const accessButton = document.getElementById('access-button');
            const accessResult = document.getElementById('access-result');
            const urlChange = document.getElementById('url-change');

            if (accessButton) {
                accessButton.addEventListener('click', function() {
                    const selectedUrl = urlChange.value;
                    accessResult.style.display = 'block';

                    if (selectedUrl === 'profile') {
                        accessResult.innerHTML = '<strong>Access Granted</strong><br>This is your own profile - you have permission to view it.';
                    } else if (selectedUrl === 'other-profile') {
                        accessResult.innerHTML = '<strong>Access Granted</strong><br><span style="color: #dc3545;">VULNERABILITY DETECTED:</span> You can access another user\'s profile. This is a horizontal privilege escalation vulnerability.';
                    } else if (selectedUrl === 'admin') {
                        accessResult.innerHTML = '<strong>Access Granted</strong><br><span style="color: #dc3545;">VULNERABILITY DETECTED:</span> You can access the admin dashboard as a regular user. This is a vertical privilege escalation vulnerability.';
                    } else if (selectedUrl === 'settings') {
                        accessResult.innerHTML = '<strong>Access Granted</strong><br>These are your own settings - you have permission to view and modify them.';
                    } else if (selectedUrl === 'other-settings') {
                        accessResult.innerHTML = '<strong>Access Granted</strong><br><span style="color: #dc3545;">VULNERABILITY DETECTED:</span> You can access another user\'s settings. This is an example of IDOR (Insecure Direct Object Reference).';
                    }
                });
            }

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