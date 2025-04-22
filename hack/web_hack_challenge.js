/**
 * Web Vulnerability Hacking Challenge
 *
 * This challenge simulates common web vulnerabilities in a controlled environment.
 * Users can practice discovering and exploiting vulnerabilities like:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - CSRF (Cross-Site Request Forgery)
 * - Path Traversal
 * - And more!
 */

// Challenge state
let webHackState = {
    currentLevel: 0,
    maxLevel: 8,
    completedLevels: [],
    serverDatabase: {
        users: [
            { id: 1, username: 'admin', password: 'S3cur3P@ssw0rd!', role: 'administrator', email: 'admin@example.com' },
            { id: 2, username: 'john', password: 'password123', role: 'user', email: 'john@example.com' },
            { id: 3, username: 'sarah', password: 'sarah2023', role: 'user', email: 'sarah@example.com' },
            { id: 4, username: 'guest', password: 'guest', role: 'guest', email: 'guest@example.com' }
        ],
        posts: [
            { id: 1, user_id: 1, title: 'Welcome to the forum', content: 'This is a safe space for discussion.', private: false },
            { id: 2, user_id: 1, title: 'Security Policy Update', content: 'We have implemented new security measures.', private: true },
            { id: 3, user_id: 2, title: 'Hello everyone', content: 'Just joined this forum!', private: false },
            { id: 4, user_id: 3, title: 'Question about privacy', content: 'How secure is this platform?', private: false },
            { id: 5, user_id: 1, title: 'CONFIDENTIAL: Admin credentials', content: 'Backup admin credentials: username=backdoor, password=adm1n2023', private: true }
        ],
        files: {
            'public/index.html': '<html><head><title>Welcome</title></head><body><h1>Welcome</h1></body></html>',
            'public/about.html': '<html><head><title>About</title></head><body><h1>About Us</h1></body></html>',
            'private/config.ini': 'DB_USER=app_user\nDB_PASS=db_S3cret!\nADMIN_KEY=S3creT_K3y!',
            'private/logs.txt': 'Login attempt: admin - SUCCESS\nLogin attempt: john - SUCCESS\nLogin attempt: unknown - FAILED',
            'private/backup.sql': 'INSERT INTO users VALUES (1, "admin", "S3cur3P@ssw0rd!", "administrator")'
        }
    },
    currentSession: {
        loggedIn: false,
        username: null,
        role: null,
        token: null,
        attempts: 0
    },
    flags: {
        sqlInjection: false,
        xssFound: false,
        csrfExploited: false,
        pathTraversal: false,
        adminAccess: false,
        sensitiveDataExposed: false,
        sessionHijacked: false,
        passwordCracked: false
    },
    hints: {
        used: 0,
        available: 5
    }
};

// Challenge level definitions
const webChallenges = [
    {
        id: 'sql_injection',
        title: 'SQL Injection Vulnerability',
        description: 'Find a way to log in as admin without knowing the password.',
        hint: 'SQL queries can be manipulated to always return true conditions. Try using quotes and SQL keywords in the username or password field.',
        solved: () => webHackState.flags.sqlInjection,
        reward: 'SQL Injection Master',
        message: 'You successfully exploited an SQL injection vulnerability to gain unauthorized access!'
    },
    {
        id: 'xss_vulnerability',
        title: 'Cross-Site Scripting (XSS)',
        description: 'Insert a JavaScript alert in the comment field that executes when viewed.',
        hint: 'HTML content is not being properly sanitized. Try embedding <script> tags or event handlers.',
        solved: () => webHackState.flags.xssFound,
        reward: 'XSS Hunter',
        message: 'You successfully executed a cross-site scripting attack!'
    },
    {
        id: 'path_traversal',
        title: 'Path Traversal Vulnerability',
        description: 'Access a file outside the intended directory.',
        hint: 'The file viewer doesn\'t validate paths properly. Try using "../" to navigate to parent directories.',
        solved: () => webHackState.flags.pathTraversal,
        reward: 'Path Traversal Expert',
        message: 'You successfully exploited a path traversal vulnerability to access restricted files!'
    },
    {
        id: 'csrf_attack',
        title: 'Cross-Site Request Forgery (CSRF)',
        description: 'Create a request that performs an action as another user.',
        hint: 'The application doesn\'t validate the origin of requests. Try crafting a form that submits to the target action.',
        solved: () => webHackState.flags.csrfExploited,
        reward: 'CSRF Exploiter',
        message: 'You successfully performed a cross-site request forgery attack!'
    },
    {
        id: 'sensitive_data',
        title: 'Sensitive Data Exposure',
        description: 'Find exposed confidential information in the application.',
        hint: 'Check page sources, API responses, and hidden directories for unprotected sensitive data.',
        solved: () => webHackState.flags.sensitiveDataExposed,
        reward: 'Data Sniffer',
        message: 'You successfully discovered exposed sensitive information!'
    },
    {
        id: 'session_hijacking',
        title: 'Session Hijacking',
        description: 'Take over another user\'s session.',
        hint: 'Session tokens might be predictable or stored insecurely. Look for patterns or insecure storage.',
        solved: () => webHackState.flags.sessionHijacked,
        reward: 'Session Hijacker',
        message: 'You successfully hijacked another user\'s session!'
    },
    {
        id: 'password_cracking',
        title: 'Password Cracking',
        description: 'Crack a user\'s password using the provided hash.',
        hint: 'The password hash is vulnerable to rainbow table attacks. Try common password cracking tools or techniques.',
        solved: () => webHackState.flags.passwordCracked,
        reward: 'Password Cracker',
        message: 'You successfully cracked a password hash!'
    },
    {
        id: 'privilege_escalation',
        title: 'Privilege Escalation',
        description: 'Elevate your privileges from a standard user to administrator.',
        hint: 'The user role parameter might be manipulable. Check for insecure direct object references.',
        solved: () => webHackState.flags.adminAccess,
        reward: 'Privilege Escalation Master',
        message: 'You successfully escalated your privileges to gain administrator access!'
    }
];

