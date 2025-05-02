        document.addEventListener('DOMContentLoaded', function() {
            // Tab switching functionality
            const tabs = document.querySelectorAll('.sandbox-tab');
            const tabContents = {
                'iam': document.getElementById('iam-tab'),
                'security-groups': document.getElementById('security-groups-tab'),
                'monitoring': document.getElementById('monitoring-tab'),
                'incident-response': document.getElementById('incident-response-tab'),
                'storage-security': document.getElementById('storage-security-tab')
            };

            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs and contents
                    tabs.forEach(t => t.classList.remove('active'));
                    Object.values(tabContents).forEach(content => {
                        if (content) content.classList.remove('active');
                    });

                    // Add active class to clicked tab and corresponding content
                    this.classList.add('active');
                    const tabName = this.getAttribute('data-tab');
                    if (tabContents[tabName]) {
                        tabContents[tabName].classList.add('active');
                    }
                });
            });

            // IAM Configuration Functionality
            const createRoleBtn = document.getElementById('create-role');
            let iamScore = 0;
            let iamObjectives = 0;

            if (createRoleBtn) {
                createRoleBtn.addEventListener('click', function() {
                    const roleName = document.getElementById('role-name').value;
                    const serviceAccess = document.getElementById('service-access');
                    const selectedServices = Array.from(serviceAccess.selectedOptions).map(option => option.value);
                    const permissionLevel = document.querySelector('input[name="permission"]:checked');
                    const mfaRequired = document.getElementById('mfa-required').value;

                    // Simple validation
                    if (!roleName) {
                        alert('Please enter a role name');
                        return;
                    }

                    if (selectedServices.length === 0) {
                        alert('Please select at least one service');
                        return;
                    }

                    if (!permissionLevel) {
                        alert('Please select a permission level');
                        return;
                    }

                    // Calculate score based on selections
                    let roleScore = 0;

                    // Least privilege principle score
                    if (permissionLevel.value === 'read-only') {
                        roleScore += 30;
                    } else if (permissionLevel.value === 'read-write') {
                        roleScore += 20;
                    } else if (permissionLevel.value === 'full-access') {
                        roleScore += 10;
                    }

                    // MFA score
                    if (mfaRequired === 'yes') {
                        roleScore += 30;
                    }

                    // Service selection score
                    if (selectedServices.length <= 3) {
                        roleScore += 20; // Better segregation of duties
                    } else if (selectedServices.length <= 5) {
                        roleScore += 10;
                    }

                    // Time restriction score
                    const timeRestriction = document.getElementById('time-restriction').value;
                    if (timeRestriction !== 'none') {
                        roleScore += 20;
                    }

                    // Update overall IAM score
                    iamScore = Math.min(100, Math.max(iamScore, roleScore));
                    iamObjectives = Math.min(5, Math.ceil(iamScore / 20));

                    // Update UI
                    document.getElementById('iam-score').textContent = iamScore + '%';
                    document.getElementById('iam-objectives').textContent = iamObjectives + '/5';
                    document.querySelector('#iam-tab .progress-fill').style.width = iamScore + '%';

                    // Feedback
                    alert(`Role "${roleName}" created successfully with a security score of ${roleScore}%.`);

                    // Reset form
                    document.getElementById('role-name').value = '';
                    document.getElementById('role-description').value = '';
                    Array.from(serviceAccess.options).forEach(option => option.selected = false);
                    if (permissionLevel) permissionLevel.checked = false;
                });
            }

            // Incident Response functionality
            window.simulateResponse = function(incidentType) {
                let responseOptions = [];
                let correctOption = '';

                switch(incidentType) {
                    case 'api-calls':
                        responseOptions = [
                            'Monitor the activity for further information',
                            'Revoke the active session and rotate IAM credentials',
                            'Disable the user account and investigate',
                            'Contact the user to verify the activity'
                        ];
                        correctOption = 'Revoke the active session and rotate IAM credentials';
                        break;
                    case 'security-group':
                        responseOptions = [
                            'Leave it as is - the developer probably needs this access',
                            'Modify the security group to restrict access to specific IPs',
                            'Document the change for security review later',
                            'Delete the security group completely'
                        ];
                        correctOption = 'Modify the security group to restrict access to specific IPs';
                        break;
                    case 's3-activity':
                        responseOptions = [
                            'Ignore the alert as it involves a service account',
                            'Block all access to the bucket temporarily',
                            'Investigate the access pattern and verify with analytics team',
                            'Delete the downloaded files'
                        ];
                        correctOption = 'Investigate the access pattern and verify with analytics team';
                        break;
                }

                // Simple dialog for response options
                const responseDialog = document.createElement('div');
                responseDialog.style.position = 'fixed';
                responseDialog.style.top = '50%';
                responseDialog.style.left = '50%';
                responseDialog.style.transform = 'translate(-50%, -50%)';
                responseDialog.style.backgroundColor = 'white';
                responseDialog.style.padding = '20px';
                responseDialog.style.borderRadius = '5px';
                responseDialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
                responseDialog.style.zIndex = '1000';
                responseDialog.style.maxWidth = '600px';
                responseDialog.style.width = '90%';

                const dialogTitle = document.createElement('h3');
                dialogTitle.textContent = 'Select Response Action';
                dialogTitle.style.marginBottom = '15px';
                responseDialog.appendChild(dialogTitle);

                const optionsList = document.createElement('div');
                optionsList.style.marginBottom = '20px';

                responseOptions.forEach((option, index) => {
                    const optionItem = document.createElement('div');
                    optionItem.style.marginBottom = '10px';

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'response-option';
                    radio.id = `option-${index}`;
                    radio.value = option;

                    const label = document.createElement('label');
                    label.htmlFor = `option-${index}`;
                    label.textContent = option;
                    label.style.marginLeft = '10px';

                    optionItem.appendChild(radio);
                    optionItem.appendChild(label);
                    optionsList.appendChild(optionItem);
                });

                responseDialog.appendChild(optionsList);

                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.justifyContent = 'space-between';

                const submitButton = document.createElement('button');
                submitButton.textContent = 'Submit Response';
                submitButton.className = 'btn';
                submitButton.addEventListener('click', function() {
                    const selectedOption = document.querySelector('input[name="response-option"]:checked');

                    if (!selectedOption) {
                        alert('Please select a response action');
                        return;
                    }

                    // Check if the selected option is correct
                    if (selectedOption.value === correctOption) {
                        // Increment score
                        const incidentScoreEl = document.getElementById('incident-score');
                        const incidentResolvedEl = document.getElementById('incident-resolved');
                        const currentScore = parseInt(incidentScoreEl.textContent);
                        const currentResolved = parseInt(incidentResolvedEl.textContent.split('/')[0]);

                        const newResolved = currentResolved + 1;
                        const newScore = Math.min(100, Math.round((newResolved / 3) * 100));

                        incidentScoreEl.textContent = newScore + '%';
                        incidentResolvedEl.textContent = `${newResolved}/3`;
                        document.querySelector('#incident-response-tab .progress-fill').style.width = newScore + '%';

                        alert('Correct response! You have effectively mitigated the security risk.');
                    } else {
                        alert('This response may not be the most effective for this situation. Consider the security implications carefully.');
                    }

                    // Close the dialog
                    document.body.removeChild(responseDialog);
                    document.body.removeChild(overlay);
                });

                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.className = 'btn';
                cancelButton.style.backgroundColor = '#6c757d';
                cancelButton.addEventListener('click', function() {
                    document.body.removeChild(responseDialog);
                    document.body.removeChild(overlay);
                });

                buttonContainer.appendChild(cancelButton);
                buttonContainer.appendChild(submitButton);
                responseDialog.appendChild(buttonContainer);

                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = 0;
                overlay.style.left = 0;
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
                overlay.style.zIndex = 999;

                document.body.appendChild(overlay);
                document.body.appendChild(responseDialog);
            };

            // Storage security configuration
            const applyStorageConfigBtn = document.getElementById('apply-storage-config');

            if (applyStorageConfigBtn) {
                applyStorageConfigBtn.addEventListener('click', function() {
                    const encryptionType = document.getElementById('encryption-type').value;
                    const keyRotation = document.getElementById('key-rotation').value;
                    const bucketPolicy = document.getElementById('bucket-policy').value;
                    const controls = document.querySelectorAll('input[name="storage-controls"]:checked');
                    const classifications = document.querySelectorAll('input[name="classification"]:checked');
                    const classifyAction = document.getElementById('classify-action').value;

                    // Calculate score based on selections
                    let storageScore = 0;

                    // Encryption score
                    if (encryptionType === 'client-side' || encryptionType === 'customer-key') {
                        storageScore += 25;
                    } else if (encryptionType === 'server-side') {
                        storageScore += 15;
                    }

                    // Key rotation score
                    if (keyRotation !== 'none') {
                        storageScore += 15;
                    }

                    // Bucket policy score
                    if (bucketPolicy === 'private') {
                        storageScore += 20;
                    } else if (bucketPolicy === 'authenticated-read') {
                        storageScore += 10;
                    }

                    // Controls score
                    storageScore += Math.min(20, controls.length * 5);

                    // Data classification score
                    storageScore += Math.min(20, classifications.length * 5);

                    // Classification action score
                    if (classifyAction === 'encrypt' || classifyAction === 'quarantine') {
                        storageScore += 15;
                    } else if (classifyAction === 'report') {
                        storageScore += 10;
                    } else if (classifyAction === 'tag') {
                        storageScore += 5;
                    }

                    // Calculate final score (max 100)
                    storageScore = Math.min(100, storageScore);
                    const storageObjectives = Math.min(5, Math.ceil(storageScore / 20));

                    // Update UI
                    document.getElementById('storage-score').textContent = storageScore + '%';
                    document.getElementById('storage-objectives').textContent = storageObjectives + '/5';
                    document.querySelector('#storage-security-tab .progress-fill').style.width = storageScore + '%';

                    // Feedback
                    alert(`Storage security configuration applied successfully with a security score of ${storageScore}%.`);
                });
            }

            // Apply monitoring configuration
            const applyMonitoringBtn = document.getElementById('apply-monitoring');

            if (applyMonitoringBtn) {
                applyMonitoringBtn.addEventListener('click', function() {
                    const selectedLogs = document.querySelectorAll('input[name="logs"]:checked');
                    const alertType = document.getElementById('alert-type').value;
                    const alertThreshold = document.getElementById('alert-threshold').value;
                    const notificationMethod = document.getElementById('notification-method').value;
                    const retentionPeriod = document.getElementById('retention-period').value;
                    const encryptLogs = document.getElementById('encryption-enabled').value;

                    // Calculate score based on selections
                    let monitoringScore = 0;

                    // Log selection score
                    monitoringScore += Math.min(40, selectedLogs.length * 8);

                    // Alert configuration score
                    if (alertType && alertThreshold && notificationMethod) {
                        monitoringScore += 20;
                    }

                    // Retention and encryption score
                    if (parseInt(retentionPeriod) >= 90) {
                        monitoringScore += 20;
                    } else if (parseInt(retentionPeriod) >= 30) {
                        monitoringScore += 10;
                    }

                    if (encryptLogs === 'yes') {
                        monitoringScore += 20;
                    }

                    // Calculate final score (max 100)
                    monitoringScore = Math.min(100, monitoringScore);
                    const monitoringObjectives = Math.min(5, Math.ceil(monitoringScore / 20));

                    // Update UI
                    document.getElementById('monitoring-score').textContent = monitoringScore + '%';
                    document.getElementById('monitoring-objectives').textContent = monitoringObjectives + '/5';
                    document.querySelector('#monitoring-tab .progress-fill').style.width = monitoringScore + '%';

                    // Feedback
                    alert(`Monitoring configuration applied successfully with a security score of ${monitoringScore}%.`);
                });
            }

            // Security group rules
            const addRuleWebBtn = document.getElementById('add-rule-web');
            const addRuleDbBtn = document.getElementById('add-rule-db');
            const addRuleAdminBtn = document.getElementById('add-rule-admin');

            let networkScore = 0;
            const updateNetworkScore = () => {
                const webRules = document.querySelectorAll('#web-rules .rule-item').length;
                const dbRules = document.querySelectorAll('#db-rules .rule-item').length;
                const adminRules = document.querySelectorAll('#admin-rules .rule-item').length;

                // Calculate score based on rule count and specific patterns
                // More granular rules = better security
                networkScore = Math.min(100, 20 + webRules * 10 + dbRules * 10 + adminRules * 10);

                const networkObjectives = Math.min(5, Math.ceil(networkScore / 20));

                // Update UI
                document.getElementById('network-score').textContent = networkScore + '%';
                document.getElementById('network-objectives').textContent = networkObjectives + '/5';
                document.querySelector('#security-groups-tab .progress-fill').style.width = networkScore + '%';
            };

            const createSecurityGroupDialog = (groupType) => {
                // Simple dialog for adding rules
                const ruleDialog = document.createElement('div');
                ruleDialog.style.position = 'fixed';
                ruleDialog.style.top = '50%';
                ruleDialog.style.left = '50%';
                ruleDialog.style.transform = 'translate(-50%, -50%)';
                ruleDialog.style.backgroundColor = 'white';
                ruleDialog.style.padding = '20px';
                ruleDialog.style.borderRadius = '5px';
                ruleDialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
                ruleDialog.style.zIndex = '1000';
                ruleDialog.style.maxWidth = '500px';
                ruleDialog.style.width = '90%';

                const dialogTitle = document.createElement('h3');
                dialogTitle.textContent = 'Add Security Group Rule';
                dialogTitle.style.marginBottom = '15px';
                ruleDialog.appendChild(dialogTitle);

                // Protocol selection
                const protocolGroup = document.createElement('div');
                protocolGroup.style.marginBottom = '15px';

                const protocolLabel = document.createElement('label');
                protocolLabel.textContent = 'Protocol:';
                protocolLabel.style.display = 'block';
                protocolLabel.style.marginBottom = '5px';
                protocolGroup.appendChild(protocolLabel);

                const protocolSelect = document.createElement('select');
                protocolSelect.style.width = '100%';
                protocolSelect.style.padding = '8px';
                protocolSelect.style.borderRadius = '4px';
                protocolSelect.style.border = '1px solid #dee2e6';

                const protocols = ['TCP', 'UDP', 'ICMP', 'All'];
                protocols.forEach(protocol => {
                    const option = document.createElement('option');
                    option.value = protocol;
                    option.textContent = protocol;
                    protocolSelect.appendChild(option);
                });

                protocolGroup.appendChild(protocolSelect);
                ruleDialog.appendChild(protocolGroup);

                // Port range
                const portGroup = document.createElement('div');
                portGroup.style.marginBottom = '15px';

                const portLabel = document.createElement('label');
                portLabel.textContent = 'Port Range:';
                portLabel.style.display = 'block';
                portLabel.style.marginBottom = '5px';
                portGroup.appendChild(portLabel);

                const portContainer = document.createElement('div');
                portContainer.style.display = 'flex';
                portContainer.style.gap = '10px';

                const fromPort = document.createElement('input');
                fromPort.type = 'number';
                fromPort.min = '1';
                fromPort.max = '65535';
                fromPort.placeholder = 'From';
                fromPort.style.flex = '1';
                fromPort.style.padding = '8px';
                fromPort.style.borderRadius = '4px';
                fromPort.style.border = '1px solid #dee2e6';

                const toPort = document.createElement('input');
                toPort.type = 'number';
                toPort.min = '1';
                toPort.max = '65535';
                toPort.placeholder = 'To';
                toPort.style.flex = '1';
                toPort.style.padding = '8px';
                toPort.style.borderRadius = '4px';
                toPort.style.border = '1px solid #dee2e6';

                portContainer.appendChild(fromPort);
                portContainer.appendChild(toPort);
                portGroup.appendChild(portContainer);
                ruleDialog.appendChild(portGroup);

                // Source
                const sourceGroup = document.createElement('div');
                sourceGroup.style.marginBottom = '15px';

                const sourceLabel = document.createElement('label');
                sourceLabel.textContent = 'Source:';
                sourceLabel.style.display = 'block';
                sourceLabel.style.marginBottom = '5px';
                sourceGroup.appendChild(sourceLabel);

                const sourceSelect = document.createElement('select');
                sourceSelect.style.width = '100%';
                sourceSelect.style.padding = '8px';
                sourceSelect.style.borderRadius = '4px';
                sourceSelect.style.border = '1px solid #dee2e6';

                const sources = ['Any (0.0.0.0/0)', 'My IP', 'Custom IP', 'Security Group'];
                sources.forEach(source => {
                    const option = document.createElement('option');
                    option.value = source;
                    option.textContent = source;
                    sourceSelect.appendChild(option);
                });

                sourceGroup.appendChild(sourceSelect);
                ruleDialog.appendChild(sourceGroup);

                // Description
                const descGroup = document.createElement('div');
                descGroup.style.marginBottom = '20px';

                const descLabel = document.createElement('label');
                descLabel.textContent = 'Description:';
                descLabel.style.display = 'block';
                descLabel.style.marginBottom = '5px';
                descGroup.appendChild(descLabel);

                const descInput = document.createElement('input');
                descInput.type = 'text';
                descInput.placeholder = 'Rule description';
                descInput.style.width = '100%';
                descInput.style.padding = '8px';
                descInput.style.borderRadius = '4px';
                descInput.style.border = '1px solid #dee2e6';

                descGroup.appendChild(descInput);
                ruleDialog.appendChild(descGroup);

                // Buttons
                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.justifyContent = 'space-between';

                const addButton = document.createElement('button');
                addButton.textContent = 'Add Rule';
                addButton.className = 'btn';
                addButton.addEventListener('click', function() {
                    // Validate
                    if (!fromPort.value || !toPort.value) {
                        alert('Please specify port range');
                        return;
                    }

                    if (!descInput.value) {
                        alert('Please provide a description');
                        return;
                    }

                    // Create rule item
                    const ruleItem = document.createElement('li');
                    ruleItem.className = 'rule-item';

                    const ruleDesc = document.createElement('span');
                    ruleDesc.className = 'rule-desc';
                    ruleDesc.textContent = descInput.value;

                    const editButton = document.createElement('button');
                    editButton.className = 'btn';
                    editButton.textContent = 'Edit';
                    editButton.addEventListener('click', function() {
                        // For simplicity, just allow removing the rule
                        if (confirm('Remove this rule?')) {
                            ruleItem.remove();
                            updateNetworkScore();
                        }
                    });

                    ruleItem.appendChild(ruleDesc);
                    ruleItem.appendChild(editButton);

                    // Add rule to the appropriate list
                    let ruleListId;
                    if (groupType === 'web') {
                        ruleListId = 'web-rules';
                    } else if (groupType === 'db') {
                        ruleListId = 'db-rules';
                    } else if (groupType === 'admin') {
                        ruleListId = 'admin-rules';
                    }

                    document.getElementById(ruleListId).appendChild(ruleItem);

                    // Update score
                    updateNetworkScore();

                    // Close dialog
                    document.body.removeChild(ruleDialog);
                    document.body.removeChild(overlay);
                });

                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.className = 'btn';
                cancelButton.style.backgroundColor = '#6c757d';
                cancelButton.addEventListener('click', function() {
                    document.body.removeChild(ruleDialog);
                    document.body.removeChild(overlay);
                });

                buttonContainer.appendChild(cancelButton);
                buttonContainer.appendChild(addButton);
                ruleDialog.appendChild(buttonContainer);

                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = 0;
                overlay.style.left = 0;
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
                overlay.style.zIndex = 999;

                document.body.appendChild(overlay);
                document.body.appendChild(ruleDialog);
            };

            if (addRuleWebBtn) {
                addRuleWebBtn.addEventListener('click', function() {
                    createSecurityGroupDialog('web');
                });
            }

            if (addRuleDbBtn) {
                addRuleDbBtn.addEventListener('click', function() {
                    createSecurityGroupDialog('db');
                });
            }

            if (addRuleAdminBtn) {
                addRuleAdminBtn.addEventListener('click', function() {
                    createSecurityGroupDialog('admin');
                });
            }

            // Initialize scores
            updateNetworkScore();
        });