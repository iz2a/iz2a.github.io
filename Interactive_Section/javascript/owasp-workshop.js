/**
 * OWASP Workshop Interactive Visualizations
 * This file contains code for creating interactive security visualizations
 * used in the OWASP Top 10 Workshop
 */

/**
 * Initialize Security Visualizations
 */
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize visualizations when needed
    if (document.querySelector('.workshop-section.active')) {
        const activeSection = document.querySelector('.workshop-section.active').id;
        initializeVisualizationForSection(activeSection);
    }

    // Listen for section changes
    document.addEventListener('sectionChanged', function(e) {
        if (e.detail && e.detail.sectionId) {
            initializeVisualizationForSection(e.detail.sectionId);
        }
    });
});

/**
 * Initialize visualizations based on active section
 */
function initializeVisualizationForSection(sectionId) {
    switch(sectionId) {
        case 'broken-access-section':
            initializeAccessControlViz();
            break;
        case 'crypto-failures-section':
            initializeCryptoViz();
            break;
        case 'injection-section':
            initializeSQLInjectionViz();
            break;
        case 'insecure-design-section':
            initializeInsecureDesignViz();
            break;
        case 'auth-failures-section':
            initializeAuthFailuresViz();
            break;
        case 'ssrf-section':
            initializeSSRFViz();
            break;
    }
}

/**
 * A01: Broken Access Control Visualization
 * Interactive visualization showing privilege escalation paths
 */
function initializeAccessControlViz() {
    const container = document.getElementById('access-control-viz');
    if (!container) return;

    // Clear previous visualization
    container.innerHTML = '';

    // Create canvas for visualization
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 400;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the network diagram
    drawAccessControlNetwork(ctx, canvas.width, canvas.height);

    // Add interaction
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if user clicked on a node and show information
        handleAccessControlNodeClick(ctx, x, y, canvas.width, canvas.height);
    });
}

/**
 * Draw network diagram for access control visualization
 */
function drawAccessControlNetwork(ctx, width, height) {
    // Define nodes: user roles and resources
    const nodes = [
        { id: 'anon', label: 'Anonymous', type: 'role', x: width * 0.2, y: height * 0.2, color: '#6c757d' },
        { id: 'user', label: 'Regular User', type: 'role', x: width * 0.5, y: height * 0.2, color: '#17a2b8' },
        { id: 'admin', label: 'Admin', type: 'role', x: width * 0.8, y: height * 0.2, color: '#dc3545' },

        { id: 'public', label: 'Public Page', type: 'resource', x: width * 0.2, y: height * 0.6, color: '#28a745' },
        { id: 'profile', label: 'User Profile', type: 'resource', x: width * 0.4, y: height * 0.6, color: '#28a745' },
        { id: 'settings', label: 'User Settings', type: 'resource', x: width * 0.6, y: height * 0.6, color: '#ffc107' },
        { id: 'admin-panel', label: 'Admin Panel', type: 'resource', x: width * 0.8, y: height * 0.6, color: '#dc3545' }
    ];

    // Define edges: intended access paths
    const edges = [
        { from: 'anon', to: 'public', type: 'allowed' },
        { from: 'user', to: 'public', type: 'allowed' },
        { from: 'user', to: 'profile', type: 'allowed' },
        { from: 'user', to: 'settings', type: 'allowed' },
        { from: 'admin', to: 'public', type: 'allowed' },
        { from: 'admin', to: 'profile', type: 'allowed' },
        { from: 'admin', to: 'settings', type: 'allowed' },
        { from: 'admin', to: 'admin-panel', type: 'allowed' }
    ];

    // Define vulnerability edges: unintended access paths
    const vulnEdges = [
        { from: 'anon', to: 'profile', type: 'vulnerability', label: 'Missing Auth Check' },
        { from: 'user', to: 'admin-panel', type: 'vulnerability', label: 'Direct URL Access' },
        { from: 'user', to: 'profile', to2: 'other-user', type: 'vulnerability', label: 'IDOR' }
    ];

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);

        if (fromNode && toNode) {
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw arrow
            drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, 10);
        }
    });

    // Draw vulnerability edges
    vulnEdges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);

        if (fromNode && toNode) {
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(fromNode.x, fromNode.y);

            // Draw curved path for vulnerability
            const controlX = (fromNode.x + toNode.x) / 2;
            const controlY = (fromNode.y + toNode.y) / 2 - 50;

            ctx.quadraticCurveTo(controlX, controlY, toNode.x, toNode.y);
            ctx.strokeStyle = '#dc3545';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw label
            ctx.fillStyle = '#dc3545';
            ctx.font = '12px Arial';
            ctx.fillText(edge.label, controlX - ctx.measureText(edge.label).width / 2, controlY - 10);

            // Draw arrow
            drawArrow(ctx, controlX, controlY, toNode.x, toNode.y, 10, '#dc3545');
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        // Draw circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(node.label).width;
        ctx.fillText(node.label, node.x - textWidth / 2, node.y + 5);
    });

    // Draw legend
    drawLegend(ctx, width, height);
}

