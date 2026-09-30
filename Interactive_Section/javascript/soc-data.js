// soc-data.js - Centralized data management for SOC Simulation
// This simulates what would typically come from a backend API/database

const SOCData = {
    // Alert data with full details
    alerts: [
        {
            id: 'EDR-RW-20250501-001',
            title: 'Potential Ransomware Activity Detected',
            severity: 'critical',
            source: 'endpoint',
            sourceDetail: 'EDR - Endpoint 192.168.1.45',
            timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
            status: 'new',
            user: 'jsmith@company.com',
            hostname: 'DESKTOP-FINANCE03',
            ipAddress: '192.168.1.45',
            description: 'The EDR system detected multiple suspicious activities consistent with ransomware behavior on endpoint 192.168.1.45. This includes mass file encryption attempts, deletion of shadow copies, and communication with known malicious command and control servers.',
            activities: [
                {
                    timestamp: '10:42:15 AM',
                    activity: 'Process Creation',
                    details: 'Suspicious PowerShell command with encoded parameters',
                    severity: 'High'
                },
                {
                    timestamp: '10:43:22 AM',
                    activity: 'Command Execution',
                    details: 'vssadmin delete shadows /all /quiet',
                    severity: 'Critical'
                },
                {
                    timestamp: '10:43:48 AM',
                    activity: 'Registry Modification',
                    details: 'Multiple registry keys associated with persistence',
                    severity: 'High'
                },
                {
                    timestamp: '10:44:05 AM',
                    activity: 'Network Connection',
                    details: 'Connection to known C2 server (185.122.58.12)',
                    severity: 'Critical'
                },
                {
                    timestamp: '10:44:37 AM',
                    activity: 'File System Activity',
                    details: 'Multiple file extension changes (.doc → .encrypted)',
                    severity: 'Critical'
                }
            ],
            systemInfo: {
                hostname: 'DESKTOP-FINANCE03',
                ipAddress: '192.168.1.45',
                user: 'jsmith@company.com (John Smith - Finance Department)',
                os: 'Windows 10 Pro 21H2 (OS Build 19044.2251)',
                lastPatch: 'April 28, 2025'
            },
            recommendations: [
                'Isolate the affected endpoint immediately to prevent lateral movement and further encryption.',
                'Disable the user account and force password reset for all accounts that may have been logged into the affected system.',
                'Block all communication to the identified command and control IP address (185.122.58.12) at the firewall.',
                'Scan all systems for similar indicators of compromise, especially within the same department.',
                'Preserve forensic evidence for detailed analysis and potential legal requirements.',
                'Initiate incident response plan and notify appropriate stakeholders according to the procedure.'
            ]
        },
        {
            id: 'AUTH-BF-20250501-002',
            title: 'Multiple Failed Login Attempts',
            severity: 'high',
            source: 'auth',
            sourceDetail: 'Authentication - VPN Gateway',
            timestamp: new Date(Date.now() - 32 * 60000),
            status: 'new',
            description: 'Detected 47 failed login attempts from IP 203.45.12.88 targeting multiple user accounts within a 5-minute window.'
        },
        {
            id: 'EDR-PS-20250501-003',
            title: 'Suspicious PowerShell Command Execution',
            severity: 'high',
            source: 'endpoint',
            sourceDetail: 'EDR - Endpoint 192.168.1.23',
            timestamp: new Date(Date.now() - 47 * 60000),
            status: 'new',
            description: 'PowerShell script with encoded command detected. Possible data exfiltration or reconnaissance activity.'
        },
        {
            id: 'IDS-EX-20250501-004',
            title: 'Data Exfiltration Attempt Detected',
            severity: 'critical',
            source: 'ids',
            sourceDetail: 'IDS - Network Sensor 3',
            timestamp: new Date(Date.now() - 60 * 60000),
            status: 'new',
            description: 'Large volume of data transfer to external IP detected. Transfer size: 2.3 GB over encrypted channel.'
        },
        {
            id: 'AUTH-AT-20250501-005',
            title: 'Unusual Authentication Time',
            severity: 'medium',
            source: 'auth',
            sourceDetail: 'Authentication - Office 365',
            timestamp: new Date(Date.now() - 90 * 60000),
            status: 'new',
            description: 'User login detected at 3:47 AM, outside normal working hours for this account.'
        },
        {
            id: 'FW-DLP-20250501-006',
            title: 'Unencrypted Data Transfer Detected',
            severity: 'medium',
            source: 'firewall',
            sourceDetail: 'DLP - Web Proxy',
            timestamp: new Date(Date.now() - 120 * 60000),
            status: 'new',
            description: 'Sensitive data transmitted over unencrypted HTTP connection.'
        },
        {
            id: 'VS-SW-20250501-007',
            title: 'Outdated Software Version',
            severity: 'low',
            source: 'cloud',
            sourceDetail: 'Vulnerability Scanner',
            timestamp: new Date(Date.now() - 180 * 60000),
            status: 'new',
            description: 'Apache server version 2.4.41 detected with known vulnerabilities. Update available.'
        },
        {
            id: 'CM-SSL-20250501-008',
            title: 'SSL Certificate Expiring Soon',
            severity: 'low',
            source: 'cloud',
            sourceDetail: 'Certificate Monitor',
            timestamp: new Date(Date.now() - 240 * 60000),
            status: 'new',
            description: 'SSL certificate for api.company.com expires in 14 days.'
        }
    ],

    // Playbooks data with pagination
    playbooks: [
        // Page 1
        [
            { name: 'Ransomware Response', category: 'Malware', updated: 'April 25, 2025', status: 'active', content: 'Full ransomware response playbook content...' },
            { name: 'Phishing Investigation', category: 'Email Security', updated: 'April 22, 2025', status: 'active', content: 'Phishing investigation procedures...' },
            { name: 'Data Exfiltration Response', category: 'Data Loss Prevention', updated: 'April 15, 2025', status: 'active', content: 'Data exfiltration response steps...' },
            { name: 'Brute Force Attack Response', category: 'Authentication', updated: 'April 10, 2025', status: 'active', content: 'Brute force mitigation playbook...' },
            { name: 'Insider Threat Investigation', category: 'User Activity', updated: 'April 05, 2025', status: 'active', content: 'Insider threat investigation guide...' },
            { name: 'Cloud Account Compromise', category: 'Cloud Security', updated: 'March 28, 2025', status: 'active', content: 'Cloud account compromise response...' },
            { name: 'DDoS Mitigation', category: 'Network Security', updated: 'March 20, 2025', status: 'active', content: 'DDoS attack mitigation procedures...' },
            { name: 'Malicious URL Investigation', category: 'Web Security', updated: 'March 15, 2025', status: 'active', content: 'Malicious URL investigation steps...' }
        ],
        // Page 2
        [
            { name: 'Malware Analysis', category: 'Malware', updated: 'March 10, 2025', status: 'active', content: 'Malware analysis procedures...' },
            { name: 'SQL Injection Response', category: 'Application Security', updated: 'March 05, 2025', status: 'active', content: 'SQL injection incident response...' },
            { name: 'Privilege Escalation Investigation', category: 'Access Control', updated: 'February 28, 2025', status: 'active', content: 'Privilege escalation investigation...' },
            { name: 'Zero-Day Vulnerability Response', category: 'Vulnerability Management', updated: 'February 20, 2025', status: 'active', content: 'Zero-day vulnerability handling...' },
            { name: 'Social Engineering Incident', category: 'Security Awareness', updated: 'February 15, 2025', status: 'active', content: 'Social engineering response...' },
            { name: 'Data Breach Response', category: 'Incident Response', updated: 'February 10, 2025', status: 'active', content: 'Data breach response procedures...' },
            { name: 'APT Investigation', category: 'Threat Hunting', updated: 'February 05, 2025', status: 'active', content: 'APT investigation playbook...' },
            { name: 'Business Email Compromise', category: 'Email Security', updated: 'January 30, 2025', status: 'active', content: 'BEC investigation guide...' }
        ],
        // Page 3
        [
            { name: 'Cryptojacking Detection', category: 'Malware', updated: 'January 25, 2025', status: 'active', content: 'Cryptojacking detection and response...' },
            { name: 'Supply Chain Attack', category: 'Third-Party Risk', updated: 'January 20, 2025', status: 'active', content: 'Supply chain compromise response...' },
            { name: 'Container Security Incident', category: 'Cloud Security', updated: 'January 15, 2025', status: 'active', content: 'Container security incident response...' },
            { name: 'IoT Device Compromise', category: 'IoT Security', updated: 'January 10, 2025', status: 'inactive', content: 'IoT device compromise procedures...' },
            { name: 'Credential Stuffing Attack', category: 'Authentication', updated: 'January 05, 2025', status: 'active', content: 'Credential stuffing response...' },
            { name: 'DNS Tunneling Detection', category: 'Network Security', updated: 'December 28, 2024', status: 'active', content: 'DNS tunneling investigation...' }
        ]
    ],

    // Cases data with pagination
    cases: [
        // Page 1
        [
            { id: 'INC-2025-042', title: 'Finance Department Ransomware Investigation', severity: 'Critical', assigned: 'Incident Response Team', status: 'in-progress' },
            { id: 'INC-2025-041', title: 'Executive Account Compromise Attempt', severity: 'High', assigned: 'Michael Chen', status: 'in-progress' },
            { id: 'INC-2025-040', title: 'Unusual Database Activity Investigation', severity: 'Medium', assigned: 'Sarah Johnson', status: 'pending' },
            { id: 'INC-2025-039', title: 'Suspected Data Exfiltration via Email', severity: 'High', assigned: 'David Wilson', status: 'in-progress' },
            { id: 'INC-2025-038', title: 'Cloud Storage Misconfiguration', severity: 'Medium', assigned: 'Cloud Security Team', status: 'closed' },
            { id: 'INC-2025-037', title: 'Web Application Vulnerability', severity: 'Medium', assigned: 'Application Security Team', status: 'closed' }
        ],
        // Page 2
        [
            { id: 'INC-2025-036', title: 'Phishing Campaign Targeting HR', severity: 'High', assigned: 'Email Security Team', status: 'closed' },
            { id: 'INC-2025-035', title: 'Suspicious Network Scanning', severity: 'Medium', assigned: 'Network Security', status: 'closed' },
            { id: 'INC-2025-034', title: 'Malware Detected on Development Server', severity: 'High', assigned: 'DevSec Team', status: 'closed' },
            { id: 'INC-2025-033', title: 'Unauthorized API Access', severity: 'Critical', assigned: 'API Security Team', status: 'closed' },
            { id: 'INC-2025-032', title: 'DDoS Attack Mitigation', severity: 'High', assigned: 'Network Operations', status: 'closed' },
            { id: 'INC-2025-031', title: 'Insider Threat Investigation', severity: 'Critical', assigned: 'Security Operations', status: 'closed' }
        ],
        // Page 3
        [
            { id: 'INC-2025-030', title: 'Compromised Service Account', severity: 'High', assigned: 'IAM Team', status: 'closed' },
            { id: 'INC-2025-029', title: 'Data Leakage via Public Repository', severity: 'Critical', assigned: 'DevSec Team', status: 'closed' },
            { id: 'INC-2025-028', title: 'Mobile Device Compromise', severity: 'Medium', assigned: 'Mobile Security', status: 'closed' },
            { id: 'INC-2025-027', title: 'SQL Injection Attempt', severity: 'High', assigned: 'AppSec Team', status: 'closed' }
        ]
    ],

    // Reports data with actual downloadable content
    reports: [
        // Page 1
        [
            { 
                name: 'Daily Security Operations Report', 
                type: 'Daily Summary', 
                date: 'May 01, 2025',
                content: {
                    title: 'Daily Security Operations Report - May 01, 2025',
                    summary: 'Overview of security events and incidents for the past 24 hours',
                    metrics: {
                        totalAlerts: 47,
                        criticalAlerts: 3,
                        resolvedIncidents: 12,
                        meanTimeToResolve: '2.3 hours'
                    },
                    details: 'Detailed daily operations report content would go here...'
                }
            },
            { 
                name: 'Weekly Threat Intelligence Summary', 
                type: 'Threat Intelligence', 
                date: 'April 28, 2025',
                content: {
                    title: 'Weekly Threat Intelligence Summary - Week 17, 2025',
                    threats: ['New ransomware variant detected', 'Phishing campaign targeting financial sector'],
                    details: 'Weekly threat intelligence summary content...'
                }
            },
            { 
                name: 'Monthly Incident Response Metrics', 
                type: 'Performance', 
                date: 'April 30, 2025',
                content: {
                    title: 'Monthly Incident Response Metrics - April 2025',
                    metrics: {
                        incidents: 156,
                        avgResponseTime: '1.8 hours',
                        falsePositives: '12%'
                    },
                    details: 'Monthly metrics report content...'
                }
            },
            { name: 'Ransomware Incident Post-Mortem', type: 'Incident Analysis', date: 'April 22, 2025', content: { title: 'Ransomware Incident Post-Mortem Analysis' } },
            { name: 'Quarterly Vulnerability Assessment', type: 'Compliance', date: 'March 31, 2025', content: { title: 'Q1 2025 Vulnerability Assessment' } },
            { name: 'Executive Security Dashboard', type: 'Executive Summary', date: 'April 30, 2025', content: { title: 'Executive Security Dashboard - April 2025' } }
        ],
        // Page 2
        [
            { name: 'Security Awareness Training Report', type: 'Training', date: 'April 15, 2025', content: { title: 'Security Awareness Training Q1 2025' } },
            { name: 'Penetration Testing Results', type: 'Testing', date: 'April 10, 2025', content: { title: 'Annual Penetration Test Results' } },
            { name: 'Compliance Audit Report', type: 'Compliance', date: 'March 28, 2025', content: { title: 'SOC 2 Compliance Audit' } },
            { name: 'Threat Hunting Campaign Summary', type: 'Threat Hunting', date: 'March 20, 2025', content: { title: 'Q1 Threat Hunting Summary' } },
            { name: 'Phishing Simulation Results', type: 'Testing', date: 'March 15, 2025', content: { title: 'Phishing Simulation Campaign Results' } },
            { name: 'Third-Party Risk Assessment', type: 'Risk Management', date: 'March 10, 2025', content: { title: 'Vendor Security Assessment Q1' } }
        ],
        // Page 3
        [
            { name: 'Cloud Security Posture Report', type: 'Cloud Security', date: 'February 28, 2025', content: { title: 'Cloud Security Assessment' } },
            { name: 'Incident Response Drill Report', type: 'Training', date: 'February 20, 2025', content: { title: 'Annual IR Tabletop Exercise' } },
            { name: 'Security Tool Effectiveness', type: 'Performance', date: 'February 15, 2025', content: { title: 'Security Tool ROI Analysis' } },
            { name: 'Data Loss Prevention Report', type: 'DLP', date: 'February 10, 2025', content: { title: 'DLP Activity Report Q1' } }
        ]
    ],

    // Helper functions
    getAlertById(id) {
        return this.alerts.find(alert => alert.id === id);
    },

    getAlertsByFilter(filters) {
        return this.alerts.filter(alert => {
            const severityMatch = !filters.severity || filters.severity.includes(alert.severity);
            const sourceMatch = !filters.source || filters.source.includes(alert.source);
            const statusMatch = !filters.status || filters.status.includes(alert.status);
            return severityMatch && sourceMatch && statusMatch;
        });
    },

    updateAlertStatus(id, status) {
        const alert = this.getAlertById(id);
        if (alert) {
            alert.status = status;
            return true;
        }
        return false;
    },

    getStatistics() {
        return {
            total: this.alerts.length,
            new: this.alerts.filter(a => a.status === 'new').length,
            critical: this.alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
            resolved: this.alerts.filter(a => a.status === 'resolved').length
        };
    },

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        return 'Just now';
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SOCData;
}
