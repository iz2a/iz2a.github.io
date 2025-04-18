/**
 * Cybersecurity Terminal Challenge - Game Logic and Challenge Definitions
 * This file contains all game state, challenge definitions, and file system simulation
 */

// Game state
let gameState = {
    currentUser: 'guest',
    currentLevel: 0,
    maxLevel: 12, // Expanded to 12 challenges
    completedChallenges: [],
    filesDiscovered: [],
    inventory: [],
    badges: [],
    hints: {
        used: 0,
        available: 5 // Increased from 3 to 5
    },
    commandHistory: [],
    historyIndex: -1,
    networkAccess: false,
    firewallDisabled: false,
    idsDisabled: false,
    dataExfiltrated: false,
    rootAccess: false,
    keychain: []
};

// File system simulation - expanded with many more files
const fileSystem = {
    // Basic files available to guest
    'readme.txt': 'Welcome to the Cybersecurity Challenge Terminal!\n\nYour mission is to find vulnerabilities in this system and gradually gain higher access privileges.\n\nType "ls" to see available files and "cat [filename]" to read them.\n\nGood luck!',
    'user_accounts.txt': 'system users:\n- guest (current)\n- analyst\n- admin\n- root (system)',
    'system_log.txt': 'System boot: OK\nFirewall: ACTIVE\nLast login: admin - 2 days ago\nSecurity scan: PASSED\nNote: Analyst password needs to be updated - currently using default setting',
    'todo.txt': '1. Update system firmware\n2. Change default passwords\n3. Check encryption on secure_data.enc\n4. Review analyst account permissions\n5. Implement two-factor authentication\n6. Patch CVE-2023-9876',
    'network_status.txt': 'Network Status: ONLINE\nExternal Access: BLOCKED\nInternal Services: RUNNING\nFirewall Rules: ENFORCED\nProxy Status: ACTIVE',
    'public_notice.txt': 'ATTENTION ALL EMPLOYEES:\nThe IT Security team will be conducting routine security assessments throughout the week. Please report any unusual system behavior to security@cyberguard.com',

    // Files for analyst-level access
    'secure_data.enc': 'ENCRYPTED FILE - Use "decrypt secure_data.enc" with the proper key to view contents',
    'password_hint.txt': 'Reminder: Our password policy requires a minimum of 8 characters\nThe admin likes to use the company name in their password\nThe company name is "CyberGuard"',
    'default_passwords.txt': 'Default credentials for new analyst accounts:\nusername: analyst\npassword: Secure123!',
    'access_log.txt': 'ACCESS DENIED: Unauthorized login attempt from IP 192.168.1.45\nACCESS GRANTED: Admin login successful\nSYSTEM: Password policy updated\nSYSTEM: New security certificates installed\nACCESS DENIED: Attempted privilege escalation from user "analyst"\nACCESS GRANTED: Root access for maintenance task',
    'secure_notes.txt': 'ADMIN ONLY: The root password has been temporarily set to "SuperSecureAdmin2023!"\nPlease change immediately after system maintenance.',
    'network_scan.txt': 'Network scan results:\n- 192.168.1.1 (Router - Open ports: 80, 443)\n- 192.168.1.10 (Server - Open ports: 22, 80, 443, 3306)\n- 192.168.1.50 (Workstation - Open ports: 445, 3389)\n- 192.168.1.100 (Unknown device - Open ports: 21, 22, 23)',
    'config.sys': 'SYSTEM CONFIGURATION FILE\nFirewall=ENABLED\nIDS=ACTIVE\nRemote_Access=DISABLED\nAuto_Update=ENABLED\nPort_Scanning=BLOCKED\nIPS_Mode=LEARNING',

    // Hidden files for admin-level access
    'backdoor.sh': '#!/bin/bash\necho "Potential security breach detected!"\necho "This file should not be accessible!"\n# This script opens a reverse shell to 192.168.1.100 on port 4444\nif [ "$1" == "activate" ]; then\n  # Connection code removed for security reasons\nfi',
    'hidden_flag.txt': 'Congratulations! You found a hidden flag: CyberMaster2023',
    'encryption_key.txt': 'SECURE ENCRYPTION KEY: CyberGuard123\nDO NOT SHARE!',

    // Advanced admin files
    'firewall_rules.conf': '# Firewall configuration\n# To disable, use command: "sudo firewall --disable"\nALLOW TCP 22 # SSH\nALLOW TCP 80 # HTTP\nALLOW TCP 443 # HTTPS\nDENY ICMP ALL # Block ping\nDENY TCP 3389 # Block RDP\nDENY TCP 21 # Block FTP\nDENY TCP 23 # Block Telnet\n# Root override key: 7XJ9A55TMN',
    'ssh_access.key': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCAV4wggFaAgEAAkEAt8E8EpOgH2HxFvnR\nWdMrW2V1HvBGfP239C9XrJiIe7q+jPbGxIk2Rjv+E1V3HGfP73GUAkSo2OeGTHXs\nr6CpGwIDAQABAkBBF5KYSfKkB2dNSL7O6Kr4j9a7gOhpUQgUNxNBru8RlmhUrHxB\niOgYPQzUFoUs7QRHWxpZqTXJxYfV3U8LH8dJAiEA3SuN8o/yu/Uo0832DQk7lCKr\nSej9P5QEsRMQZEjC220CIQDUYYYbdD67tJAMJVhNQQl9pq57HZ8X3Vn5zGJiWMtB\nRwIhANhYOrJXy8sgDwKjfGIsMiLUJpGnfSq9lEIEYLgP4rZlAiAKBcQW+1LdGeKJ\nycTsUK9IEqpCnqKfdLP7WEpYZQH2RQIhAL0a+Gj4QKVzlshaJxYS4GACM9DE1oWH\n/XKHAWjRfpqX\n-----END PRIVATE KEY-----',
    'vuln_report.txt': 'VULNERABILITY ASSESSMENT REPORT\n\nCritical findings:\n1. Unpatched CVE-2023-9876 in internal services\n2. Default credentials on analyst accounts\n3. Weak encryption on sensitive data files\n4. Outdated intrusion detection system\n\nTo mitigate, run patch_system.sh with proper permissions',

    // Root-level access files
    'patch_system.sh': '#!/bin/bash\n# This script requires root access\n# Usage: patch_system.sh --apply-all\nif [ "$(whoami)" != "root" ]; then\n  echo "This script must be run as root"\n  exit 1\nfi\necho "Applying security patches..."\necho "Updating intrusion detection systems..."\necho "Hardening firewall configuration..."\necho "System patched successfully."',
    'database_backup.sql': '-- Database backup file - HIGHLY SENSITIVE\n-- Last updated: 2023-04-15\nCREATE TABLE users (\n  id INT PRIMARY KEY,\n  username VARCHAR(50),\n  password_hash VARCHAR(255),\n  email VARCHAR(100),\n  role VARCHAR(20)\n);\n\nINSERT INTO users VALUES\n(1, "admin", "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "admin@cyberguard.com", "administrator"),\n(2, "analyst", "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f", "analyst@cyberguard.com", "security"),\n(3, "root", "4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2", "sysadmin@cyberguard.com", "system");\n\n-- End of backup',
    'root_access.key': 'ROOT ACCESS AUTHORIZATION KEY: EV2XMD9TQP5RK7',
    'ids_config.json': '{\n  "system": "CyberGuard IDS v3.2",\n  "mode": "active",\n  "alertLevel": "high",\n  "logRetention": 90,\n  "signatures": {\n    "lastUpdated": "2023-03-28",\n    "count": 12458,\n    "updateServer": "https://updates.cyberguard.com/ids"\n  },\n  "adminOverrideCode": "J5NM8KL",\n  "disableCommand": "sudo ids --disable"\n}',

    // Special files that are created by actions
    'network_exploit.log': 'SECURITY ALERT: Potential exploit attempt detected\nSource: Internal\nTarget: 192.168.1.100\nProtocol: TCP\nPort: 4444\nPayload signature: REVERSE_SHELL_ATTEMPT\n\nAction taken: Connection blocked by firewall\nTo allow the connection for security testing, disable the firewall',
    'secure_data_decrypted.txt': 'CONFIDENTIAL INFORMATION:\nSystem access credentials are rotated monthly.\nCurrent admin password hint: Company name + year established + "!"\nCompany established in: 2023\nEmergency access procedures documented in file "emergency_protocols.txt"\nSecurity vulnerability detected in the main firewall configuration.',
    'data_exfiltration.log': 'Data transfer initiated:\nSource: Internal system\nDestination: 192.168.1.100\nProtocol: Encrypted tunnel\nData size: 4.2 MB\nType: Database records\nStatus: COMPLETE\n\nWarning: Unauthorized data transfer detected by IDS',
    'emergency_protocols.txt': 'EMERGENCY ACCESS PROTOCOLS\n\nIn case of critical system failure or security breach:\n1. Contact the security team immediately\n2. Use emergency access code: QRST7890\n3. Apply the root override: EV2XMD9TQP5RK7\n4. Document all actions taken\n\nWARNING: These protocols are for emergency situations only.'
};

