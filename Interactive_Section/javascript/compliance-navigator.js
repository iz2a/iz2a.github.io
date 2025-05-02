        document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // ================ FRAMEWORK TAB SWITCHING - FIXED VERSION ================
    const frameworkTabs = document.querySelectorAll('.framework-tab');

    frameworkTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const framework = this.getAttribute('data-framework');

            // Remove active class from all tabs
            frameworkTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all framework contents
            document.querySelectorAll('.framework-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });

            // Show the selected framework content
            if (framework === 'nist') {
                document.getElementById('nist-content').classList.add('active');
                document.getElementById('nist-content').style.display = 'block';
            } else if (framework === 'iso') {
                document.getElementById('iso-content').classList.add('active');
                document.getElementById('iso-content').style.display = 'block';
            } else if (framework === 'cis') {
                document.getElementById('cis-content').classList.add('active');
                document.getElementById('cis-content').style.display = 'block';
            } else if (framework === 'pci') {
                document.getElementById('pci-content').classList.add('active');
                document.getElementById('pci-content').style.display = 'block';
            } else if (framework === 'comparison') {
                document.getElementById('comparison-content').classList.add('active');
                document.getElementById('comparison-content').style.display = 'block';
            }
        });
    });

    // ================ CATEGORY TAB SWITCHING - EACH FRAMEWORK ================
    // NIST Categories
    const nistCategoryTabs = document.querySelectorAll('#nist-content .category-tab');
    nistCategoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            // Remove active class from all NIST category tabs
            nistCategoryTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Update controls title
            const controlsTitle = document.querySelector('#nist-content .controls-title');
            if (controlsTitle) {
                switch(category) {
                    case 'identify':
                        controlsTitle.textContent = 'Identify (ID) Function Controls';
                        break;
                    case 'protect':
                        controlsTitle.textContent = 'Protect (PR) Function Controls';
                        break;
                    case 'detect':
                        controlsTitle.textContent = 'Detect (DE) Function Controls';
                        break;
                    case 'respond':
                        controlsTitle.textContent = 'Respond (RS) Function Controls';
                        break;
                    case 'recover':
                        controlsTitle.textContent = 'Recover (RC) Function Controls';
                        break;
                }
            }
        });
    });

    // ISO Categories
    const isoCategoryTabs = document.querySelectorAll('#iso-content .category-tab');
    isoCategoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            // Remove active class from all ISO category tabs
            isoCategoryTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Update controls title
            const controlsTitle = document.querySelector('#iso-content .controls-title');
            if (controlsTitle) {
                switch(category) {
                    case 'a5':
                        controlsTitle.textContent = 'A5: Information Security Policies';
                        break;
                    case 'a6':
                        controlsTitle.textContent = 'A6: Organization of Information Security';
                        break;
                    case 'a7':
                        controlsTitle.textContent = 'A7: Human Resource Security';
                        break;
                    case 'a8':
                        controlsTitle.textContent = 'A8: Asset Management';
                        break;
                    case 'a9':
                        controlsTitle.textContent = 'A9: Access Control';
                        break;
                    case 'more':
                        controlsTitle.textContent = 'Additional ISO Controls';
                        break;
                }
            }
        });
    });

    // CIS Categories
    const cisCategoryTabs = document.querySelectorAll('#cis-content .category-tab');
    cisCategoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            // Remove active class from all CIS category tabs
            cisCategoryTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Update controls title
            const controlsTitle = document.querySelector('#cis-content .controls-title');
            if (controlsTitle) {
                switch(category) {
                    case 'ig1':
                        controlsTitle.textContent = 'Basic Controls (Implementation Group 1)';
                        break;
                    case 'ig2':
                        controlsTitle.textContent = 'Foundational Controls (Implementation Group 2)';
                        break;
                    case 'ig3':
                        controlsTitle.textContent = 'Organizational Controls (Implementation Group 3)';
                        break;
                }
            }
        });
    });

    // PCI Categories
    const pciCategoryTabs = document.querySelectorAll('#pci-content .category-tab');
    pciCategoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            // Remove active class from all PCI category tabs
            pciCategoryTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Update controls title
            const controlsTitle = document.querySelector('#pci-content .controls-title');
            if (controlsTitle) {
                switch(category) {
                    case 'req1':
                        controlsTitle.textContent = 'Requirement 1: Install and maintain network security controls';
                        break;
                    case 'req2':
                        controlsTitle.textContent = 'Requirement 2: Apply secure configurations';
                        break;
                    case 'req3':
                        controlsTitle.textContent = 'Requirement 3: Protect stored account data';
                        break;
                    case 'req4':
                        controlsTitle.textContent = 'Requirement 4: Protect data in transit';
                        break;
                    case 'more':
                        controlsTitle.textContent = 'Additional PCI DSS Requirements';
                        break;
                }
            }
        });
    });

    // ================ DOWNLOAD & GENERATE FUNCTIONALITY ================
    // Download Template buttons
    document.querySelectorAll('.btn-outline').forEach(button => {
        if (button.innerHTML.includes('Download Template')) {
            button.addEventListener('click', function() {
                const frameworkContent = this.closest('.framework-content');
                let framework = "framework";

                if (frameworkContent) {
                    framework = frameworkContent.id.split('-')[0];
                }

                // Create a sample template file - this would be a real template in production
                const template = generateTemplateData(framework);

                // Create a Blob and download link
                const blob = new Blob([template], {type: 'text/csv'});
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${framework}_compliance_template.csv`;

                // Append to body, click and remove
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();

                alert(`Downloaded ${framework.toUpperCase()} template successfully!`);
            });
        }
    });

    // Generate Report buttons
    document.querySelectorAll('.btn-outline').forEach(button => {
        if (button.innerHTML.includes('Generate Report')) {
            button.addEventListener('click', function() {
                const frameworkContent = this.closest('.framework-content');
                let framework = "framework";

                if (frameworkContent) {
                    framework = frameworkContent.id.split('-')[0];
                }

                // Create a sample report - this would be a real report in production
                const report = generateReportData(framework);

                // Create a Blob and download link
                const blob = new Blob([report], {type: 'text/html'});
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${framework}_compliance_report.html`;

                // Append to body, click and remove
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();

                alert(`Generated ${framework.toUpperCase()} report successfully!`);
            });
        }
    });

    // Add Download Comparison button functionality
    document.querySelectorAll('#comparison-content .btn-outline').forEach(button => {
        button.addEventListener('click', function() {
            // Create a sample comparison report
            const comparisonData = generateComparisonData();

            // Create a Blob and download link
            const blob = new Blob([comparisonData], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'framework_comparison.csv';

            // Append to body, click and remove
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            alert('Framework comparison downloaded successfully!');
        });
    });

    // ================ TABLE CONTROLS FUNCTIONALITY ================
    // Search functionality
    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const parentFramework = this.closest('.framework-content');
            const controlRows = parentFramework.querySelectorAll('.controls-table tbody tr');

            controlRows.forEach(row => {
                const controlId = row.querySelector('.control-id')?.textContent.toLowerCase() || '';
                const controlDesc = row.querySelector('.control-description')?.textContent.toLowerCase() || '';

                if (controlId.includes(searchTerm) || controlDesc.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Status filter functionality
    document.querySelectorAll('.search-filter select').forEach(select => {
        select.addEventListener('change', function() {
            const selectedStatus = this.value.toLowerCase();
            const parentFramework = this.closest('.framework-content');
            const controlRows = parentFramework.querySelectorAll('.controls-table tbody tr');

            controlRows.forEach(row => {
                if (selectedStatus === 'all statuses') {
                    row.style.display = '';
                    return;
                }

                const statusCell = row.querySelector('.control-status');
                if (!statusCell) return;

                const statusBadge = statusCell.querySelector('.status-badge');
                if (!statusBadge) return;

                const rowStatus = statusBadge.textContent.toLowerCase();

                if (rowStatus === selectedStatus.toLowerCase()) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // ================ CONTROL DETAIL VIEW FUNCTIONALITY ================
    // Make all table rows clickable to show control detail
    document.querySelectorAll('.controls-table tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            showControlDetail(this);
        });
    });

    // Detail view close button
    const closeDetailButton = document.querySelector('.detail-close');
    if (closeDetailButton) {
        closeDetailButton.addEventListener('click', function() {
            hideControlDetail();
        });
    }

    // Control assessment form buttons
    const saveButton = document.querySelector('.assessment-form .btn-outline:last-child');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            saveControlAssessment();
        });
    }

    const cancelButton = document.querySelector('.assessment-form .btn-outline:nth-last-child(2)');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            hideControlDetail();
        });
    }

    // Set default active views if none are visible
    if (!document.querySelector('.framework-content.active')) {
        // Set NIST as default active tab
        document.querySelector('.framework-tab[data-framework="nist"]').classList.add('active');
        document.getElementById('nist-content').classList.add('active');
        document.getElementById('nist-content').style.display = 'block';
    }
});

