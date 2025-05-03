document.addEventListener('DOMContentLoaded', function() {
    // Variables for canvas interaction
    const canvas = document.getElementById('architecture-canvas');
    const componentList = document.querySelectorAll('.component-item');
    const scenarioSelect = document.getElementById('scenario-select');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const evaluateBtn = document.getElementById('evaluate-architecture');
    const saveBtn = document.getElementById('save-architecture');
    const evaluationPanel = document.getElementById('evaluation-panel');
    const connectTool = document.getElementById('connect-tool');
    const deleteTool = document.getElementById('delete-tool');
    const clearTool = document.getElementById('clear-tool');

    // Modal elements
    const componentModal = document.getElementById('component-modal');
    const scenarioModal = document.getElementById('scenario-modal');
    const modalClose = document.querySelectorAll('.modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');
    const scenarioStart = document.getElementById('scenario-start');

    // Form elements
    const componentName = document.getElementById('component-name');
    const securityLevel = document.getElementById('security-level');
    const componentDescription = document.getElementById('component-description');

    // State variables
    let currentComponent = null;
    let isConnecting = false;
    let connectionStart = null;
    let components = [];
    let connections = [];
    let draggedComponent = null;
    let offsetX, offsetY;
    let currentScenario = 0;
    let activeToolMode = 'none'; // 'none', 'connect', 'delete'

    // Scenario data
    const scenarios = [
        {
            title: "Select a scenario",
            description: "",
            requirements: [],
            considerations: []
        },
        {
            title: "E-commerce Web Application",
            description: "Design a secure architecture for an e-commerce web application that handles customer data, payment processing, and inventory management.",
            requirements: [
                "Support for 10,000+ concurrent users",
                "Payment processing with credit card information",
                "Customer account management and personal data storage",
                "Integration with inventory management system",
                "Protection against common web attacks (OWASP Top 10)"
            ],
            considerations: [
                "PCI DSS compliance for payment processing",
                "Protection of customer personal information",
                "Secure authentication and session management",
                "Defense against DDoS attacks",
                "API security for third-party integrations"
            ]
        },
        {
            title: "Healthcare Data Management System",
            description: "Design a secure architecture for a healthcare data management system that stores and processes sensitive patient information.",
            requirements: [
                "Electronic health record (EHR) storage and access",
                "Secure patient portal for accessing medical information",
                "Integration with laboratory and medical imaging systems",
                "Support for mobile access by healthcare providers",
                "Audit logging for compliance purposes"
            ],
            considerations: [
                "HIPAA compliance requirements",
                "Protection of sensitive patient data",
                "Strong access controls and authentication",
                "Data encryption at rest and in transit",
                "Disaster recovery and business continuity"
            ]
        },
        {
            title: "Financial Transaction Processing",
            description: "Design a secure architecture for a financial transaction processing system that handles sensitive financial data and high-value transactions.",
            requirements: [
                "High availability (99.99% uptime)",
                "Support for real-time transaction processing",
                "Integration with multiple banking systems",
                "Fraud detection and prevention",
                "Comprehensive audit trail"
            ],
            considerations: [
                "PCI DSS and financial regulatory compliance",
                "Protection against fraud and financial crimes",
                "Transaction integrity and non-repudiation",
                "Secure key management for cryptographic operations",
                "Defense against targeted attacks"
            ]
        },
        {
            title: "Cloud-based SaaS Application",
            description: "Design a secure architecture for a multi-tenant SaaS application hosted in the cloud that processes and stores customer data.",
            requirements: [
                "Multi-tenant architecture with data isolation",
                "Scalability to handle growing customer base",
                "API-based integration with customer systems",
                "Self-service customer administration",
                "Analytics and reporting capabilities"
            ],
            considerations: [
                "Tenant data isolation and security",
                "Identity and access management across tenants",
                "Cloud security controls and shared responsibility",
                "API security and rate limiting",
                "Compliance with various regional data protection laws"
            ]
        }
    ];

    // Initialize draggable components
    componentList.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedComponent = {
                type: this.getAttribute('data-type'),
                name: this.textContent.trim()
            };
            e.dataTransfer.setData('text/plain', '');
        });
    });

    // Canvas drop zone
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    canvas.addEventListener('drop', function(e) {
        e.preventDefault();

        if (draggedComponent) {
            // Remove placeholder if this is the first component
            const placeholder = canvas.querySelector('.canvas-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }

            // Create component
            currentComponent = createComponent(
                draggedComponent.type,
                draggedComponent.name,
                e.clientX - canvas.getBoundingClientRect().left - 60,
                e.clientY - canvas.getBoundingClientRect().top - 20
            );

            // Show configuration modal
            showComponentModal();

            draggedComponent = null;
        }
    });

    // Canvas click for connections
    canvas.addEventListener('click', function(e) {
        if (activeToolMode === 'connect') {
            // Find the closest component to the click
            const component = findClosestComponent(e);

            if (component) {
                if (!connectionStart) {
                    // Start connection
                    connectionStart = component;
                    connectionStart.classList.add('connection-active');
                } else if (connectionStart !== component) {
                    // Finish connection if clicking on a different component
                    createConnection(connectionStart, component);
                    connectionStart.classList.remove('connection-active');
                    connectionStart = null;
                }
            }
        } else if (activeToolMode === 'delete') {
            // Find the closest component or connection to the click
            const element = findClosestElement(e);

            if (element) {
                if (element.classList.contains('canvas-component')) {
                    deleteComponent(element);
                } else if (element.classList.contains('connection-line')) {
                    deleteConnection(element);
                }
            }
        }
    });

    // Find closest component to a click
    function findClosestComponent(e) {
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        let closestComponent = null;
        let minDistance = Infinity;

        components.forEach(comp => {
            const element = document.getElementById(comp.id);
            if (element) {
                const rect = element.getBoundingClientRect();
                const componentX = rect.left + rect.width / 2 - canvasRect.left;
                const componentY = rect.top + rect.height / 2 - canvasRect.top;

                const distance = Math.sqrt((x - componentX) ** 2 + (y - componentY) ** 2);

                if (distance < minDistance && distance < 100) {
                    minDistance = distance;
                    closestComponent = element;
                }
            }
        });

        return closestComponent;
    }

    // Find closest element (component or connection) to a click
    function findClosestElement(e) {
        const component = findClosestComponent(e);

        if (component) {
            return component;
        }

        // Check for connections if no component is found
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        let closestConnection = null;
        let minDistance = Infinity;

        connections.forEach(conn => {
            const element = document.getElementById(conn.id);
            if (element) {
                const fromComponent = document.getElementById(conn.from);
                const toComponent = document.getElementById(conn.to);

                if (fromComponent && toComponent) {
                    const fromRect = fromComponent.getBoundingClientRect();
                    const toRect = toComponent.getBoundingClientRect();

                    const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
                    const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
                    const toX = toRect.left + toRect.width / 2 - canvasRect.left;
                    const toY = toRect.top + toRect.height / 2 - canvasRect.top;

                    // Calculate distance from point to line segment
                    const distance = distanceToLineSegment(fromX, fromY, toX, toY, x, y);

                    if (distance < minDistance && distance < 20) {
                        minDistance = distance;
                        closestConnection = element;
                    }
                }
            }
        });

        return closestConnection;
    }

    // Calculate distance from point to line segment
    function distanceToLineSegment(x1, y1, x2, y2, x, y) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    // Create connection between components
    function createConnection(fromComponent, toComponent) {
        const fromId = fromComponent.id;
        const toId = toComponent.id;

        // Check if connection already exists
        const existingConnection = connections.find(c =>
            (c.from === fromId && c.to === toId) ||
            (c.from === toId && c.to === fromId)
        );

        if (existingConnection) {
            return; // Don't create duplicate connections
        }

        const connectionId = `connection-${Date.now()}`;

        // Create visual connection element
        const connectionElement = document.createElement('div');
        connectionElement.id = connectionId;
        connectionElement.className = 'connection-line';
        canvas.appendChild(connectionElement);

        // Store connection data
        connections.push({
            id: connectionId,
            from: fromId,
            to: toId,
            element: connectionElement
        });

        // Calculate and draw connection line
        const fromRect = fromComponent.getBoundingClientRect();
        const toRect = toComponent.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
        const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
        const toX = toRect.left + toRect.width / 2 - canvasRect.left;
        const toY = toRect.top + toRect.height / 2 - canvasRect.top;

        drawConnection(connectionElement, fromX, fromY, toX, toY);

        // Add connection label
        const labelElement = document.createElement('div');
        labelElement.className = 'connection-label';
        labelElement.textContent = 'Secure';
        labelElement.style.left = `${(fromX + toX) / 2}px`;
        labelElement.style.top = `${(fromY + toY) / 2}px`;
        canvas.appendChild(labelElement);

        // Store label reference
        connections[connections.length - 1].label = labelElement;
    }

    // Delete connection
    function deleteConnection(connectionElement) {
        const connectionId = connectionElement.id;

        // Remove connection from DOM
        connectionElement.remove();

        // Remove connection label if exists
        const connection = connections.find(c => c.id === connectionId);
        if (connection && connection.label) {
            connection.label.remove();
        }

        // Remove from connections array
        connections = connections.filter(c => c.id !== connectionId);
    }

    // Component creation
    function createComponent(type, name, x, y) {
        const component = document.createElement('div');
        component.className = `canvas-component component-${type}`;
        component.setAttribute('data-type', type);
        component.style.left = `${x}px`;
        component.style.top = `${y}px`;

        const componentId = `component-${Date.now()}`;
        component.id = componentId;

        component.innerHTML = `
            <div class="component-actions">
                <button class="component-action edit-component" title="Edit">
                    <i class="fas fa-cog"></i>
                </button>
                <button class="component-action delete-component" title="Delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="component-header">
                <div class="component-icon">
                    <i class="${getIconForType(type)}"></i>
                </div>
                <div class="component-title">${name}</div>
            </div>
            <div class="component-body">
                Security: Medium
            </div>
        `;

        // Make component draggable
        component.addEventListener('mousedown', startDrag);

        // Component edit button
        component.querySelector('.edit-component').addEventListener('click', function(e) {
            e.stopPropagation();
            currentComponent = component;
            componentName.value = component.querySelector('.component-title').textContent;
            securityLevel.value = component.getAttribute('data-security') || 'medium';
            componentDescription.value = component.getAttribute('data-description') || '';
            showComponentModal();
        });

        // Component delete button
        component.querySelector('.delete-component').addEventListener('click', function(e) {
            e.stopPropagation();
            deleteComponent(component);
        });

        // Add component to canvas
        canvas.appendChild(component);

        // Add to components array
        components.push({
            id: componentId,
            element: component,
            type: type,
            name: name,
            x: x,
            y: y,
            security: 'medium'
        });

        return component;
    }

    // Get icon for component type
    function getIconForType(type) {
        const icons = {
            'web-server': 'fas fa-server',
            'database': 'fas fa-database',
            'load-balancer': 'fas fa-random',
            'cdn': 'fas fa-globe',
            'api-gateway': 'fas fa-exchange-alt',
            'firewall': 'fas fa-shield-alt',
            'waf': 'fas fa-filter',
            'ids-ips': 'fas fa-eye',
            'auth-server': 'fas fa-user-lock',
            'vpn': 'fas fa-lock'
        };

        return icons[type] || 'fas fa-cube';
    }

    // Component dragging functionality
    function startDrag(e) {
        // Only allow dragging if no tool is active
        if (activeToolMode !== 'none') {
            return;
        }

        const component = this;

        // Only start drag if not clicking on a button
        if (e.target.closest('.component-action')) {
            return;
        }

        // Add dragging class
        component.classList.add('dragging');

        // Get initial position
        const rect = component.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Add event listeners for drag
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        // Prevent default behavior
        e.preventDefault();
    }

    function drag(e) {
        const component = document.querySelector('.canvas-component.dragging');
        if (!component) return;

        // Calculate new position
        const canvasRect = canvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.left - offsetX;
        let y = e.clientY - canvasRect.top - offsetY;

        // Keep component within canvas bounds
        x = Math.max(0, Math.min(x, canvasRect.width - component.offsetWidth));
        y = Math.max(0, Math.min(y, canvasRect.height - component.offsetHeight));

        // Update position
        component.style.left = `${x}px`;
        component.style.top = `${y}px`;

        // Update components array
        const componentId = component.id;
        const componentData = components.find(c => c.id === componentId);
        if (componentData) {
            componentData.x = x;
            componentData.y = y;
        }

        // Update connections
        updateConnections(component);
    }

    function stopDrag() {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        const component = document.querySelector('.canvas-component.dragging');
        if (component) {
            component.classList.remove('dragging');
        }
    }

    // Delete component and its connections
    function deleteComponent(component) {
        // Remove component from DOM
        component.remove();

        // Remove component from components array
        const componentId = component.id;
        components = components.filter(c => c.id !== componentId);

        // Remove connections to/from this component
        const connectionsToRemove = connections.filter(c => c.from === componentId || c.to === componentId);
        connectionsToRemove.forEach(connection => {
            const connectionElement = document.getElementById(connection.id);
            if (connectionElement) {
                connectionElement.remove();
            }

            // Remove connection label if exists
            if (connection.label) {
                connection.label.remove();
            }
        });

        connections = connections.filter(c => c.from !== componentId && c.to !== componentId);

        // Show placeholder if no components left
        if (components.length === 0) {
            const placeholder = canvas.querySelector('.canvas-placeholder');
            if (placeholder) {
                placeholder.style.display = 'block';
            }
        }
    }

    // Update connections when component moves
    function updateConnections(component) {
        const componentId = component.id;

        // Find connections that involve this component
        const relevantConnections = connections.filter(c => c.from === componentId || c.to === componentId);

        relevantConnections.forEach(connection => {
            const connectionElement = document.getElementById(connection.id);
            if (!connectionElement) return;

            const fromComponent = document.getElementById(connection.from);
            const toComponent = document.getElementById(connection.to);

            if (!fromComponent || !toComponent) return;

            const fromRect = fromComponent.getBoundingClientRect();
            const toRect = toComponent.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();

            // Calculate center points
            const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
            const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
            const toX = toRect.left + toRect.width / 2 - canvasRect.left;
            const toY = toRect.top + toRect.height / 2 - canvasRect.top;

            // Update line
            drawConnection(connectionElement, fromX, fromY, toX, toY);

            // Update label position if exists
            if (connection.label) {
                connection.label.style.left = `${(fromX + toX) / 2}px`;
                connection.label.style.top = `${(fromY + toY) / 2}px`;
            }
        });
    }

    // Draw connection between components
    function drawConnection(connectionElement, fromX, fromY, toX, toY) {
        const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
        const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;

        connectionElement.style.width = `${length}px`;
        connectionElement.style.left = `${fromX}px`;
        connectionElement.style.top = `${fromY}px`;
        connectionElement.style.transform = `rotate(${angle}deg)`;
    }

    // Component modal functions
    function showComponentModal() {
        componentModal.style.display = 'flex';

        // Fill form with current component data if editing
        if (currentComponent) {
            const componentTitle = currentComponent.querySelector('.component-title');
            if (componentTitle) {
                componentName.value = componentTitle.textContent;
            }

            securityLevel.value = currentComponent.getAttribute('data-security') || 'medium';
            componentDescription.value = currentComponent.getAttribute('data-description') || '';
        }
    }

    function hideComponentModal() {
        componentModal.style.display = 'none';
        currentComponent = null;
    }

    // Function to handle scenario selection
    function handleScenarioSelect() {
        const scenarioIndex = parseInt(scenarioSelect.value);
        currentScenario = scenarioIndex;

        if (scenarioIndex > 0) {
            const scenario = scenarios[scenarioIndex];

            // Update modal content
            document.getElementById('scenario-modal-title').textContent = scenario.title;
            document.getElementById('scenario-modal-description').textContent = scenario.description;

            // Update requirements
            const requirementsList = document.getElementById('scenario-requirements');
            requirementsList.innerHTML = '';
            scenario.requirements.forEach(req => {
                const li = document.createElement('li');
                li.textContent = req;
                requirementsList.appendChild(li);
            });

            // Update considerations
            const considerationsList = document.getElementById('scenario-considerations');
            considerationsList.innerHTML = '';
            scenario.considerations.forEach(con => {
                const li = document.createElement('li');
                li.textContent = con;
                considerationsList.appendChild(li);
            });

            // Show modal
            scenarioModal.style.display = 'flex';
        }
    }

    // Function to evaluate architecture
    function evaluateArchitecture() {
        if (components.length === 0) {
            alert('Please add components to your architecture before evaluating.');
            return;
        }

        if (currentScenario === 0) {
            alert('Please select a scenario before evaluating your architecture.');
            return;
        }

        // Reset evaluation panel
        const scoreValue = document.querySelector('.score-value');
        const evaluationCategories = document.querySelectorAll('.evaluation-category');
        const evaluationSuggestions = document.querySelector('.evaluation-suggestions');

        // Basic evaluation logic - this can be enhanced further
        let score = 0;
        let maxScore = 100;
        let categories = [];
        let suggestions = [];

        // Count component types
        const componentTypes = components.map(c => c.type);
        const componentTypeCounts = {};
        componentTypes.forEach(type => {
            componentTypeCounts[type] = (componentTypeCounts[type] || 0) + 1;
        });

        // Check security levels
        const securityLevels = components.map(c => c.security);
        const highSecurityCount = securityLevels.filter(s => s === 'high').length;
        const mediumSecurityCount = securityLevels.filter(s => s === 'medium').length;
        const lowSecurityCount = securityLevels.filter(s => s === 'low').length;

        // Check connections
        const isFullyConnected = components.length > 0 && connections.length >= components.length - 1;

        // Scenario-specific evaluation
        switch (currentScenario) {
            case 1: // E-commerce
                // Check for essential components
                if (componentTypeCounts['web-server']) score += 10;
                if (componentTypeCounts['database']) score += 10;
                if (componentTypeCounts['firewall']) score += 10;
                if (componentTypeCounts['waf']) score += 10;
                if (componentTypeCounts['load-balancer']) score += 5;
                if (componentTypeCounts['auth-server']) score += 15;

                // Check connections
                if (isFullyConnected) score += 10;

                // Check security levels
                score += (highSecurityCount * 5);
                score -= (lowSecurityCount * 5);

                // Categories and suggestions
                if (componentTypeCounts['firewall'] && componentTypeCounts['waf']) {
                    categories.push({
                        title: 'Defense in Depth',
                        status: 'Good',
                        details: 'Your architecture implements multiple layers of security controls. The firewall, WAF, and other security components provide complementary protection against various threats.'
                    });
                } else {
                    categories.push({
                        title: 'Defense in Depth',
                        status: 'Needs Improvement',
                        details: 'Consider adding more security layers to protect against different types of threats.'
                    });
                    suggestions.push('Add both firewall and web application firewall (WAF) to implement defense in depth.');
                }

                if (componentTypeCounts['database'] && highSecurityCount > 0) {
                    categories.push({
                        title: 'Data Protection',
                        status: 'Good',
                        details: 'Your architecture includes database security measures and high-security components for data protection.'
                    });
                } else {
                    categories.push({
                        title: 'Data Protection',
                        status: 'Needs Improvement',
                        details: 'Consider adding encryption for data at rest in the database and implementing proper access controls for sensitive data.'
                    });
                    suggestions.push('Set the database component to high security level and ensure proper access controls.');
                }

                if (componentTypeCounts['auth-server']) {
                    categories.push({
                        title: 'Authentication & Authorization',
                        status: 'Good',
                        details: 'Your architecture includes an authentication server, which is essential for secure user authentication and authorization.'
                    });
                } else {
                    categories.push({
                        title: 'Authentication & Authorization',
                        status: 'Insufficient',
                        details: 'Your architecture is missing a dedicated authentication service. Consider adding this component to ensure secure user authentication.'
                    });
                    suggestions.push('Add an authentication server to manage user identities and access tokens.');
                }
                break;

            // Additional scenarios can be implemented similarly
            case 2: // Healthcare
                // Healthcare-specific checks...
                // For example, emphasize data encryption, access controls, audit logging
                if (componentTypeCounts['database']) score += 10;
                if (componentTypeCounts['firewall']) score += 10;
                if (componentTypeCounts['auth-server']) score += 15;
                if (componentTypeCounts['ids-ips']) score += 15;

                // Add more healthcare-specific evaluations...
                break;

            case 3: // Financial
                // Financial-specific checks...
                // For example, emphasize high availability, fraud detection, audit trails
                break;

            case 4: // Cloud SaaS
                // Cloud SaaS-specific checks...
                // For example, emphasize multi-tenancy, API security, scalability
                break;
        }

        // Ensure score is within range
        score = Math.max(0, Math.min(score, maxScore));

        // Update UI with evaluation results
        scoreValue.textContent = `${Math.round(score)}/${maxScore}`;

        // Clear existing categories and add new ones
        while (evaluationCategories[0].nextElementSibling) {
            evaluationCategories[0].nextElementSibling.remove();
        }

        // Add categories
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'evaluation-category';

            let statusClass = '';
            if (category.status === 'Good') statusClass = 'category-good';
            else if (category.status === 'Needs Improvement') statusClass = 'category-warning';
            else if (category.status === 'Insufficient') statusClass = 'category-bad';

            categoryElement.innerHTML = `
                <div class="category-header">
                    <div class="category-title">${category.title}</div>
                    <div class="category-score ${statusClass}">${category.status}</div>
                </div>
                <div class="category-details">
                    ${category.details}
                </div>
            `;

            evaluationCategories[0].parentNode.insertBefore(categoryElement, evaluationCategories[0].nextSibling);
        });

        // Clear existing suggestions
        evaluationSuggestions.innerHTML = '<h4>Suggested Improvements:</h4>';

        // Add suggestions
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <div class="suggestion-icon"><i class="fas fa-plus-circle"></i></div>
                <div>${suggestion}</div>
            `;
            evaluationSuggestions.appendChild(suggestionElement);
        });

        // If no suggestions, add a positive message
        if (suggestions.length === 0) {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <div class="suggestion-icon"><i class="fas fa-check-circle"></i></div>
                <div>Your architecture is well designed! Consider adding more security controls for defense in depth.</div>
            `;
            evaluationSuggestions.appendChild(suggestionElement);
        }

        // Show evaluation panel
        evaluationPanel.style.display = 'block';

        // Scroll to evaluation
        evaluationPanel.scrollIntoView({ behavior: 'smooth' });
    }

    // Event listeners

    // Scenario selection
    scenarioSelect.addEventListener('change', handleScenarioSelect);

    // Tool buttons
    connectTool.addEventListener('click', function() {
        if (activeToolMode === 'connect') {
            // Deactivate
            activeToolMode = 'none';
            this.classList.remove('active');

            // Clear any active connection
            if (connectionStart) {
                connectionStart.classList.remove('connection-active');
                connectionStart = null;
            }
        } else {
            // Activate connect tool
            activeToolMode = 'connect';
            this.classList.add('active');

            // Deactivate other tools
            deleteTool.classList.remove('active');
        }
    });

    deleteTool.addEventListener('click', function() {
        if (activeToolMode === 'delete') {
            // Deactivate
            activeToolMode = 'none';
            this.classList.remove('active');
        } else {
            // Activate delete tool
            activeToolMode = 'delete';
            this.classList.add('active');

            // Deactivate other tools
            connectTool.classList.remove('active');

            // Clear any active connection
            if (connectionStart) {
                connectionStart.classList.remove('connection-active');
                connectionStart = null;
            }
        }
    });

    clearTool.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas? This will delete all components.')) {
            clearCanvas();
        }
    });

    // Clear canvas function
    function clearCanvas() {
        // Remove all components and connections
        components.forEach(component => {
            const element = document.getElementById(component.id);
            if (element) {
                element.remove();
            }
        });

        connections.forEach(connection => {
            const element = document.getElementById(connection.id);
            if (element) {
                element.remove();
            }

            // Remove connection label if exists
            if (connection.label) {
                connection.label.remove();
            }
        });

        // Reset arrays
        components = [];
        connections = [];

        // Show placeholder
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }

        // Hide evaluation panel
        evaluationPanel.style.display = 'none';
    }

    // Clear canvas button
    clearCanvasBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas? This will delete all components.')) {
            clearCanvas();
        }
    });

    // Evaluate architecture button
    evaluateBtn.addEventListener('click', function() {
        evaluateArchitecture();
    });

    // Save architecture button
    saveBtn.addEventListener('click', function() {
        // Create a JSON representation of the architecture
        const architectureData = {
            scenario: currentScenario,
            components: components.map(c => ({
                id: c.id,
                type: c.type,
                name: c.name,
                x: c.x,
                y: c.y,
                security: c.security,
                description: c.description || ''
            })),
            connections: connections.map(c => ({
                from: c.from,
                to: c.to
            }))
        };

        // Convert to JSON string
        const architectureJSON = JSON.stringify(architectureData, null, 2);

        // Create a blob and download link
        const blob = new Blob([architectureJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `architecture-design-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        alert('Architecture saved successfully!');
    });

    // Modal close buttons
    modalClose.forEach(button => {
        button.addEventListener('click', function() {
            // Hide all modals
            componentModal.style.display = 'none';
            scenarioModal.style.display = 'none';

            // If closing component modal without saving, remove the component
            if (this.closest('#component-modal') && currentComponent && !currentComponent.hasAttribute('data-configured')) {
                deleteComponent(currentComponent);
            }

            currentComponent = null;
        });
    });

    // Component modal cancel button
    modalCancel.addEventListener('click', function() {
        // Hide modal
        componentModal.style.display = 'none';

        // If canceling a new component, remove it
        if (currentComponent && !currentComponent.hasAttribute('data-configured')) {
            deleteComponent(currentComponent);
        }

        currentComponent = null;
    });

    // Component modal save button
    modalSave.addEventListener('click', function() {
        if (!currentComponent) return;

        // Update component with form data
        currentComponent.querySelector('.component-title').textContent = componentName.value;
        currentComponent.querySelector('.component-body').textContent = `Security: ${securityLevel.value.charAt(0).toUpperCase() + securityLevel.value.slice(1)}`;

        // Set attributes for later retrieval
        currentComponent.setAttribute('data-security', securityLevel.value);
        currentComponent.setAttribute('data-description', componentDescription.value);
        currentComponent.setAttribute('data-configured', 'true');

        // Update component in array
        const componentId = currentComponent.id;
        const componentData = components.find(c => c.id === componentId);
        if (componentData) {
            componentData.name = componentName.value;
            componentData.security = securityLevel.value;
            componentData.description = componentDescription.value;
        }

        // Hide modal
        componentModal.style.display = 'none';
        currentComponent = null;
    });

    // Scenario modal start button
    scenarioStart.addEventListener('click', function() {
        // Hide modal
        scenarioModal.style.display = 'none';
    });

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

    // Add CSS for connection lines and active tools
    const style = document.createElement('style');
    style.textContent = `
        .connection-line {
            position: absolute;
            height: 2px;
            background-color: #3498db;
            transform-origin: left center;
            z-index: 1;
        }
        
        .connection-label {
            position: absolute;
            background-color: #fff;
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid #3498db;
            font-size: 12px;
            transform: translate(-50%, -50%);
            z-index: 2;
        }
        
        .component-item:hover, .canvas-component:hover {
            cursor: pointer;
            box-shadow: 0 0 0 2px #3498db;
        }
        
        .connection-active {
            box-shadow: 0 0 0 3px #e74c3c;
        }
        
        .tool-btn.active {
            background-color: #2980b9;
            color: white;
        }
        
        .canvas-component.dragging {
            z-index: 1000;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
});