// DOM elements
let hackOutput;
let hackInput;
let hackPrompt;
let progressBar;
let levelDisplay;

// Initialize the hacking challenge
function initWebHackChallenge() {
    // Get DOM elements
    hackOutput = document.getElementById('hack-output');
    hackInput = document.getElementById('hack-input');
    hackPrompt = document.getElementById('hack-prompt');
    progressBar = document.getElementById('hack-progress-bar');
    levelDisplay = document.getElementById('current-challenge');

    // Set up event listeners
    hackInput.addEventListener('keydown', handleHackInput);
    document.getElementById('hack-help-button').addEventListener('click', showWebHackHelp);
    document.getElementById('hack-hint-button').addEventListener('click', showWebHackHint);
    document.getElementById('hack-reset-button').addEventListener('click', resetWebHackChallenge);

    // Display welcome message
    printToHackOutput(`
    ██╗    ██╗███████╗██████╗     ██╗  ██╗ █████╗  ██████╗██╗  ██╗██╗███╗   ██╗ ██████╗ 
    ██║    ██║██╔════╝██╔══██╗    ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██║████╗  ██║██╔════╝ 
    ██║ █╗ ██║█████╗  ██████╔╝    ███████║███████║██║     █████╔╝ ██║██╔██╗ ██║██║  ███╗
    ██║███╗██║██╔══╝  ██╔══██╗    ██╔══██║██╔══██║██║     ██╔═██╗ ██║██║╚██╗██║██║   ██║
    ╚███╔███╔╝███████╗██████╔╝    ██║  ██║██║  ██║╚██████╗██║  ██╗██║██║ ╚████║╚██████╔╝
     ╚══╝╚══╝ ╚══════╝╚═════╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
                                     CHALLENGE
    `, 'ascii-art');

    printToHackOutput("Welcome to the Web Vulnerability Hacking Challenge!");
    printToHackOutput("Your mission is to discover and exploit vulnerabilities in a simulated web application.");
    printToHackOutput("Type 'help' to see available commands.");

    // Display first challenge
    updateWebHackLevel();
}

// Print to hack output
function printToHackOutput(text, className = '') {
    const output = document.createElement('div');
    output.className = 'hack-output-line ' + className;
    output.textContent = text;
    hackOutput.appendChild(output);
    hackOutput.scrollTop = hackOutput.scrollHeight;
}

// Handle input
function handleHackInput(event) {
    if (event.key === 'Enter') {
        const command = hackInput.value;
        hackInput.value = '';

        // Record input in output
        const inputLine = document.createElement('div');
        inputLine.className = 'hack-input-line';

        const prompt = document.createElement('span');
        prompt.className = 'hack-prompt';
        prompt.textContent = hackPrompt.textContent;

        const input = document.createElement('span');
        input.textContent = ' ' + command;

        inputLine.appendChild(prompt);
        inputLine.appendChild(input);
        hackOutput.appendChild(inputLine);

        // Process command
        processWebHackCommand(command);

        // Update level completion
        checkWebHackLevelCompletion();

        // Scroll to bottom
        hackOutput.scrollTop = hackOutput.scrollHeight;
    }
}

// Process commands
function processWebHackCommand(command) {
    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case 'help':
            showWebHackHelp();
            break;
        case 'clear':
            hackOutput.innerHTML = '';
            break;
        case 'login':
            handleLogin(args);
            break;
        case 'inspect':
            inspectElement(args);
            break;
        case 'request':
            sendRequest(args);
            break;
        case 'inject':
            injectPayload(args);
            break;
        case 'browse':
            browseTo(args);
            break;
        case 'read':
            readFile(args);
            break;
        case 'crack':
            crackPassword(args);
            break;
        case 'status':
            showStatus();
            break;
        case 'level':
            showCurrentLevel();
            break;
        case 'hint':
            showWebHackHint();
            break;
        default:
            printToHackOutput(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error-text');
    }
}