/**
 * Draw arrow for directed edges
 */
function drawArrow(ctx, fromX, fromY, toX, toY, arrowSize, color = '#007bff') {
    // Calculate angle
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Calculate arrow position (slightly before endpoint)
    const arrowLength = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const arrowX = fromX + (arrowLength - 40) * Math.cos(angle);
    const arrowY = fromY + (arrowLength - 40) * Math.sin(angle);

    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowSize * Math.cos(angle - Math.PI/6), arrowY - arrowSize * Math.sin(angle - Math.PI/6));
    ctx.lineTo(arrowX - arrowSize * Math.cos(angle + Math.PI/6), arrowY - arrowSize * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

/**
 * Draw legend for visualization
 */
function drawLegend(ctx, width, height) {
    const legendX = width - 200;
    const legendY = height - 100;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(legendX, legendY, 180, 80);
    ctx.strokeStyle = '#dee2e6';
    ctx.strokeRect(legendX, legendY, 180, 80);

    // Title
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Legend', legendX + 10, legendY + 20);

    // Items
    ctx.font = '12px Arial';

    // Allowed access
    ctx.beginPath();
    ctx.moveTo(legendX + 20, legendY + 40);
    ctx.lineTo(legendX + 50, legendY + 40);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#212529';
    ctx.fillText('Allowed Access', legendX + 60, legendY + 44);

    // Vulnerability
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(legendX + 20, legendY + 60);
    ctx.lineTo(legendX + 50, legendY + 60);
    ctx.strokeStyle = '#dc3545';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#212529';
    ctx.fillText('Vulnerability', legendX + 60, legendY + 64);
}

/**
 * Handle node click in access control visualization
 */
function handleAccessControlNodeClick(ctx, x, y, width, height) {
    // Define nodes (same as in drawAccessControlNetwork)
    const nodes = [
        { id: 'anon', label: 'Anonymous', type: 'role', x: width * 0.2, y: height * 0.2, color: '#6c757d' },
        { id: 'user', label: 'Regular User', type: 'role', x: width * 0.5, y: height * 0.2, color: '#17a2b8' },
        { id: 'admin', label: 'Admin', type: 'role', x: width * 0.8, y: height * 0.2, color: '#dc3545' },

        { id: 'public', label: 'Public Page', type: 'resource', x: width * 0.2, y: height * 0.6, color: '#28a745' },
        { id: 'profile', label: 'User Profile', type: 'resource', x: width * 0.4, y: height * 0.6, color: '#28a745' },
        { id: 'settings', label: 'User Settings', type: 'resource', x: width * 0.6, y: height * 0.6, color: '#ffc107' },
        { id: 'admin-panel', label: 'Admin Panel', type: 'resource', x: width * 0.8, y: height * 0.6, color: '#dc3545' }
    ];

    // Check if user clicked on a node
    for (const node of nodes) {
        const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));

        if (distance <= 30) {
            // Show node details in tooltip
            showNodeDetails(node);
            return;
        }
    }
}

/**
 * Show node details in a tooltip
 */
