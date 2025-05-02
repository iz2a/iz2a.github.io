        document.addEventListener('DOMContentLoaded', function() {
            // Variables for canvas interaction
            const canvas = document.getElementById('architecture-canvas');
            const componentList = document.querySelectorAll('.component-item');
            const scenarioSelect = document.getElementById('scenario-select');
            const clearCanvasBtn = document.getElementById('clear-canvas');
            const evaluateBtn = document.getElementById('evaluate-architecture');
            const saveBtn = document.getElementById('save-architecture');
            const evaluationPanel = document.getElementById('evaluation-panel');

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
                const component = this;

                // Only start drag if not clicking on a button
                if (e.target.closest('.component-action')) {
                    return;
                }

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
                if (!draggedComponent) {
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

            // Event listeners

            // Scenario selection
            scenarioSelect.addEventListener('change', handleScenarioSelect);

            // Clear canvas button
            clearCanvasBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear the canvas? This will delete all components.')) {
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
            });

            // Evaluate architecture button
            evaluateBtn.addEventListener('click', function() {
                // Simple validation to ensure there are components
                if (components.length === 0) {
                    alert('Please add components to your architecture before evaluating.');
                    return;
                }

                // Show evaluation panel
                evaluationPanel.style.display = 'block';

                // Scroll to evaluation
                evaluationPanel.scrollIntoView({ behavior: 'smooth' });
            });

            // Save architecture button
            saveBtn.addEventListener('click', function() {
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
        });