// Show help
function showWebHackHelp() {
    printToHackOutput("Available commands:", "highlight-text");
    printToHackOutput("  help       - Show this help menu");
    printToHackOutput("  clear      - Clear the output");
    printToHackOutput("  login      - Attempt to log in (login [username] [password])");
    printToHackOutput("  inspect    - Inspect an element or page (inspect [element/page])");
    printToHackOutput("  request    - Send HTTP request (request [GET/POST] [url] [data])");
    printToHackOutput("  inject     - Inject a payload (inject [target] [payload])");
    printToHackOutput("  browse     - Navigate to a URL (browse [url])");
    printToHackOutput("  read       - Read a file (read [filename])");
    printToHackOutput("  crack      - Attempt to crack a password (crack [hash])");
    printToHackOutput("  status     - Show current status and progress");
    printToHackOutput("  level      - Show current challenge information");
    printToHackOutput("  hint       - Get a hint for the current challenge");
}

// Login handler - with SQL injection vulnerability
function handleLogin(args) {
    if (args.length < 2) {
        printToHackOutput("Usage: login [username] [password]", "error-text");
        return;
    }

    const username = args[0];
    const password = args[1];

    printToHackOutput(`Attempting to login as ${username}...`);

    // Simulate SQL injection vulnerability
    if (username.includes("'") || password.includes("'")) {
        if ((username.includes("'") && username.toLowerCase().includes("or") && username.includes("=")) ||
            (password.includes("'") && password.toLowerCase().includes("or") && password.includes("="))) {
            // SQL injection successful
            printToHackOutput("Login successful! Welcome, admin!", "success-text");
            webHackState.currentSession.loggedIn = true;
            webHackState.currentSession.username = "admin";
            webHackState.currentSession.role = "administrator";
            webHackState.currentSession.token = "admin_session_" + Math.random().toString(36).substring(2);
            webHackState.flags.sqlInjection = true;

            printToHackOutput("SQL INJECTION DETECTED! You've successfully exploited a SQL injection vulnerability.", "highlight-text");
            printToHackOutput("Example of vulnerable code:", "info-text");
            printToHackOutput("\"SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'\"", "code-text");

            return;
        }
    }

    // Regular login check
    const user = webHackState.serverDatabase.users.find(u => u.username === username && u.password === password);
    if (user) {
        printToHackOutput(`Login successful! Welcome, ${username}!`, "success-text");
        webHackState.currentSession.loggedIn = true;
        webHackState.currentSession.username = username;
        webHackState.currentSession.role = user.role;
        webHackState.currentSession.token = user.id + "_session_" + Math.random().toString(36).substring(2);
    } else {
        printToHackOutput("Login failed: Invalid username or password", "error-text");
        webHackState.currentSession.attempts++;

        // After 3 failed attempts, give a hint
        if (webHackState.currentSession.attempts >= 3 && !webHackState.flags.sqlInjection) {
            printToHackOutput("Hint: The login form might be vulnerable to SQL injection...", "info-text");
        }
    }
}

// Inspect elements or pages - useful for XSS challenge
function inspectElement(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: read [filename]", "error-text");
        return;
    }

    const filename = args[0];
    printToHackOutput(`Attempting to read file: ${filename}...`);

    // Check for path traversal vulnerability
    if (filename.includes('../') || filename.includes('..\\')) {
        // Path traversal exploit successful
        let targetFile = filename;

        // Replace path traversal sequences to simulate directory navigation
        while (targetFile.includes('../') || targetFile.includes('..\\')) {
            targetFile = targetFile.replace(/\.\.\/[^\/]+\//, '');
            targetFile = targetFile.replace(/\.\.\\\[^\\]+\\/, '');
        }

        // Extract the last part of the path (the actual file name)
        const actualFile = targetFile.split('/').pop().split('\\').pop();

        // Check if we've accessed a sensitive file
        if (actualFile === 'config.ini' || actualFile === 'logs.txt' || actualFile === 'backup.sql') {
            webHackState.flags.pathTraversal = true;

            // Find the file in our simulated database
            let fileContent = null;
            for (const [path, content] of Object.entries(webHackState.serverDatabase.files)) {
                if (path.endsWith(actualFile)) {
                    fileContent = content;
                    break;
                }
            }

            if (fileContent) {
                printToHackOutput("PATH TRAVERSAL VULNERABILITY DETECTED! You've accessed a sensitive file outside the intended directory.", "highlight-text");
                printToHackOutput(`Contents of ${actualFile}:`, "info-text");
                printToHackOutput(fileContent, "code-text");
            } else {
                printToHackOutput("File not found or inaccessible.", "error-text");
            }
        } else if (Object.keys(webHackState.serverDatabase.files).some(f => f.endsWith(actualFile))) {
            // Non-sensitive file found
            for (const [path, content] of Object.entries(webHackState.serverDatabase.files)) {
                if (path.endsWith(actualFile)) {
                    printToHackOutput(`Contents of ${actualFile}:`, "info-text");
                    printToHackOutput(content, "code-text");
                    break;
                }
            }
        } else {
            printToHackOutput("File not found or inaccessible.", "error-text");
        }
    } else {
        // Regular file access (no path traversal)
        if (webHackState.serverDatabase.files[`public/${filename}`]) {
            printToHackOutput(`Contents of ${filename}:`, "info-text");
            printToHackOutput(webHackState.serverDatabase.files[`public/${filename}`], "code-text");
        } else {
            printToHackOutput("File not found or access denied. You can only access files in the public directory.", "error-text");
            printToHackOutput("Hint: Try exploring different directories...", "info-text");
        }
    }
}