function showNodeDetails(node) {
    // Remove any existing tooltips
    const existingTooltip = document.getElementById('viz-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'viz-tooltip';
    tooltip.className = 'viz-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${node.x + 40}px`;
    tooltip.style.top = `${node.y}px`;
    tooltip.style.backgroundColor = '#fff';
    tooltip.style.border = '1px solid #dee2e6';
    tooltip.style.borderRadius = '4px';
    tooltip.style.padding = '10px';
    tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    tooltip.style.zIndex = '1000';

    // Tooltip content
    let content = `<h4>${node.label}</h4>`;

    if (node.type === 'role') {
        content += `<p>User Role</p>`;
        content += `<p>Access level: ${node.id === 'admin' ? 'High' : node.id === 'user' ? 'Medium' : 'Low'}</p>`;

        if (node.id === 'anon') {
            content += `<p>Vulnerability: Can access user profiles due to missing authentication check</p>`;
        } else if (node.id === 'user') {
            content += `<p>Vulnerabilities:</p>`;
            content += `<ul>`;
            content += `<li>Can access admin panel through direct URL</li>`;
            content += `<li>Can access other users' profiles through IDOR</li>`;
            content += `</ul>`;
        }
    } else if (node.type === 'resource') {
        content += `<p>Application Resource</p>`;
        content += `<p>Access required: ${node.id === 'admin-panel' ? 'Admin' : node.id === 'settings' || node.id === 'profile' ? 'Authenticated User' : 'None'}</p>`;

        if (node.id === 'admin-panel') {
            content += `<p>Vulnerability: Accessible to regular users through direct URL access</p>`;
        } else if (node.id === 'profile') {
            content += `<p>Vulnerabilities:</p>`;
            content += `<ul>`;
            content += `<li>Accessible to unauthenticated users due to missing auth check</li>`;
            content += `<li>IDOR allows viewing other users' profiles</li>`;
            content += `</ul>`;
        }
    }

    tooltip.innerHTML = content;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.addEventListener('click', () => tooltip.remove());

    tooltip.appendChild(closeButton);

    // Add to document
    document.body.appendChild(tooltip);
}

/**
 * A02: Cryptographic Failures Visualization
 * Interactive visualization of encryption methods
 */
function initializeCryptoViz() {
    const container = document.getElementById('crypto-viz');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create visualization components
    const controls = document.createElement('div');
    controls.className = 'crypto-controls';
    controls.innerHTML = `
        <div class="form-group">
            <label for="message-input">Enter a message:</label>
            <input type="text" id="message-input" class="form-control" value="Secret message">
        </div>
        <div class="form-group">
            <label for="encryption-method">Encryption method:</label>
            <select id="encryption-method" class="form-control">
                <option value="none">No Encryption (Plaintext)</option>
                <option value="base64">Base64 Encoding (Not Encryption)</option>
                <option value="caesar">Caesar Cipher (Weak)</option>
                <option value="xor">XOR with Simple Key (Weak)</option>
                <option value="aes">AES-256 (Strong)</option>
            </select>
        </div>
        <button id="encrypt-button" class="btn btn-primary">Encrypt</button>
    `;

    const visualization = document.createElement('div');
    visualization.className = 'crypto-visualization';
    visualization.innerHTML = `
        <div class="crypto-stages">
            <div class="crypto-stage">
                <h4>Original Message</h4>
                <div class="message-box" id="original-message">Secret message</div>
            </div>
            <div class="crypto-stage">
                <h4>Encryption Process</h4>
                <div class="process-box" id="encryption-process">
                    <div class="process-icon"><i class="fas fa-lock"></i></div>
                    <div class="process-arrow"><i class="fas fa-arrow-right"></i></div>
                </div>
            </div>
            <div class="crypto-stage">
                <h4>Encrypted Result</h4>
                <div class="message-box" id="encrypted-message"></div>
            </div>
        </div>
        
        <div class="crypto-details" id="crypto-details">
            <h4>How it works</h4>
            <p>Select an encryption method and click "Encrypt" to see how it works.</p>
        </div>
        
        <div class="crypto-warning" id="crypto-warning" style="display: none;">
            <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="warning-message"></div>
        </div>
    `;

    // Add components to container
    container.appendChild(controls);
    container.appendChild(visualization);

    // Add event listeners
    const encryptButton = document.getElementById('encrypt-button');
    if (encryptButton) {
        encryptButton.addEventListener('click', performEncryption);
    }
}

/**
 * Perform encryption based on selected method
 */
function performEncryption() {
    const messageInput = document.getElementById('message-input');
    const encryptionMethod = document.getElementById('encryption-method');
    const originalMessageEl = document.getElementById('original-message');
    const encryptedMessageEl = document.getElementById('encrypted-message');
    const cryptoDetailsEl = document.getElementById('crypto-details');
    const cryptoWarningEl = document.getElementById('crypto-warning');

    if (!messageInput || !encryptionMethod || !originalMessageEl ||
        !encryptedMessageEl || !cryptoDetailsEl || !cryptoWarningEl) {
        return;
    }

    const message = messageInput.value || 'Secret message';
    const method = encryptionMethod.value;

    // Update original message display
    originalMessageEl.textContent = message;

    // Encrypt message based on selected method
    let encryptedMessage = '';
    let details = '';
    let warning = '';

    switch (method) {
        case 'none':
            encryptedMessage = message;
            details = `
                <h4>No Encryption (Plaintext)</h4>
                <p>The message is transmitted as-is, with no encryption or encoding.</p>
                <p>This is extremely insecure and should never be used for sensitive information.</p>
            `;
            warning = `
                <h4>Critical Security Issue</h4>
                <p>Transmitting sensitive data as plaintext is a serious cryptographic failure. 
                Anyone who can intercept the transmission can read the data.</p>
                <p>Always encrypt sensitive data both in transit and at rest.</p>
            `;
            break;

        case 'base64':
            encryptedMessage = btoa(message);
            details = `
                <h4>Base64 Encoding (Not Encryption)</h4>
                <p>Base64 is an encoding scheme, not encryption. It converts binary data to ASCII text format.</p>
                <p>The algorithm works by encoding every 3 bytes of data into 4 ASCII characters from a set of 64 characters.</p>
            `;
            warning = `
                <h4>Security Issue</h4>
                <p>Base64 is not encryption - it's just encoding. It provides no security as it can be 
                easily decoded by anyone.</p>
                <p>Many developers mistakenly use Base64 thinking it provides security, when it doesn't.</p>
            `;
            break;

        case 'caesar':
            encryptedMessage = caesarCipher(message, 3);
            details = `
                <h4>Caesar Cipher (Shift Cipher)</h4>
                <p>The Caesar cipher is a simple substitution cipher where each letter is shifted by a fixed number of positions.</p>
                <p>In this example, each letter is shifted 3 positions forward in the alphabet.</p>
            `;
            warning = `
                <h4>Security Issue</h4>
                <p>The Caesar cipher is extremely weak and can be broken very easily using frequency analysis 
                or by simply trying all 25 possible shifts.</p>
                <p>Never use this for any real security needs.</p>
            `;
            break;

        case 'xor':
            encryptedMessage = xorEncrypt(message, 'key');
            details = `
                <h4>XOR Encryption with Simple Key</h4>
                <p>XOR encryption works by applying the XOR operation between each character of the message 
                and a corresponding character from the key.</p>
                <p>If the key is too short, it's repeated to match the message length.</p>
            `;
            warning = `
                <h4>Security Issue</h4>
                <p>Simple XOR encryption with a short, repeating key is vulnerable to cryptanalysis.</p>
                <p>If the key is known or can be guessed, the encryption is trivially broken.</p>
            `;
            break;

        case 'aes':
            encryptedMessage = "[AES-256 encrypted data would appear here]";
            details = `
                <h4>AES-256 Encryption (Strong)</h4>
                <p>AES (Advanced Encryption Standard) is a symmetric encryption algorithm used worldwide.</p>
                <p>AES-256 uses a 256-bit key size and is considered very secure when implemented correctly.</p>
                <p>Proper implementation requires:</p>
                <ul>
                    <li>Secure key generation and management</li>
                    <li>Appropriate mode of operation (e.g., GCM, not ECB)</li>
                    <li>Proper initialization vectors (IVs)</li>
                    <li>Authentication to prevent tampering</li>
                </ul>
            `;
            warning = `
                <h4>Implementation Caution</h4>
                <p>While AES-256 is secure, incorrect implementation can introduce vulnerabilities:</p>
                <ul>
                    <li>Using ECB mode reveals patterns in data</li>
                    <li>Reusing IVs compromises security</li>
                    <li>Lack of authentication allows message tampering</li>
                    <li>Poor key management can lead to key compromise</li>
                </ul>
            `;
            break;
    }

    // Update UI with results
    encryptedMessageEl.textContent = encryptedMessage;
    cryptoDetailsEl.innerHTML = details;

    // Show warning if applicable
    if (warning) {
        cryptoWarningEl.style.display = 'flex';
        cryptoWarningEl.querySelector('.warning-message').innerHTML = warning;
    } else {
        cryptoWarningEl.style.display = 'none';
    }

    // Animate encryption process
    animateEncryption();
}

/**
 * Animate the encryption process
 */
function animateEncryption() {
    const processBox = document.getElementById('encryption-process');
    if (!processBox) return;

    processBox.classList.add('processing');

    setTimeout(() => {
        processBox.classList.remove('processing');
    }, 1000);
}

/**
 * Caesar cipher implementation
 */
function caesarCipher(text, shift) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const isUpperCase = code >= 65 && code <= 90;
            const base = isUpperCase ? 65 : 97;
            return String.fromCharCode(((code - base + shift) % 26) + base);
        }
        return char;
    }).join('');
}

