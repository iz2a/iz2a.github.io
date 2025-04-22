/**
 * Web Vulnerability Hacking Challenge
 *
 * This challenge simulates common web vulnerabilities in a controlled environment.
 * Users can practice discovering and exploiting vulnerabilities like:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - CSRF (Cross-Site Request Forgery)
 * - Path Traversal
 * - Server-Side Request Forgery (SSRF)
 * - Insecure Deserialization
 * - JWT Manipulation
 * - XML External Entity (XXE) Injection
 * - And more!
 */

// Challenge state
let webHackState = {
    currentLevel: 0,
    maxLevel: 10, // Increased from 8 to 10 with new challenges
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
            'private/backup.sql': 'INSERT INTO users VALUES (1, "admin", "S3cur3P@ssw0rd!", "administrator")',
            'private/jwt_secret.key': 'super_secret_jwt_key_2023'
        },
        apis: {
            'internal': {
                'users': 'http://internal-api.local/users',
                'admin': 'http://internal-api.local/admin',
                'logs': 'http://internal-api.local/logs'
            }
        },
        jwt: {
            validTokens: {
                'user': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwibmFtZSI6ImpvaG4iLCJyb2xlIjoidXNlciJ9.7Qs6zUfpGQIS817Xhw2eJ_rOYVvHHLFTWfB-2q4sxEM',
                'admin': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluaXN0cmF0b3IifQ.zsCPXw9XQNLRI-T_xA6hS4es-JbVaXPpqLrRlG2Uuzs'
            }
        },
        xml: {
            users: `<?xml version="1.0" encoding="UTF-8"?>
<users>
    <user id="1">
        <username>admin</username>
        <role>administrator</role>
    </user>
    <user id="2">
        <username>john</username>
        <role>user</role>
    </user>
    <user id="3">
        <username>sarah</username>
        <role>user</role>
    </user>
</users>`
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
        passwordCracked: false,
        ssrfExploited: false,
        jwtManipulated: false,
        xxeInjection: false,
        insecureDeserialization: false
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
    },
    {
        id: 'ssrf_vulnerability',
        title: 'Server-Side Request Forgery (SSRF)',
        description: 'Access an internal API by manipulating server requests.',
        hint: 'The application might make requests to other resources based on user input. Try accessing internal API endpoints.',
        solved: () => webHackState.flags.ssrfExploited,
        reward: 'SSRF Exploiter',
        message: 'You successfully exploited a Server-Side Request Forgery vulnerability to access internal systems!'
    },
    {
        id: 'jwt_manipulation',
        title: 'JWT Token Manipulation',
        description: 'Manipulate a JWT token to gain elevated privileges.',
        hint: 'JWT tokens contain encoded data that might be tampered with. Try modifying the payload and signature.',
        solved: () => webHackState.flags.jwtManipulated,
        reward: 'JWT Hacker',
        message: 'You successfully manipulated a JWT token to gain unauthorized access!'
    },
    {
        id: 'xxe_injection',
        title: 'XML External Entity (XXE) Injection',
        description: 'Exploit an XML parser to access local files through XXE.',
        hint: 'XML parsers might process external entity references. Try injecting a DOCTYPE declaration with an entity that reads a sensitive file.',
        solved: () => webHackState.flags.xxeInjection,
        reward: 'XXE Exploiter',
        message: 'You successfully exploited an XXE vulnerability to extract sensitive data!'
    },
    {
        id: 'insecure_deserialization',
        title: 'Insecure Deserialization',
        description: 'Exploit insecure deserialization to execute arbitrary code.',
        hint: 'The application might deserialize user-controlled data without proper validation. Try modifying serialized objects.',
        solved: () => webHackState.flags.insecureDeserialization,
        reward: 'Deserialization Expert',
        message: 'You successfully exploited an insecure deserialization vulnerability!'
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
        case 'analyze':
            analyzeToken(args);
            break;
        case 'decode':
            decodeData(args);
            break;
        case 'fetch':
            fetchResource(args);
            break;
        case 'parse':
            parseXML(args);
            break;
        case 'serialize':
            serializeObject(args);
            break;
        case 'deserialize':
            deserializeObject(args);
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
    printToHackOutput("  crack      - Attempt to crack a password (crack [hash/algorithm] [target])");
    printToHackOutput("  status     - Show current status and progress");
    printToHackOutput("  level      - Show current challenge information");
    printToHackOutput("  hint       - Get a hint for the current challenge");
    printToHackOutput("  analyze    - Analyze a token or hash (analyze [token/jwt] [value])");
    printToHackOutput("  decode     - Decode data (decode [type] [data])");
    printToHackOutput("  fetch      - Fetch a resource from a URL (fetch [url])");
    printToHackOutput("  parse      - Parse and process XML data (parse [xml])");
    printToHackOutput("  serialize  - Serialize an object (serialize [object])");
    printToHackOutput("  deserialize - Deserialize data (deserialize [data])");
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
        printToHackOutput("Usage: inspect [element/page]", "error-text");
        return;
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
        case "jwt":
        case "token":
            printToHackOutput("Inspecting JWT token structure...");
            printToHackOutput("Token format: xxxxx.yyyyy.zzzzz", "info-text");
            printToHackOutput("- xxxxx: Header (Algorithm & Token Type)", "info-text");
            printToHackOutput("- yyyyy: Payload (Data)", "info-text");
            printToHackOutput("- zzzzz: Signature", "info-text");
            printToHackOutput("");
            printToHackOutput("Example token:", "info-text");
            printToHackOutput(webHackState.serverDatabase.jwt.validTokens.user, "code-text");
            printToHackOutput("");
            printToHackOutput("The token can be decoded using base64url decoding for the first two parts.", "info-text");
            break;
        case "api":
            printToHackOutput("Inspecting API endpoints...");
            printToHackOutput("Public API endpoints:", "info-text");
            printToHackOutput("- GET /api/users - List users", "code-text");
            printToHackOutput("- GET /api/posts - List public posts", "code-text");
            printToHackOutput("- POST /api/login - Authenticate user", "code-text");
            printToHackOutput("");
            printToHackOutput("Note: The API has an endpoint that fetches data from URLs: /api/fetch?url=", "info-text");
            break;
        case "xml":
            printToHackOutput("Inspecting XML processor...");
            printToHackOutput("XML processing code:", "info-text");
            printToHackOutput("function processXML(xml) {", "code-text");
            printToHackOutput("  // Parse XML with entity expansion enabled", "code-text");
            printToHackOutput("  const parser = new DOMParser();", "code-text");
            printToHackOutput("  const xmlDoc = parser.parseFromString(xml, 'text/xml');", "code-text");
            printToHackOutput("  // Process XML document", "code-text");
            printToHackOutput("  // ...", "code-text");
            printToHackOutput("}", "code-text");
            break;
        default:
            printToHackOutput(`Element "${target}" not found or cannot be inspected.`, "error-text");
    }
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

        // SSRF vulnerability check
        if (url.includes('/api/fetch') && url.includes('url=')) {
            const targetUrl = url.split('url=')[1];
            if (targetUrl.includes('internal-api.local')) {
                printToHackOutput("Response: 200 OK", "success-text");
                if (targetUrl.includes('/admin')) {
                    printToHackOutput("Response body: { \"admin_panel\": true, \"users\": [...], \"sensitive_data\": \"admin_backdoor_key=12345\" }", "code-text");
                    webHackState.flags.ssrfExploited = true;
                    printToHackOutput("SSRF VULNERABILITY DETECTED! You've accessed an internal API endpoint.", "highlight-text");
                } else if (targetUrl.includes('/logs')) {
                    printToHackOutput("Response body: { \"logs\": [\"Admin logged in\", \"Configuration updated\", \"Backup created\"] }", "code-text");
                    webHackState.flags.ssrfExploited = true;
                    printToHackOutput("SSRF VULNERABILITY DETECTED! You've accessed internal logs.", "highlight-text");
                } else {
                    printToHackOutput("Response body: { \"status\": \"success\", \"message\": \"Internal API accessed\" }", "code-text");
                    webHackState.flags.ssrfExploited = true;
                    printToHackOutput("SSRF VULNERABILITY DETECTED! You've accessed an internal API.", "highlight-text");
                }
                return;
            }

            // Regular API fetch
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput(`Fetched content from ${targetUrl}`, "info-text");
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
        } else if (url.includes('process') && data.includes('DOCTYPE')) {
            // XXE vulnerability check
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("XML processed successfully!");
            if (data.includes('SYSTEM') && (data.includes('file:///') || data.includes('../'))) {
                webHackState.flags.xxeInjection = true;
                printToHackOutput("XXE VULNERABILITY DETECTED! You've successfully exploited an XML External Entity injection.", "highlight-text");
                printToHackOutput("The XML parser accessed sensitive file content:", "info-text");
                printToHackOutput("Content of config.ini: DB_USER=app_user, DB_PASS=db_S3cret!, ADMIN_KEY=S3creT_K3y!", "code-text");
            }
        } else if (url.includes('object') && data.includes('serialized')) {
            // Insecure deserialization check
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Object processed successfully!");
            if (data.includes('admin') || data.includes('command')) {
                webHackState.flags.insecureDeserialization = true;
                printToHackOutput("INSECURE DESERIALIZATION DETECTED! You've successfully exploited an insecure deserialization vulnerability.", "highlight-text");
                printToHackOutput("The application executed your injected command.", "info-text");
            }
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
        case 'jwt':
            // JWT token tampering
            if (payload.includes('eyJ') && payload.includes('.')) {
                printToHackOutput(`Attempting to use JWT token: ${payload.substring(0, 20)}...`, "info-text");

                // Check if token has been tampered to escalate privileges
                if (payload.includes('admin') || payload.includes('administrator')) {
                    printToHackOutput("JWT token accepted!", "success-text");
                    printToHackOutput("You now have administrator privileges.", "success-text");
                    webHackState.flags.jwtManipulated = true;
                    printToHackOutput("JWT MANIPULATION DETECTED! You've successfully tampered with a JWT token.", "highlight-text");
                } else {
                    printToHackOutput("JWT token accepted, but no privilege escalation detected.", "info-text");
                    printToHackOutput("Hint: Try modifying the payload to include administrator role.", "info-text");
                }
            } else {
                printToHackOutput("Invalid JWT format.", "error-text");
                printToHackOutput("Hint: JWT tokens typically have three parts separated by dots.", "info-text");
            }
            break;
        case 'xml':
            // XXE Injection
            if (payload.includes('<!DOCTYPE') && payload.includes('SYSTEM')) {
                printToHackOutput("XML payload injected successfully!", "success-text");

                if (payload.includes('file:///') || payload.includes('../')) {
                    printToHackOutput("XXE Injection successful!", "success-text");
                    webHackState.flags.xxeInjection = true;
                    printToHackOutput("XXE INJECTION DETECTED! You've successfully read sensitive files through XML processing.", "highlight-text");
                    printToHackOutput("The XML processor returned:", "info-text");
                    printToHackOutput("DB_USER=app_user, DB_PASS=db_S3cret!, ADMIN_KEY=S3creT_K3y!", "code-text");
                } else {
                    printToHackOutput("XML processed, but no file access detected.", "info-text");
                    printToHackOutput("Hint: Try accessing a file using the file:/// protocol or relative paths.", "info-text");
                }
            } else {
                printToHackOutput("XML payload processed, but no XXE vulnerability triggered.", "info-text");
                printToHackOutput("Hint: Try including a DOCTYPE declaration with an external entity.", "info-text");
            }
            break;
        case 'object':
            // Insecure Deserialization
            if (payload.includes('Object') || payload.includes('serialize')) {
                printToHackOutput("Object payload injected successfully!", "success-text");

                if (payload.includes('exec') || payload.includes('eval') || payload.includes('command')) {
                    printToHackOutput("Insecure deserialization exploit successful!", "success-text");
                    webHackState.flags.insecureDeserialization = true;
                    printToHackOutput("INSECURE DESERIALIZATION DETECTED! You've injected code to be executed during deserialization.", "highlight-text");
                    printToHackOutput("The application executed your payload:", "info-text");
                    printToHackOutput("Command output: system information accessed", "code-text");
                } else {
                    printToHackOutput("Object processed, but no code execution detected.", "info-text");
                    printToHackOutput("Hint: Try including a command to be executed during deserialization.", "info-text");
                }
            } else {
                printToHackOutput("Invalid object format for deserialization.", "error-text");
                printToHackOutput("Hint: Try using a serialized object format.", "info-text");
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
    } else if (url.includes('internal-api.local')) {
        // SSRF attempt through direct URL
        printToHackOutput("Attempting to access internal API directly...", "info-text");
        printToHackOutput("Connection failed: Cannot resolve hostname from external network.", "error-text");
        printToHackOutput("Hint: Internal APIs might be accessible through other means.", "info-text");
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
        if (actualFile === 'config.ini' || actualFile === 'logs.txt' || actualFile === 'backup.sql' || actualFile === 'jwt_secret.key') {
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
                    printToHackOutput("Password found: test", "success-text");
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
        case 'jwt':
            printToHackOutput("JWT token analysis initiated...");
            printToHackOutput("Checking signature algorithm...");
            setTimeout(() => {
                printToHackOutput("JWT uses HMAC SHA256 algorithm", "success-text");
                printToHackOutput("Tokens are signed with a secret key", "success-text");
                printToHackOutput("Attempting to forge with empty signature...", "info-text");
                setTimeout(() => {
                    printToHackOutput("JWT signature check bypassed!", "success-text");
                    webHackState.flags.jwtManipulated = true;
                    printToHackOutput("JWT VULNERABILITY DETECTED! The application doesn't properly validate JWT signatures.", "highlight-text");
                }, 1000);
            }, 2000);
            break;
        default:
            printToHackOutput(`Unsupported hash/algorithm type: ${type}`, "error-text");
    }
}

// New function: Analyze token
function analyzeToken(args) {
    if (args.length < 2) {
        printToHackOutput("Usage: analyze [token/jwt] [value]", "error-text");
        return;
    }

    const type = args[0].toLowerCase();
    const value = args[1];

    switch (type) {
        case 'jwt':
            printToHackOutput("Analyzing JWT token...");
            if (value.includes('.') && value.split('.').length === 3) {
                const [header, payload, signature] = value.split('.');

                // Decode header and payload (base64url)
                let decodedHeader, decodedPayload;
                try {
                    decodedHeader = atob(header.replace(/-/g, '+').replace(/_/g, '/'));
                    decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

                    printToHackOutput("Token successfully decoded:", "success-text");
                    printToHackOutput("Header:", "info-text");
                    printToHackOutput(decodedHeader, "code-text");
                    printToHackOutput("Payload:", "info-text");
                    printToHackOutput(decodedPayload, "code-text");
                    printToHackOutput("Signature (base64url encoded):", "info-text");
                    printToHackOutput(signature, "code-text");

                    // Vulnerability hint
                    if (decodedHeader.includes('none') || decodedHeader.includes('HS256')) {
                        printToHackOutput("Hint: This token might be vulnerable to signature manipulation.", "info-text");
                    }
                } catch (e) {
                    printToHackOutput("Error decoding token: Invalid base64url encoding", "error-text");
                }
            } else {
                printToHackOutput("Invalid JWT format. JWT should have three parts separated by dots.", "error-text");
            }
            break;
        case 'session':
            printToHackOutput("Analyzing session token...");
            if (value.includes('_session_')) {
                const parts = value.split('_session_');
                printToHackOutput("Token structure:", "info-text");
                printToHackOutput(`User ID: ${parts[0]}`, "code-text");
                printToHackOutput(`Random string: ${parts[1]}`, "code-text");
                printToHackOutput("Vulnerability assessment: The token contains predictable user ID.", "info-text");
            } else {
                printToHackOutput("Unknown session token format.", "error-text");
            }
            break;
        default:
            printToHackOutput(`Unsupported token type: ${type}`, "error-text");
    }
}

// New function: Decode data
function decodeData(args) {
    if (args.length < 2) {
        printToHackOutput("Usage: decode [type] [data]", "error-text");
        return;
    }

    const type = args[0].toLowerCase();
    const data = args[1];

    switch (type) {
        case 'base64':
            try {
                const decoded = atob(data);
                printToHackOutput("Decoded base64:", "success-text");
                printToHackOutput(decoded, "code-text");
            } catch (e) {
                printToHackOutput("Error: Invalid base64 encoding", "error-text");
            }
            break;
        case 'hex':
            try {
                let decoded = '';
                for (let i = 0; i < data.length; i += 2) {
                    decoded += String.fromCharCode(parseInt(data.substr(i, 2), 16));
                }
                printToHackOutput("Decoded hex:", "success-text");
                printToHackOutput(decoded, "code-text");
            } catch (e) {
                printToHackOutput("Error: Invalid hex encoding", "error-text");
            }
            break;
        case 'url':
            try {
                const decoded = decodeURIComponent(data);
                printToHackOutput("Decoded URL:", "success-text");
                printToHackOutput(decoded, "code-text");
            } catch (e) {
                printToHackOutput("Error: Invalid URL encoding", "error-text");
            }
            break;
        default:
            printToHackOutput(`Unsupported encoding type: ${type}`, "error-text");
    }
}

// New function: Fetch remote resource (for SSRF)
function fetchResource(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: fetch [url]", "error-text");
        return;
    }

    const url = args[0];
    printToHackOutput(`Fetching resource from ${url}...`);

    // Check for SSRF vulnerability
    if (url.includes('internal-api.local') || url.includes('localhost') || url.includes('127.0.0.1')) {
        if (url.includes('internal-api.local/admin')) {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Content:", "info-text");
            printToHackOutput("{ \"admin_panel\": true, \"users\": [...], \"sensitive_data\": \"admin_backdoor_key=12345\" }", "code-text");
            webHackState.flags.ssrfExploited = true;
            printToHackOutput("SSRF VULNERABILITY DETECTED! You've accessed an internal API endpoint.", "highlight-text");
        } else if (url.includes('internal-api.local/users')) {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Content:", "info-text");
            printToHackOutput("{ \"users\": [{ \"id\": 1, \"username\": \"admin\", \"role\": \"administrator\" }, ...] }", "code-text");
            webHackState.flags.ssrfExploited = true;
            printToHackOutput("SSRF VULNERABILITY DETECTED! You've accessed an internal API endpoint.", "highlight-text");
        } else {
            printToHackOutput("Response: 200 OK", "success-text");
            printToHackOutput("Content:", "info-text");
            printToHackOutput("{ \"status\": \"success\", \"message\": \"Internal resource accessed\" }", "code-text");
            webHackState.flags.ssrfExploited = true;
            printToHackOutput("SSRF VULNERABILITY DETECTED! You've accessed internal resources.", "highlight-text");
        }
    } else {
        printToHackOutput("Response: 200 OK", "success-text");
        printToHackOutput("Resource fetched successfully!", "info-text");
    }
}