// Password cracking function
function crackPassword(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: crack [hash/algorithm] [target]", "error-text");
        return;
    }

    const type = args[0].toLowerCase();
    const target = args.length > 1 ? args[1] : null;

    printToHackOutput(`Attempting to crack ${type}...`);

    switch (type) {
        case 'md5':
            printToHackOutput("MD5 hash cracking initiated...");
            printToHackOutput("Running dictionary attack...");
            setTimeout(() => {
                printToHackOutput("Password found: password123", "success-text");
                webHackState.flags.passwordCracked = true;
                printToHackOutput("PASSWORD CRACKING SUCCESSFUL! You've cracked a weak password hash.", "highlight-text");
            }, 2000);
            break;
        case 'sha256':
            if (target === '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08') {
                printToHackOutput("SHA-256 hash cracking initiated...");
                printToHackOutput("Running dictionary attack...");
                setTimeout(() => {
                    printToHackOutput("Password found: 1234", "success-text");
                    webHackState.flags.passwordCracked = true;
                    printToHackOutput("PASSWORD CRACKING SUCCESSFUL! You've cracked a weak password hash.", "highlight-text");
                }, 2000);
            } else {
                printToHackOutput("Hash cracking in progress...");
                setTimeout(() => {
                    printToHackOutput("No match found. Try a different hash or algorithm.", "error-text");
                }, 2000);
            }
            break;
        case 'session':
            printToHackOutput("Session token analysis initiated...");
            printToHackOutput("Looking for patterns...");
            setTimeout(() => {
                printToHackOutput("Session token pattern: {user_id}_session_{random_string}", "success-text");
                printToHackOutput("Predictable element: user_id", "success-text");
                webHackState.flags.sessionHijacked = true;
                printToHackOutput("SESSION HIJACKING POSSIBLE! You've identified a predictable session token pattern.", "highlight-text");
            }, 2000);
            break;
        default:
            printToHackOutput(`Unsupported hash/algorithm type: ${type}`, "error-text");
    }
}

// Show current status
function showStatus() {
    printToHackOutput("=== Current Status ===", "highlight-text");
    printToHackOutput(`Logged in: ${webHackState.currentSession.loggedIn ? 'Yes' : 'No'}`);
    if (webHackState.currentSession.loggedIn) {
        printToHackOutput(`Username: ${webHackState.currentSession.username}`);
        printToHackOutput(`Role: ${webHackState.currentSession.role}`);
    }

    printToHackOutput("\nVulnerabilities found:", "highlight-text");
    const flags = Object.entries(webHackState.flags).filter(([_, value]) => value);
    if (flags.length === 0) {
        printToHackOutput("None yet. Keep exploring!");
    } else {
        flags.forEach(([flag]) => {
            let flagName = flag.replace(/([A-Z])/g, ' $1').toLowerCase();
            flagName = flagName.charAt(0).toUpperCase() + flagName.slice(1);
            printToHackOutput(`• ${flagName}`, "success-text");
        });
    }

    printToHackOutput(`\nProgress: ${webHackState.completedLevels.length}/${webHackState.maxLevel} challenges completed`);
    printToHackOutput(`Hints available: ${webHackState.hints.available}`);
}

// Show current level/challenge
function showCurrentLevel() {
    const currentChallenge = webChallenges[webHackState.currentLevel];

    printToHackOutput("=== Current Challenge ===", "highlight-text");
    printToHackOutput(`Challenge: ${currentChallenge.title}`, "info-text");
    printToHackOutput(`Description: ${currentChallenge.description}`);
    printToHackOutput(`Status: ${currentChallenge.solved() ? 'COMPLETED' : 'IN PROGRESS'}`);

    updateWebHackLevel();
}