/**
 * Simple XOR encryption
 */
function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(result); // Convert to base64 for display
}

/**
 * A03: SQL Injection Visualization
 * Interactive visualization showing SQL injection attacks
 */
function initializeSQLInjectionViz() {
    const container = document.getElementById('sql-injection-viz');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create user interface
    container.innerHTML = `
        <div class="injection-demo">
            <h3>SQL Injection Demo</h3>
            <div class="demo-app">
                <div class="app-header">
                    <span>Demo Login Application</span>
                </div>
                <div class="app-body">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" class="form-control" placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" class="form-control" placeholder="Enter password">
                    </div>
                    <button id="login-button" class="btn btn-primary">Login</button>
                    
                    <div class="attack-buttons">
                        <button id="inject-button" class="btn btn-danger">Try SQL Injection Attack</button>
                    </div>
                </div>
            </div>
            
            <div class="server-code">
                <h4>Server-side Code (Vulnerable)</h4>
                <pre class="code-block code-vulnerable">
// Vulnerable code
function loginUser(username, password) {
    const query = "SELECT * FROM users WHERE username = '" + username + 
                  "' AND password = '" + password + "'";
    
    // Execute the query and return user if found
    return database.execute(query);
}
                </pre>
                
                <h4>Generated SQL Query</h4>
                <pre id="sql-query" class="sql-query">SELECT * FROM users WHERE username = 'username' AND password = 'password'</pre>
                
                <h4>Query Result</h4>
                <div id="query-result" class="query-result">No query executed yet</div>
            </div>
            
            <div class="secure-code">
                <h4>Secure Alternative (Using Parametrized Queries)</h4>
                <pre class="code-block code-secure">
// Secure code
function loginUser(username, password) {
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    
    // Parameters are safely handled by the database driver
    return database.execute(query, [username, password]);
}
                </pre>
            </div>
        </div>
    `;

    // Add event listeners
    const loginButton = document.getElementById('login-button');
    const injectButton = document.getElementById('inject-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (loginButton && injectButton && usernameInput && passwordInput) {
        loginButton.addEventListener('click', function() {
            const username = usernameInput.value;
            const password = passwordInput.value;
            simulateLogin(username, password);
        });

        injectButton.addEventListener('click', function() {
            usernameInput.value = "admin' --";
            passwordInput.value = "doesnt_matter";
            simulateLogin(usernameInput.value, passwordInput.value);
        });
    }
}

