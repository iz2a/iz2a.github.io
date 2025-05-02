document.addEventListener('DOMContentLoaded', function() {
            // Config: Challenge answers and point values
            const challenges = {
                recon: {
                    answer: 'flag{internal_employee_records}',
                    points: 50,
                    badge: 'Recon Master',
                    status: 'recon-status',
                    completed: false
                },
                crypto: {
                    answer: 'flag{base64_encoding_is_not_encryption}',
                    points: 100,
                    badge: 'Crypto Expert',
                    status: 'crypto-status',
                    completed: false
                },
                web: {
                    answer: 'flag{sql_injection_no_sanitization}',
                    points: 100,
                    badge: 'Web Hacker',
                    status: 'web-status',
                    completed: false
                },
                forensics: {
                    answer: 'flag{steganography_metadata_exfiltration}',
                    points: 150,
                    badge: 'Forensic Analyst',
                    status: 'forensics-status',
                    completed: false
                },
                reverse: {
                    answer: 'flag{buffer_overflow_vulnerability}',
                    points: 100,
                    badge: 'Code Breaker',
                    status: 'reverse-status',
                    completed: false
                }
            };

            // Challenge navigation
            const challengeButtons = document.querySelectorAll('.challenge-btn');
            const challengeSections = document.querySelectorAll('.challenge-section');

            challengeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const challengeId = button.getAttribute('data-challenge');

                    // Update active button
                    challengeButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Update active section
                    challengeSections.forEach(section => section.classList.remove('active'));
                    document.getElementById(`${challengeId}-challenge`).classList.add('active');
                });
            });

            // Hint toggles
            const hintButtons = document.querySelectorAll('.hint-btn');
            hintButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const hintId = button.id.replace('-btn', '-content');
                    const hintContent = document.getElementById(hintId);

                    if (hintContent.classList.contains('visible')) {
                        hintContent.classList.remove('visible');
                        button.textContent = 'Show Hint';
                    } else {
                        hintContent.classList.add('visible');
                        button.textContent = 'Hide Hint';
                    }
                });
            });

            // Global variables for tracking
            let totalScore = 0;
            const maxScore = 500;

            // Flag submission handlers
            setupFlagSubmission('recon');
            setupFlagSubmission('crypto');
            setupFlagSubmission('forensics');
            setupFlagSubmission('reverse');

            // Setup flag submission for a challenge
            function setupFlagSubmission(challengeId) {
                const submitBtn = document.getElementById(`${challengeId}-flag-submit`);
                const inputField = document.getElementById(`${challengeId}-flag-input`);
                const resultElement = document.getElementById(`${challengeId}-flag-result`);

                submitBtn.addEventListener('click', () => {
                    const userInput = inputField.value.trim().toLowerCase();
                    const challenge = challenges[challengeId];

                    if (userInput === challenge.answer.toLowerCase()) {
                        resultElement.textContent = 'Correct! You\'ve found the flag.';
                        resultElement.className = 'flag-result success';

                        if (!challenge.completed) {
                            challenge.completed = true;
                            updateProgress(challengeId);
                        }
                    } else {
                        resultElement.textContent = 'Incorrect. Try again.';
                        resultElement.className = 'flag-result error';
                    }
                });

                // Add Enter key support
                inputField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        submitBtn.click();
                    }
                });
            }

            // Web challenge special handling
            const webSubmitBtn = document.getElementById('web-submit');
            const webInput = document.getElementById('web-input');
            const webResult = document.getElementById('web-result');
            const webFlagContainer = document.getElementById('web-flag-container');

            webSubmitBtn.addEventListener('click', () => {
                const input = webInput.value.toLowerCase();

                // Check for common SQL injection patterns
                if (input.includes("' or '") ||
                    input.includes("' or 1=1") ||
                    input.includes("' or 1=1--") ||
                    input.includes("' or 1=1#") ||
                    input.includes("admin'--") ||
                    input.includes("' or '1'='1")) {

                    webResult.textContent = 'Success! You\'ve successfully exploited the SQL injection vulnerability.';
                    webResult.className = 'flag-result success';

                    // Show flag input
                    webFlagContainer.style.display = 'block';
                } else {
                    webResult.textContent = 'That doesn\'t seem to work. Try a different SQL injection pattern.';
                    webResult.className = 'flag-result error';
                }
            });

            // Add web flag submission handler
            const webFlagSubmitBtn = document.getElementById('web-flag-submit');
            const webFlagInput = document.getElementById('web-flag-input');
            const webFlagResult = document.getElementById('web-flag-result');

            webFlagSubmitBtn.addEventListener('click', () => {
                const userInput = webFlagInput.value.trim().toLowerCase();

                if (userInput === challenges.web.answer.toLowerCase()) {
                    webFlagResult.textContent = 'Correct! You\'ve found the flag.';
                    webFlagResult.className = 'flag-result success';

                    if (!challenges.web.completed) {
                        challenges.web.completed = true;
                        updateProgress('web');
                    }
                } else {
                    webFlagResult.textContent = 'Incorrect. Try again.';
                    webFlagResult.className = 'flag-result error';
                }
            });

            // Add Enter key support for web inputs
            webInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    webSubmitBtn.click();
                }
            });

            webFlagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    webFlagSubmitBtn.click();
                }
            });

            // Update progress after completing a challenge
            function updateProgress(challengeId) {
                // Update status indicator
                const statusElement = document.getElementById(challenges[challengeId].status);
                statusElement.classList.add('complete');

                // Update score
                totalScore += challenges[challengeId].points;
                document.getElementById('current-score').textContent = totalScore;

                // Update progress bar
                const progressPercentage = (totalScore / maxScore) * 100;
                document.getElementById('progress-fill').style.width = `${progressPercentage}%`;

                // Unlock badge
                unlockBadge(challenges[challengeId].badge);

                // Show notification
                showNotification(`You've earned the ${challenges[challengeId].badge} badge and ${challenges[challengeId].points} points!`);
            }

            // Unlock a badge in the profile section
            function unlockBadge(badgeName) {
                const badges = document.querySelectorAll('.profile-badge');

                badges.forEach(badge => {
                    if (badge.querySelector('.badge-name').textContent === badgeName) {
                        badge.classList.remove('locked');
                    }
                });
            }

            // Show notification popup
            function showNotification(message) {
                const notification = document.getElementById('badge-notification');
                const notificationText = document.getElementById('badge-notification-text');

                notificationText.textContent = message;
                notification.classList.add('visible');

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    notification.classList.remove('visible');
                }, 5000);
            }
        });