// ================ UTILITY FUNCTIONS ================
// Function to show control detail
function showControlDetail(rowElement) {
    // Remove selected class from all rows
    document.querySelectorAll('.controls-table tbody tr').forEach(row => {
        row.classList.remove('selected');
    });

    // Add selected class to clicked row
    rowElement.classList.add('selected');

    // Get data from the clicked row
    const controlId = rowElement.querySelector('.control-id').textContent;
    const controlDesc = rowElement.querySelector('.control-description').textContent;
    const statusElement = rowElement.querySelector('.status-badge');
    const statusBadge = statusElement ? statusElement.outerHTML : '';
    const lastAssessment = rowElement.querySelector('td:last-child').textContent;

    // Get the control detail element
    const controlDetail = document.getElementById('control-detail');

    // Update control detail with row data
    if (controlDetail) {
        const detailId = controlDetail.querySelector('.detail-id');
        if (detailId) detailId.textContent = controlId;

        const detailName = controlDetail.querySelector('.detail-name');
        if (detailName) detailName.textContent = controlDesc;

        // Update status in detail view
        const detailStatusValue = controlDetail.querySelector('.detail-info .detail-item:nth-child(4) .detail-value');
        if (detailStatusValue && statusBadge) {
            detailStatusValue.innerHTML = statusBadge;
        }

        // Update last assessment date
        const assessmentDateValue = controlDetail.querySelector('.detail-info .detail-item:nth-child(5) .detail-value');
        if (assessmentDateValue) {
            assessmentDateValue.textContent = lastAssessment;
        }

        // Set the form status dropdown to match the current status
        const statusSelect = controlDetail.querySelector('.assessment-form select');
        if (statusSelect && statusElement) {
            const currentStatus = statusElement.textContent;
            for (let i = 0; i < statusSelect.options.length; i++) {
                if (statusSelect.options[i].text === currentStatus) {
                    statusSelect.selectedIndex = i;
                    break;
                }
            }
        }

        // Show the control detail
        controlDetail.style.display = 'block';

        // Scroll to the control detail
        controlDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Function to hide control detail
function hideControlDetail() {
    const controlDetail = document.getElementById('control-detail');
    if (controlDetail) {
        controlDetail.style.display = 'none';

        // Remove selected class from all rows
        document.querySelectorAll('.controls-table tbody tr').forEach(row => {
            row.classList.remove('selected');
        });
    }
}

// Function to save control assessment
function saveControlAssessment() {
    const controlDetail = document.getElementById('control-detail');
    if (!controlDetail) return;

    // Get values from form
    const statusSelect = controlDetail.querySelector('.assessment-form select');
    const assessmentDate = controlDetail.querySelector('.assessment-form input[type="date"]');
    const assessmentNotes = controlDetail.querySelector('.assessment-form textarea');
    const evidenceRefs = controlDetail.querySelector('.assessment-form input[type="text"]');

    if (!statusSelect || !assessmentDate) return;

    // Get the selected row
    const selectedRow = document.querySelector('.controls-table tbody tr.selected');
    if (!selectedRow) return;

    // Update the row with new status
    const statusCell = selectedRow.querySelector('.control-status');
    if (statusCell) {
        const newStatus = statusSelect.options[statusSelect.selectedIndex].text;
        let badgeClass = 'status-badge ';

        switch(newStatus.toLowerCase()) {
            case 'implemented':
                badgeClass += 'implemented';
                break;
            case 'partially implemented':
                badgeClass += 'partial';
                break;
            case 'not implemented':
                badgeClass += 'not-implemented';
                break;
            case 'not applicable':
                badgeClass += 'not-applicable';
                break;
        }

        statusCell.innerHTML = `<span class="${badgeClass}">${newStatus}</span>`;
    }

    // Update the date in the row
    const dateCell = selectedRow.querySelector('td:last-child');
    if (dateCell && assessmentDate.value) {
        // Convert YYYY-MM-DD to MMM DD, YYYY format
        const date = new Date(assessmentDate.value);
        if (!isNaN(date.getTime())) {
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            dateCell.textContent = date.toLocaleDateString('en-US', options);
        }
    }

    // Show success message
    alert('Assessment saved successfully!');

    // Hide the control detail
    hideControlDetail();
}

// ================ DOWNLOAD AND REPORT GENERATION FUNCTIONS ================
// Function to generate template data
function generateTemplateData(framework) {
    let template = '';

    switch(framework) {
        case 'nist':
            template = 'Control ID,Control Name,Description,Status,Assessment Date,Evidence,Notes\n';
            template += 'ID.AM-1,Asset Inventory,Physical devices and systems within the organization are inventoried,Not Implemented,,\n';
            template += 'ID.AM-2,Software Inventory,Software platforms and applications within the organization are inventoried,Not Implemented,,\n';
            template += 'ID.AM-3,Communication Maps,Organizational communication and data flows are mapped,Not Implemented,,\n';
            template += 'ID.AM-4,External Systems,External information systems are catalogued,Not Implemented,,\n';
            template += 'ID.AM-5,Resource Prioritization,Resources are prioritized based on their classification criticality and business value,Not Implemented,,\n';
            break;
        case 'iso':
            template = 'Control ID,Control Name,Description,Status,Assessment Date,Evidence,Notes\n';
            template += 'A.5.1.1,Security Policies,Policies for information security,Not Implemented,,\n';
            template += 'A.5.1.2,Review of Policies,Review of the policies for information security,Not Implemented,,\n';
            template += 'A.6.1.1,Security Roles,Information security roles and responsibilities,Not Implemented,,\n';
            template += 'A.6.1.2,Segregation of Duties,Segregation of duties,Not Implemented,,\n';
            template += 'A.6.1.3,Contact with Authorities,Contact with authorities,Not Implemented,,\n';
            break;
        case 'cis':
            template = 'Control ID,Control Name,Description,Status,Assessment Date,Evidence,Notes\n';
            template += 'CIS 1,Hardware Inventory,Inventory and Control of Hardware Assets,Not Implemented,,\n';
            template += 'CIS 2,Software Inventory,Inventory and Control of Software Assets,Not Implemented,,\n';
            template += 'CIS 3,Data Protection,Data Protection,Not Implemented,,\n';
            template += 'CIS 4,Secure Configuration,Secure Configuration of Enterprise Assets and Software,Not Implemented,,\n';
            template += 'CIS 5,Account Management,Account Management,Not Implemented,,\n';
            break;
        case 'pci':
            template = 'Control ID,Control Name,Description,Status,Assessment Date,Evidence,Notes\n';
            template += '1.1,Network Security Process,Processes and mechanisms for network security controls are defined and understood,Not Implemented,,\n';
            template += '1.2,Network Controls,Network security controls are defined and implemented,Not Implemented,,\n';
            template += '1.3,CDE Access,Network access to and from the cardholder data environment is restricted,Not Implemented,,\n';
            template += '1.4,Trusted Networks,Network connections between trusted and untrusted networks are controlled,Not Implemented,,\n';
            template += '1.5,Risk Assessment,Risks to the cardholder data environment are identified and addressed,Not Implemented,,\n';
            break;
        default:
            template = 'Control ID,Control Name,Description,Status,Assessment Date,Evidence,Notes\n';
            template += 'Example-1,Example Control,Description of example control,Not Implemented,,\n';
    }

    return template;
}

// Function to generate report data
function generateReportData(framework) {
    let title = '';
    let controls = '';

    switch(framework) {
        case 'nist':
            title = 'NIST Cybersecurity Framework';
            controls = `
                <tr><td>ID.AM-1</td><td>Physical devices and systems within the organization are inventoried</td><td>Implemented</td><td>Apr 15, 2025</td></tr>
                <tr><td>ID.AM-2</td><td>Software platforms and applications within the organization are inventoried</td><td>Implemented</td><td>Apr 15, 2025</td></tr>
                <tr><td>ID.AM-3</td><td>Organizational communication and data flows are mapped</td><td>Partially Implemented</td><td>Apr 15, 2025</td></tr>
                <tr><td>ID.AM-4</td><td>External information systems are catalogued</td><td>Partially Implemented</td><td>Apr 15, 2025</td></tr>
                <tr><td>ID.AM-5</td><td>Resources are prioritized based on their classification, criticality, and business value</td><td>Not Implemented</td><td>Apr 15, 2025</td></tr>
            `;
            break;
        case 'iso':
            title = 'ISO 27001';
            controls = `
                <tr><td>A.5.1.1</td><td>Policies for information security</td><td>Implemented</td><td>Apr 10, 2025</td></tr>
                <tr><td>A.5.1.2</td><td>Review of the policies for information security</td><td>Implemented</td><td>Apr 10, 2025</td></tr>
                <tr><td>A.6.1.1</td><td>Information security roles and responsibilities</td><td>Partially Implemented</td><td>Apr 10, 2025</td></tr>
                <tr><td>A.6.1.2</td><td>Segregation of duties</td><td>Not Implemented</td><td>Apr 10, 2025</td></tr>
                <tr><td>A.6.1.3</td><td>Contact with authorities</td><td>Implemented</td><td>Apr 10, 2025</td></tr>
            `;
            break;
        case 'cis':
            title = 'CIS Controls';
            controls = `
                <tr><td>CIS 1</td><td>Inventory and Control of Hardware Assets</td><td>Implemented</td><td>Mar 25, 2025</td></tr>
                <tr><td>CIS 2</td><td>Inventory and Control of Software Assets</td><td>Implemented</td><td>Mar 25, 2025</td></tr>
                <tr><td>CIS 3</td><td>Data Protection</td><td>Partially Implemented</td><td>Mar 25, 2025</td></tr>
                <tr><td>CIS 4</td><td>Secure Configuration of Enterprise Assets and Software</td><td>Partially Implemented</td><td>Mar 25, 2025</td></tr>
                <tr><td>CIS 5</td><td>Account Management</td><td>Implemented</td><td>Mar 25, 2025</td></tr>
            `;
            break;
        case 'pci':
            title = 'PCI DSS';
            controls = `
                <tr><td>1.1</td><td>Processes and mechanisms for network security controls are defined and understood</td><td>Implemented</td><td>Mar 15, 2025</td></tr>
                <tr><td>1.2</td><td>Network security controls are defined and implemented</td><td>Implemented</td><td>Mar 15, 2025</td></tr>
                <tr><td>1.3</td><td>Network access to and from the cardholder data environment is restricted</td><td>Partially Implemented</td><td>Mar 15, 2025</td></tr>
                <tr><td>1.4</td><td>Network connections between trusted and untrusted networks are controlled</td><td>Implemented</td><td>Mar 15, 2025</td></tr>
                <tr><td>1.5</td><td>Risks to the cardholder data environment are identified and addressed</td><td>Partially Implemented</td><td>Mar 15, 2025</td></tr>
            `;
            break;
        default:
            title = 'Security Framework';
            controls = `
                <tr><td>Control-1</td><td>Example Control Description</td><td>Not Implemented</td><td>May 1, 2025</td></tr>
            `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} Compliance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
                .summary { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                table, th, td { border: 1px solid #ddd; }
                th, td { padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
                .implemented { color: green; }
                .partial { color: orange; }
                .not-implemented { color: red; }
                .chart { width: 600px; height: 300px; margin: 20px 0; background-color: #f9f9f9; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; }
                .footer { margin-top: 40px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>${title} Compliance Report</h1>
            <p>Generated: May 1, 2025</p>

            <div class="summary">
                <h2>Executive Summary</h2>
                <p>This report provides an overview of the organization's compliance status with the ${title}. The assessment was conducted on May 1, 2025.</p>
            </div>

            <h2>Compliance Summary</h2>
            <div class="chart">[Compliance Chart Placeholder]</div>

            <h2>Control Implementation Status</h2>
            <table>
                <thead>
                    <tr>
                        <th>Control ID</th>
                        <th>Control Description</th>
                        <th>Status</th>
                        <th>Last Assessment</th>
                    </tr>
                </thead>
                <tbody>
                    ${controls}
                </tbody>
            </table>

            <h2>Recommendations</h2>
            <p>Based on the assessment, the following recommendations are provided to improve the organization's security posture:</p>
            <ul>
                <li>Implement missing controls</li>
                <li>Enhance partially implemented controls</li>
                <li>Conduct regular assessments to ensure continued compliance</li>
            </ul>

            <div class="footer">
                <p>This report was generated by the Security Compliance Navigator tool.</p>
            </div>
        </body>
        </html>
    `;
}

// Function to generate comparison data
// Function to generate comparison data (continued)
function generateComparisonData() {
    return `Security Domain,NIST CSF,ISO 27001:2013,CIS Controls v8,PCI DSS v4.0
Asset Management,ID.AM-1 ID.AM-2 ID.AM-4 ID.AM-5,A.8.1.1 A.8.1.2 A.8.1.3 A.8.2.1,Control 1 Control 2,Req 9.9 Req 11.2 Req 12.10.1
Access Control,PR.AC-1 PR.AC-2 PR.AC-3 PR.AC-4,A.9.1.1 A.9.2.1 A.9.2.2 A.9.2.3 A.9.2.4 A.9.2.5 A.9.2.6,Control 5 Control 6,Req 7.1 Req 7.2 Req 7.3 Req 8.1 Req 8.2 Req 8.3
Network Security,PR.AC-5 PR.PT-4 DE.CM-1,A.13.1.1 A.13.1.2 A.13.1.3,Control 12 Control 13,Req 1.1 Req 1.2 Req 1.3 Req 1.4 Req 1.5
Data Protection,PR.DS-1 PR.DS-2 PR.DS-5,A.8.2.3 A.10.1.1 A.18.1.3 A.18.1.4,Control 3,Req 3.1 Req 3.2 Req 3.3 Req 3.4 Req 3.5 Req 3.6 Req 3.7
Security Assessment,ID.RA-1 ID.RA-2 ID.RA-3 DE.CM-8,A.12.6.1 A.18.2.1 A.18.2.2 A.18.2.3,Control 7 Control 10,Req 6.5 Req 11.1 Req 11.3 Req 11.4
Security Awareness,PR.AT-1 PR.AT-2 PR.AT-3 PR.AT-4 PR.AT-5,A.7.2.2 A.7.2.3,Control 14,Req 12.6 Req 12.6.1 Req 12.6.2
Incident Response,RS.RP-1 RS.CO-1 RS.CO-2 RS.AN-1 RS.MI-1 RS.MI-2,A.16.1.1 A.16.1.2 A.16.1.3 A.16.1.4 A.16.1.5,Control 17 Control 19,Req 12.10 Req 12.10.1 Req 12.10.2 Req 12.10.3 Req 12.10.4 Req 12.10.5`;
}

// Function to generate random unique ID for downloaded files
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Optional: Add analytics tracking for downloads
function trackDownload(framework, type) {
    console.log(`Download tracked: ${framework} ${type}`);
    // In a real application, you might send this to your analytics service
    // Example: analytics.trackEvent('download', { framework: framework, type: type });
}

// Optional: Initialize more interactive elements on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set up related controls click behavior in detail view
    const relatedControls = document.querySelectorAll('.related-control');
    relatedControls.forEach(control => {
        control.addEventListener('click', function() {
            const controlId = this.textContent;
            alert(`Navigate to related control: ${controlId}`);
            // In a real application, you would find and show the related control
        });
    });

    // Enable tooltips or popovers if needed
    // This would require a library like Bootstrap
    // Example: $('.status-badge').tooltip();

    // Check for URL parameters to show specific content
    const urlParams = new URLSearchParams(window.location.search);
    const frameworkParam = urlParams.get('framework');
    const controlParam = urlParams.get('control');

    if (frameworkParam) {
        // Show specific framework tab
        const frameworkTab = document.querySelector(`.framework-tab[data-framework="${frameworkParam}"]`);
        if (frameworkTab) {
            frameworkTab.click();

            // If control is specified, show it
            if (controlParam) {
                setTimeout(() => {
                    const controlRow = document.querySelector(`#${frameworkParam}-content .control-id:contains('${controlParam}')`);
                    if (controlRow) {
                        controlRow.closest('tr').click();
                    }
                }, 500);
            }
        }
    }
});

// Helper function for debugging
function logDebugInfo(message, data) {
    if (window.debugMode) {
        console.log(`[DEBUG] ${message}`, data);
    }
}

// Enable debug mode in development environment
// window.debugMode = window.location.hostname === 'localhost';