/**
 * Simulate login with SQL query
 */
function simulateLogin(username, password) {
    const sqlQueryEl = document.getElementById('sql-query');
    const queryResultEl = document.getElementById('query-result');

    if (!sqlQueryEl || !queryResultEl) return;

    // Generate SQL query
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    sqlQueryEl.textContent = query;

    // Simulate query execution
    if (username.toLowerCase().includes("' --") ||
        username.toLowerCase().includes("' OR '1'='1") ||
        password.toLowerCase().includes("' OR '1'='1")) {

        // SQL injection successful
        queryResultEl.innerHTML = `
            <div class="alert alert-danger">
                <strong>SQL Injection Successful!</strong>
                <p>The attack bypassed the login authentication.</p>
            </div>
            <div class="result-table">
                <table>
                    <thead>
                        <tr>
                            <th>id</th>
                            <th>username</th>
                            <th>password</th>
                            <th>role</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>admin</td>
                            <td>s3cr3t_@dm1n_p@ss!</td>
                            <td>administrator</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>john</td>
                            <td>john123</td>
                            <td>user</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>sarah</td>
                            <td>sarah456</td>
                            <td>user</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    } else if (username === 'admin' && password === 's3cr3t_@dm1n_p@ss!') {
        // Correct credentials
        queryResultEl.innerHTML = `
            <div class="alert alert-success">
                <strong>Login Successful!</strong>
                <p>Authenticated as admin user.</p>
            </div>
            <div class="result-table">
                <table>
                    <thead>
                        <tr>
                            <th>id</th>
                            <th>username</th>
                            <th>password</th>
                            <th>role</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>admin</td>
                            <td>s3cr3t_@dm1n_p@ss!</td>
                            <td>administrator</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    } else {
        // Invalid login
        queryResultEl.innerHTML = `
            <div class="alert alert-warning">
                <strong>Login Failed!</strong>
                <p>Invalid username or password.</p>
            </div>
            <div class="result-empty">
                No results returned
            </div>
        `;
    }
}

