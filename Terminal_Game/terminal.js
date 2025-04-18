/**
 * Cybersecurity Terminal Challenge - Terminal Functionality
 * This file handles all terminal input/output and command processing
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    const terminalPrompt = document.getElementById('terminal-prompt');
    const helpButton = document.getElementById('help-button');
    const helpPanel = document.getElementById('help-panel');
    const hintButton = document.getElementById('hint-button');
    const badgesButton = document.getElementById('badges-button');
    const resetButton = document.getElementById('reset-button');
    const progressBar = document.getElementById('progress-bar');

    // Initialize the game
    function initGame() {
        clearTerminal();
        printAsciiLogo();
        printOutput("═════════════════════════════════════════════════", "highlight-text");
        printOutput("Welcome to the Cybersecurity Terminal Challenge! Your goal is to find vulnerabilities and gain higher access privileges.");
        printOutput("Type 'help' to see available commands.");

        // Creating a cool mission box
        printOutput("\n┌─────────────────────────────────────────────┐", "highlight-text");
        printOutput("│ CURRENT MISSION:                            │", "highlight-text");
        printOutput(`│ ${getCurrentChallenge().description.padEnd(43)} │`, "highlight-text");
        printOutput("└─────────────────────────────────────────────┘", "highlight-text");

        // Show badge count
        printOutput(`\nBadges earned: ${gameState.badges.length}/${gameState.maxLevel}`, "success-text");
        printOutput(`Hints available: ${gameState.hints.available}`, "success-text");

        updateProgressBar();
    }

    // Get current active challenge
    function getCurrentChallenge() {
        return challenges[gameState.currentLevel];
    }

    // Check if challenges are completed and update game state
    function checkChallengeCompletion() {
        const currentChallenge = getCurrentChallenge();

        // Check if current user meets challenge requirements
        if (currentChallenge.requiresUser && gameState.currentUser !== currentChallenge.requiresUser) {
            return;
        }

        // Check if current state meets challenge requirements
        if (currentChallenge.requiresState && !currentChallenge.requiresState()) {
            return;
        }

        if (!gameState.completedChallenges.includes(currentChallenge.id) && currentChallenge.isCompleted()) {
            // Mark challenge as completed
            gameState.completedChallenges.push(currentChallenge.id);
            gameState.badges.push(currentChallenge.reward);

            // Display success message
            printOutput("\n=== CHALLENGE COMPLETED ===", "success-text");
            printOutput(currentChallenge.message, "success-text");
            printOutput("You earned: " + currentChallenge.reward, "success-text");
            printOutput("=========================\n", "success-text");

            // Move to next level if not on last level
            if (gameState.currentLevel < gameState.maxLevel - 1) {
                gameState.currentLevel++;
                printOutput("\nNEW MISSION: " + getCurrentChallenge().description, "highlight-text");
            } else {
                printOutput("\n=== CONGRATULATIONS! ALL CHALLENGES COMPLETED ===", "success-text");
                printOutput("You have successfully completed all cybersecurity challenges!", "success-text");
                printOutput("You've demonstrated expert skills in reconnaissance, credential discovery, privilege escalation, system exploitation, and security operations.", "success-text");
                printOutput("Total badges earned: " + gameState.badges.length, "success-text");
            }

            updateProgressBar();
        }
    }

    // Print output to the terminal
    function printOutput(text, className = '') {
        const output = document.createElement('div');
        output.className = 'output-line ' + className;
        output.textContent = text;
        terminalOutput.appendChild(output);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // Print ASCII logo
    function printAsciiLogo() {
        const logo =
        `   _____      _               _____            _       __
  / ____|    | |             / ____|          (_)      \\ \\
 | |    _   _| |__   ___ _ _| (___   ___  ___ _  ___   | |
 | |   | | | | '_ \\ / _ \\ '__\\___ \\ / _ \\/ __| |/ __|  | |
 | |___| |_| | |_) |  __/ |  ____) |  __/ (__| | (__   | |____
  \\_____\\__, |_.__/ \\___|_| |_____/ \\___|\\___|_|\\___|  \\_____/
         __/ |
        |___/        ╔═══════════════════════════════╗
                     ║ Terminal Penetration Challenge ║
                     ╚═══════════════════════════════╝`;

        const logoElement = document.createElement('div');
        logoElement.className = 'ascii-art';
        logoElement.textContent = logo;
        terminalOutput.appendChild(logoElement);

        // Add subtle animation to the logo
        setTimeout(() => {
            const chars = "!@#$%^&*()_+-=[]{}|;:,./<>?";
            const glitchCount = 3;

            for (let g = 0; g < glitchCount; g++) {
                setTimeout(() => {
                    const glitchedLogo = logo.split('');

                    // Randomly replace characters in the logo
                    for (let i = 0; i < 10; i++) {
                        const randomIndex = Math.floor(Math.random() * logo.length);
                        if (logo[randomIndex] !== '\n' && logo[randomIndex] !== ' ') {
                            glitchedLogo[randomIndex] = chars[Math.floor(Math.random() * chars.length)];
                        }
                    }

                    logoElement.textContent = glitchedLogo.join('');

                    // Restore original logo after a short delay
                    setTimeout(() => {
                        logoElement.textContent = logo;
                    }, 100);
                }, g * 300);
            }
        }, 500);
    }

    // Clear the terminal
    function clearTerminal() {
        terminalOutput.innerHTML = '';
    }

    // Update the progress bar
    function updateProgressBar() {
        const progress = (gameState.completedChallenges.length / gameState.maxLevel) * 100;
        progressBar.style.width = progress + '%';
    }

    // Process user commands
    function processCommand(command) {
        // Play typing sound
        playTypeSound();

        // Add command to history
        if (command.trim()) {
            gameState.commandHistory.push(command);
            gameState.historyIndex = gameState.commandHistory.length;
        }

        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Record the input with prompt
        const inputLine = document.createElement('div');
        inputLine.className = 'input-line';

        const prompt = document.createElement('div');
        prompt.className = 'terminal-prompt';
        prompt.textContent = terminalPrompt.textContent;

        const input = document.createElement('div');
        input.textContent = ' ' + command;

        inputLine.appendChild(prompt);
        inputLine.appendChild(input);
        terminalOutput.appendChild(inputLine);

        // Process different commands
        switch (cmd) {
            case 'help':
                showHelp();
                break;
            case 'clear':
                clearTerminal();
                break;
            case 'ls':
                listFiles();
                break;
            case 'cat':
                if (args.length === 0) {
                    printOutput("Usage: cat [filename]", "error-text");
                } else {
                    catFile(args[0]);
                }
                break;
            case 'scan':
                scanSystem();
                break;
            case 'crack':
                if (args.length === 0) {
                    printOutput("Usage: crack [filename]", "error-text");
                } else {
                    crackFile(args[0]);
                }
                break;
            case 'decrypt':
                if (args.length === 0) {
                    printOutput("Usage: decrypt [filename]", "error-text");
                } else {
                    decryptFile(args[0]);
                }
                break;
            case 'whoami':
                printOutput(gameState.currentUser);
                break;
            case 'login':
                if (args.length === 0) {
                    printOutput("Usage: login [username]", "error-text");
                } else {
                    loginUser(args[0]);
                }
                break;
            case 'hint':
                showHint();
                break;
            case 'badges':
                showBadges();
                break;
            case 'find':
                if (args.length === 0) {
                    printOutput("Usage: find [pattern]", "error-text");
                } else {
                    findPattern(args[0]);
                }
                break;
            case 'man':
                if (args.length === 0) {
                    printOutput("Usage: man [command]", "error-text");
                } else {
                    showManPage(args[0]);
                }
                break;
            case 'history':
                showCommandHistory();
                break;
            case 'sudo':
                handleSudoCommand(args);
                break;
            case 'ssh':
                handleSSHCommand(args);
                break;
            case 'exfiltrate':
                handleExfiltrate(args);
                break;
            case 'firewall':
                handleFirewall(args);
                break;
            case 'ids':
                handleIDS(args);
                break;
            case 'ping':
                handlePing(args);
                break;
            case 'exploit':
                handleExploit(args);
                break;
            case 'nmap':
                handleNmap(args);
                break;
            case 'chmod':
                handleChmod(args);
                break;
            case 'rm':
                handleRemove(args);
                break;
            case 'cd':
                printOutput("Functionality limited to the current directory for this challenge.");
                break;
            case 'mkdir':
                printOutput("Functionality limited to existing directories for this challenge.");
                break;
            case 'touch':
                printOutput("File creation restricted in this challenge environment.");
                break;
            case 'wget':
                printOutput("External downloads are restricted in this challenge environment.");
                break;
            case 'nc':
                handleNetcat(args);
                break;
            case 'ps':
                handleProcessList();
                break;
            default:
                printOutput(`Command not found: ${cmd}. Type 'help' for available commands.`, "error-text");
        }

        // Check if any challenges are completed
        checkChallengeCompletion();

        // Scroll to bottom
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // Show available commands
    function showHelp() {
        printOutput("Available commands:", "highlight-text");
        printOutput("System commands:");
        printOutput("  help       - Display this help information");
        printOutput("  clear      - Clear the terminal screen");
        printOutput("  ls         - List files in the current directory");
        printOutput("  cat [file] - Display the contents of a file");
        printOutput("  find [pattern] - Search for files with matching pattern");
        printOutput("  man [command] - Display manual page for a command");
        printOutput("  history    - Show command history");

        printOutput("\nSecurity commands:");
        printOutput("  scan       - Scan the system for vulnerabilities");
        printOutput("  crack [file] - Attempt to crack a password file");
        printOutput("  decrypt [file] - Decrypt an encrypted file");
        printOutput("  whoami     - Display current user");
        printOutput("  login [user] - Login as a different user");

        printOutput("\nAdvanced commands (require higher privileges):");
        printOutput("  sudo [command] - Execute a command with elevated privileges");
        printOutput("  ssh [user@host] - Connect to a remote system");
        printOutput("  firewall [option] - Manage the system firewall");
        printOutput("  ids [option] - Control the intrusion detection system");
        printOutput("  exfiltrate [file] - Extract data from the system");
        printOutput("  exploit [target] - Attempt to exploit a vulnerability");

        printOutput("\nChallenge commands:");
        printOutput("  hint       - Get a hint for current challenge");
        printOutput("  badges     - Show earned badges");
    }

    // Show manual page for a command
    function showManPage(command) {
        if (commandManual[command]) {
            printOutput(`Manual page for '${command}':`, "highlight-text");
            printOutput(commandManual[command]);

            // Show examples for specific commands
            if (command === 'sudo') {
                printOutput("\nExamples:");
                printOutput("  sudo firewall --disable    # Disable the firewall with root privileges");
                printOutput("  sudo ids --disable         # Disable the intrusion detection system");
                printOutput("  sudo access --root         # Attempt to gain root access");
            } else if (command === 'firewall') {
                printOutput("\nExamples:");
                printOutput("  firewall --status          # Check firewall status");
                printOutput("  firewall --rules           # List firewall rules");
                printOutput("  sudo firewall --disable    # Disable the firewall (requires sudo)");
            } else if (command === 'exfiltrate') {
                printOutput("\nExamples:");
                printOutput("  exfiltrate database_backup.sql  # Extract database backup");
                printOutput("  exfiltrate ids_config.json      # Extract IDS configuration");
            }
        } else {
            printOutput(`No manual entry for '${command}'`, "error-text");
        }
    }

    // Show command history
    function showCommandHistory() {
        printOutput("Command history:", "highlight-text");
        if (gameState.commandHistory.length === 0) {
            printOutput("No commands in history.");
            return;
        }

        gameState.commandHistory.forEach((cmd, index) => {
            printOutput(`${index + 1}. ${cmd}`);
        });
    }

    // List files
    function listFiles() {
        printOutput("Listing files in current directory:");

        // Filter out hidden files unless user has proper permissions
        let visibleFiles = Object.keys(fileSystem).filter(file => {
            if (gameState.currentUser === 'root') return true;
            if (gameState.currentUser === 'admin') return !hiddenFiles.includes(file) ||
                file === 'backdoor.sh' ||
                file === 'secure_notes.txt' ||
                file === 'encryption_key.txt' ||
                file === 'firewall_rules.conf' ||
                file === 'ssh_access.key';
            if (gameState.currentUser === 'analyst') return !hiddenFiles.includes(file) || file === 'secure_notes.txt';
            return !hiddenFiles.includes(file);
        });

        if (visibleFiles.length === 0) {
            printOutput("No files found.");
        } else {
            // Format file list with colors based on type
            let outputText = '';
            visibleFiles.forEach((file, index) => {
                let fileClass = '';
                if (file.endsWith('.txt')) fileClass = 'highlight-text';
                else if (file.endsWith('.sh')) fileClass = 'success-text';
                else if (file.endsWith('.enc')) fileClass = 'error-text';
                else if (file.endsWith('.key')) fileClass = 'warning-text';

                const fileSpan = document.createElement('span');
                fileSpan.className = fileClass;
                fileSpan.textContent = file;

                outputText += file + '  ';

                // Break into multiple lines for readability
                if ((index + 1) % 3 === 0) {
                    outputText += '\n';
                }
            });

            printOutput(outputText);
        }
    }

    // Display file contents
    function catFile(filename) {
        // Check if the file exists
        if (fileSystem[filename]) {
            // Record that this file has been discovered
            if (!gameState.filesDiscovered.includes(filename)) {
                gameState.filesDiscovered.push(filename);
            }

            // Check permissions
            if (hiddenFiles.includes(filename)) {
                if (gameState.currentUser === 'guest') {
                    printOutput(`Permission denied: ${filename}`, "error-text");
                    return;
                } else if (gameState.currentUser === 'analyst' && filename !== 'secure_notes.txt') {
                    printOutput(`Permission denied: ${filename}`, "error-text");
                    return;
                } else if (gameState.currentUser === 'admin' &&
                          (filename === 'root_access.key' ||
                           filename === 'ids_config.json' ||
                           filename === 'emergency_protocols.txt')) {
                    printOutput(`Permission denied: ${filename}`, "error-text");
                    return;
                }
            }

            printOutput(`=== ${filename} ===`, "highlight-text");
            printOutput(fileSystem[filename]);

            // Special case for backdoor.sh when viewed by admin
            if (filename === 'backdoor.sh' && gameState.currentUser === 'admin') {
                printOutput("\nThis appears to be a backdoor script. It can be executed with 'backdoor.sh activate'");
            }

            // Special case for firewall rules when viewed by admin
            if (filename === 'firewall_rules.conf' && gameState.currentUser === 'admin') {
                printOutput("\nThe firewall can be disabled with 'sudo firewall --disable' using the override key.");
            }
        } else {
            printOutput(`File not found: ${filename}`, "error-text");
        }
    }

    // Scan the system
    function scanSystem() {
        printOutput("Scanning system for vulnerabilities...");

        // Simulate scanning with a delay
        setTimeout(() => {
            printOutput("Scan complete!");

            if (gameState.currentUser === 'guest') {
                printOutput("Limited scan results (guest access):", "highlight-text");
                printOutput("- System appears to be using default configurations");
                printOutput("- Some files have weak permissions");
                printOutput("- Network ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)");

                // Give a hint based on current challenge
                if (gameState.currentLevel === 0) {
                    printOutput("Hint: There might be a file containing user information.");
                }
            } else if (gameState.currentUser === 'analyst') {
                printOutput("Detailed scan results (analyst access):", "highlight-text");
                printOutput("- Default credentials detected for some accounts");
                printOutput("- Sensitive information may be stored in plaintext");
                printOutput("- Admin account shows recent activity");
                printOutput("- Weak encryption detected on sensitive files");
                printOutput("- Hidden services running on ports 8080, 3306");
                printOutput("- Multiple system files have insecure permissions");

                if (!gameState.filesDiscovered.includes('backdoor.sh')) {
                    printOutput("- Potential backdoor script detected: backdoor.sh");
                }

                // Show additional information based on challenge level
                if (gameState.currentLevel >= 3) {
                    printOutput("- Admin credentials may be stored in protected files");
                    printOutput("- Network traffic shows suspicious patterns");
                }
            } else if (gameState.currentUser === 'admin') {
                printOutput("Full system scan results (admin access):", "highlight-text");
                printOutput("- Multiple hidden files contain sensitive information");
                printOutput("- Encryption keys stored insecurely in system files");
                printOutput("- Firewall configuration has potential override option");
                printOutput("- Intrusion Detection System can be disabled");
                printOutput("- Backdoor script present in system directory");

                // If the encryption key hasn't been found, give a hint
                if (!gameState.filesDiscovered.includes('encryption_key.txt')) {
                    printOutput("- Encryption key detected in hidden file: encryption_key.txt");
                }

                // Show additional vulnerabilities based on challenge progress
                if (gameState.currentLevel >= 6) {
                    printOutput("- Firewall can be disabled using admin override in firewall_rules.conf");
                }

                if (gameState.currentLevel >= 7) {
                    printOutput("- Backdoor connectivity can be established to 192.168.1.100");
                }

                if (gameState.currentLevel >= 8) {
                    printOutput("- IDS can be disabled using configuration in ids_config.json");
                }

                if (gameState.currentLevel >= 9) {
                    printOutput("- Database backup contains sensitive information");
                }
            } else if (gameState.currentUser === 'root') {
                printOutput("Root-level scan results:", "highlight-text");
                printOutput("- Full system compromise achieved");
                printOutput("- All security mechanisms can be controlled");
                printOutput("- Complete access to all system files and configurations");
                printOutput("- Security logging can be modified or deleted");
                printOutput("- System patch available to fix all vulnerabilities");

                if (!gameState.filesDiscovered.includes('patch_system.sh')) {
                    printOutput("- System patching script available: patch_system.sh");
                }
            }
        }, 1000);
    }

    // Find files by pattern
    function findPattern(pattern) {
        printOutput(`Searching for files matching pattern: ${pattern}...`);

        // Determine which files the user can access based on privilege level
        let accessibleFiles = Object.keys(fileSystem).filter(file => {
            if (gameState.currentUser === 'root') return true;
            if (gameState.currentUser === 'admin') return !hiddenFiles.includes(file) ||
                file === 'backdoor.sh' ||
                file === 'secure_notes.txt' ||
                file === 'encryption_key.txt' ||
                file === 'firewall_rules.conf' ||
                file === 'ssh_access.key';
            if (gameState.currentUser === 'analyst') return !hiddenFiles.includes(file) || file === 'secure_notes.txt';
            return !hiddenFiles.includes(file);
        });

        // Search for the pattern in file names and content
        let matchingFiles = [];
        accessibleFiles.forEach(file => {
            // Check filename
            if (file.toLowerCase().includes(pattern.toLowerCase())) {
                matchingFiles.push(`${file} (filename match)`);
                // Record that this file has been discovered
                if (!gameState.filesDiscovered.includes(file)) {
                    gameState.filesDiscovered.push(file);
                }
            }
            // Check content if user has permission to read this file
            else if (fileSystem[file].toLowerCase().includes(pattern.toLowerCase())) {
                matchingFiles.push(`${file} (content match)`);
                // Record that this file has been discovered
                if (!gameState.filesDiscovered.includes(file)) {
                    gameState.filesDiscovered.push(file);
                }
            }
        });

        // Display results
        if (matchingFiles.length > 0) {
            printOutput("Matches found:", "highlight-text");
            matchingFiles.forEach(file => printOutput(`- ${file}`));
        } else {
            printOutput("No matches found.");
        }
    }

    // Crack a password file
    function crackFile(filename) {
        printOutput(`Attempting to crack ${filename}...`);

        if (!fileSystem[filename]) {
            printOutput(`File not found: ${filename}`, "error-text");
            return;
        }

        // Simulate password cracking with a delay
        setTimeout(() => {
            if (filename === 'user_accounts.txt' && gameState.currentUser !== 'guest') {
                printOutput("Cracking successful!", "success-text");
                printOutput("Found credentials:");
                printOutput("- guest:guest");
                printOutput("- analyst:Secure123!");
                printOutput("- admin:[Encrypted]");
                printOutput("- root:[Highly Encrypted]");
            } else if (filename === 'secure_data.enc') {
                printOutput("Cracking failed: Strong encryption detected.", "error-text");
                printOutput("Try using the 'decrypt' command with the appropriate key.");
            } else if (filename === 'system_log.txt' && gameState.currentUser === 'analyst') {
                printOutput("Partial success!", "success-text");
                printOutput("Extracted system information:");
                printOutput("- Last login: admin user from 192.168.1.100");
                printOutput("- System vulnerabilities detected in ports 22, 80");
                printOutput("- Possible password pattern: Company+Year+Symbol");
            } else if (filename === 'database_backup.sql' && gameState.currentUser === 'admin') {
                printOutput("Database password hashes extracted:", "success-text");
                printOutput("- admin:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
                printOutput("- analyst:ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f");
                printOutput("- root:4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2");
                printOutput("\nNote: These appear to be SHA-256 hashes, difficult to crack quickly.");
            } else if (filename === 'firewall_rules.conf' && gameState.currentUser === 'admin') {
                printOutput("Configuration analysis complete:", "success-text");
                printOutput("- Firewall override key found: 7XJ9A55TMN");
                printOutput("- Disable command: sudo firewall --disable");
                printOutput("\nThis information could be used to disable the firewall.");
            } else if (filename === 'ids_config.json' && (gameState.currentUser === 'admin' || gameState.currentUser === 'root')) {
                printOutput("Configuration analysis complete:", "success-text");
                printOutput("- IDS admin override code: J5NM8KL");
                printOutput("- Disable command: sudo ids --disable");
                printOutput("\nThis information could be used to disable the intrusion detection system.");
            } else {
                printOutput("No credentials or valuable information found in this file.");
            }
        }, 1500);
    }

    // Decrypt a file
    function decryptFile(filename) {
        if (!fileSystem[filename]) {
            printOutput(`File not found: ${filename}`, "error-text");
            return;
        }

        printOutput(`Attempting to decrypt ${filename}...`);
        printOutput("Enter decryption key:");

        // Set a flag to handle the next input as a decryption key
        terminalInput.setAttribute('data-mode', 'decrypt');
        terminalInput.setAttribute('data-file', filename);
    }

    // Handle decryption with key
    function handleDecryption(file, key) {
        printOutput(`Using key: ${key}`);

        setTimeout(() => {
            if (file === 'secure_data.enc' && key === 'CyberGuard123') {
                printOutput("Decryption successful!", "success-text");
                printOutput("=== secure_data.enc (decrypted) ===", "highlight-text");

                // Create the decrypted file in the system
                fileSystem['secure_data_decrypted.txt'] = fileSystem['secure_data_decrypted.txt'] ||
                    'CONFIDENTIAL INFORMATION:\nSystem access credentials are rotated monthly.\nCurrent admin password hint: Company name + year established + "!"\nCompany established in: 2023\nEmergency access procedures documented in file "emergency_protocols.txt"\nSecurity vulnerability detected in the main firewall configuration.';

                printOutput(fileSystem['secure_data_decrypted.txt']);

                // Add decrypted file to discovered files to track challenge completion
                if (!gameState.filesDiscovered.includes('secure_data_decrypted.txt')) {
                    gameState.filesDiscovered.push('secure_data_decrypted.txt');
                }
            } else {
                printOutput("Decryption failed: Incorrect key.", "error-text");
                if (file === 'secure_data.enc') {
                    printOutput("Hint: The key might be related to company information you've discovered.");
                }
            }
        }, 1000);
    }

    // Login as a user
    function loginUser(username) {
        if (!['guest', 'analyst', 'admin', 'root'].includes(username)) {
            printOutput(`User ${username} does not exist.`, "error-text");
            return;
        }

        if (username === gameState.currentUser) {
            printOutput(`Already logged in as ${username}.`);
            return;
        }

        printOutput(`Attempting to login as ${username}...`);
        printOutput("Enter password:");

        // Set a flag to handle the next input as a password
        terminalInput.setAttribute('data-mode', 'login');
        terminalInput.setAttribute('data-user', username);
    }

    // Handle login with password
    function handleLogin(username, password) {
        printOutput(`Authenticating ${username}...`);

        setTimeout(() => {
            let loginSuccessful = false;

            // Check credentials
            if (username === 'guest' && password === 'guest') {
                loginSuccessful = true;
            } else if (username === 'analyst' && password === 'Secure123!') {
                loginSuccessful = true;
            } else if (username === 'admin' && password === 'SuperSecureAdmin2023!') {
                loginSuccessful = true;
            }

            if (loginSuccessful) {
                gameState.currentUser = username;
                terminalPrompt.textContent = `${username}@securesystem:~$`;
                printOutput(`Login successful! Welcome, ${username}.`, "success-text");

                // If logged in as admin for the first time
                if (username === 'admin' && !gameState.filesDiscovered.includes('hidden_flag.txt')) {
                    printOutput("\nAs admin, you now have access to all system files.", "highlight-text");
                    printOutput("Try using 'ls' to see hidden files.", "highlight-text");
                }
            } else {
                printOutput("Authentication failed: Incorrect password.", "error-text");
            }
        }, 1000);
    }

    // Show hint for current challenge
    function showHint() {
        if (gameState.hints.available <= 0) {
            printOutput("No hints available. You've used all your hints.", "error-text");
            return;
        }

        const currentChallenge = getCurrentChallenge();
        gameState.hints.used++;
        gameState.hints.available--;

        printOutput(`Hint (${gameState.hints.available} remaining): ${currentChallenge.hint}`, "highlight-text");
    }

    // Show earned badges
    function showBadges() {
        if (gameState.badges.length === 0) {
            printOutput("You haven't earned any badges yet. Complete challenges to earn badges!");
            return;
        }

        printOutput("=== Earned Badges ===", "highlight-text");
        printOutput("┌────────────────────────────────────────┐");
        gameState.badges.forEach((badge, index) => {
            printOutput(`│ ${index + 1}. ${badge.padEnd(35)} │`, "success-text");
        });
        printOutput("└────────────────────────────────────────┘");

        // Show progress
        const progressText = `Progress: ${gameState.completedChallenges.length}/${gameState.maxLevel} challenges completed`;
        printOutput(`\n${progressText}`);

        // Visual progress bar
        const progressBarLength = 40;
        const filledLength = Math.floor((gameState.completedChallenges.length / gameState.maxLevel) * progressBarLength);
        let progressBar = '│';
        for (let i = 0; i < progressBarLength; i++) {
            progressBar += i < filledLength ? '█' : '░';
        }
        progressBar += '│';
        printOutput(progressBar, "highlight-text");
    }

    // Play typing sound
    function playTypeSound() {
        const typeSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABbgCJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJ//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQTAAAAAAAAW+66rKABAAAAAAAAAAAAAAAAAP/7UEAAABXhxz1RUABRGbl8jhAAVH2MLdwIABMF1MWlMAAAuXOJLQAAAKCPgAAAAAgbCAfx+H4+CEMIQhCEIQhCEIQhB+CHwQAAAAAACAIAgCATg+D4fB8IQhCEAAAABzz/0hCE5///55CEIQhCEAQcoAFCEIQhCEIQnKcHKAHCdEESYYDGXJQYABgBgKUPNjHLCQZG3JYAgGHbGIgiUrHQLwTIMowIABzYBBAxkDnI5mQdJ1HZB+g6Q54yQ/AXkA/EyuSQME5LCQZR2XbqYSWEgyTtxkAQbqALxMg5upmwfSZW0EDfgD0nbi5LoFTkrYZ9tMgARR12SAQEAAAAAAAAAAAAAAAAAAAf/7AEAAAAWAfGfwYAAInA+MvgzgAQAgBAAAAAAgAAAACAEAIAQAAAAAAIAAAAQPKAKIDBMPNIdCYzKAEICbYVEg8CmDJmOcYeAwBimLhIiAMAgkSAgCKGJgcBpDAYJAQGKgUACgGYFhgiImCgMYDAQCAQAUWoLkBgkDDoG9BgQAAQmYTAR5BwENJe/+jgQB3ABYDVCMNgAGYBZAcMf/7kEAAAAYoaKn8HgAKMjpVvgzABQwz/PUMAEDfgIAuYJAYWAIgAIBIBDgDzBg0MFk///+LBmUQA6X//8wYTg4wWOdL///+YNEhJB6PmxAAgYYAAfhEDxaWZJJBmciIf//TAwEFglErMtGGEcP//3///////ULLDQiAgL////////1WsyYnAX////////qQCDhJBgPTWAFQIYwCQZtgAwYHgAoWZqAf/9/AxkxQKyg////////qJiVAr////////o/UiFFQfWZNd////+tKkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sQRAwABfBxLfwzgAoXJWm+BoACrCpXrYJEAM2nif8GYAAAEAAAGBAGIAC4YMGDBAAAAAAAAA0MDBQIECBAgQAAAAQMFCBNSTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xBEFQAFe2vL4MMAApENWXwYYAAAA0gBQAAoAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
        typeSound.volume = 0.05;
        typeSound.play();
    }

    // Event listener for input
    terminalInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const command = terminalInput.value;
            terminalInput.value = '';

            // Check if we're in a special input mode
            const mode = terminalInput.getAttribute('data-mode');

            if (mode === 'decrypt') {
                const file = terminalInput.getAttribute('data-file');
                handleDecryption(file, command);
                // Reset mode
                terminalInput.removeAttribute('data-mode');
                terminalInput.removeAttribute('data-file');
            } else if (mode === 'login') {
                const user = terminalInput.getAttribute('data-user');
                handleLogin(user, command);
                // Reset mode
                terminalInput.removeAttribute('data-mode');
                terminalInput.removeAttribute('data-user');
            } else {
                // Regular command processing
                processCommand(command);
            }
        } else if (event.key === 'ArrowUp') {
            // Navigate command history (up)
            event.preventDefault();
            if (gameState.commandHistory.length > 0 && gameState.historyIndex > 0) {
                gameState.historyIndex--;
                terminalInput.value = gameState.commandHistory[gameState.historyIndex];
            }
        } else if (event.key === 'ArrowDown') {
            // Navigate command history (down)
            event.preventDefault();
            if (gameState.historyIndex < gameState.commandHistory.length - 1) {
                gameState.historyIndex++;
                terminalInput.value = gameState.commandHistory[gameState.historyIndex];
            } else if (gameState.historyIndex === gameState.commandHistory.length - 1) {
                gameState.historyIndex = gameState.commandHistory.length;
                terminalInput.value = '';
            }
        } else if (event.key === 'Tab') {
            // Simple command auto-completion
            event.preventDefault();

            const currentInput = terminalInput.value.trim();
            if (currentInput) {
                const commands = ['help', 'clear', 'ls', 'cat', 'scan', 'crack', 'decrypt', 'whoami',
                                 'login', 'hint', 'badges', 'find', 'man', 'history'];

                const matchingCommands = commands.filter(cmd => cmd.startsWith(currentInput));

                if (matchingCommands.length === 1) {
                    terminalInput.value = matchingCommands[0] + ' ';
                } else if (matchingCommands.length > 1) {
                    // Display possible completions
                    printOutput(`Possible completions: ${matchingCommands.join(' ')}`);
                }
            }
        }
    });

    // Help button toggle
    helpButton.addEventListener('click', function() {
        helpPanel.classList.toggle('visible');
        helpButton.textContent = helpPanel.classList.contains('visible') ? 'Hide Help' : 'Show Help';
    });

    // Hint button
    hintButton.addEventListener('click', function() {
        showHint();
    });

    // Badges button
    badgesButton.addEventListener('click', function() {
        showBadges();
    });

    // Reset button
    resetButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
            gameState = {
                currentUser: 'guest',
                currentLevel: 0,
                maxLevel: 6,
                completedChallenges: [],
                filesDiscovered: [],
                inventory: [],
                badges: [],
                hints: {
                    used: 0,
                    available: 3
                },
                commandHistory: [],
                historyIndex: -1
            };
            terminalPrompt.textContent = 'guest@securesystem:~';
            initGame();
        }
    });

    // Create matrix effect on start
    function createMatrixEffect() {
        // Create a temporary canvas for the matrix effect
        const matrixCanvas = document.createElement('canvas');
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        matrixCanvas.style.position = 'absolute';
        matrixCanvas.style.top = '0';
        matrixCanvas.style.left = '0';
        matrixCanvas.style.zIndex = '10';
        document.querySelector('.terminal-container').appendChild(matrixCanvas);

        const ctx = matrixCanvas.getContext('2d');

        // Matrix characters
        const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

        // Set up columns - scale based on viewport width
        const fontSize = Math.max(10, window.innerWidth / 80);
        const columns = Math.floor(matrixCanvas.width / fontSize);
        const drops = [];

        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * -20);
        }

        // Draw matrix effect
        function drawMatrix() {
            // Set semi-transparent black background to create fade effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

            // Set text color
            ctx.fillStyle = '#0f0';
            ctx.font = `${fontSize}px monospace`;

            // Draw characters
            for (let i = 0; i < drops.length; i++) {
                // Random character
                const text = chars[Math.floor(Math.random() * chars.length)];

                // x = i * font size, y = drop position * font size
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Send drop back to top randomly after it reaches the bottom
                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.99) {
                    drops[i] = 0;
                }

                // Increment drop position
                drops[i]++;
            }
        }

        // Animate matrix effect
        const matrixInterval = setInterval(drawMatrix, 33);

        // Remove matrix effect after a few seconds
        setTimeout(() => {
            clearInterval(matrixInterval);
            matrixCanvas.remove();

            // Proceed with game initialization
            initGame();
        }, 3000);
    }

    // Start with matrix effect
    createMatrixEffect();

    // Expose functions for debugging
    window.terminalInterface = {
        printOutput,
        clearTerminal,
        processCommand
    };
});