// Show hint for current challenge
function showWebHackHint() {
    if (webHackState.hints.available <= 0) {
        printToHackOutput("No hints available. You've used all your hints.", "error-text");
        return;
    }

    const currentChallenge = webChallenges[webHackState.currentLevel];
    webHackState.hints.used++;
    webHackState.hints.available--;

    printToHackOutput(`Hint (${webHackState.hints.available} remaining): ${currentChallenge.hint}`, "highlight-text");
}

// Reset the web hacking challenge
function resetWebHackChallenge() {
    if (confirm('Are you sure you want to reset the challenge? All progress will be lost.')) {
        webHackState = {
            currentLevel: 0,
            maxLevel: 8,
            completedLevels: [],
            serverDatabase: {
                users: [
                    { id: 1, username: 'admin', password: 'S3cur3P@ssw0rd!', role: 'administrator', email: 'admin@example.com' },
                    { id: 2, username: 'john', password: 'password123', role: 'user', email: 'john@example.com' },
                    { id: 3, username: 'sarah', password: 'sarah2023', role: 'user', email: 'sarah@example.com' },
                    { id: 4, username: 'guest', password: 'guest', role: 'guest', email: 'guest@example.com' }
                ],
                posts: [
                    { id: 1, user_id: 1, title: 'Welcome to the forum', content: 'This is a safe space for discussion.', private: false },
                    { id: 2, user_id: 1, title: 'Security Policy Update', content: 'We have implemented new security measures.', private: true },
                    { id: 3, user_id: 2, title: 'Hello everyone', content: 'Just joined this forum!', private: false },
                    { id: 4, user_id: 3, title: 'Question about privacy', content: 'How secure is this platform?', private: false },
                    { id: 5, user_id: 1, title: 'CONFIDENTIAL: Admin credentials', content: 'Backup admin credentials: username=backdoor, password=adm1n2023', private: true }
                ],
                files: {
                    'public/index.html': '<html><head><title>Welcome</title></head><body><h1>Welcome</h1></body></html>',
                    'public/about.html': '<html><head><title>About</title></head><body><h1>About Us</h1></body></html>',
                    'private/config.ini': 'DB_USER=app_user\nDB_PASS=db_S3cret!\nADMIN_KEY=S3creT_K3y!',
                    'private/logs.txt': 'Login attempt: admin - SUCCESS\nLogin attempt: john - SUCCESS\nLogin attempt: unknown - FAILED',
                    'private/backup.sql': 'INSERT INTO users VALUES (1, "admin", "S3cur3P@ssw0rd!", "administrator")'
                }
            },
            currentSession: {
                loggedIn: false,
                username: null,
                role: null,
                token: null,
                attempts: 0
            },
            flags: {
                sqlInjection: false,
                xssFound: false,
                csrfExploited: false,
                pathTraversal: false,
                adminAccess: false,
                sensitiveDataExposed: false,
                sessionHijacked: false,
                passwordCracked: false
            },
            hints: {
                used: 0,
                available: 5
            }
        };

        hackOutput.innerHTML = '';
        initWebHackChallenge();
    }
}

// Check if the current level is completed
function checkWebHackLevelCompletion() {
    const currentChallenge = webChallenges[webHackState.currentLevel];

    if (!webHackState.completedLevels.includes(currentChallenge.id) && currentChallenge.solved()) {
        // Mark challenge as completed
        webHackState.completedLevels.push(currentChallenge.id);

        // Display success message
        printToHackOutput("\n=== CHALLENGE COMPLETED ===", "success-text");
        printToHackOutput(currentChallenge.message, "success-text");
        printToHackOutput("You earned: " + currentChallenge.reward, "success-text");
        printToHackOutput("=========================\n", "success-text");

        // Move to next level if not on last level
        if (webHackState.currentLevel < webHackState.maxLevel - 1) {
            webHackState.currentLevel++;
            updateWebHackLevel();
        } else {
            printToHackOutput("\n=== CONGRATULATIONS! ALL CHALLENGES COMPLETED ===", "success-text");
            printToHackOutput("You have successfully completed all web hacking challenges!", "success-text");
            printToHackOutput("You've demonstrated expert knowledge of common web vulnerabilities.", "success-text");
            printToHackOutput("Total challenges completed: " + webHackState.completedLevels.length, "success-text");
        }

        // Update progress bar
        updateWebHackProgress();
    }
}

// Update the web hack challenge level display
function updateWebHackLevel() {
    const currentChallenge = webChallenges[webHackState.currentLevel];

    // Update level display if it exists
    if (levelDisplay) {
        levelDisplay.textContent = currentChallenge.title;
    }

    // Print current challenge info
    printToHackOutput("\n--- CURRENT CHALLENGE ---", "highlight-text");
    printToHackOutput(currentChallenge.description, "info-text");
    printToHackOutput("------------------\n");

    // Update progress bar
    updateWebHackProgress();
}

