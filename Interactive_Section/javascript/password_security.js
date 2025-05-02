    document.addEventListener('DOMContentLoaded', function () {
        // Elements
        const passwordInput = document.getElementById('password-input');
        const togglePasswordBtn = document.getElementById('toggle-password');
        const testPasswordBtn = document.getElementById('test-password');
        const strengthResult = document.getElementById('strength-result');
        const strengthMeterFill = document.getElementById('strength-meter-fill');
        const strengthText = document.getElementById('strength-text');
        const feedbackList = document.getElementById('feedback-list');

        const passwordLengthSlider = document.getElementById('password-length');
        const lengthValue = document.getElementById('length-value');
        const includeUppercase = document.getElementById('include-uppercase');
        const includeLowercase = document.getElementById('include-lowercase');
        const includeNumbers = document.getElementById('include-numbers');
        const includeSymbols = document.getElementById('include-symbols');
        const generatePasswordBtn = document.getElementById('generate-password');
        const generatorResult = document.getElementById('generator-result');
        const generatedPassword = document.getElementById('generated-password');
        const copyPasswordBtn = document.getElementById('copy-password');
        const generatedStrengthMeter = document.getElementById('generated-strength-meter');
        const generatedStrengthText = document.getElementById('generated-strength-text');

        // Password criteria elements
        const criteriaLength = document.getElementById('criteria-length');
        const criteriaUppercase = document.getElementById('criteria-uppercase');
        const criteriaLowercase = document.getElementById('criteria-lowercase');
        const criteriaNumbers = document.getElementById('criteria-numbers');
        const criteriaSpecial = document.getElementById('criteria-special');

        // Toggle password visibility
        togglePasswordBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle eye icon
            const eyeIcon = togglePasswordBtn.querySelector('i');
            eyeIcon.classList.toggle('fa-eye');
            eyeIcon.classList.toggle('fa-eye-slash');
        });

        // Update length value display
        passwordLengthSlider.addEventListener('input', function () {
            lengthValue.textContent = this.value;
        });

        // Password strength test logic
        testPasswordBtn.addEventListener('click', function () {
            const password = passwordInput.value;

            if (!password) {
                alert('Please enter a password to test.');
                return;
            }

            const result = checkPasswordStrength(password);

            // Update UI with results
            strengthResult.style.display = 'block';
            strengthMeterFill.style.width = result.score * 25 + '%';

            // Update strength meter color based on score
            strengthMeterFill.className = 'strength-meter-fill';

            if (result.score === 0) {
                strengthMeterFill.classList.add('strength-very-weak');
                strengthText.textContent = 'Password Strength: Very Weak';
            } else if (result.score === 1) {
                strengthMeterFill.classList.add('strength-weak');
                strengthText.textContent = 'Password Strength: Weak';
            } else if (result.score === 2) {
                strengthMeterFill.classList.add('strength-fair');
                strengthText.textContent = 'Password Strength: Fair';
            } else if (result.score === 3) {
                strengthMeterFill.classList.add('strength-good');
                strengthText.textContent = 'Password Strength: Good';
            } else {
                strengthMeterFill.classList.add('strength-strong');
                strengthText.textContent = 'Password Strength: Strong';
            }

            // Show feedback
            feedbackList.innerHTML = '';

            // Add pass feedback items
            result.feedback.passes.forEach(item => {
                const feedbackItem = document.createElement('div');
                feedbackItem.className = 'feedback-item feedback-pass';
                feedbackItem.innerHTML = `<i class="fas fa-check-circle"></i> ${item}`;
                feedbackList.appendChild(feedbackItem);
            });

            // Add fail feedback items
            result.feedback.fails.forEach(item => {
                const feedbackItem = document.createElement('div');
                feedbackItem.className = 'feedback-item feedback-fail';
                feedbackItem.innerHTML = `<i class="fas fa-times-circle"></i> ${item}`;
                feedbackList.appendChild(feedbackItem);
            });

            // Add custom suggestions
            if (result.feedback.suggestions.length > 0) {
                const suggestionTitle = document.createElement('div');
                suggestionTitle.style.marginTop = '15px';
                suggestionTitle.style.fontWeight = 'bold';
                suggestionTitle.textContent = 'Suggestions:';
                feedbackList.appendChild(suggestionTitle);

                result.feedback.suggestions.forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'feedback-item';
                    suggestionItem.innerHTML = `<i class="fas fa-lightbulb" style="color: #ffc107;"></i> ${suggestion}`;
                    feedbackList.appendChild(suggestionItem);
                });
            }

            strengthResult.classList.add('animated');
            setTimeout(() => {
                strengthResult.classList.remove('animated');
            }, 500);
        });

        // Generate password
        generatePasswordBtn.addEventListener('click', function () {
            // Check if at least one character type is selected
            if (!includeUppercase.checked && !includeLowercase.checked &&
                !includeNumbers.checked && !includeSymbols.checked) {
                alert('Please select at least one character type.');
                return;
            }

            const length = parseInt(passwordLengthSlider.value);
            const password = generatePassword(length, {
                uppercase: includeUppercase.checked,
                lowercase: includeLowercase.checked,
                numbers: includeNumbers.checked,
                symbols: includeSymbols.checked
            });

            // Show generated password
            generatorResult.style.display = 'block';
            generatedPassword.textContent = password;

            // Check strength of generated password
            const result = checkPasswordStrength(password);

            // Update strength meter
            generatedStrengthMeter.style.width = result.score * 25 + '%';

            // Update strength meter color based on score
            generatedStrengthMeter.className = 'strength-meter-fill';

            if (result.score === 0) {
                generatedStrengthMeter.classList.add('strength-very-weak');
                generatedStrengthText.textContent = 'Password Strength: Very Weak';
            } else if (result.score === 1) {
                generatedStrengthMeter.classList.add('strength-weak');
                generatedStrengthText.textContent = 'Password Strength: Weak';
            } else if (result.score === 2) {
                generatedStrengthMeter.classList.add('strength-fair');
                generatedStrengthText.textContent = 'Password Strength: Fair';
            } else if (result.score === 3) {
                generatedStrengthMeter.classList.add('strength-good');
                generatedStrengthText.textContent = 'Password Strength: Good';
            } else {
                generatedStrengthMeter.classList.add('strength-strong');
                generatedStrengthText.textContent = 'Password Strength: Strong';
            }

            generatorResult.classList.add('animated');
            setTimeout(() => {
                generatorResult.classList.remove('animated');
            }, 500);
        });

        // Copy password to clipboard
        copyPasswordBtn.addEventListener('click', function () {
            const password = generatedPassword.textContent.trim();
            if (password && password !== 'Your secure password will appear here') {
                navigator.clipboard.writeText(password)
                    .then(() => {
                        const icon = copyPasswordBtn.querySelector('i');
                        icon.classList.remove('fa-copy');
                        icon.classList.add('fa-check');

                        setTimeout(() => {
                            icon.classList.remove('fa-check');
                            icon.classList.add('fa-copy');
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                        alert('Failed to copy password. Please try again.');
                    });
            }
        });

        // Live password criteria checking
        passwordInput.addEventListener('input', function () {
            const password = this.value;

            // Check length
            if (password.length >= 8) {
                criteriaLength.classList.remove('criteria-unmet');
                criteriaLength.classList.add('criteria-met');
                criteriaLength.innerHTML = '<i class="fas fa-check-circle"></i> At least 8 characters long';
            } else {
                criteriaLength.classList.remove('criteria-met');
                criteriaLength.classList.add('criteria-unmet');
                criteriaLength.innerHTML = '<i class="fas fa-times-circle"></i> At least 8 characters long';
            }

            // Check uppercase
            if (/[A-Z]/.test(password)) {
                criteriaUppercase.classList.remove('criteria-unmet');
                criteriaUppercase.classList.add('criteria-met');
                criteriaUppercase.innerHTML = '<i class="fas fa-check-circle"></i> Contains uppercase letters';
            } else {
                criteriaUppercase.classList.remove('criteria-met');
                criteriaUppercase.classList.add('criteria-unmet');
                criteriaUppercase.innerHTML = '<i class="fas fa-times-circle"></i> Contains uppercase letters';
            }

            // Check lowercase
            if (/[a-z]/.test(password)) {
                criteriaLowercase.classList.remove('criteria-unmet');
                criteriaLowercase.classList.add('criteria-met');
                criteriaLowercase.innerHTML = '<i class="fas fa-check-circle"></i> Contains lowercase letters';
            } else {
                criteriaLowercase.classList.remove('criteria-met');
                criteriaLowercase.classList.add('criteria-unmet');
                criteriaLowercase.innerHTML = '<i class="fas fa-times-circle"></i> Contains lowercase letters';
            }

            // Check numbers
            if (/[0-9]/.test(password)) {
                criteriaNumbers.classList.remove('criteria-unmet');
                criteriaNumbers.classList.add('criteria-met');
                criteriaNumbers.innerHTML = '<i class="fas fa-check-circle"></i> Contains numbers';
            } else {
                criteriaNumbers.classList.remove('criteria-met');
                criteriaNumbers.classList.add('criteria-unmet');
                criteriaNumbers.innerHTML = '<i class="fas fa-times-circle"></i> Contains numbers';
            }

            // Check special characters
            if (/[^A-Za-z0-9]/.test(password)) {
                criteriaSpecial.classList.remove('criteria-unmet');
                criteriaSpecial.classList.add('criteria-met');
                criteriaSpecial.innerHTML = '<i class="fas fa-check-circle"></i> Contains special characters';
            } else {
                criteriaSpecial.classList.remove('criteria-met');
                criteriaSpecial.classList.add('criteria-unmet');
                criteriaSpecial.innerHTML = '<i class="fas fa-times-circle"></i> Contains special characters';
            }
        });

        // Function to check password strength
        function checkPasswordStrength(password) {
            // Initialize score and feedback
            let score = 0;
            const feedback = {
                passes: [],
                fails: [],
                suggestions: []
            };

            // Check length (basic)
            if (password.length < 8) {
                score = 0;
                feedback.fails.push('Password is too short (minimum 8 characters)');
                feedback.suggestions.push('Make your password longer (12+ characters recommended)');
                return {score, feedback};
            } else {
                feedback.passes.push('Password meets minimum length requirement');
                score += 1;
            }

            // Check for character variety
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumbers = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);

            // Count character types
            let varietyCount = 0;
            if (hasUppercase) {
                varietyCount++;
                feedback.passes.push('Contains uppercase letters');
            } else {
                feedback.fails.push('Missing uppercase letters');
            }

            if (hasLowercase) {
                varietyCount++;
                feedback.passes.push('Contains lowercase letters');
            } else {
                feedback.fails.push('Missing lowercase letters');
            }

            if (hasNumbers) {
                varietyCount++;
                feedback.passes.push('Contains numbers');
            } else {
                feedback.fails.push('Missing numbers');
            }

            if (hasSpecial) {
                varietyCount++;
                feedback.passes.push('Contains special characters');
            } else {
                feedback.fails.push('Missing special characters');
            }

            // Add score based on variety
            if (varietyCount >= 4) {
                score += 1;
            }

            // Check for common password patterns
            const commonPatterns = [
                /^123/, /password/i, /qwerty/i, /admin/i, /welcome/i,
                /letmein/i, /abc123/i, /monkey/i, /1234567/, /12345678/,
                /football/i, /baseball/i, /dragon/i, /superman/i, /batman/i
            ];

            let hasCommonPattern = false;
            for (const pattern of commonPatterns) {
                if (pattern.test(password)) {
                    hasCommonPattern = true;
                    feedback.fails.push('Contains common password pattern');
                    feedback.suggestions.push('Avoid common words and patterns');
                    break;
                }
            }

            if (!hasCommonPattern) {
                feedback.passes.push('No common password patterns detected');
                score += 1;
            }

            // Check for repeated characters
            const repeatedChars = /(.)\1{2,}/;
            if (repeatedChars.test(password)) {
                feedback.fails.push('Contains repeated characters');
                feedback.suggestions.push('Avoid using the same character multiple times in a row');
            } else {
                feedback.passes.push('No excessive character repetition');
                score += 0.5;
            }

            // Length bonus
            if (password.length >= 12) {
                feedback.passes.push('Good length (12+ characters)');
                score += 0.5;

                if (password.length >= 16) {
                    feedback.passes.push('Excellent length (16+ characters)');
                    score += 0.5;
                }
            } else {
                feedback.suggestions.push('Consider using a longer password (12+ characters)');
            }

            // Cap score at 4
            score = Math.min(4, Math.round(score));

            // Add general suggestions based on score
            if (score < 3) {
                feedback.suggestions.push('Consider using a password manager to generate and store strong passwords');
                feedback.suggestions.push('Try a passphrase: a series of random words with numbers and symbols');
            }

            return {score, feedback};
        }

        // Function to generate secure passwords
        function generatePassword(length, options) {
            const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
            const numberChars = '0123456789';
            const symbolChars = '!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?`~';

            let chars = '';
            if (options.uppercase) chars += uppercaseChars;
            if (options.lowercase) chars += lowercaseChars;
            if (options.numbers) chars += numberChars;
            if (options.symbols) chars += symbolChars;

            // Ensure at least one character from each selected type
            let password = '';

            if (options.uppercase) {
                password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
            }

            if (options.lowercase) {
                password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
            }

            if (options.numbers) {
                password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
            }

            if (options.symbols) {
                password += symbolChars.charAt(Math.floor(Math.random() * symbolChars.length));
            }

            // Fill the rest randomly
            for (let i = password.length; i < length; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Shuffle the password (Fisher-Yates algorithm)
            password = password.split('');
            for (let i = password.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [password[i], password[j]] = [password[j], password[i]];
            }

            return password.join('');
        }

        // Add cybersecurity visualization
        document.addEventListener('DOMContentLoaded', function () {
            // Create visualization container
            const container = document.querySelector('.cyber-visualization');

            // Set size to full window
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Create SVG element
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.zIndex = '-1';
            container.appendChild(svg);

            // Node and connection data
            const nodeCount = 40;
            const nodes = [];
            const connections = [];
            const packetData = [];
            const alerts = [];

            // Create nodes
            for (let i = 0; i < nodeCount; i++) {
                const node = {
                    id: i,
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 3 + 2,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    type: Math.random() > 0.8 ? 'server' : 'client',
                    secure: Math.random() > 0.2
                };
                nodes.push(node);
            }

            // Create connections between nodes
            for (let i = 0; i < nodes.length; i++) {
                const connectionCount = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < connectionCount; j++) {
                    const target = Math.floor(Math.random() * nodes.length);
                    if (i !== target) {
                        connections.push({
                            source: i,
                            target: target,
                            active: Math.random() > 0.3,
                            secure: Math.random() > 0.25,
                            width: Math.random() * 0.8 + 0.2
                        });
                    }
                }
            }

            // Create SVG definitions for effects
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.appendChild(defs);

            // Create glow filter
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', 'glow');
            filter.setAttribute('x', '-50%');
            filter.setAttribute('y', '-50%');
            filter.setAttribute('width', '200%');
            filter.setAttribute('height', '200%');

            const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feGaussianBlur.setAttribute('stdDeviation', '1.5');
            feGaussianBlur.setAttribute('result', 'blur');
            filter.appendChild(feGaussianBlur);

            const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComposite.setAttribute('in', 'SourceGraphic');
            feComposite.setAttribute('in2', 'blur');
            feComposite.setAttribute('operator', 'over');
            filter.appendChild(feComposite);

            defs.appendChild(filter);

            // Add gradient definitions
            const secureGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            secureGradient.setAttribute('id', 'secureGradient');
            secureGradient.innerHTML = `
                <stop offset="0%" stop-color="#2c2c2c" />
                <stop offset="100%" stop-color="#454545" />
            `;
            defs.appendChild(secureGradient);

            const insecureGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            insecureGradient.setAttribute('id', 'insecureGradient');
            insecureGradient.innerHTML = `
                <stop offset="0%" stop-color="#3a3a3a" />
                <stop offset="100%" stop-color="#1a1a1a" />
            `;
            defs.appendChild(insecureGradient);

            // Group for connections
            const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            svg.appendChild(connectionsGroup);

            // Group for packets
            const packetsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            svg.appendChild(packetsGroup);

            // Group for nodes
            const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            svg.appendChild(nodesGroup);

            // Group for alerts
            const alertsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            svg.appendChild(alertsGroup);

            // Draw connections
            connections.forEach((connection, index) => {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', nodes[connection.source].x);
                line.setAttribute('y1', nodes[connection.source].y);
                line.setAttribute('x2', nodes[connection.target].x);
                line.setAttribute('y2', nodes[connection.target].y);
                line.setAttribute('stroke', connection.secure ? '#3a3a3a' : '#1a1a1a');
                line.setAttribute('stroke-width', connection.width);
                line.setAttribute('stroke-opacity', connection.active ? 0.5 : 0.2);
                line.setAttribute('data-index', index);

                if (connection.active) {
                    line.setAttribute('stroke-dasharray', '3,3');
                    setInterval(() => {
                        const offset = parseInt(line.getAttribute('stroke-dashoffset') || 0);
                        line.setAttribute('stroke-dashoffset', (offset + 1) % 6);
                    }, 100);
                }

                connectionsGroup.appendChild(line);
            });

            // Draw nodes
            nodes.forEach((node, index) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', node.x);
                circle.setAttribute('cy', node.y);
                circle.setAttribute('r', node.radius);
                circle.setAttribute('fill', node.secure ? 'url(#secureGradient)' : 'url(#insecureGradient)');
                circle.setAttribute('data-index', index);

                if (node.type === 'server') {
                    circle.setAttribute('filter', 'url(#glow)');
                    circle.setAttribute('r', node.radius + 1);
                }

                nodesGroup.appendChild(circle);

                // Add hexagon for server nodes
                if (node.type === 'server') {
                    const hexSize = node.radius * 2.5;
                    const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    const points = [];

                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const x = node.x + hexSize * Math.cos(angle);
                        const y = node.y + hexSize * Math.sin(angle);
                        points.push(`${x},${y}`);
                    }

                    hexagon.setAttribute('points', points.join(' '));
                    hexagon.setAttribute('fill', 'none');
                    hexagon.setAttribute('stroke', '#454545');
                    hexagon.setAttribute('stroke-width', '0.5');
                    hexagon.setAttribute('opacity', '0.3');
                    nodesGroup.appendChild(hexagon);
                }
            });

            // Animation function
            function animate() {
                // Move nodes
                nodes.forEach((node, i) => {
                    // Update position
                    node.x += node.vx;
                    node.y += node.vy;

                    // Boundary check
                    if (node.x < 0 || node.x > width) node.vx = -node.vx;
                    if (node.y < 0 || node.y > height) node.vy = -node.vy;

                    // Update node element
                    const circle = nodesGroup.querySelector(`circle[data-index="${i}"]`);
                    if (circle) {
                        circle.setAttribute('cx', node.x);
                        circle.setAttribute('cy', node.y);
                    }

                    // Update server hexagon if present
                    if (node.type === 'server') {
                        const hexagon = nodesGroup.querySelectorAll('polygon')[nodes.filter(n => n.type === 'server').indexOf(node)];
                        if (hexagon) {
                            const hexSize = node.radius * 2.5;
                            const points = [];

                            for (let i = 0; i < 6; i++) {
                                const angle = (Math.PI / 3) * i - Math.PI / 2;
                                const x = node.x + hexSize * Math.cos(angle);
                                const y = node.y + hexSize * Math.sin(angle);
                                points.push(`${x},${y}`);
                            }

                            hexagon.setAttribute('points', points.join(' '));
                        }
                    }
                });

                // Update connection lines
                connections.forEach((connection, i) => {
                    const line = connectionsGroup.querySelector(`line[data-index="${i}"]`);
                    if (line) {
                        line.setAttribute('x1', nodes[connection.source].x);
                        line.setAttribute('y1', nodes[connection.source].y);
                        line.setAttribute('x2', nodes[connection.target].x);
                        line.setAttribute('y2', nodes[connection.target].y);
                    }
                });

                // Handle packet animations
                if (Math.random() > 0.95) {
                    const connectionIndex = Math.floor(Math.random() * connections.length);
                    const connection = connections[connectionIndex];

                    if (connection.active) {
                        const sourceNode = nodes[connection.source];
                        const targetNode = nodes[connection.target];

                        const packet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        packet.setAttribute('cx', sourceNode.x);
                        packet.setAttribute('cy', sourceNode.y);
                        packet.setAttribute('r', 1.5);
                        packet.setAttribute('fill', connection.secure ? '#4a4a4a' : '#2a2a2a');
                        packetsGroup.appendChild(packet);

                        const packetObj = {
                            element: packet,
                            source: connection.source,
                            target: connection.target,
                            progress: 0,
                            speed: Math.random() * 0.02 + 0.01,
                            secure: connection.secure
                        };

                        packetData.push(packetObj);
                    }
                }

                // Update existing packets
                for (let i = packetData.length - 1; i >= 0; i--) {
                    const packet = packetData[i];
                    packet.progress += packet.speed;

                    if (packet.progress >= 1) {
                        // Packet reached destination
                        packetsGroup.removeChild(packet.element);
                        packetData.splice(i, 1);

                        // Sometimes generate security alert
                        if (!packet.secure && Math.random() > 0.7) {
                            createAlert(nodes[packet.target].x, nodes[packet.target].y);
                        }
                    } else {
                        // Update packet position
                        const sourceNode = nodes[packet.source];
                        const targetNode = nodes[packet.target];

                        const x = sourceNode.x + (targetNode.x - sourceNode.x) * packet.progress;
                        const y = sourceNode.y + (targetNode.y - sourceNode.y) * packet.progress;

                        packet.element.setAttribute('cx', x);
                        packet.element.setAttribute('cy', y);
                    }
                }

                // Update alerts
                for (let i = alerts.length - 1; i >= 0; i--) {
                    const alert = alerts[i];
                    alert.opacity -= 0.01;

                    if (alert.opacity <= 0) {
                        // Remove faded alert
                        alertsGroup.removeChild(alert.element);
                        alerts.splice(i, 1);
                    } else {
                        // Update alert opacity
                        alert.element.setAttribute('opacity', alert.opacity);

                        // Expand alert radius
                        alert.radius += 0.3;
                        alert.element.setAttribute('r', alert.radius);
                    }
                }

                requestAnimationFrame(animate);
            }

            // Function to create security alert animation
            function createAlert(x, y) {
                const alertCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                alertCircle.setAttribute('cx', x);
                alertCircle.setAttribute('cy', y);
                alertCircle.setAttribute('r', 5);
                alertCircle.setAttribute('fill', 'none');
                alertCircle.setAttribute('stroke', '#333333');
                alertCircle.setAttribute('stroke-width', '1');
                alertCircle.setAttribute('opacity', '0.8');

                alertsGroup.appendChild(alertCircle);

                alerts.push({
                    element: alertCircle,
                    opacity: 0.8,
                    radius: 5
                });
            }

            // Handle window resize
            window.addEventListener('resize', function () {
                svg.setAttribute('width', window.innerWidth);
                svg.setAttribute('height', window.innerHeight);
            });

            // Start animation
            animate();
        });
    });