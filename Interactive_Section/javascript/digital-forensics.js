  document.addEventListener('DOMContentLoaded', function() {
            // Get DOM elements
            const evidenceItems = document.querySelectorAll('.evidence-item');
            const evidenceViews = document.querySelectorAll('.evidence-view');
            const currentEvidenceTitle = document.getElementById('current-evidence');
            const analyzeBtn = document.getElementById('analyze-btn');
            const notebook = document.getElementById('notebook');
            const clueCounter = document.getElementById('clue-counter');
            const hintButton = document.getElementById('hint-button');
            const hintContent = document.getElementById('hint-content');
            const submitBtn = document.getElementById('submit-btn');
            const feedback = document.getElementById('feedback');
            const feedbackTitleText = document.getElementById('feedback-title-text');
            const feedbackMessage = document.getElementById('feedback-message');
            const resetBtn = document.getElementById('reset-btn');
            const completionContainer = document.getElementById('completion-container');
            const solutionForm = document.getElementById('solution-form');

            // Game state
            let currentEvidence = null;
            let cluesFound = [];
            let totalClues = 12; // Total number of unique clues across all evidence

            // Initialize game
            initGame();

            // Initialize game state
            function initGame() {
                cluesFound = [];
                updateClueCounter();
                resetForm();

                // Hide all evidence views initially
                evidenceViews.forEach(view => {
                    view.classList.remove('active');
                });

                // Reset evidence items
                evidenceItems.forEach(item => {
                    item.classList.remove('active');
                });

                currentEvidenceTitle.textContent = 'Select evidence to begin investigation';
                feedback.style.display = 'none';
                completionContainer.style.display = 'none';
                solutionForm.style.display = 'block';
            }

            // Add click event listeners to evidence items
            evidenceItems.forEach(item => {
                item.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');

                    // Remove active class from all items
                    evidenceItems.forEach(i => i.classList.remove('active'));

                    // Add active class to clicked item
                    this.classList.add('active');

                    // Hide all evidence views
                    evidenceViews.forEach(view => {
                        view.classList.remove('active');
                    });

                    // Show selected evidence view
                    const targetView = document.getElementById(targetId);
                    targetView.classList.add('active');

                    // Update current evidence title
                    currentEvidenceTitle.textContent = this.querySelector('.evidence-name').textContent;

                    // Store current evidence ID
                    currentEvidence = targetId;
                });
            });

            // Add click event listener to analyze button
            analyzeBtn.addEventListener('click', function() {
                if (!currentEvidence) return;

                // Get details for current evidence
                const detailsContainer = document.getElementById(currentEvidence + '-details');

                if (detailsContainer) {
                    const details = detailsContainer.querySelectorAll('li');
                    let newCluesFound = false;

                    // Check each clue from the current evidence
                    details.forEach(detail => {
                        const clueText = detail.textContent;

                        // If this clue hasn't been found yet
                        if (!cluesFound.includes(clueText)) {
                            cluesFound.push(clueText);
                            newCluesFound = true;

                            // Add clue to notebook
                            if (notebook.value === '') {
                                notebook.value = '• ' + clueText;
                            } else {
                                notebook.value += '\n• ' + clueText;
                            }
                        }
                    });

                    if (newCluesFound) {
                        updateClueCounter();
                        alert('New evidence detected! Clues added to your notebook.');
                    } else {
                        alert('No new clues found in this evidence.');
                    }
                }
            });

            // Add click event listener to hint button
            hintButton.addEventListener('click', function() {
                if (hintContent.style.display === 'block') {
                    hintContent.style.display = 'none';
                } else {
                    hintContent.style.display = 'block';
                }
            });

            // Add click event listener to submit button
            submitBtn.addEventListener('click', function() {
                const who = document.getElementById('solution-who').value.trim().toLowerCase();
                const how = document.getElementById('solution-how').value.trim().toLowerCase();
                const what = document.getElementById('solution-what').value.trim().toLowerCase();
                const when = document.getElementById('solution-when').value.trim();

                // Check if all fields are filled
                if (!who || !how || !what || !when) {
                    showFeedback(false, 'Please fill in all fields to submit your solution.');
                    return;
                }

                // Check solution
                let correct = true;
                let feedbackText = '';

                // Check "who"
                if (!who.includes('external') || !who.includes('attack') || !who.includes('hacker')) {
                    correct = false;
                    feedbackText += '• The perpetrator identification is incorrect. Review the evidence about the source of the attack.<br>';
                }

                // Check "how"
                if (!how.includes('phishing') || !how.includes('badge') || !how.includes('stolen')) {
                    correct = false;
                    feedbackText += '• Your access method is incomplete. Look for evidence of both digital and physical security breaches.<br>';
                }

                // Check "what"
                if (!what.includes('customer') || !what.includes('financial') || !what.includes('record')) {
                    correct = false;
                    feedbackText += '• The compromised data description is incorrect. Check the database and file names in the evidence.<br>';
                }

                // Check "when"
                if (!when.match(/2023-03-15 02:/)) {
                    correct = false;
                    feedbackText += '• The timing is incorrect. Look at the timestamps across different pieces of evidence.<br>';
                }

                if (correct) {
                    showFeedback(true, 'Your analysis is correct! You\'ve successfully identified all aspects of the breach.');
                    solutionForm.style.display = 'none';
                    completionContainer.style.display = 'block';
                } else {
                    showFeedback(false, 'Your analysis contains some errors:<br>' + feedbackText + '<br>Review the evidence and try again.');
                }
            });

            // Add click event listener to reset button
            resetBtn.addEventListener('click', function() {
                initGame();
            });

            // Update clue counter
            function updateClueCounter() {
                clueCounter.textContent = cluesFound.length + '/' + totalClues;
            }

            // Show feedback message
            function showFeedback(isSuccess, message) {
                feedback.className = isSuccess ? 'feedback success' : 'feedback error';
                feedbackTitleText.textContent = isSuccess ? 'Correct!' : 'Try Again';
                feedbackMessage.innerHTML = message;
                feedback.style.display = 'block';
            }

            // Reset form
            function resetForm() {
                document.getElementById('solution-who').value = '';
                document.getElementById('solution-how').value = '';
                document.getElementById('solution-what').value = '';
                document.getElementById('solution-when').value = '';
                notebook.value = '';
            }
        });