// Update the progress bar
function updateWebHackProgress() {
    if (progressBar) {
        const progress = (webHackState.completedLevels.length / webHackState.maxLevel) * 100;
        progressBar.style.width = progress + '%';
    }
}

// Export functions for external access
window.webHackChallenge = {
    init: initWebHackChallenge,
    reset: resetWebHackChallenge,
    printOutput: printToHackOutput
};
 {
        printToHackOutput("Usage: inspect [element/page]", "error-text");

    }

    const target = args[0].toLowerCase();

    switch (target) {
        case "form":
        case "login":
            printToHackOutput("Inspecting login form...");
            printToHackOutput("<form action='/login' method='POST'>", "code-text");
            printToHackOutput("  <input type='text' name='username' placeholder='Username'>", "code-text");
            printToHackOutput("  <input type='password' name='password' placeholder='Password'>", "code-text");
            printToHackOutput("  <button type='submit'>Login</button>", "code-text");
            printToHackOutput("</form>", "code-text");
            break;
        case "comments":
        case "comment":
            printToHackOutput("Inspecting comment section...");
            printToHackOutput("<div class='comments'>", "code-text");
            printToHackOutput("  <div class='comment'>", "code-text");
            printToHackOutput("    <h3>John</h3>", "code-text");
            printToHackOutput("    <p>Great site!</p>", "code-text");
            printToHackOutput("  </div>", "code-text");
            printToHackOutput("  <div class='comment'>", "code-text");
            printToHackOutput("    <h3>Sarah</h3>", "code-text");
            printToHackOutput("    <p>I have a question about security...</p>", "code-text");
            printToHackOutput("  </div>", "code-text");
            printToHackOutput("  <form id='comment-form'>", "code-text");
            printToHackOutput("    <textarea name='comment'></textarea>", "code-text");
            printToHackOutput("    <button type='submit'>Post Comment</button>", "code-text");
            printToHackOutput("  </form>", "code-text");
            printToHackOutput("</div>", "code-text");
            printToHackOutput("");
            printToHackOutput("Comment processing function:", "info-text");
            printToHackOutput("function displayComment(username, content) {", "code-text");
            printToHackOutput("  const commentDiv = document.createElement('div');", "code-text");
            printToHackOutput("  commentDiv.className = 'comment';", "code-text");
            printToHackOutput("  commentDiv.innerHTML = `<h3>${username}</h3><p>${content}</p>`;", "code-text");
            printToHackOutput("  document.querySelector('.comments').appendChild(commentDiv);", "code-text");
            printToHackOutput("}", "code-text");
            break;
        case "source":
        case "page":
            printToHackOutput("Inspecting page source...");
            printToHackOutput("<!DOCTYPE html>", "code-text");
            printToHackOutput("<html>", "code-text");
            printToHackOutput("<head>", "code-text");
            printToHackOutput("  <title>Secure Web App</title>", "code-text");
            printToHackOutput("  <!-- TODO: Remove before production -->", "code-text");
            printToHackOutput("  <!-- Admin secret key: S3creT_K3y! -->", "code-text");
            printToHackOutput("</head>", "code-text");
            printToHackOutput("<body>", "code-text");
            printToHackOutput("  <!-- Content here -->", "code-text");
            printToHackOutput("</body>", "code-text");
            printToHackOutput("</html>", "code-text");

            // Mark sensitive data found
            webHackState.flags.sensitiveDataExposed = true;
            break;
        case "headers":
            printToHackOutput("Inspecting HTTP headers...");
            printToHackOutput("Response headers:", "info-text");
            printToHackOutput("HTTP/1.1 200 OK", "code-text");
            printToHackOutput("Server: Apache/2.4.41", "code-text");
            printToHackOutput("Content-Type: text/html; charset=UTF-8", "code-text");
            printToHackOutput("Set-Cookie: session=user_session_123; HttpOnly", "code-text");
            printToHackOutput("X-Powered-By: PHP/7.2.24", "code-text");
            break;
        default:
            printToHackOutput(`Element "${target}" not found or cannot be inspected.`, "error-text");
    }