// Hidden files not shown by default with ls
const hiddenFiles = [
    'backdoor.sh',
    'secure_notes.txt',
    'hidden_flag.txt',
    'encryption_key.txt',
    'firewall_rules.conf',
    'ssh_access.key',
    'root_access.key',
    'ids_config.json',
    'emergency_protocols.txt'
];

// Challenge definitions - expanded to 12 challenges
const challenges = [
    {
        id: 'find_user_info',
        title: 'Reconnaissance',
        description: 'Find information about system users',
        hint: 'Try looking for files containing user information. Use "ls" and "cat".',
        isCompleted: () => gameState.filesDiscovered.includes('user_accounts.txt'),
        reward: 'Basic Reconnaissance Badge',
        message: 'You\'ve identified system users! Knowledge about user accounts is the first step in understanding system access.'
    },
    {
        id: 'find_default_password',
        title: 'Password Discovery',
        description: 'Find default credentials',
        hint: 'Look for files that might contain default settings or passwords.',
        isCompleted: () => gameState.filesDiscovered.includes('default_passwords.txt'),
        reward: 'Password Hunter Badge',
        message: 'You found default credentials! Many breaches happen because default passwords are never changed.'
    },
    {
        id: 'login_as_analyst',
        title: 'Account Takeover',
        description: 'Login as the analyst user',
        hint: 'Use the "login" command with the analyst username and the default password you found.',
        isCompleted: () => gameState.currentUser === 'analyst',
        reward: 'Account Hijacker Badge',
        message: 'You successfully logged in as an analyst! You now have increased access to the system.'
    },
    {
        id: 'find_admin_password',
        title: 'Privilege Escalation',
        description: 'Find the admin password',
        hint: 'Now that you\'re the analyst, you might be able to access files with admin information.',
        isCompleted: () => gameState.filesDiscovered.includes('secure_notes.txt'),
        requiresUser: 'analyst',
        reward: 'Privilege Hunter Badge',
        message: 'You found the admin password! This is a critical security breach that could lead to complete system compromise.'
    },
    {
        id: 'login_as_admin',
        title: 'Admin Access',
        description: 'Login as the admin user',
        hint: 'Use the admin password you found to login as admin.',
        isCompleted: () => gameState.currentUser === 'admin',
        reward: 'System Administrator Badge',
        message: 'Congratulations! You have successfully gained admin access to the system. You now have complete control.'
    },
    {
        id: 'decrypt_secure_data',
        title: 'Data Decryption',
        description: 'Find the encryption key and decrypt secure_data.enc',
        hint: 'Check for hidden files containing encryption keys or passwords.',
        isCompleted: () => gameState.filesDiscovered.includes('secure_data_decrypted.txt'),
        requiresUser: 'admin',
        reward: 'Crypto Master Badge',
        message: 'You successfully decrypted the secure data! Access to encrypted information is critical in cybersecurity operations.'
    },
    {
        id: 'disable_firewall',
        title: 'Firewall Bypass',
        description: 'Disable the system firewall',
        hint: 'Look for configuration files that might contain firewall settings or commands.',
        isCompleted: () => gameState.firewallDisabled,
        requiresUser: 'admin',
        reward: 'Firewall Breaker Badge',
        message: 'You\'ve disabled the firewall! This allows for unrestricted network access and potentially malicious connections.'
    },
    {
        id: 'activate_backdoor',
        title: 'Backdoor Activation',
        description: 'Find and activate a backdoor in the system',
        hint: 'Look for suspicious scripts or executables that might establish external connections.',
        isCompleted: () => gameState.networkAccess,
        requiresUser: 'admin',
        reward: 'Backdoor Specialist Badge',
        message: 'You\'ve successfully activated a backdoor connection! Remote access has been established.'
    },
    {
        id: 'disable_ids',
        title: 'Evade Detection',
        description: 'Disable the Intrusion Detection System (IDS)',
        hint: 'Find the IDS configuration and look for ways to disable it.',
        isCompleted: () => gameState.idsDisabled,
        requiresUser: 'admin',
        reward: 'Ghost Operator Badge',
        message: 'The IDS has been disabled! Your activities will no longer be detected or logged by the security system.'
    },
    {
        id: 'data_exfiltration',
        title: 'Data Exfiltration',
        description: 'Exfiltrate sensitive data from the system',
        hint: 'Look for valuable data and use network commands to extract it.',
        isCompleted: () => gameState.dataExfiltrated,
        requiresUser: 'admin',
        requiresState: () => gameState.networkAccess && gameState.firewallDisabled,
        reward: 'Data Smuggler Badge',
        message: 'You\'ve successfully exfiltrated sensitive data from the system! This is a critical security breach.'
    },
    {
        id: 'gain_root_access',
        title: 'Root Privilege Escalation',
        description: 'Gain root-level system access',
        hint: 'Look for files containing root access information or emergency protocols.',
        isCompleted: () => gameState.rootAccess,
        requiresUser: 'admin',
        reward: 'Root Commander Badge',
        message: 'You\'ve gained root access! This is the highest level of system privilege, giving you complete control.'
    },
    {
        id: 'patch_system',
        title: 'Cover Your Tracks',
        description: 'Patch the system vulnerabilities to hide your intrusion',
        hint: 'Find and execute a script that will patch system vulnerabilities.',
        isCompleted: () => gameState.filesDiscovered.includes('system_patched'),
        requiresUser: 'root',
        reward: 'Master Hacker Badge',
        message: 'You\'ve successfully patched the system! All traces of your intrusion have been hidden, and the system is now more secure than before.'
    }
];