// New function: Parse XML (for XXE)
function parseXML(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: parse [xml]", "error-text");
        return;
    }

    const xml = args.join(' ');
    printToHackOutput("Parsing XML...");

    // Check for XXE vulnerability
    if (xml.includes('<!DOCTYPE') && xml.includes('SYSTEM')) {
        if (xml.includes('file:///') || xml.includes('../')) {
            printToHackOutput("XML parsed successfully!", "success-text");
            printToHackOutput("Parsed content:", "info-text");

            if (xml.includes('config.ini') || xml.includes('passwd') || xml.includes('private')) {
                printToHackOutput("DB_USER=app_user, DB_PASS=db_S3cret!, ADMIN_KEY=S3creT_K3y!", "code-text");
                webHackState.flags.xxeInjection = true;
                printToHackOutput("XXE VULNERABILITY DETECTED! You've accessed sensitive files through XML parsing.", "highlight-text");
            } else {
                printToHackOutput("[Content of requested file]", "code-text");
                webHackState.flags.xxeInjection = true;
                printToHackOutput("XXE VULNERABILITY DETECTED! You've accessed files through XML parsing.", "highlight-text");
            }
        } else {
            printToHackOutput("XML parsed successfully!", "success-text");
            printToHackOutput("The document contains external entity references, but no file was accessed.", "info-text");
        }
    } else {
        // Regular XML parsing
        printToHackOutput("XML parsed successfully!", "success-text");
        printToHackOutput("Parsed content:", "info-text");
        printToHackOutput("{ users: [ { username: 'admin', role: 'administrator' }, ... ] }", "code-text");
    }
}