// Send HTTP requests - useful for CSRF and other challenges
function sendRequest(args) {
    if (args.length < 2) {
        printToHackOutput("Usage: request [GET/POST] [url] [data]", "error-text");
        return;
    }

    const method = args[0].toUpperCase();
    const url = args[1];
    const data = args.length > 2 ? args.slice(2).join(' ') : '';

    printToHackOutput(`Sending ${method} request to ${url}...`);

    if (method === 'GET') {
        if (url.includes('admin') && !webHackState.currentSession.loggedIn) {
            printToHackOutput("Request failed: Authentication required", "error-text");
            return;
        }

        if (url.includes('user') && url.includes('role=admin')) {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Role updated successfully!");
            webHackState.flags.adminAccess = true;
            printToHackOutput("PRIVILEGE ESCALATION DETECTED! You've successfully exploited an insecure direct object reference.", "highlight-text");
            return;
        }

        printToHackOutput("Response: 200 OK", "success-text");
        printToHackOutput("Received data: { status: 'success', message: 'Request completed successfully' }");
    } else if (method === 'POST') {
        if (url.includes('login')) {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Redirecting to /dashboard");
        } else if (url.includes('comment') && data.includes('<script>')) {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Comment posted successfully!");
            webHackState.flags.xssFound = true;
            printToHackOutput("XSS VULNERABILITY DETECTED! Your script would execute when viewed.", "highlight-text");
        } else if (url.includes('transfer') && !url.includes('csrf_token')) {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Transfer completed successfully!");
            webHackState.flags.csrfExploited = true;
            printToHackOutput("CSRF VULNERABILITY DETECTED! You've successfully executed a cross-site request forgery.", "highlight-text");
        } else {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Request processed successfully");
        }
    } else {
        printToHackOutput(`Unsupported HTTP method: ${method}`, "error-text");
    }
}

// Inject payloads - for XSS and other challenges
function injectPayload(args) {
    if (args.length < 2) {
        printToHackOutput("Usage: inject [target] [payload]", "error-text");
        return;
    }

    const target = args[0].toLowerCase();
    const payload = args.slice(1).join(' ');

    printToHackOutput(`Injecting payload into ${target}...`);

    switch (target) {
        case 'comment':
            if (payload.includes('<script>') && payload.includes('alert')) {
                printToHackOutput("Payload injected successfully!", "success-text");
                printToHackOutput("The script executes when the comment is viewed:", "info-text");
                printToHackOutput(`<div class="comment"><h3>User</h3><p>${payload}</p></div>`, "code-text");
                webHackState.flags.xssFound = true;
                printToHackOutput("XSS VULNERABILITY DETECTED! The comment system doesn't sanitize HTML input.", "highlight-text");
            } else {
                printToHackOutput("Payload injected, but no vulnerability was triggered.", "info-text");
                printToHackOutput("Hint: Try using JavaScript to create an alert dialog.", "info-text");
            }
            break;
        case 'url':
            if (payload.includes('../')) {
                printToHackOutput("Payload injected successfully!", "success-text");
                if (payload.includes('../private')) {
                    webHackState.flags.pathTraversal = true;
                    printToHackOutput("PATH TRAVERSAL VULNERABILITY DETECTED! You've accessed files outside the intended directory.", "highlight-text");
                    printToHackOutput("Accessed file: private/config.ini", "info-text");
                    printToHackOutput("Content:", "info-text");
                    printToHackOutput(webHackState.serverDatabase.files['private/config.ini'], "code-text");
                } else {
                    printToHackOutput("Path traversal attempted, but no sensitive files were accessed.", "info-text");
                    printToHackOutput("Hint: Try accessing the 'private' directory.", "info-text");
                }
            } else {
                printToHackOutput("Payload injected, but no vulnerability was triggered.", "info-text");
                printToHackOutput("Hint: Try using path traversal techniques to access restricted directories.", "info-text");
            }
            break;
        case 'session':
            if (payload.includes('token=')) {
                const token = payload.split('token=')[1].trim();
                printToHackOutput(`Attempting to use session token: ${token}`, "info-text");

                if (token.includes('admin_session')) {
                    printToHackOutput("Session hijacking successful!", "success-text");
                    printToHackOutput("You are now logged in as admin.", "success-text");
                    webHackState.flags.sessionHijacked = true;
                    printToHackOutput("SESSION HIJACKING DETECTED! You've successfully taken over another user's session.", "highlight-text");
                } else {
                    printToHackOutput("Invalid session token.", "error-text");
                }
            } else {
                printToHackOutput("Payload injected, but no vulnerability was triggered.", "info-text");
                printToHackOutput("Hint: Try using a valid session token format.", "info-text");
            }
            break;
        default:
            printToHackOutput(`Target "${target}" not recognized or not injectable.`, "error-text");
    }
}