/**
 * A04: Insecure Design Visualization
 */
function initializeInsecureDesignViz() {
    const container = document.getElementById('insecure-design-viz');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create visualization
    container.innerHTML = `
        <div class="design-comparison">
            <div class="design-column insecure">
                <h3>Insecure Design</h3>
                <div class="design-diagram">
                    <div class="diagram-header">Password Reset Flow</div>
                    <div class="diagram-body" id="insecure-diagram">
                        <!-- Diagram will be drawn here with JavaScript -->
                    </div>
                </div>
                <div class="design-issues">
                    <h4>Security Issues</h4>
                    <ul>
                        <li>No rate limiting on password reset requests</li>
                        <li>Sequential, easily guessable reset tokens</li>
                        <li>Reset tokens don't expire</li>
                        <li>User enumeration via different responses</li>
                        <li>No notification to user about password change</li>
                    </ul>
                </div>
            </div>
            
            <div class="design-column secure">
                <h3>Secure Design</h3>
                <div class="design-diagram">
                    <div class="diagram-header">Password Reset Flow</div>
                    <div class="diagram-body" id="secure-diagram">
                        <!-- Diagram will be drawn here with JavaScript -->
                    </div>
                </div>
                <div class="design-principles">
                    <h4>Security Principles Applied</h4>
                    <ul>
                        <li>Rate limiting to prevent brute force attacks</li>
                        <li>Cryptographically secure random tokens</li>
                        <li>Short token expiration time (15 minutes)</li>
                        <li>Consistent responses to prevent user enumeration</li>
                        <li>Email notification for successful password changes</li>
                        <li>Multi-factor authentication for sensitive operations</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="design-simulation">
            <h3>Interactive Demonstration</h3>
            <div class="simulation-controls">
                <button id="simulate-insecure" class="btn btn-danger">Simulate Insecure Design Attack</button>
                <button id="simulate-secure" class="btn btn-success">Test Secure Design</button>
            </div>
            <div class="simulation-output" id="simulation-output">
                Click a simulation button to start
            </div>
        </div>
    `;

    // Draw insecure and secure design diagrams
    drawInsecureDesignDiagram();
    drawSecureDesignDiagram();

    // Add event listeners for simulation buttons
    const insecureBtn = document.getElementById('simulate-insecure');
    const secureBtn = document.getElementById('simulate-secure');

    if (insecureBtn && secureBtn) {
        insecureBtn.addEventListener('click', simulateInsecureDesignAttack);
        secureBtn.addEventListener('click', simulateSecureDesign);
    }
}

/**
 * Draw insecure design flow diagram
 */
function drawInsecureDesignDiagram() {
    const diagramEl = document.getElementById('insecure-diagram');
    if (!diagramEl) return;

    diagramEl.innerHTML = `
        <div class="design-step">
            <div class="step-icon"><i class="fas fa-user"></i></div>
            <div class="step-description">User requests password reset</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step vulnerable">
            <div class="step-icon"><i class="fas fa-server"></i></div>
            <div class="step-description">Server generates sequential token</div>
            <div class="vulnerability-tag">Vulnerable</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step">
            <div class="step-icon"><i class="fas fa-envelope"></i></div>
            <div class="step-description">Email with reset link sent to user</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step vulnerable">
            <div class="step-icon"><i class="fas fa-link"></i></div>
            <div class="step-description">Reset link has no expiration</div>
            <div class="vulnerability-tag">Vulnerable</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step">
            <div class="step-icon"><i class="fas fa-key"></i></div>
            <div class="step-description">User sets new password</div>
        </div>
    `;
}

/**
 * Draw secure design flow diagram
 */
