 document.addEventListener('DOMContentLoaded', function() {
            // Get canvas and context
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            // Get UI elements
            const tooltip = document.getElementById('tooltip');
            const nodeSlider = document.getElementById('node-slider');
            const vulnerabilitySlider = document.getElementById('vulnerability-slider');
            const trafficSlider = document.getElementById('traffic-slider');
            const nodeSliderValue = document.getElementById('node-slider-value');
            const vulnerabilitySliderValue = document.getElementById('vulnerability-slider-value');
            const trafficSliderValue = document.getElementById('traffic-slider-value');
            const nodeCountEl = document.getElementById('node-count');
            const trafficVolumeEl = document.getElementById('traffic-volume');
            const securityLevelEl = document.getElementById('security-level');
            const incidentCountEl = document.getElementById('incident-count');
            const securityStatEl = document.getElementById('security-stat');
            const incidentStatEl = document.getElementById('incident-stat');
            const logsContainer = document.getElementById('logs');

            // Button elements
            const addNodeBtn = document.getElementById('add-node-btn');
            const addSecurityBtn = document.getElementById('add-security-btn');
            const resetBtn = document.getElementById('reset-btn');
            const ddosBtn = document.getElementById('ddos-btn');
            const malwareBtn = document.getElementById('malware-btn');
            const bruteForceBtn = document.getElementById('brute-force-btn');
            const firewallBtn = document.getElementById('firewall-btn');
            const idsBtn = document.getElementById('ids-btn');
            const patchBtn = document.getElementById('patch-btn');

            // Network state
            let nodes = [];
            let connections = [];
            let packets = [];
            let attacks = [];
            let securityMeasures = {
                firewall: false,
                ids: false,
                patched: false
            };

            // Statistics
            let stats = {
                nodeCount: 0,
                trafficVolume: 0,
                securityLevel: 100,
                incidentCount: 0
            };

            // Mouse interaction
            let mousePos = { x: 0, y: 0 };
            let isDragging = false;
            let selectedNode = null;

            // Node types
            const NODE_TYPES = {
                SECURE: 'secure',
                VULNERABLE: 'vulnerable',
                COMPROMISED: 'compromised',
                EXTERNAL: 'external',
                SECURITY: 'security'
            };

            // Colors
            const COLORS = {
                [NODE_TYPES.SECURE]: '#4CAF50',
                [NODE_TYPES.VULNERABLE]: '#FFC107',
                [NODE_TYPES.COMPROMISED]: '#F44336',
                [NODE_TYPES.EXTERNAL]: '#2196F3',
                [NODE_TYPES.SECURITY]: '#9C27B0',
                CONNECTION_NORMAL: 'rgba(255, 255, 255, 0.3)',
                CONNECTION_ACTIVE: 'rgba(255, 255, 255, 0.8)',
                CONNECTION_ATTACK: 'rgba(244, 67, 54, 0.8)',
                CONNECTION_SECURE: 'rgba(76, 175, 80, 0.5)',
                PACKET_NORMAL: '#FFFFFF',
                PACKET_MALICIOUS: '#F44336'
            };

            // Initialize canvas
            function initCanvas() {
                // Set canvas to proper size
                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);

                // Mouse event listeners
                canvas.addEventListener('mousemove', handleMouseMove);
                canvas.addEventListener('mousedown', handleMouseDown);
                canvas.addEventListener('mouseup', handleMouseUp);
                canvas.addEventListener('click', handleClick);

                // Initialize network
                createNetwork(parseInt(nodeSlider.value));

                // Start animation loop
                animate();

                // Start traffic generation
                setInterval(generateTraffic, 1000);

                // Add log entry
                addLogEntry('Network visualization initialized with ' + nodes.length + ' nodes', 'info');
            }

            // Resize canvas to fit container
            function resizeCanvas() {
                const container = canvas.parentElement;
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }

            // Create initial network
            function createNetwork(nodeCount) {
                // Reset arrays
                nodes = [];
                connections = [];
                packets = [];
                attacks = [];

                // Reset security measures
                securityMeasures = {
                    firewall: false,
                    ids: false,
                    patched: false
                };

                // Reset stats
                stats = {
                    nodeCount: 0,
                    trafficVolume: 0,
                    securityLevel: 100,
                    incidentCount: 0
                };

                // Get vulnerability percentage
                const vulnerabilityRate = parseInt(vulnerabilitySlider.value) / 100;

                // Create nodes
                for (let i = 0; i < nodeCount; i++) {
                    // Determine if node is vulnerable based on slider
                    const isVulnerable = Math.random() < vulnerabilityRate;
                    const nodeType = isVulnerable ? NODE_TYPES.VULNERABLE : NODE_TYPES.SECURE;

                    createNode(nodeType);
                }

                // Add internet gateway (external node)
                nodes.push({
                    id: nodes.length,
                    x: canvas.width * 0.1,
                    y: canvas.height * 0.5,
                    radius: 15,
                    type: NODE_TYPES.EXTERNAL,
                    name: 'Internet Gateway',
                    description: 'Connection to external networks',
                    vulnerabilities: 0,
                    compromised: false,
                    vx: 0,
                    vy: 0
                });

                // Create connections between nodes
                createConnections();

                // Update stats
                updateStats();

                // Log network creation
                addLogEntry(`Network created with ${nodes.length} nodes (${Math.round(vulnerabilityRate * 100)}% vulnerable)`, 'info');
            }

            // Create a single node
            function createNode(type) {
                // Determine node type if not specified
                const nodeType = type || (Math.random() > 0.7 ? NODE_TYPES.VULNERABLE : NODE_TYPES.SECURE);

                // Random position, avoiding edges
                const margin = 50;
                const x = Math.random() * (canvas.width - 2 * margin) + margin;
                const y = Math.random() * (canvas.height - 2 * margin) + margin;

                // Random size based on node type
                const radius = nodeType === NODE_TYPES.SECURITY ? 12 :
                               nodeType === NODE_TYPES.EXTERNAL ? 15 :
                               Math.random() * 3 + 8;

                // Generate node name
                const deviceTypes = ['Server', 'Workstation', 'Router', 'Database', 'IoT Device'];
                const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
                const deviceId = Math.floor(Math.random() * 1000);
                const name = `${deviceType}-${deviceId}`;

                // Create node object
                const node = {
                    id: nodes.length,
                    x: x,
                    y: y,
                    radius: radius,
                    type: nodeType,
                    name: name,
                    description: generateDescription(deviceType),
                    vulnerabilities: nodeType === NODE_TYPES.VULNERABLE ? Math.floor(Math.random() * 3) + 1 : 0,
                    compromised: false,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2
                };

                nodes.push(node);
                return node;
            }

            // Generate description based on device type
            function generateDescription(deviceType) {
                switch (deviceType) {
                    case 'Server':
                        return 'Network server hosting applications and services';
                    case 'Workstation':
                        return 'Employee computer workstation';
                    case 'Router':
                        return 'Network routing and switching device';
                    case 'Database':
                        return 'Database server containing sensitive records';
                    case 'IoT Device':
                        return 'Connected smart device with limited security';
                    default:
                        return 'Network endpoint device';
                }
            }

            // Create connections between nodes
            function createConnections() {
                // Each node should have at least one connection
                nodes.forEach(node => {
                    // Skip security devices for now (we'll connect them manually)
                    if (node.type === NODE_TYPES.SECURITY) return;

                    // Connect to random nodes
                    const connectionCount = Math.floor(Math.random() * 3) + 1;

                    for (let i = 0; i < connectionCount; i++) {
                        // Find a random node to connect to
                        const targetIndex = Math.floor(Math.random() * nodes.length);
                        const targetNode = nodes[targetIndex];

                        // Skip self-connections and security devices
                        if (targetNode.id === node.id || targetNode.type === NODE_TYPES.SECURITY) continue;

                        // Check if connection already exists
                        const connectionExists = connections.some(conn =>
                            (conn.source === node.id && conn.target === targetNode.id) ||
                            (conn.source === targetNode.id && conn.target === node.id)
                        );

                        if (!connectionExists) {
                            connections.push({
                                source: node.id,
                                target: targetNode.id,
                                active: false,
                                status: 'normal',
                                width: Math.random() * 1.5 + 0.5
                            });
                        }
                    }
                });

                // Make sure every node has at least one connection
                nodes.forEach(node => {
                    if (node.type === NODE_TYPES.SECURITY) return;

                    const hasConnection = connections.some(conn =>
                        conn.source === node.id || conn.target === node.id
                    );

                    if (!hasConnection) {
                        // Connect to a random node
                        let targetIndex;
                        do {
                            targetIndex = Math.floor(Math.random() * nodes.length);
                        } while (targetIndex === node.id || nodes[targetIndex].type === NODE_TYPES.SECURITY);

                        connections.push({
                            source: node.id,
                            target: targetIndex,
                            active: false,
                            status: 'normal',
                            width: Math.random() * 1.5 + 0.5
                        });
                    }
                });

                // Ensure external node is connected to multiple internal nodes
                const externalNodeIndex = nodes.findIndex(node => node.type === NODE_TYPES.EXTERNAL);
                if (externalNodeIndex !== -1) {
                    const externalNode = nodes[externalNodeIndex];
                    const connCount = connections.filter(conn =>
                        conn.source === externalNode.id || conn.target === externalNode.id
                    ).length;

                    if (connCount < 3) {
                        const additionalConnections = 3 - connCount;
                        for (let i = 0; i < additionalConnections; i++) {
                            let targetIndex;
                            do {
                                targetIndex = Math.floor(Math.random() * nodes.length);
                            } while (
                                targetIndex === externalNode.id ||
                                nodes[targetIndex].type === NODE_TYPES.SECURITY ||
                                connections.some(conn =>
                                    (conn.source === externalNode.id && conn.target === targetIndex) ||
                                    (conn.source === targetIndex && conn.target === externalNode.id)
                                )
                            );

                            connections.push({
                                source: externalNode.id,
                                target: targetIndex,
                                active: false,
                                status: 'normal',
                                width: Math.random() * 1.5 + 0.5
                            });
                        }
                    }
                }
            }

            // Generate network traffic
            function generateTraffic() {
                const intensity = parseInt(trafficSlider.value);
                const packetCount = Math.floor(Math.random() * intensity) + 1;

                for (let i = 0; i < packetCount; i++) {
                    // Select random source and target
                    const sourceIndex = Math.floor(Math.random() * nodes.length);
                    let targetIndex;
                    do {
                        targetIndex = Math.floor(Math.random() * nodes.length);
                    } while (targetIndex === sourceIndex);

                    const source = nodes[sourceIndex];
                    const target = nodes[targetIndex];

                    // Find if there's a direct connection or a path
                    const connection = findConnection(source.id, target.id);

                    if (connection) {
                        // Create packet
                        createPacket(source.id, target.id, 'normal');

                        // Mark connection as active
                        connection.active = true;
                        setTimeout(() => {
                            connection.active = false;
                        }, 500);

                        // Update traffic volume
                        stats.trafficVolume += 1;
                    }
                }

                // Update stats display
                updateStats();
            }

            // Find a connection between two nodes
            function findConnection(sourceId, targetId) {
                return connections.find(conn =>
                    (conn.source === sourceId && conn.target === targetId) ||
                    (conn.source === targetId && conn.target === sourceId)
                );
            }

            // Create a data packet
            function createPacket(sourceId, targetId, type = 'normal') {
                const source = nodes[sourceId];
                const target = nodes[targetId];

                if (!source || !target) return;

                packets.push({
                    sourceId: sourceId,
                    targetId: targetId,
                    x: source.x,
                    y: source.y,
                    progress: 0,
                    speed: Math.random() * 0.01 + 0.005,
                    type: type,
                    size: type === 'attack' ? 3 : 2
                });
            }

            // Start a DDoS attack
            function launchDDoSAttack() {
                // Find external node
                const externalNode = nodes.find(node => node.type === NODE_TYPES.EXTERNAL);
                if (!externalNode) return;

                addLogEntry('DDoS attack detected from Internet Gateway!', 'danger');

                // Create attack object
                const attack = {
                    type: 'ddos',
                    sourceId: externalNode.id,
                    targetIds: [],
                    active: true,
                    startTime: Date.now(),
                    duration: 10000, // 10 seconds
                    packetRate: 5,
                    interval: null
                };

                // Find connected nodes to target
                const connectedNodes = nodes.filter(node =>
                    connections.some(conn =>
                        (conn.source === externalNode.id && conn.target === node.id) ||
                        (conn.source === node.id && conn.target === externalNode.id)
                    )
                );

                if (connectedNodes.length === 0) {
                    addLogEntry('DDoS attack failed: No connected targets', 'warning');
                    return;
                }

                attack.targetIds = connectedNodes.map(node => node.id);

                // Start sending attack packets
                attack.interval = setInterval(() => {
                    // If security measure (firewall) is enabled, reduce packet rate
                    if (securityMeasures.firewall) {
                        if (Math.random() > 0.7) {
                            // Create attack packet to random target
                            const targetId = attack.targetIds[Math.floor(Math.random() * attack.targetIds.length)];
                            createPacket(attack.sourceId, targetId, 'attack');
                        }
                    } else {
                        // Create multiple attack packets
                        for (let i = 0; i < attack.packetRate; i++) {
                            const targetId = attack.targetIds[Math.floor(Math.random() * attack.targetIds.length)];
                            createPacket(attack.sourceId, targetId, 'attack');
                        }

                        // Reduce security level
                        stats.securityLevel = Math.max(0, stats.securityLevel - 1);

                        // Update connection status
                        attack.targetIds.forEach(targetId => {
                            const connection = findConnection(attack.sourceId, targetId);
                            if (connection) {
                                connection.status = 'attack';
                            }
                        });
                    }

                    // Update stats
                    stats.incidentCount++;
                    updateStats();

                    // Stop after duration
                    if (Date.now() - attack.startTime >= attack.duration) {
                        clearInterval(attack.interval);
                        attack.active = false;

                        // Reset connection status
                        attack.targetIds.forEach(targetId => {
                            const connection = findConnection(attack.sourceId, targetId);
                            if (connection) {
                                connection.status = 'normal';
                            }
                        });

                        addLogEntry('DDoS attack stopped', securityMeasures.firewall ? 'success' : 'info');
                    }
                }, 200);

                attacks.push(attack);
            }

            // Launch a malware attack
            function launchMalwareAttack() {
                // Choose a random vulnerable node as the initial target
                const vulnerableNodes = nodes.filter(node => node.type === NODE_TYPES.VULNERABLE);

                if (vulnerableNodes.length === 0) {
                    addLogEntry('Malware attack failed: No vulnerable nodes detected', 'success');
                    return;
                }

                const initialTarget = vulnerableNodes[Math.floor(Math.random() * vulnerableNodes.length)];

                // Find a path to the initial target, preferably from external node
                const externalNode = nodes.find(node => node.type === NODE_TYPES.EXTERNAL);
                const sourceNode = externalNode || nodes[Math.floor(Math.random() * nodes.length)];

                if (sourceNode.id === initialTarget.id) {
                    // Try again if source and target are the same
                    launchMalwareAttack();
                    return;
                }

                addLogEntry(`Malware injection detected from ${sourceNode.name} targeting ${initialTarget.name}!`, 'danger');

                // Create attack object
                const attack = {
                    type: 'malware',
                    sourceId: sourceNode.id,
                    initialTargetId: initialTarget.id,
                    infectedNodes: [],
                    active: true,
                    startTime: Date.now(),
                    duration: 15000, // 15 seconds
                    interval: null,
                    propagationInterval: null
                };

                // Send malware packet
                createPacket(attack.sourceId, attack.initialTargetId, 'attack');

                // Set timeout to infect initial node
                setTimeout(() => {
                    // Check if IDS/IPS blocked it
                    if (securityMeasures.ids && Math.random() < 0.7) {
                        addLogEntry(`IDS/IPS blocked malware infection on ${initialTarget.name}`, 'success');
                        return;
                    }

                    // Infect the initial target
                    if (initialTarget.type !== NODE_TYPES.SECURITY) {
                        initialTarget.type = NODE_TYPES.COMPROMISED;
                        attack.infectedNodes.push(initialTarget.id);
                        addLogEntry(`${initialTarget.name} has been infected with malware`, 'danger');

                        // Reduce security level
                        stats.securityLevel = Math.max(0, stats.securityLevel - 5);
                        stats.incidentCount++;
                        updateStats();

                        // Start malware propagation if no patching
                        if (!securityMeasures.patched) {
                            attack.propagationInterval = setInterval(() => {
                                propagateMalware(attack);
                            }, 2000);
                        }
                    }
                }, 1000);

                // Set timeout to end attack
                setTimeout(() => {
                    attack.active = false;
                    if (attack.propagationInterval) {
                        clearInterval(attack.propagationInterval);
                    }

                    // If not patched, leave nodes compromised
                    if (securityMeasures.patched) {
                        // Restore infected nodes
                        attack.infectedNodes.forEach(nodeId => {
                            const node = nodes.find(n => n.id === nodeId);
                            if (node) {
                                node.type = NODE_TYPES.VULNERABLE;
                            }
                        });
                        addLogEntry('Malware removed from all infected systems', 'success');
                    } else {
                        addLogEntry('Malware attack completed, systems remain compromised', 'warning');
                    }
                }, attack.duration);

                attacks.push(attack);
            }

            // Propagate malware to connected nodes
            function propagateMalware(attack) {
                if (!attack.active) return;

                // For each infected node, try to infect connected nodes
                attack.infectedNodes.forEach(infectedId => {
                    // Find connected nodes
                    const connectedNodeIds = [];
                    connections.forEach(conn => {
                        if (conn.source === infectedId && !attack.infectedNodes.includes(conn.target)) {
                            connectedNodeIds.push(conn.target);
                        } else if (conn.target === infectedId && !attack.infectedNodes.includes(conn.source)) {
                            connectedNodeIds.push(conn.source);
                        }
                    });

                    // Try to infect a random connected node
                    if (connectedNodeIds.length > 0) {
                        const targetId = connectedNodeIds[Math.floor(Math.random() * connectedNodeIds.length)];
                        const targetNode = nodes.find(n => n.id === targetId);

                        // Only vulnerable nodes can be infected
                        if (targetNode && (targetNode.type === NODE_TYPES.VULNERABLE || (!securityMeasures.patched && Math.random() < 0.3))) {
                            // Send malware packet
                            createPacket(infectedId, targetId, 'attack');

                            // Check if IDS/IPS blocks it
                            if (securityMeasures.ids && Math.random() < 0.8) {
                                addLogEntry(`IDS/IPS blocked malware propagation to ${targetNode.name}`, 'success');
                                return;
                            }

                            // Set timeout to infect target
                            setTimeout(() => {
                                if (targetNode.type !== NODE_TYPES.SECURITY && targetNode.type !== NODE_TYPES.EXTERNAL) {
                                    targetNode.type = NODE_TYPES.COMPROMISED;
                                    attack.infectedNodes.push(targetId);
                                    addLogEntry(`Malware propagated to ${targetNode.name}`, 'danger');

                                    // Reduce security level
                                    stats.securityLevel = Math.max(0, stats.securityLevel - 2);
                                    stats.incidentCount++;
                                    updateStats();
                                }
                            }, 1000);
                        }
                    }
                });
            }

            // Launch a brute force attack on a random node
            function launchBruteForceAttack() {
                // Choose a random node as target
                const potentialTargets = nodes.filter(node =>
                    node.type !== NODE_TYPES.EXTERNAL &&
                    node.type !== NODE_TYPES.SECURITY &&
                    node.type !== NODE_TYPES.COMPROMISED
                );

                if (potentialTargets.length === 0) {
                    addLogEntry('Brute force attack failed: No suitable targets', 'warning');
                    return;
                }

                const targetNode = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

                // Choose source node (preferably external)
                const externalNode = nodes.find(node => node.type === NODE_TYPES.EXTERNAL);
                const sourceNode = externalNode || nodes[Math.floor(Math.random() * nodes.length)];

                if (sourceNode.id === targetNode.id) {
                    // Try again if source and target are the same
                    launchBruteForceAttack();
                    return;
                }

                addLogEntry(`Brute force attack detected from ${sourceNode.name} targeting ${targetNode.name}!`, 'warning');

                // Create attack object
                const attack = {
                    type: 'bruteforce',
                    sourceId: sourceNode.id,
                    targetId: targetNode.id,
                    active: true,
                    startTime: Date.now(),
                    duration: 8000, // 8 seconds
                    attempts: 0,
                    maxAttempts: 20,
                    interval: null,
                    success: false
                };

                // Find connection or create temporary one
                let connection = findConnection(sourceNode.id, targetNode.id);
                let isTemporary = false;

                if (!connection) {
                    // Create temporary connection for visualization
                    connection = {
                        source: sourceNode.id,
                        target: targetNode.id,
                        active: false,
                        status: 'attack',
                        width: 1,
                        temporary: true
                    };
                    connections.push(connection);
                    isTemporary = true;
                } else {
                    connection.status = 'attack';
                }

                // Start brute force attempts
                attack.interval = setInterval(() => {
                    // Send attack packet
                    createPacket(attack.sourceId, attack.targetId, 'attack');

                    attack.attempts++;

                    // Check for successful breach
                    let breachProbability = targetNode.type === NODE_TYPES.VULNERABLE ? 0.15 : 0.05;

                    // Adjust probability based on security measures
                    if (securityMeasures.firewall) breachProbability *= 0.5;
                    if (securityMeasures.ids) breachProbability *= 0.3;

                    if (Math.random() < breachProbability) {
                        // Successful breach
                        attack.success = true;
                        clearInterval(attack.interval);

                        if (targetNode.type !== NODE_TYPES.COMPROMISED) {
                            targetNode.type = NODE_TYPES.COMPROMISED;
                            addLogEntry(`Brute force attack successful! ${targetNode.name} has been compromised`, 'danger');

                            // Reduce security level
                            stats.securityLevel = Math.max(0, stats.securityLevel - 10);
                            stats.incidentCount++;
                            updateStats();
                        }
                    }

                    // End attack if max attempts reached or duration elapsed
                    if (attack.attempts >= attack.maxAttempts || Date.now() - attack.startTime >= attack.duration) {
                        clearInterval(attack.interval);
                        attack.active = false;

                        // Reset connection status
                        if (isTemporary) {
                            // Remove temporary connection
                            connections = connections.filter(c => !c.temporary);
                        } else {
                            connection.status = 'normal';
                        }

                        if (!attack.success) {
                            addLogEntry(`Brute force attack on ${targetNode.name} failed after ${attack.attempts} attempts`, securityMeasures.firewall ? 'success' : 'info');
                        }
                    }
                }, 400);

                attacks.push(attack);
            }

            // Deploy a firewall
            function deployFirewall() {
                if (securityMeasures.firewall) {
                    addLogEntry('Firewall already active', 'info');
                    return;
                }

                securityMeasures.firewall = true;
                addLogEntry('Firewall deployed. External traffic filtering enabled.', 'success');

                // Create security node for firewall
                const externalNode = nodes.find(node => node.type === NODE_TYPES.EXTERNAL);

                if (externalNode) {
                    // Place firewall near external node
                    const firewallNode = {
                        id: nodes.length,
                        x: externalNode.x + 50,
                        y: externalNode.y,
                        radius: 12,
                        type: NODE_TYPES.SECURITY,
                        name: 'Firewall',
                        description: 'Network traffic filtering device',
                        vulnerabilities: 0,
                        compromised: false,
                        vx: 0,
                        vy: 0
                    };

                    nodes.push(firewallNode);

                    // Connect firewall to external node
                    connections.push({
                        source: externalNode.id,
                        target: firewallNode.id,
                        active: false,
                        status: 'secure',
                        width: 2
                    });

                    // Find all connections from external node and redirect through firewall
                    const externalConnections = connections.filter(conn =>
                        conn.source === externalNode.id || conn.target === externalNode.id
                    );

                    externalConnections.forEach(conn => {
                        const otherNodeId = conn.source === externalNode.id ? conn.target : conn.source;

                        // Skip if it's the firewall itself
                        if (otherNodeId === firewallNode.id) return;

                        // Create connection from firewall to internal node
                        connections.push({
                            source: firewallNode.id,
                            target: otherNodeId,
                            active: false,
                            status: 'secure',
                            width: 1.5
                        });
                    });
                }

                // Improve security level
                stats.securityLevel = Math.min(100, stats.securityLevel + 20);
                updateStats();
            }

            // Enable IDS/IPS
            function enableIDS() {
                if (securityMeasures.ids) {
                    addLogEntry('IDS/IPS already active', 'info');
                    return;
                }

                securityMeasures.ids = true;
                addLogEntry('Intrusion Detection/Prevention System enabled. Traffic monitoring active.', 'success');

                // Create IDS node
                const x = canvas.width * 0.5;
                const y = canvas.height * 0.2;

                const idsNode = {
                    id: nodes.length,
                    x: x,
                    y: y,
                    radius: 12,
                    type: NODE_TYPES.SECURITY,
                    name: 'IDS/IPS',
                    description: 'Intrusion Detection and Prevention System',
                    vulnerabilities: 0,
                    compromised: false,
                    vx: 0,
                    vy: 0
                };

                nodes.push(idsNode);

                // Connect IDS to some random nodes for monitoring
                const nodesToConnect = Math.min(5, nodes.length - 1);
                const availableNodes = nodes.filter(node => node.id !== idsNode.id);

                for (let i = 0; i < nodesToConnect; i++) {
                    if (availableNodes.length === 0) break;

                    const randomIndex = Math.floor(Math.random() * availableNodes.length);
                    const targetNode = availableNodes[randomIndex];

                    connections.push({
                        source: idsNode.id,
                        target: targetNode.id,
                        active: false,
                        status: 'secure',
                        width: 1
                    });

                    // Remove node from available list
                    availableNodes.splice(randomIndex, 1);
                }

                // Improve security level
                stats.securityLevel = Math.min(100, stats.securityLevel + 25);
                updateStats();
            }

            // Patch vulnerabilities
            function patchVulnerabilities() {
                if (securityMeasures.patched) {
                    addLogEntry('Systems already patched', 'info');
                    return;
                }

                securityMeasures.patched = true;
                addLogEntry('Vulnerability patching initiated. Securing vulnerable systems...', 'success');

                // Count vulnerable and compromised nodes
                const vulnerableNodes = nodes.filter(node => node.type === NODE_TYPES.VULNERABLE);
                const compromisedNodes = nodes.filter(node => node.type === NODE_TYPES.COMPROMISED);

                // Patch vulnerable nodes
                vulnerableNodes.forEach(node => {
                    // Simulate gradual patching
                    setTimeout(() => {
                        node.type = NODE_TYPES.SECURE;
                        node.vulnerabilities = 0;
                        addLogEntry(`${node.name} patched and secured`, 'success');
                    }, Math.random() * 3000);
                });

                // Recover compromised nodes
                compromisedNodes.forEach(node => {
                    // Simulate gradual recovery
                    setTimeout(() => {
                        node.type = NODE_TYPES.SECURE;
                        node.vulnerabilities = 0;
                        node.compromised = false;
                        addLogEntry(`${node.name} recovered from compromise and secured`, 'success');
                    }, 1000 + Math.random() * 4000);
                });

                // Improve security level
                stats.securityLevel = Math.min(100, stats.securityLevel + 30);
                updateStats();
            }

            // Update statistics
            function updateStats() {
                // Update node count
                stats.nodeCount = nodes.length;
                nodeCountEl.textContent = stats.nodeCount;

                // Update traffic volume (with decay)
                stats.trafficVolume = Math.max(0, stats.trafficVolume - 1);
                trafficVolumeEl.textContent = stats.trafficVolume;

                // Update security level
                securityLevelEl.textContent = stats.securityLevel + '%';

                // Update incident count
                incidentCountEl.textContent = stats.incidentCount;

                // Update stat card classes based on values
                if (stats.securityLevel < 30) {
                    securityStatEl.className = 'stat-card stat-danger';
                } else if (stats.securityLevel < 70) {
                    securityStatEl.className = 'stat-card stat-warning';
                } else {
                    securityStatEl.className = 'stat-card stat-normal';
                }

                if (stats.incidentCount > 50) {
                    incidentStatEl.className = 'stat-card stat-danger';
                } else if (stats.incidentCount > 20) {
                    incidentStatEl.className = 'stat-card stat-warning';
                } else {
                    incidentStatEl.className = 'stat-card stat-normal';
                }
            }

            // Add log entry
            function addLogEntry(message, type = 'info') {
                const now = new Date();
                const timestamp = [
                    now.getHours().toString().padStart(2, '0'),
                    now.getMinutes().toString().padStart(2, '0'),
                    now.getSeconds().toString().padStart(2, '0')
                ].join(':');

                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';

                const timestampSpan = document.createElement('span');
                timestampSpan.className = 'log-timestamp';
                timestampSpan.textContent = `[${timestamp}]`;

                const messageSpan = document.createElement('span');
                messageSpan.className = `log-${type}`;
                messageSpan.textContent = ' ' + message;

                logEntry.appendChild(timestampSpan);
                logEntry.appendChild(messageSpan);

                logsContainer.appendChild(logEntry);
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }

            // Handle mouse move
            function handleMouseMove(event) {
                const rect = canvas.getBoundingClientRect();
                mousePos.x = event.clientX - rect.left;
                mousePos.y = event.clientY - rect.top;

                // Update tooltip position
                tooltip.style.left = (event.clientX + 10) + 'px';
                tooltip.style.top = (event.clientY + 10) + 'px';

                // Check if mouse is over a node
                const hoveredNode = nodes.find(node => {
                    const dx = mousePos.x - node.x;
                    const dy = mousePos.y - node.y;
                    return Math.sqrt(dx * dx + dy * dy) <= node.radius;
                });

                if (hoveredNode) {
                    // Show tooltip
                    tooltip.innerHTML = `
                        <strong>${hoveredNode.name}</strong><br>
                        Type: ${hoveredNode.type}<br>
                        ${hoveredNode.description}<br>
                        ${hoveredNode.vulnerabilities > 0 ? 'Vulnerabilities: ' + hoveredNode.vulnerabilities : ''}
                    `;
                    tooltip.style.opacity = '1';

                    // Change cursor
                    canvas.style.cursor = 'pointer';
                } else {
                    // Hide tooltip
                    tooltip.style.opacity = '0';

                    // Reset cursor
                    canvas.style.cursor = isDragging ? 'grabbing' : 'default';
                }

                // Handle dragging
                if (isDragging && selectedNode !== null) {
                    nodes[selectedNode].x = mousePos.x;
                    nodes[selectedNode].y = mousePos.y;
                    nodes[selectedNode].vx = 0;
                    nodes[selectedNode].vy = 0;
                }
            }

            // Handle mouse down
            function handleMouseDown(event) {
                // Check if clicking on a node
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const dx = mousePos.x - node.x;
                    const dy = mousePos.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= node.radius) {
                        isDragging = true;
                        selectedNode = i;
                        canvas.style.cursor = 'grabbing';
                        break;
                    }
                }
            }

            // Handle mouse up
            function handleMouseUp() {
                isDragging = false;
                selectedNode = null;
                canvas.style.cursor = 'default';
            }

            // Handle click
            function handleClick() {
                // Check if clicking on a node
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const dx = mousePos.x - node.x;
                    const dy = mousePos.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= node.radius) {
                        // Log node information
                        addLogEntry(`Selected node: ${node.name} (${node.type})`, 'info');

                        // Display additional info depending on node type
                        if (node.type === NODE_TYPES.VULNERABLE) {
                            addLogEntry(`Warning: ${node.name} has ${node.vulnerabilities} vulnerabilities`, 'warning');
                        } else if (node.type === NODE_TYPES.COMPROMISED) {
                            addLogEntry(`Alert: ${node.name} is compromised!`, 'danger');
                        } else if (node.type === NODE_TYPES.SECURITY) {
                            addLogEntry(`${node.name} is actively monitoring network traffic`, 'success');
                        }

                        break;
                    }
                }
            }

            // Animation loop
            function animate() {
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw connections
                connections.forEach(connection => {
                    const source = nodes[connection.source];
                    const target = nodes[connection.target];

                    if (!source || !target) return;

                    // Determine connection color based on status
                    let color;
                    if (connection.status === 'attack') {
                        color = COLORS.CONNECTION_ATTACK;
                    } else if (connection.status === 'secure') {
                        color = COLORS.CONNECTION_SECURE;
                    } else {
                        color = connection.active ? COLORS.CONNECTION_ACTIVE : COLORS.CONNECTION_NORMAL;
                    }

                    // Draw connection line
                    ctx.beginPath();
                    ctx.moveTo(source.x, source.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = connection.width;
                    ctx.stroke();
                });

                // Draw nodes
                nodes.forEach(node => {
                    // Draw node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                    ctx.fillStyle = COLORS[node.type];
                    ctx.fill();

                    // Draw security indicator for security devices
                    if (node.type === NODE_TYPES.SECURITY) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(156, 39, 176, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                    // Draw alert indicator for compromised nodes
                    if (node.type === NODE_TYPES.COMPROMISED) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(244, 67, 54, 0.5)';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([2, 2]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }

                    // Apply slight movement to nodes
                    if (node.id !== selectedNode) {
                        node.x += node.vx;
                        node.y += node.vy;

                        // Boundary check
                        if (node.x < node.radius || node.x > canvas.width - node.radius) {
                            node.vx = -node.vx;
                        }
                        if (node.y < node.radius || node.y > canvas.height - node.radius) {
                            node.vy = -node.vy;
                        }
                    }
                });

                // Update and draw packets
                for (let i = packets.length - 1; i >= 0; i--) {
                    const packet = packets[i];
                    const source = nodes[packet.sourceId];
                    const target = nodes[packet.targetId];

                    if (!source || !target) {
                        packets.splice(i, 1);
                        continue;
                    }

                    // Update position along path
                    packet.progress += packet.speed;

                    if (packet.progress >= 1) {
                        // Packet reached destination
                        packets.splice(i, 1);

                        // If it's an attack packet and reaches a vulnerable node, potentially compromise it
                        if (packet.type === 'attack' && target.type === NODE_TYPES.VULNERABLE && !securityMeasures.patched) {
                            // Small chance to compromise on contact
                            if (Math.random() < 0.1) {
                                target.type = NODE_TYPES.COMPROMISED;
                                addLogEntry(`${target.name} has been compromised by direct attack!`, 'danger');

                                // Reduce security level
                                stats.securityLevel = Math.max(0, stats.securityLevel - 5);
                                stats.incidentCount++;
                                updateStats();
                            }
                        }
                    } else {
                        // Draw packet
                        packet.x = source.x + (target.x - source.x) * packet.progress;
                        packet.y = source.y + (target.y - source.y) * packet.progress;

                        ctx.beginPath();
                        ctx.arc(packet.x, packet.y, packet.size || 2, 0, Math.PI * 2);
                        ctx.fillStyle = packet.type === 'attack' ? COLORS.PACKET_MALICIOUS : COLORS.PACKET_NORMAL;
                        ctx.fill();
                    }
                }

                // Request next animation frame
                requestAnimationFrame(animate);
            }

            // Event listeners for UI controls
            nodeSlider.addEventListener('input', function() {
                nodeSliderValue.textContent = this.value;
            });

            vulnerabilitySlider.addEventListener('input', function() {
                vulnerabilitySliderValue.textContent = this.value + '%';
            });

            trafficSlider.addEventListener('input', function() {
                trafficSliderValue.textContent = this.value;
            });

            addNodeBtn.addEventListener('click', function() {
                const node = createNode();
                // Create some connections for the new node
                const connectionsCount = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < connectionsCount; i++) {
                    const targetIndex = Math.floor(Math.random() * nodes.length);
                    if (targetIndex !== node.id) {
                        connections.push({
                            source: node.id,
                            target: targetIndex,
                            active: false,
                            status: 'normal',
                            width: Math.random() * 1.5 + 0.5
                        });
                    }
                }

                addLogEntry(`New node added: ${node.name}`, 'info');
                updateStats();
            });

            addSecurityBtn.addEventListener('click', function() {
                // Create security device node
                const node = createNode(NODE_TYPES.SECURITY);
                node.name = 'Security Device';
                node.description = 'Network security monitoring device';

                // Create connections to vulnerable nodes
                const vulnerableNodes = nodes.filter(n => n.type === NODE_TYPES.VULNERABLE || n.type === NODE_TYPES.COMPROMISED);

                vulnerableNodes.slice(0, 5).forEach(vulnerableNode => {
                    connections.push({
                        source: node.id,
                        target: vulnerableNode.id,
                        active: false,
                        status: 'secure',
                        width: 1.5
                    });
                });

                addLogEntry(`Security device added: ${node.name}`, 'success');

                // Improve security level
                stats.securityLevel = Math.min(100, stats.securityLevel + 10);
                updateStats();
            });

            resetBtn.addEventListener('click', function() {
                createNetwork(parseInt(nodeSlider.value));
                addLogEntry('Network reset with new configuration', 'info');
            });

            ddosBtn.addEventListener('click', function() {
                launchDDoSAttack();
            });

            malwareBtn.addEventListener('click', function() {
                launchMalwareAttack();
            });

            bruteForceBtn.addEventListener('click', function() {
                launchBruteForceAttack();
            });

            firewallBtn.addEventListener('click', function() {
                deployFirewall();
            });

            idsBtn.addEventListener('click', function() {
                enableIDS();
            });

            patchBtn.addEventListener('click', function() {
                patchVulnerabilities();
            });

            // Initialize canvas and start simulation
            initCanvas();
        });