// Browse to URLs - for path traversal and other challenges
function browseTo(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: browse [url]", "error-text");
        return;
    }

    const url = args[0];
    printToHackOutput(`Browsing to ${url}...`);

    if (url.includes('../')) {
        // Path traversal attempt
        let normalizedPath = url;
        while (normalizedPath.includes('../')) {
            normalizedPath = normalizedPath.replace(/\/[^\/]+\/\.\./, '');
        }

        if (normalizedPath.includes('private/')) {
            const filePath = normalizedPath.split('private/')[1];
            if (webHackState.serverDatabase.files[`private/${filePath}`]) {
                printToHackOutput("File accessed successfully!", "success-text");
                printToHackOutput(`Contents of ${filePath}:`, "info-text");
                printToHackOutput(webHackState.serverDatabase.files[`private/${filePath}`], "code-text");
                webHackState.flags.pathTraversal = true;
                printToHackOutput("PATH TRAVERSAL VULNERABILITY DETECTED! You've accessed files outside the intended directory.", "highlight-text");
            } else {
                printToHackOutput("File not found.", "error-text");
            }
        } else if (normalizedPath.includes('public/')) {
            const filePath = normalizedPath.split('public/')[1];
            if (webHackState.serverDatabase.files[`public/${filePath}`]) {
                printToHackOutput("File accessed successfully!", "success-text");
                printToHackOutput(`Contents of ${filePath}:`, "info-text");
                printToHackOutput(webHackState.serverDatabase.files[`public/${filePath}`], "code-text");
            } else {
                printToHackOutput("File not found.", "error-text");
            }
        } else {
            printToHackOutput("Access denied or resource not found.", "error-text");
        }
    } else if (url.includes('admin') && !webHackState.currentSession.loggedIn) {
        printToHackOutput("Access denied: Authentication required", "error-text");
    } else if (url.includes('user_profile.php') && url.includes('user_id=')) {
        // IDOR vulnerability
        const userId = url.split('user_id=')[1];
        if (userId !== '2' && webHackState.currentSession.role !== 'administrator') {
            printToHackOutput("Access denied: You can only view your own profile", "error-text");
        } else {
            const user = webHackState.serverDatabase.users.find(u => u.id === parseInt(userId)) || webHackState.serverDatabase.users[0];
            printToHackOutput("Profile accessed:", "success-text");
            printToHackOutput(`Username: ${user.username}`, "info-text");
            printToHackOutput(`Email: ${user.email}`, "info-text");
            printToHackOutput(`Role: ${user.role}`, "info-text");

            if (userId === '1' && webHackState.currentSession.role !== 'administrator') {
                webHackState.flags.adminAccess = true;
                printToHackOutput("IDOR VULNERABILITY DETECTED! You've accessed another user's data through insecure direct object references.", "highlight-text");
            }
        }
    } else {
        printToHackOutput("Page loaded successfully.", "success-text");
        printToHackOutput("This is a normal page with no vulnerabilities detected.");
    }
}

// Read file handler - with path traversal vulnerability
function readFile(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: read [filename]", "error-text");
        return;
    }

    const filename = args[0];
    printToHackOutput(`Attempting to read file: ${filename}...`);

    // Check for path traversal vulnerability
    if (filename.includes('../') || filename.includes('..\\')) {
        // Path traversal exploit successful
        let targetFile = filename;

        // Replace path traversal sequences to simulate directory navigation
        while (targetFile.includes('../') || targetFile.includes('..\\')) {
            targetFile = targetFile.replace(/\.\.\/[^\/]+\//, '');
            targetFile = targetFile.replace(/\.\.\\\[^\\]+\\/, '');
        }

        // Extract the last part of the path (the actual file name)
        const actualFile = targetFile.split('/').pop().split('\\').pop();

        // Check if we've accessed a sensitive file
        if (actualFile === 'config.ini' || actualFile === 'logs.txt' || actualFile === 'backup.sql') {
            webHackState.flags.pathTraversal = true;

            // Find the file in our simulated database
            let fileContent = null;
            for (const [path, content] of Object.entries(webHackState.serverDatabase.files)) {
                if (path.endsWith(actualFile)) {
                    fileContent = content;
                    break;
                }
            }

            if (fileContent) {
                printToHackOutput("PATH TRAVERSAL VULNERABILITY DETECTED! You've accessed a sensitive file outside the intended directory.", "highlight-text");
                printToHackOutput(`Contents of ${actualFile}:`, "info-text");
                printToHackOutput(fileContent, "code-text");
            } else {
                printToHackOutput("File not found or inaccessible.", "error-text");
            }
        } else if (Object.keys(webHackState.serverDatabase.files).some(f => f.endsWith(actualFile))) {
            // Non-sensitive file found
            for (const [path, content] of Object.entries(webHackState.serverDatabase.files)) {
                if (path.endsWith(actualFile)) {
                    printToHackOutput(`Contents of ${actualFile}:`, "info-text");
                    printToHackOutput(content, "code-text");
                    break;
                }
            }
        } else {
            printToHackOutput("File not found or inaccessible.", "error-text");
        }
    } else {
        // Regular file access (no path traversal)
        if (webHackState.serverDatabase.files[`public/${filename}`]) {
            printToHackOutput(`Contents of ${filename}:`, "info-text");
            printToHackOutput(webHackState.serverDatabase.files[`public/${filename}`], "code-text");
        } else {
            printToHackOutput("File not found or access denied. You can only access files in the public directory.", "error-text");
            printToHackOutput("Hint: Try exploring different directories...", "info-text");
        }
    }
}