function drawSecureDesignDiagram() {
    const diagramEl = document.getElementById('secure-diagram');
    if (!diagramEl) return;

    diagramEl.innerHTML = `
        <div class="design-step">
            <div class="step-icon"><i class="fas fa-user"></i></div>
            <div class="step-description">User requests password reset</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step secure">
            <div class="step-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="step-description">Rate limiting applied</div>
            <div class="security-tag">Secure</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step secure">
            <div class="step-icon"><i class="fas fa-random"></i></div>
            <div class="step-description">Cryptographically secure random token generated</div>
            <div class="security-tag">Secure</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step">
            <div class="step-icon"><i class="fas fa-envelope"></i></div>
            <div class="step-description">Email with reset link sent to user</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step secure">
            <div class="step-icon"><i class="fas fa-hourglass-half"></i></div>
            <div class="step-description">Token expires after 15 minutes</div>
            <div class="security-tag">Secure</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step">
            <div class="step-icon"><i class="fas fa-key"></i></div>
            <div class="step-description">User sets new password</div>
        </div>
        <div class="design-arrow"><i class="fas fa-arrow-down"></i></div>
        <div class="design-step secure">
            <div class="step-icon"><i class="fas fa-bell"></i></div>
            <div class="step-description">Notification email sent confirming password change</div>
            <div class="security-tag">Secure</div>
        </div>
    `;
}

/**
 * Simulate attack on insecure design
 */
function simulateInsecureDesignAttack() {
    const outputEl = document.getElementById('simulation-output');
    if (!outputEl) return;

    outputEl.innerHTML = '<div class="simulation-title">Attacking Insecure Password Reset</div>';

    // Simulate attack steps with timing
    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker discovers the password reset functionality');
    }, 500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker requests password reset for a known username');
    }, 1000);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Server generates a sequential token (e.g., user ID + timestamp)');
    }, 1500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker analyzes token pattern from their own account');
    }, 2000);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker predicts token pattern for target user');
        appendSimulationStep(outputEl, '<span class="text-danger">Vulnerability: Predictable tokens allow attacker to generate valid reset links</span>');
    }, 2500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker accesses password reset page with predicted token');
    }, 3000);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker sets a new password for the target account');
        appendSimulationStep(outputEl, '<span class="text-danger">Vulnerability: No notification to user about password change</span>');
    }, 3500);

    setTimeout(() => {
        appendSimulationStep(outputEl, '<strong>Attack Result: Success! Attacker has taken over the target account.</strong>');
    }, 4000);
}

/**
 * Simulate secure design process
 */
function simulateSecureDesign() {
    const outputEl = document.getElementById('simulation-output');
    if (!outputEl) return;

    outputEl.innerHTML = '<div class="simulation-title">Testing Secure Password Reset</div>';

    // Simulate secure process with timing
    setTimeout(() => {
        appendSimulationStep(outputEl, 'Attacker attempts to request multiple password resets');
        appendSimulationStep(outputEl, '<span class="text-success">Security: Rate limiting blocks excessive requests from same IP</span>');
    }, 500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Legitimate user requests password reset');
    }, 1000);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Server generates cryptographically secure random token');
        appendSimulationStep(outputEl, '<span class="text-success">Security: Token is 128-bit random value, impossible to predict</span>');
    }, 1500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Token is stored hashed in database with 15-minute expiration');
    }, 2000);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'Reset email sent to user');
    }, 2500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'User clicks reset link within 15 minutes');
    }, 3000);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'User sets new password with strength requirements');
    }, 3500);

    setTimeout(() => {
        appendSimulationStep(outputEl, 'System sends confirmation email about password change');
        appendSimulationStep(outputEl, '<span class="text-success">Security: User is notified immediately of password change</span>');
    }, 4000);

    setTimeout(() => {
        appendSimulationStep(outputEl, '<strong>Result: Secure password reset process completed successfully. Attack attempts blocked.</strong>');
    }, 4500);
}

/**
 * Append a step to the simulation output
 */
function appendSimulationStep(container, text) {
    const stepEl = document.createElement('div');
    stepEl.className = 'simulation-step';
    stepEl.innerHTML = text;
    container.appendChild(stepEl);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * A07: Authentication Failures Visualization
 */
function initializeAuthFailuresViz() {
    // Similar implementation to other visualizations
    console.log('Auth failures visualization initialized');
}

/**
 * A10: SSRF Visualization
 */
function initializeSSRFViz() {
    // Similar implementation to other visualizations
    console.log('SSRF visualization initialized');
}