// Additional vulnerability definitions for network security challenges
const vulnerabilities = {
    firewall: {
        status: 'enabled',
        disableKey: '7XJ9A55TMN',
        disableCommand: 'sudo firewall --disable'
    },
    ids: {
        status: 'active',
        disableCode: 'J5NM8KL',
        disableCommand: 'sudo ids --disable'
    },
    backdoor: {
        status: 'inactive',
        activationCommand: 'backdoor.sh activate',
        targetIP: '192.168.1.100',
        targetPort: 4444
    },
    data: {
        exfiltrationCommand: 'exfiltrate database_backup.sql',
        status: 'secure'
    },
    root: {
        accessKey: 'EV2XMD9TQP5RK7',
        emergencyCode: 'QRST7890',
        escalationCommand: 'sudo access --root'
    }
};

// Command manual - expanded with more detailed explanations for all commands
const commandManual = {
    help: 'Displays a list of available commands and their basic usage.',
    clear: 'Clears all the text from the terminal screen.',
    ls: 'Lists all visible files in the current directory. Some files may be hidden based on your access level.',
    cat: 'Displays the content of a file. Usage: cat [filename]',
    scan: 'Performs a security scan of the system, revealing potential vulnerabilities. Different users have different scan capabilities.',
    crack: 'Attempts to crack a password-protected file. Usage: crack [filename]',
    decrypt: 'Decrypts an encrypted file using a key. Usage: decrypt [filename]',
    whoami: 'Displays the username of the current user.',
    login: 'Attempts to log in as another user. Usage: login [username]',
    find: 'Searches for files containing a specific pattern. Usage: find [pattern]',
    man: 'Displays the manual page for a command. Usage: man [command]',
    history: 'Shows previously entered commands.',
    hint: 'Provides a hint for the current challenge.',
    badges: 'Displays all earned badges.',
    sudo: 'Executes a command with elevated privileges. Usage: sudo [command]',
    ssh: 'Establishes a secure shell connection to a remote system. Usage: ssh [username]@[hostname]',
    exfiltrate: 'Extracts data from the system. Usage: exfiltrate [filename]',
    exploit: 'Attempts to exploit a vulnerability. Usage: exploit [target]',
    firewall: 'Manages the system firewall. Usage: firewall [option]',
    ids: 'Controls the intrusion detection system. Usage: ids [option]',
    ping: 'Tests connectivity to another system. Usage: ping [hostname/IP]',
    chmod: 'Changes file permissions. Usage: chmod [permissions] [filename]',
    rm: 'Removes a file. Usage: rm [filename]',
    cd: 'Changes the current directory. Usage: cd [directory]',
    mkdir: 'Creates a new directory. Usage: mkdir [directory_name]',
    touch: 'Creates a new empty file. Usage: touch [filename]',
    wget: 'Downloads files from the web. Usage: wget [URL]',
    nc: 'Netcat utility for reading and writing data across network connections. Usage: nc [options] [hostname] [port]',
    nmap: 'Network exploration tool and security scanner. Usage: nmap [options] [target]',
    ps: 'Displays information about active processes. Usage: ps [options]'
};

// Export the game elements
window.gameState = gameState;
window.fileSystem = fileSystem;
window.hiddenFiles = hiddenFiles;
window.challenges = challenges;
window.commandManual = commandManual;
window.vulnerabilities = vulnerabilities;