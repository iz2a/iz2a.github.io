<link rel="stylesheet" href="styles.css"/>
document.addEventListener('DOMContentLoaded', function () {
    // Create visualization container
    const container = document.getElementById('cyber-visualization');

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

    // Mouse interaction
    let isDragging = false;
    let selectedNode = null;

    svg.addEventListener('mousedown', function (e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Check if clicked on a node
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= node.radius * 2) {
                isDragging = true;
                selectedNode = i;
                break;
            }
        }
    });

    svg.addEventListener('mousemove', function (e) {
        if (isDragging && selectedNode !== null) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            nodes[selectedNode].x = mouseX;
            nodes[selectedNode].y = mouseY;
            nodes[selectedNode].vx = 0;
            nodes[selectedNode].vy = 0;
        }
    });

    svg.addEventListener('mouseup', function () {
        isDragging = false;
        selectedNode = null;
    });

    // Start animation
    animate();
});