// New function: Serialize object (for insecure deserialization)
function serializeObject(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: serialize [object]", "error-text");
        return;
    }

    const objStr = args.join(' ');
    printToHackOutput(`Serializing object: ${objStr}...`);

    try {
        // Simple serialization simulation
        const serialized = "O:4:\"User\":2:{s:8:\"username\";s:" + objStr.length + ":\"" + objStr + "\";s:4:\"role\";s:4:\"user\";}";
        printToHackOutput("Serialized object:", "success-text");
        printToHackOutput(serialized, "code-text");
        printToHackOutput("Hint: Serialized objects might be processed insecurely during deserialization.", "info-text");
    } catch (e) {
        printToHackOutput("Error serializing object", "error-text");
    }
}

// New function: Deserialize object (for insecure deserialization)
function deserializeObject(args) {
    if (args.length === 0) {
        printToHackOutput("Usage: deserialize [data]", "error-text");
        return;
    }

    const data = args.join(' ');
    printToHackOutput(`Deserializing data: ${data.substring(0, 20)}...`);

    // Check for code execution in serialized data
    if (data.includes('exec') || data.includes('system') || data.includes('eval')) {
        printToHackOutput("Deserialization successful!", "success-text");
        printToHackOutput("Warning: Potential code execution detected in serialized data!", "error-text");
        webHackState.flags.insecureDeserialization = true;
        printToHackOutput("INSECURE DESERIALIZATION DETECTED! Code execution attempted during deserialization.", "highlight-text");
        printToHackOutput("Executed command output:", "info-text");
        printToHackOutput("System information: Linux webapp-server 5.10.0 #1 SMP", "code-text");
    } else if (data.includes('User') && data.includes('role')) {
        printToHackOutput("Deserialization successful!", "success-text");

        if (data.includes('admin') || data.includes('administrator')) {
            printToHackOutput("Object properties have been altered!", "success-text");
            printToHackOutput("Your role has been changed to: administrator", "code-text");
            webHackState.flags.insecureDeserialization = true;
            printToHackOutput("INSECURE DESERIALIZATION DETECTED! You've manipulated object properties during deserialization.", "highlight-text");
        } else {
            printToHackOutput("Deserialized object:", "info-text");
            printToHackOutput("{ username: 'user', role: 'user' }", "code-text");
        }
    } else {
        printToHackOutput("Deserialization successful!", "success-text");
        printToHackOutput("Deserialized object:", "info-text");
        printToHackOutput("{ data: 'regular data' }", "code-text");
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
            maxLevel: 10,
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
                    'private/backup.sql': 'INSERT INTO users VALUES (1, "admin", "S3cur3P@ssw0rd!", "administrator")',
                    'private/jwt_secret.key': 'super_secret_jwt_key_2023'
                },
                apis: {
                    'internal': {
                        'users': 'http://internal-api.local/users',
                        'admin': 'http://internal-api.local/admin',
                        'logs': 'http://internal-api.local/logs'
                    }
                },
                jwt: {
                    validTokens: {
                        'user': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwibmFtZSI6ImpvaG4iLCJyb2xlIjoidXNlciJ9.7Qs6zUfpGQIS817Xhw2eJ_rOYVvHHLFTWfB-2q4sxEM',
                        'admin': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluaXN0cmF0b3IifQ.zsCPXw9XQNLRI-T_xA6hS4es-JbVaXPpqLrRlG2Uuzs'
                    }
                },
                xml: {
                    users: `<?xml version="1.0" encoding="UTF-8"?>
<users>
    <user id="1">
        <username>admin</username>
        <role>administrator</role>
    </user>
    <user id="2">
        <username>john</username>
        <role>user</role>
    </user>
    <user id="3">
        <username>sarah</username>
        <role>user</role>
    </user>
</users>`
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
                passwordCracked: false,
                ssrfExploited: false,
                jwtManipulated: false,
                xxeInjection: false,
                insecureDeserialization: false
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

// CSS Styling for the Challenge Interface
const challengeStyles = `
.hack-container {
    font-family: 'Courier New', monospace;
    background-color: #0f0f0f;
    color: #33ff33;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.2);
    max-width: 1000px;
    margin: 0 auto;
}

.hack-header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #33ff33;
    padding-bottom: 10px;
}

.hack-title {
    font-size: 24px;
    margin: 0;
    color: #33ff33;
}

.hack-subtitle {
    font-size: 14px;
    margin: 5px 0 0;
    color: #cccccc;
}

.hack-progress {
    background-color: #333;
    height: 10px;
    border-radius: 5px;
    margin: 10px 0;
    overflow: hidden;
}

#hack-progress-bar {
    height: 100%;
    background-color: #33ff33;
    width: 0%;
    transition: width 0.5s ease;
}

.hack-challenge-info {
    margin-bottom: 10px;
    font-size: 14px;
}

.hack-challenge-label {
    color: #cccccc;
}

#current-challenge {
    color: #33ff33;
    font-weight: bold;
}

.hack-output-container {
    background-color: #1a1a1a;
    border: 1px solid #444;
    border-radius: 3px;
    height: 400px;
    overflow-y: auto;
    padding: 10px;
    margin-bottom: 10px;
    font-size: 14px;
    line-height: 1.4;
}

.hack-input-container {
    display: flex;
    margin-bottom: 10px;
}

#hack-prompt {
    color: #33ff33;
    margin-right: 5px;
    font-weight: bold;
}

#hack-input {
    flex-grow: 1;
    background-color: #1a1a1a;
    border: 1px solid #444;
    border-radius: 3px;
    color: #33ff33;
    padding: 5px 10px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
}

#hack-input:focus {
    outline: none;
    border-color: #33ff33;
}

.hack-buttons {
    display: flex;
    justify-content: space-between;
}

.hack-button {
    background-color: #1a1a1a;
    color: #33ff33;
    border: 1px solid #33ff33;
    border-radius: 3px;
    padding: 5px 10px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    transition: all 0.3s ease;
}

.hack-button:hover {
    background-color: #33ff33;
    color: #1a1a1a;
}

.hack-output-line {
    margin-bottom: 5px;
    word-wrap: break-word;
}

.hack-input-line {
    color: #33ff33;
    margin-bottom: 5px;
}

.error-text {
    color: #ff3333;
}

.success-text {
    color: #33ff99;
}

.info-text {
    color: #3399ff;
}

.highlight-text {
    color: #ffff33;
    font-weight: bold;
}

.code-text {
    color: #cccccc;
    background-color: #333;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.ascii-art {
    font-family: monospace;
    white-space: pre;
    color: #33ff33;
    font-size: 12px;
    line-height: 1.2;
    margin-bottom: 10px;
}

/* Add some animations */
@keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.hack-title {
    animation: blink 2s infinite;
}

@keyframes flicker {
    0% { text-shadow: 0 0 5px rgba(51, 255, 51, 0.7); }
    50% { text-shadow: 0 0 10px rgba(51, 255, 51, 0.9); }
    100% { text-shadow: 0 0 5px rgba(51, 255, 51, 0.7); }
}

.highlight-text {
    animation: flicker 1.5s infinite;
}
`;

// Add styles to the document
function addStylesForChallenge() {
    const style = document.createElement('style');
    style.textContent = challengeStyles;
    document.head.appendChild(style);
}

// HTML structure for the challenge interface
function createChallengeInterface() {
    const container = document.createElement('div');
    container.className = 'hack-container';
    container.innerHTML = `
        <div class="hack-header">
            <h1 class="hack-title">Web Vulnerability Hacking Challenge</h1>
            <p class="hack-subtitle">Discover and exploit web vulnerabilities in a safe environment</p>
            <div class="hack-progress">
                <div id="hack-progress-bar"></div>
            </div>
            <div class="hack-challenge-info">
                <span class="hack-challenge-label">Current Challenge: </span>
                <span id="current-challenge">Loading...</span>
            </div>
        </div>
        <div id="hack-output" class="hack-output-container"></div>
        <div class="hack-input-container">
            <span id="hack-prompt">hacker@webchallenge:~$</span>
            <input type="text" id="hack-input" placeholder="Enter command..." autocomplete="off">
        </div>
        <div class="hack-buttons">
            <button id="hack-help-button" class="hack-button">Help</button>
            <button id="hack-hint-button" class="hack-button">Hint</button>
            <button id="hack-reset-button" class="hack-button">Reset</button>
        </div>
    `;
    document.body.appendChild(container);
}

// Initialize everything when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    addStylesForChallenge();
    createChallengeInterface();
    initWebHackChallenge();
});