/* ==========================================================================
   Digital Forensics Simulation: case files
   Five DFIR cases at the fictional fintech GulfPay, from Level 1 to Level 5.
   Each case is plain data; digital-forensics.js runs them.

   Dates are generated relative to today, so the cases never look stale.
   IP addresses use the documentation ranges (192.0.2.0/24, 198.51.100.0/24,
   203.0.113.0/24) and the wallet addresses are made up, so nothing here points
   at a real system, person or wallet.
   ========================================================================== */
(function () {
    'use strict';

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    // D(-2, '21:06') -> the date two days ago at 21:06, as YYYY-MM-DD HH:MM
    function D(offsetDays, hm) {
        var d = new Date();
        d.setDate(d.getDate() + offsetDays);
        var s = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        return hm ? s + ' ' + hm : s;
    }
    var YEAR = new Date().getFullYear();

    /* ------------------------------------------------------------------
       LEVEL 1: Business email compromise
       ------------------------------------------------------------------ */
    var bec = {
        id: 'bec', level: 1, rank: 'Trainee',
        caseNo: 'GP-IR-' + YEAR + '-0611',
        title: "The invoice that wasn't",
        teaser: "A supplier's \"new bank details\" email cost GulfPay SAR 486,000. Find out how the attacker knew exactly when to strike.",
        skills: ['Email headers', 'Cloud sign-in logs', 'Mailbox rules', 'Payment controls'],
        brief: "Yesterday at 11:20, GulfPay's Accounts Payable team wired SAR 486,000 for a Qimam Hosting invoice to a new bank account. This morning Qimam's finance team called: they never changed their bank details and they are still waiting to be paid. The bank-change request came by email to Noura Al-Qahtani, who handles the Qimam account. Work out how the attacker knew the invoice was due, how Qimam's real emails were kept away from Noura, and which control failed.",
        peopleLabel: 'People involved',
        people: [
            { name: 'Noura Al-Qahtani', role: 'Accounts Payable Specialist', note: 'Received the email and changed the bank details.' },
            { name: 'Majed Al-Zahrani', role: 'Finance Manager', note: 'Approved the payment run.' },
            { name: 'Qimam Hosting', role: 'Supplier', note: 'Says it never sent the email.' }
        ],
        hintCost: 0,
        hints: {
            acquire: 'Start with the email itself, then the cloud logs for Noura\'s account, then the payment system.',
            examine: 'Compare the sender domain with earlier Qimam emails, and look at what happened in Noura\'s account about ten days before the fraud.',
            conclude: 'Think about how the attacker learned the invoice details, and why nobody at GulfPay saw Qimam\'s warnings.'
        },
        evidence: [
            {
                id: 'email', type: 'Email message', icon: 'fa-envelope-open-text',
                name: 'Bank-change email (.eml)', device: "Exported from Noura's mailbox",
                size: '48 KB', tool: 'Email header analyzer',
                groups: [
                    { label: 'Message headers', icon: 'fa-code', items: [
                        { id: 'e1', title: 'From: "Qimam Hosting Accounts" <accounts@qimam-hosting.com>', time: D(-2, '09:47'),
                          detail: "The display name looks right, but the address uses a lookalike domain: a hyphen and a .com ending. Every earlier Qimam invoice in the mailbox came from billing@qimamhosting.sa.",
                          incriminating: true,
                          raw: 'Return-Path: <bounce@qimam-hosting.com>\nReceived: from mail.qimam-hosting.com (203.0.113.48)\nFrom: "Qimam Hosting Accounts" <accounts@qimam-hosting.com>\nReply-To: qimam.accounts@outlook.com\nSubject: Updated bank details before Thursday payment run\nAuthentication-Results: spf=pass smtp.mailfrom=qimam-hosting.com;\n  dkim=pass header.d=qimam-hosting.com; dmarc=pass' },
                        { id: 'e2', title: 'Reply-To points to a free webmail address', time: D(-2, '09:47'),
                          detail: 'Reply-To: qimam.accounts@outlook.com. Any reply from Noura would go to the attacker, not to either Qimam domain.', incriminating: true },
                        { id: 'e3', title: 'SPF, DKIM and DMARC all pass', time: D(-2, '09:47'),
                          detail: 'Authentication passed, but only for qimam-hosting.com, the lookalike domain the attacker set up properly. Passing SPF and DKIM proves which domain sent the message, not that the domain belongs to the real supplier. On its own it is evidence of neither fraud nor legitimacy.', incriminating: false },
                        { id: 'e4', title: 'Sent from 203.0.113.48, a rented virtual server', time: D(-2, '09:47'),
                          detail: "The originating server sits at a budget hosting provider, not on Qimam's usual mail platform.", incriminating: true }
                    ]},
                    { label: 'Domain intelligence', icon: 'fa-globe', items: [
                        { id: 'e5', title: 'WHOIS: qimam-hosting.com registered 4 days before the email', time: D(-6, '22:15'),
                          detail: 'Registered through a privacy proxy four days before the bank-change email. A newly registered lookalike domain is a hallmark of business email compromise.', incriminating: true }
                    ]},
                    { label: 'Body and attachment', icon: 'fa-paperclip', items: [
                        { id: 'e6', title: '"Please update our IBAN before Thursday\'s payment run"', time: D(-2, '09:47'),
                          detail: 'The email quotes the exact invoice number (INV-2291), the amount and the payment run date. An outsider could only know these by reading GulfPay\'s or Qimam\'s mail.', incriminating: true },
                        { id: 'e7', title: 'Attached letter Bank_Change_Qimam.pdf', time: D(-3, '16:02'),
                          detail: 'Letterhead copied from a real Qimam invoice. The PDF metadata shows it was made with an online PDF editor the day before, and the signature image is pasted from an older invoice.', incriminating: true },
                        { id: 'e8', title: 'Email signature and logo', time: D(-2, '09:47'),
                          detail: 'Copied from genuine Qimam emails. It looks real, which is why it worked, but it proves nothing either way.', incriminating: false }
                    ]}
                ]
            },
            {
                id: 'cloud', type: 'Cloud logs', icon: 'fa-cloud',
                name: "Noura's sign-ins and mailbox audit", device: 'Entra ID sign-in log and Exchange Online audit log',
                size: '3,412 events', tool: 'Microsoft 365 audit search',
                groups: [
                    { label: 'Phishing email, ten days before the fraud', icon: 'fa-fish', items: [
                        { id: 'c1', title: '"Your mailbox is full: sign in to keep receiving mail"', time: D(-12, '08:31'),
                          detail: 'Sent to Noura from a hijacked newsletter account. The link went to login.micros0ft-office365.com (a zero instead of the letter o), a reverse-proxy phishing page that passes the real Microsoft login through and captures the password and the session cookie after MFA.', incriminating: true },
                        { id: 'c2', title: 'Link click recorded by Safe Links', time: D(-12, '08:34'),
                          detail: 'Noura clicked the link three minutes after it arrived.', incriminating: true }
                    ]},
                    { label: 'Sign-ins', icon: 'fa-right-to-bracket', items: [
                        { id: 'c3', title: 'Sign-in from 198.51.100.23 (abroad): "MFA requirement satisfied by claim in the token"', time: D(-12, '08:36'),
                          detail: 'Two minutes after the click, a session for Noura appears from a hosting provider in another country. She was never asked for MFA because the attacker replayed the session token stolen by the phishing proxy: an adversary-in-the-middle attack.', incriminating: true,
                          raw: 'User: noura.alqahtani@gulfpay.example\nIP address: 198.51.100.23   Location: Amsterdam, NL\nApplication: Office 365 Exchange Online\nAuthentication requirement: Multifactor authentication\nAuthentication details: MFA requirement satisfied by claim in the token\nResult: Success' },
                        { id: 'c4', title: 'Daily sign-ins from the Riyadh office', time: D(-12) + ' to ' + D(-1),
                          detail: "Noura's normal sign-ins from GulfPay's office network. Expected.", incriminating: false },
                        { id: 'c5', title: 'MailItemsAccessed from 198.51.100.23 over ten days', time: D(-12) + ' to ' + D(-2),
                          detail: 'The attacker returned almost every day, reading the Qimam email threads, invoices and payment-run reminders.', incriminating: true }
                    ]},
                    { label: 'Mailbox rules', icon: 'fa-filter', items: [
                        { id: 'c6', title: 'New-InboxRule named "." created from 198.51.100.23', time: D(-11, '21:04'),
                          detail: 'A rule called "." moves any message mentioning Qimam to the RSS Subscriptions folder and marks it as read. Qimam\'s genuine "we have not been paid" emails never reached Noura\'s inbox.', incriminating: true,
                          raw: 'New-InboxRule -Name "." -SubjectOrBodyContainsWords "Qimam","qimamhosting" `\n  -MoveToFolder ":\\RSS Subscriptions" -MarkAsRead $true -StopProcessingRules $true' },
                        { id: 'c7', title: 'Out-of-office reply from her annual leave last month', time: D(-40, '15:00'),
                          detail: 'A routine automatic reply Noura set up herself. Not relevant.', incriminating: false }
                    ]}
                ]
            },
            {
                id: 'erp', type: 'Application logs', icon: 'fa-money-check-dollar',
                name: 'Payment system audit trail', device: 'ERP vendor master and payment logs',
                size: '214 rows', tool: 'ERP audit export',
                groups: [
                    { label: 'Vendor master changes', icon: 'fa-building-columns', items: [
                        { id: 'r1', title: "Qimam's IBAN changed by n.alqahtani", time: D(-2, '10:05'),
                          detail: 'The IBAN was changed to an account at a different bank. The change form has the "supplier call-back done" box ticked, but the phone system shows no call to Qimam that day.', incriminating: true }
                    ]},
                    { label: 'Payments', icon: 'fa-money-bill-transfer', items: [
                        { id: 'r2', title: 'Payment of SAR 486,000 approved and released', time: D(-1, '11:20'),
                          detail: 'Approved by Majed Al-Zahrani under the normal two-step approval. Approvers see the amount and the invoice, but not that the bank account changed the day before.', incriminating: true },
                        { id: 'r3', title: 'Payment run for 37 other suppliers', time: D(-1, '11:20'),
                          detail: 'Routine payments to accounts that did not change. Not relevant.', incriminating: false }
                    ]}
                ]
            }
        ],
        stages: [],
        questions: [
            { id: 'q1', key: true, points: 15, type: 'single',
              q: 'How did the attacker know the Qimam invoice was due?',
              options: [
                  { id: 'a', text: "They had been reading Noura's mailbox since a phishing attack ten days earlier" },
                  { id: 'b', text: "Qimam's own mailbox had been hacked" },
                  { id: 'c', text: 'Noura leaked the details on purpose' },
                  { id: 'd', text: 'They guessed: it was a mass phishing campaign' }
              ], answer: 'a',
              explain: 'The phishing click, the token-replay sign-in and ten days of MailItemsAccessed events show the attacker inside Noura\'s mailbox, reading the Qimam threads.' },
            { id: 'q2', key: true, points: 15, type: 'single',
              q: "Why did Qimam's warnings never reach Noura?",
              options: [
                  { id: 'a', text: 'The spam filter quarantined them' },
                  { id: 'b', text: 'An inbox rule moved anything mentioning Qimam to RSS Subscriptions' },
                  { id: 'c', text: 'Qimam had the wrong email address' },
                  { id: 'd', text: 'Noura deleted them' }
              ], answer: 'b',
              explain: 'The attacker created a rule named "." from their own IP address. Hidden rules like this are a signature of business email compromise.' },
            { id: 'q3', points: 10, type: 'single',
              q: 'Which detail proves the bank-change email was forged?',
              options: [
                  { id: 'a', text: 'It passed SPF and DKIM' },
                  { id: 'b', text: 'It carried the Qimam logo and signature' },
                  { id: 'c', text: 'It came from a lookalike domain registered four days earlier' },
                  { id: 'd', text: 'It arrived in the morning' }
              ], answer: 'c',
              explain: 'Authentication passing only shows the lookalike domain was set up properly. The domain itself, and its age, give the forgery away.' },
            { id: 'q4', points: 10, type: 'single',
              q: 'Which control would have stopped the loss?',
              options: [
                  { id: 'a', text: 'A second approver for the payment' },
                  { id: 'b', text: 'Calling the supplier on the number already on file before changing bank details' },
                  { id: 'c', text: 'A longer password for Noura' },
                  { id: 'd', text: 'Blocking all PDF attachments' }
              ], answer: 'b',
              explain: 'GulfPay already had two approvers; neither could see the bank change. An out-of-band call-back to a known number is the control that defeats bank-change fraud, and it has to be done and logged, not just ticked.' }
        ],
        debrief: {
            story: "An attacker phished Noura with a fake \"mailbox full\" page that relayed the real Microsoft login, stealing her session after MFA. For ten days they read her mail, created a hidden rule that diverted anything from Qimam, and registered a lookalike domain. When the Qimam invoice came due, they sent a convincing bank-change request from qimam-hosting.com. The call-back box was ticked but the call never happened, and the payment went to the attacker's account.",
            lessons: [
                'Passing SPF and DKIM only proves which domain sent a message, not who that domain belongs to.',
                'Adversary-in-the-middle phishing steals the session itself, so MFA alone does not stop it. Phishing-resistant MFA (FIDO2 or passkeys) and conditional access do.',
                'Check every compromised mailbox for hidden rules that move mail to RSS Subscriptions, Archive or Conversation History.',
                'Bank-detail changes need an out-of-band call-back to a number you already hold, recorded as evidence.',
                'Ask the bank to recall the transfer immediately: the first hours decide whether money comes back.'
            ],
            refs: ['MITRE ATT&CK T1566.002 Spearphishing Link', 'T1539 Steal Web Session Cookie', 'T1564.008 Email Hiding Rules', 'NCA ECC 2-4 Email Protection']
        }
    };

    /* ------------------------------------------------------------------
       LEVEL 2: Insider data breach (the original case)
       ------------------------------------------------------------------ */
    var insider = {
        id: 'insider', level: 2, rank: 'Analyst',
        caseNo: 'GP-IR-' + YEAR + '-0417',
        title: 'Insider data breach at GulfPay',
        teaser: 'Customer financial records left GulfPay overnight. Three employees had the access. Use a disk, memory, a seized phone and logs to prove who did it.',
        skills: ['Disk forensics', 'Memory analysis', 'Mobile forensics', 'Corroboration'],
        brief: 'Two days ago, 2.6 GB of customer financial records were uploaded to an external cloud account overnight. The SOC traced the upload to the Finance subnet but could not identify the person. Three employees had the access and opportunity. You have been handed four evidence sources. Examine them, tag what matters, and tell us who did it, how, and what they took.',
        peopleLabel: 'Suspects',
        people: [
            { name: 'Faisal Al-Otaibi', role: 'Finance Analyst', note: 'Access to the customer database for reporting.' },
            { name: 'Khalid Al-Harbi', role: 'IT Administrator', note: 'Domain admin. Broad access to everything.' },
            { name: 'Sara Al-Dosari', role: 'HR Specialist', note: 'No access to financial systems.' }
        ],
        hintCost: 2,
        minCoverage: 60,
        hints: {
            examine: 'The phone is the richest source. Look at the deleted messages and the photo locations, then check who was in the building that night.',
            conclude: 'A good file corroborates: the same act should appear on the disk, in memory, on the phone and in the logs.'
        },
        evidence: [
            {
                id: 'disk', type: 'Disk image', icon: 'fa-hard-drive',
                name: 'FIN-WS03 workstation', device: "Faisal Al-Otaibi's workstation",
                size: '512 GB', tool: 'Autopsy 4.21',
                groups: [
                    { label: 'File system', items: [
                        { id: 'd1', title: 'customers_export.csv (deleted)', time: D(-2, '21:06'), detail: 'A 2.6 GB CSV recovered from unallocated space. The header row lists full names, IBANs, card numbers and balances for 48,000 customers. Deleted at 21:41 the same night.', incriminating: true },
                        { id: 'd2', title: 'fin.7z in C:\\Users\\faisal\\AppData\\Local\\Temp', time: D(-2, '21:12'), detail: 'A password-protected 7-Zip archive the same size as the CSV. Created minutes after the export.', incriminating: true },
                        { id: 'd3', title: 'Quarterly_Report_Q1.xlsx', time: D(-3, '10:30'), detail: 'A normal finance workbook, last opened the day before. Nothing unusual.', incriminating: false }
                    ]},
                    { label: 'USB / device history', items: [
                        { id: 'd4', title: 'USB mass storage connected', time: D(-2, '21:14'), detail: 'A SanDisk 64 GB stick (serial 4C531...) mounted at 21:14 and removed at 21:33. Not a company-issued device.', incriminating: true }
                    ]},
                    { label: 'Browser history', items: [
                        { id: 'd5', title: 'Search: "sell customer data anonymously"', time: D(-4, '23:10'), detail: 'Private-window search two days before the breach, followed by visits to several data-broker forums.', incriminating: true },
                        { id: 'd6', title: 'Login to mega.nz', time: D(-2, '21:28'), detail: 'Signed in to a personal MEGA cloud account from the workstation.', incriminating: true },
                        { id: 'd7', title: 'Company webmail', time: D(-2, '09:02'), detail: 'Routine morning webmail session. Normal.', incriminating: false }
                    ]}
                ]
            },
            {
                id: 'memory', type: 'Memory dump', icon: 'fa-memory',
                name: 'FIN-WS03 RAM capture', device: '8 GB live memory image',
                size: '8 GB', tool: 'Volatility 3',
                groups: [
                    { label: 'Processes at capture', items: [
                        { id: 'm1', title: 'rclone.exe running', time: D(-2, '21:29'), detail: 'A command-line cloud-sync tool was running with arguments pointing at a MEGA remote and the fin.7z archive. rclone is not installed on any managed workstation.', incriminating: true },
                        { id: 'm2', title: '7zG.exe (7-Zip)', time: D(-2, '21:12'), detail: 'The 7-Zip GUI process, consistent with creating the archive.', incriminating: true },
                        { id: 'm3', title: 'chrome.exe', time: D(-2, '21:28'), detail: 'Browser process. Expected on any workstation.', incriminating: false }
                    ]},
                    { label: 'Network connections', items: [
                        { id: 'm4', title: 'Outbound TLS to gfs302.mega.nz', time: D(-2, '21:30'), detail: 'An established connection to MEGA storage carrying a large sustained upload from the workstation.', incriminating: true }
                    ]}
                ]
            },
            {
                id: 'mobile', type: 'Mobile device', icon: 'fa-mobile-screen',
                name: "Faisal's Android phone", device: 'Samsung Galaxy S23 (seized at desk)',
                size: '256 GB', tool: 'Cellebrite-style logical + file-system extraction',
                phone: true,
                groups: [
                    { label: 'Call log', icon: 'fa-phone', items: [
                        { id: 'p1', title: '3 outgoing calls to +971 50 xxx (unsaved)', time: D(-3) + ' to ' + D(-2), detail: 'Three short calls to the same UAE mobile the day before and the night of the breach. The number is not in contacts. It later resolves to a known data broker alias "M.".', incriminating: true },
                        { id: 'p2', title: 'Call to Mom', time: D(-2, '19:40'), detail: 'Routine personal call. Not relevant.', incriminating: false }
                    ]},
                    { label: 'Messages (Signal)', icon: 'fa-comment', items: [
                        { id: 'p3', title: '"Files ready. Same price as agreed?"', time: D(-2, '21:35'), detail: 'Sent to the +971 number minutes after the upload finished.', incriminating: true },
                        { id: 'p4', title: '"Send the payment to the usual wallet."', time: D(-2, '22:02'), detail: 'Follow-up message negotiating cryptocurrency payment.', incriminating: true }
                    ]},
                    { label: 'Recovered deleted messages', icon: 'fa-trash-arrow-up', items: [
                        { id: 'p5', title: 'RECOVERED: "I\'ll pull the full CSV tonight after everyone leaves."', time: D(-2, '18:22'), detail: 'Deleted from the chat but carved from the SQLite WAL journal. Premeditation, stated intent, and timing all line up with the export.', incriminating: true },
                        { id: 'p6', title: 'RECOVERED: "delete this chat when we\'re done"', time: D(-2, '22:05'), detail: 'Instruction to destroy evidence, recovered from free pages in the messaging database.', incriminating: true }
                    ]},
                    { label: 'Photos (with EXIF)', icon: 'fa-image', items: [
                        { id: 'p7', title: 'Photo of a monitor showing customer records', time: D(-2, '21:20'), detail: 'A phone photo of a screen full of the customer table. EXIF GPS: 24.7136, 46.6753 (GulfPay HQ, Riyadh). Taken at 21:20, after hours, from inside the office.', incriminating: true },
                        { id: 'p8', title: 'Lunch photo', time: D(-2, '13:05'), detail: 'A photo of a meal. EXIF places it at a nearby restaurant at midday. Not relevant.', incriminating: false }
                    ]},
                    { label: 'Installed apps', icon: 'fa-grip', items: [
                        { id: 'p9', title: 'MEGA + Signal + "Secure Eraser"', time: 'installed ' + D(-5), detail: 'A personal cloud client, an encrypted messenger, and a file-shredding app, all installed three days before the breach.', incriminating: true },
                        { id: 'p10', title: 'Banking and food-delivery apps', time: 'various', detail: 'Ordinary consumer apps. Not relevant.', incriminating: false }
                    ]},
                    { label: 'Location history', icon: 'fa-location-dot', items: [
                        { id: 'p11', title: 'At GulfPay HQ 20:55 to 22:10', time: D(-2) + ' night', detail: 'Google location history places the phone inside the office from just before 21:00 until after 22:00 on the night of the breach, matching the export, archive and upload times.', incriminating: true }
                    ]}
                ]
            },
            {
                id: 'logs', type: 'Logs', icon: 'fa-list',
                name: 'Proxy, DLP and badge logs', device: 'Central log store',
                size: 'n/a', tool: 'SIEM export',
                groups: [
                    { label: 'Proxy / DLP', items: [
                        { id: 'l1', title: '2.6 GB upload to mega.nz', time: D(-2, '21:30'), detail: "The perimeter proxy logged a 2.6 GB HTTPS upload to MEGA from 10.20.14.53 (FIN-WS03), Faisal's assigned workstation.", incriminating: true }
                    ]},
                    { label: 'Badge access', items: [
                        { id: 'l2', title: 'Faisal badged in 20:55, out 22:10', time: D(-2), detail: 'Physical access records put Faisal in the building across the entire window of the breach.', incriminating: true },
                        { id: 'l3', title: 'Khalid badged out 18:02', time: D(-2), detail: 'The IT administrator left the building nearly three hours before the breach and did not return. He had the access but not the opportunity.', incriminating: false, clears: 'khalid' },
                        { id: 'l4', title: 'Sara has no financial-system access', time: 'n/a', detail: 'HR accounts cannot reach the customer database at all.', incriminating: false, clears: 'sara' }
                    ]}
                ]
            }
        ],
        stages: [],
        questions: [
            { id: 'who', key: true, points: 25, type: 'single',
              q: 'Who carried out the breach?',
              options: [
                  { id: 'faisal', text: 'Faisal Al-Otaibi (Finance Analyst)' },
                  { id: 'khalid', text: 'Khalid Al-Harbi (IT Administrator)' },
                  { id: 'sara', text: 'Sara Al-Dosari (HR Specialist)' }
              ], answer: 'faisal',
              explain: 'The badge and access logs clear Khalid and Sara. The disk, memory, phone and proxy logs all point at Faisal.' },
            { id: 'how', key: true, points: 15, type: 'single',
              q: 'How did they do it?',
              options: [
                  { id: 'exfil-cloud', text: 'Copied the customer export to a personal cloud account (MEGA) and sold it to an outside broker' },
                  { id: 'ransomware', text: 'Deployed ransomware that encrypted the file server' },
                  { id: 'phishing', text: 'Fell for a phishing email that let an external attacker in' },
                  { id: 'misconfig', text: 'A public cloud bucket accidentally exposed the data' }
              ], answer: 'exfil-cloud',
              explain: 'The rclone process, the MEGA upload in the proxy log and the Signal messages about payment describe a deliberate sale, not an accident or an outside attack.' }
        ],
        debrief: {
            story: "Faisal Al-Otaibi exported 48,000 customer records, archived them, and pushed the archive to a personal MEGA account with rclone, while photographing the screen on his phone. He coordinated the sale over Signal with a broker and tried to delete the chat. The disk, memory, phone and logs corroborate each other, and the after-hours badge and location records place him at the scene while the other two suspects are cleared.",
            lessons: [
                'One source is a lead; agreement between independent sources is evidence.',
                'Deleted messages often survive in SQLite write-ahead logs and free pages.',
                'Photo EXIF data can place a device, and its owner, at a scene.',
                'Clearing suspects matters as much as accusing one: the badge logs remove reasonable doubt.'
            ],
            refs: ['NIST SP 800-86 Integrating Forensics into Incident Response', 'MITRE ATT&CK T1567.002 Exfiltration to Cloud Storage', 'Saudi PDPL: personal data breach notification']
        }
    };

    /* ------------------------------------------------------------------
       LEVEL 3: Ransomware with data theft
       ------------------------------------------------------------------ */
    var ransom = {
        id: 'ransomware', level: 3, rank: 'Senior Analyst',
        caseNo: 'GP-IR-' + YEAR + '-0705',
        title: 'Midnight encryption',
        teaser: 'A branch file server woke up encrypted. Capture the evidence in the right order, rebuild the attack minute by minute and find patient zero.',
        skills: ['Order of volatility', 'Windows event logs', 'Timeline building', 'MITRE ATT&CK'],
        brief: 'At 03:12 this morning every share on FS-DMM01, the Dammam branch file server, was encrypted and renamed with a .nvlt extension. A ransom note from a group calling itself NightVault demands 4.5 BTC and threatens to publish stolen data. The jump host JMP-01, which IT uses to reach the branch, is still powered on. Acquire the evidence in the right order, rebuild the timeline, and tell the crisis team how the attackers got in and what they took.',
        peopleLabel: 'Systems and accounts involved',
        people: [
            { name: 'JMP-01', role: 'Jump host', note: 'Still running. RDP reachable for a vendor.' },
            { name: 'FS-DMM01', role: 'Branch file server', note: 'Encrypted at 03:12.' },
            { name: 'svc_backup', role: 'Service account', note: 'Used by the backup software.' }
        ],
        hintCost: 3,
        hints: {
            acquire: 'One of these systems is still running. Whatever lives only in RAM disappears when it is switched off.',
            examine: 'Line up the times: failed logons, the first successful logon, the tool that touched LSASS, the service installed on the file server.',
            timeline: 'Every event in the list appears in the artifacts with a time. Sort by those times.',
            conclude: 'Ask where the first successful logon happened, and whether any data left before the encryption.'
        },
        volatility: { first: 'mem3', points: 5 },
        evidence: [
            {
                id: 'disk3', type: 'Disk image', icon: 'fa-hard-drive',
                name: 'FS-DMM01 disk image', device: 'File server system and data volumes, 4 TB',
                size: '4 TB', tool: 'Autopsy 4.21',
                groups: [
                    { label: 'Execution artifacts', icon: 'fa-terminal', items: [
                        { id: 'r_d1', title: 'vssadmin.exe delete shadows /all /quiet', time: D(0, '03:05'),
                          detail: 'Found in the command history and in Prefetch (VSSADMIN.EXE-...pf). Every Volume Shadow Copy was deleted seven minutes before the encryption, so users cannot roll files back.', incriminating: true },
                        { id: 'r_d2', title: 'C:\\ProgramData\\svchost32.exe, the encryptor', time: D(0, '03:09'),
                          detail: 'An unsigned binary in an unusual folder, written through the PsExec session. Its strings contain the .nvlt extension and the ransom note text, and its SHA-256 matches a NightVault sample shared through the national CERT.', incriminating: true }
                    ]},
                    { label: 'Impact', icon: 'fa-lock', items: [
                        { id: 'r_d3', title: 'README_RESTORE.txt in every folder', time: D(0, '03:12'),
                          detail: 'The ransom note claims 38 GB of data was stolen, demands 4.5 BTC to bc1qnv7x0d3s5h8p2c4mz9w6tq7lr5jfe8g3uxk3yv within 72 hours, and links to a Tor negotiation site.', incriminating: true,
                          raw: '--- NightVault ---\nYour network is encrypted and 38 GB of your data is with us.\nPay 4.5 BTC to bc1qnv7x0d3s5h8p2c4mz9w6tq7lr5jfe8g3uxk3yv within 72 hours.\nIf you do not pay, your data will be published.\nNegotiate: http://nvault[...].onion  ID: GP-7Q2X' },
                        { id: 'r_d4', title: 'Encrypted .nvlt files with near-maximum entropy', time: D(0, '03:12') + ' to 03:31',
                          detail: 'Sampled files measure 7.99 bits of entropy per byte: properly encrypted, not just renamed.', incriminating: true },
                        { id: 'r_d5', title: 'Department shares and user documents', time: 'n/a',
                          detail: 'The business data itself, now encrypted. It is the victim, not an attack artifact.', incriminating: false }
                    ]}
                ]
            },
            {
                id: 'mem3', type: 'Memory dump', icon: 'fa-memory', live: true,
                name: 'JMP-01 live memory', device: 'RAM capture from the running jump host, 16 GB',
                size: '16 GB', tool: 'Volatility 3',
                groups: [
                    { label: 'Processes (windows.pstree)', icon: 'fa-sitemap', items: [
                        { id: 'r_m1', title: 'rundll32.exe with no arguments, beaconing to 203.0.113.77:443', time: D(0, '00:41'),
                          detail: 'A rundll32 process with an empty command line, holding a connection to a bare IP address and calling out every 60 seconds. That is the behaviour of a command-and-control implant injected into a system process.', incriminating: true },
                        { id: 'r_m2', title: 'procdump64.exe -ma lsass.exe', time: D(0, '00:52'),
                          detail: 'A Sysinternals tool dumping the memory of LSASS, the process that holds logon credentials. The dump sits in C:\\Users\\Public. The domain admin account adm.yousef had an open session on JMP-01 at the time.', incriminating: true,
                          raw: 'PID   PPID  ImageFileName    CreateTime\n3388  1204  explorer.exe     ' + D(-1, '23:59:41') + '\n4120  3388  cmd.exe          ' + D(0, '00:51:40') + '\n4388  4120  procdump64.exe   ' + D(0, '00:52:07') + '\n      cmdline: procdump64.exe -accepteula -ma lsass.exe C:\\Users\\Public\\lsass.dmp' },
                        { id: 'r_m3', title: 'rclone.exe copy \\\\FS-DMM01\\Finance mega:dmm --transfers 16', time: D(0, '01:10'),
                          detail: 'rclone copying the Finance and HR shares from the file server to a MEGA account. IT has never installed rclone on this host.', incriminating: true },
                        { id: 'r_m4', title: 'MsMpEng.exe and the backup agent', time: 'n/a',
                          detail: 'Normal antivirus and backup processes. Expected.', incriminating: false }
                    ]},
                    { label: 'Network (windows.netscan)', icon: 'fa-network-wired', items: [
                        { id: 'r_m5', title: 'TLS session to gfs270n117.userstorage.mega.co.nz', time: D(0, '01:10') + ' to 02:41',
                          detail: 'A long upload to MEGA storage owned by the rclone process.', incriminating: true }
                    ]}
                ]
            },
            {
                id: 'ev3', type: 'Logs', icon: 'fa-list',
                name: 'Windows event logs', device: 'Security and System logs from JMP-01 and FS-DMM01 (SIEM copy)',
                size: '1.2 GB', tool: 'EvtxECmd + Timeline Explorer',
                groups: [
                    { label: 'JMP-01 Security log', icon: 'fa-shield-halved', items: [
                        { id: 'r_l1', title: '2,316 failed logons (4625) against RDP from 192.0.2.0/24', time: D(-1, '23:02') + ' to 23:58',
                          detail: 'A burst of failed RDP logons against many usernames from rotating addresses in one range. That is password spraying, aimed at a jump host whose RDP port is open to the internet.', incriminating: true,
                          raw: '4625  Logon Type 10  Account: administrator  Source: 192.0.2.17\n4625  Logon Type 10  Account: scanner        Source: 192.0.2.63\n4625  Logon Type 10  Account: svc_backup     Source: 192.0.2.41\n...  2,313 more in 56 minutes' },
                        { id: 'r_l2', title: 'Successful RDP logon (4624, type 10) as svc_backup from 192.0.2.41', time: D(-1, '23:59'),
                          detail: 'The spray worked against the backup service account, whose password had not been changed since it was created in 2019. A service account should never be able to log on over RDP at all.', incriminating: true },
                        { id: 'r_l3', title: 'Security log cleared (1102) by adm.yousef', time: D(0, '03:20'),
                          detail: 'The attackers cleared the log after the encryption finished, using the stolen domain admin account. Everything before it survives because the logs were forwarded to the SIEM in real time.', incriminating: true },
                        { id: 'r_l4', title: 'Nightly backup service logon (4624, type 5)', time: D(-1, '22:00'),
                          detail: 'The backup software starting its scheduled job, as it does every night. Normal.', incriminating: false }
                    ]},
                    { label: 'FS-DMM01 System log', icon: 'fa-server', items: [
                        { id: 'r_l5', title: 'Service PSEXESVC installed (7045) by adm.yousef from JMP-01', time: D(0, '01:02'),
                          detail: 'PsExec created its service on the file server: lateral movement from the jump host with the domain admin credentials taken from LSASS.', incriminating: true },
                        { id: 'r_l6', title: 'Windows Update service restart', time: D(-1, '19:30'),
                          detail: 'Routine patching. Not relevant.', incriminating: false }
                    ]}
                ]
            },
            {
                id: 'net3', type: 'Network logs', icon: 'fa-network-wired',
                name: 'Firewall and NetFlow', device: 'Perimeter firewall rules and core NetFlow',
                size: '86 MB', tool: 'NetFlow analyzer',
                groups: [
                    { label: 'Firewall', icon: 'fa-fire', items: [
                        { id: 'r_n1', title: 'Inbound TCP 3389 to JMP-01 allowed from any source', time: 'rule created ' + D(-210),
                          detail: 'A "temporary" rule opened RDP to the internet for a vendor seven months ago and was never removed.', incriminating: true }
                    ]},
                    { label: 'Flows', icon: 'fa-arrow-right-arrow-left', items: [
                        { id: 'r_n2', title: '38.4 GB outbound from JMP-01 to MEGA', time: D(0, '01:10') + ' to 02:41',
                          detail: 'Matches the rclone process in memory and the 38 GB claimed in the ransom note.', incriminating: true },
                        { id: 'r_n3', title: 'Beacon JMP-01 to 203.0.113.77:443 every 60 seconds', time: D(0, '00:41') + ' onwards',
                          detail: 'Small, regular HTTPS connections to an address with no domain name: the command-and-control channel.', incriminating: true },
                        { id: 'r_n4', title: 'Microsoft 365 and update traffic', time: 'all night',
                          detail: 'Normal business traffic. Not relevant.', incriminating: false }
                    ]}
                ]
            }
        ],
        stages: [
            { type: 'timeline', id: 'tl', points: 20,
              title: 'Rebuild the attack timeline',
              intro: 'Put these events in the order they happened. They carry no times here: take the times from the artifacts you examined.',
              events: [
                  { id: 't1', text: 'Password spraying against RDP on JMP-01' },
                  { id: 't2', text: 'Successful RDP logon as svc_backup' },
                  { id: 't3', text: 'Command-and-control implant starts beaconing' },
                  { id: 't4', text: 'LSASS memory dumped with procdump' },
                  { id: 't5', text: 'PsExec service installed on FS-DMM01' },
                  { id: 't6', text: 'Finance and HR shares copied to MEGA' },
                  { id: 't7', text: 'Shadow copies deleted' },
                  { id: 't8', text: 'Files encrypted and ransom notes dropped' },
                  { id: 't9', text: 'Security log cleared on JMP-01' }
              ],
              order: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'] }
        ],
        questions: [
            { id: 'q1', key: true, points: 10, type: 'single',
              q: 'Which machine was patient zero?',
              options: [
                  { id: 'a', text: 'FS-DMM01, the file server' },
                  { id: 'b', text: 'JMP-01, the jump host' },
                  { id: 'c', text: 'The domain controller' },
                  { id: 'd', text: 'A user laptop compromised by phishing' }
              ], answer: 'b',
              explain: 'The first successful logon, the implant and the credential theft all happen on JMP-01 before the file server is touched.' },
            { id: 'q2', key: true, points: 10, type: 'single',
              q: 'How did the attackers get in?',
              options: [
                  { id: 'a', text: 'A phishing email with a malicious macro' },
                  { id: 'b', text: 'An unpatched VPN appliance' },
                  { id: 'c', text: 'Password spraying against RDP left open to the internet, landing on svc_backup' },
                  { id: 'd', text: 'An infected USB drive' }
              ], answer: 'c',
              explain: 'The firewall rule, 2,316 failed logons and the type 10 logon as svc_backup tell one story: an exposed RDP port and a weak service account password.' },
            { id: 'q3', points: 8, type: 'single',
              q: 'Was data stolen before the encryption?',
              options: [
                  { id: 'a', text: 'No, the ransom note is a bluff' },
                  { id: 'b', text: 'Yes: about 38 GB went to MEGA, so this is double extortion and a likely personal-data breach' },
                  { id: 'c', text: 'It cannot be determined' }
              ], answer: 'b',
              explain: 'rclone in memory, the MEGA session and 38.4 GB of NetFlow agree with the note.' },
            { id: 'q4', points: 12, type: 'multi',
              q: 'Which MITRE ATT&CK techniques does the evidence show? Select all that apply.',
              options: [
                  { id: 'spray', text: 'T1110.003 Password Spraying' },
                  { id: 'lsass', text: 'T1003.001 OS Credential Dumping: LSASS Memory' },
                  { id: 'psexec', text: 'T1569.002 System Services: Service Execution' },
                  { id: 'exfil', text: 'T1567.002 Exfiltration to Cloud Storage' },
                  { id: 'vss', text: 'T1490 Inhibit System Recovery' },
                  { id: 'encrypt', text: 'T1486 Data Encrypted for Impact' },
                  { id: 'clear', text: 'T1070.001 Clear Windows Event Logs' },
                  { id: 'phish', text: 'T1566.001 Spearphishing Attachment' },
                  { id: 'usb', text: 'T1091 Replication Through Removable Media' },
                  { id: 'exploit', text: 'T1190 Exploit Public-Facing Application' }
              ], answer: ['spray', 'lsass', 'psexec', 'exfil', 'vss', 'encrypt', 'clear'],
              explain: 'Every selected technique maps to an artifact. Nothing in the evidence shows phishing, USB spread or a software exploit.' },
            { id: 'q5', key: true, points: 10, type: 'single',
              q: 'What should the crisis team do first?',
              options: [
                  { id: 'a', text: 'Pay the ransom quickly to limit the damage' },
                  { id: 'b', text: 'Reboot every server to clear the malware' },
                  { id: 'c', text: 'Restore from backup straight away' },
                  { id: 'd', text: 'Isolate JMP-01 and FS-DMM01, disable svc_backup and adm.yousef, reset privileged passwords and block the C2 and MEGA traffic' }
              ], answer: 'd',
              explain: 'Contain first. Rebooting destroys memory evidence, and restoring before the attackers are locked out invites a second round.' },
            { id: 'q6', points: 8, type: 'single',
              q: 'Is a regulatory clock running?',
              options: [
                  { id: 'a', text: 'No, only if the ransom is paid' },
                  { id: 'b', text: 'No, ransomware is not a data breach' },
                  { id: 'c', text: 'Yes: personal data was stolen, so SDAIA must be notified within 72 hours under the PDPL, and the incident reported to SAMA as GulfPay\'s regulator' }
              ], answer: 'c',
              explain: 'Stolen HR and finance records include personal data. The PDPL implementing regulation sets a 72-hour notification window, and SAMA-regulated firms report cyber incidents to SAMA.' }
        ],
        debrief: {
            story: 'NightVault sprayed passwords at JMP-01, whose RDP port had been left open to the internet for a vendor, and got in as svc_backup at 23:59. They planted a beacon, dumped LSASS to steal the domain admin credentials of adm.yousef, and used PsExec to reach the file server. Between 01:10 and 02:41 they copied 38 GB of Finance and HR data to MEGA with rclone, deleted the shadow copies, encrypted the shares at 03:12, and cleared the jump host\'s Security log on the way out. The SIEM copy of the logs is why the timeline could still be rebuilt.',
            lessons: [
                'Capture memory from live systems first. Order of volatility (RFC 3227) exists because RAM evidence disappears at shutdown.',
                'Never expose RDP to the internet; put vendors behind a VPN or a privileged access gateway with MFA.',
                'Service accounts need long random passwords and should be denied interactive and RDP logons.',
                'Protect LSASS with Credential Guard or RunAsPPL so a dump does not hand over domain admin.',
                'Forward logs off the host in real time. A cleared log is only fatal when it is the only copy.',
                'Double extortion makes ransomware a data breach too: start the notification clock early.'
            ],
            refs: ['RFC 3227 Guidelines for Evidence Collection (order of volatility)', 'NIST SP 800-61 Computer Security Incident Handling', 'MITRE ATT&CK Enterprise matrix', 'Saudi PDPL implementing regulation: 72-hour breach notification']
        }
    };

    /* ------------------------------------------------------------------
       LEVEL 4: Anti-forensics and IP theft
       ------------------------------------------------------------------ */
    var antiforensics = {
        id: 'antiforensics', level: 4, rank: 'Expert',
        caseNo: 'GP-LG-' + YEAR + '-0042',
        title: 'The clean laptop',
        teaser: 'A departing engineer handed back a "clean" laptop. Prove what he took, even though he tried to erase the trail, and do it in a way that stands up in court.',
        skills: ['Evidence integrity', 'NTFS artifacts', 'Timestomping', 'USB forensics'],
        brief: 'Omar Al-Shehri, a senior engineer on GulfPay\'s payments SDK, resigned six days ago and starts at a competitor next month. When he returned his laptop he told IT it was "cleaned for the next person". Legal wants to know whether he took the SDK source code, because any lawsuit will rest on your findings. Every step must survive cross-examination: acquire the drive properly, decide which artifacts you can rely on, and prove what left and how.',
        peopleLabel: 'People involved',
        people: [
            { name: 'Omar Al-Shehri', role: 'Senior Software Engineer', note: 'Resigned on ' + D(-6) + '.' },
            { name: 'Lina Al-Harthy', role: 'Engineering Manager', note: 'Raised the concern with Legal.' },
            { name: 'IT Service Desk', role: 'Asset owner', note: 'Took the laptop back on ' + D(-5) + '.' }
        ],
        hintCost: 3,
        hints: {
            acquire: 'Anything that boots the laptop or mounts its drive normally writes to it. Courts care about that.',
            examine: 'Wiping tools leave traces of their own. Look for what Windows records about files without being asked: journals, shortcuts, shadow copies.',
            integrity: 'Compare the two sets of NTFS timestamps. Only one of them is easy to change.',
            conclude: 'Follow the archive from GitLab, to the laptop, to a removable drive.'
        },
        evidence: [
            {
                id: 'disk4', type: 'Disk image', icon: 'fa-laptop',
                name: "Omar's laptop (LT-ENG-117)", device: '1 TB NVMe SSD, BitLocker unlocked with the escrowed recovery key',
                size: '1 TB', tool: 'FTK Imager + Autopsy',
                acquire: { mode: 'writeblock' },
                groups: [
                    { label: 'NTFS metadata ($MFT)', icon: 'fa-table', items: [
                        { id: 'a1', title: 'payments_sdk_design.docx: $SI created 2019-03-02, $FN created ' + D(-9),
                          time: D(-9, '21:14'),
                          detail: 'The $STANDARD_INFORMATION timestamps say the file is seven years old, but the $FILE_NAME attribute, which ordinary tools cannot set, records its creation nine days ago. $SI earlier than $FN is the classic sign of timestomping, and every $SI value ending in exactly .0000000 seconds confirms it.', incriminating: true,
                          raw: 'Attribute               Created\n$STANDARD_INFORMATION   2019-03-02 09:00:00.0000000\n$FILE_NAME              ' + D(-9, '21:14:38') + '.4471902' },
                        { id: 'a2', title: 'Windows system files', time: 'n/a',
                          detail: 'Consistent $SI and $FN timestamps across the operating system. Not relevant.', incriminating: false }
                    ]},
                    { label: 'Event logs', icon: 'fa-list', items: [
                        { id: 'a3', title: 'Security log cleared (1102) by omar.alshehri', time: D(-6, '18:41'),
                          detail: 'The Security log begins with a clear event at 18:41 on the day he resigned. Every record before it is gone.', incriminating: true }
                    ]},
                    { label: 'Execution (Prefetch)', icon: 'fa-bolt', items: [
                        { id: 'a4', title: 'NTIMESTOMP_V1.2_X64.EXE run once', time: D(-9, '21:16'),
                          detail: 'A tool that rewrites file timestamps, run two minutes after the design document was created.', incriminating: true },
                        { id: 'a5', title: 'SDELETE64.EXE run 3 times', time: 'last run ' + D(-6, '18:20'),
                          detail: 'Sysinternals SDelete overwrites files so they cannot be carved back from free space.', incriminating: true },
                        { id: 'a6', title: 'TEAMS.EXE, CHROME.EXE, CODE.EXE', time: 'daily',
                          detail: 'Everyday applications for an engineer. Not relevant.', incriminating: false }
                    ]},
                    { label: 'Change journal ($UsnJrnl:$J)', icon: 'fa-book', items: [
                        { id: 'a7', title: 'payments-sdk-v4.zip created, renamed holiday_photos.zip, then deleted', time: D(-8, '23:22') + ' to ' + D(-6, '18:19'),
                          detail: 'The journal survived the clean-up. It records a 1.9 GB archive created in Downloads, renamed to look like holiday photos, and deleted by SDelete on the day he resigned.', incriminating: true,
                          raw: 'USN       Timestamp            Reason                     FileName\n88120144  ' + D(-8, '23:22:10') + '  FILE_CREATE|CLOSE          payments-sdk-v4.zip\n88120988  ' + D(-8, '23:24:51') + '  RENAME_OLD_NAME            payments-sdk-v4.zip\n88121032  ' + D(-8, '23:24:51') + '  RENAME_NEW_NAME            holiday_photos.zip\n90311876  ' + D(-6, '18:19:02') + '  DATA_OVERWRITE|FILE_DELETE ZZZZZZZZZZZZ.ZZZ' }
                    ]},
                    { label: 'Shortcuts and jump lists', icon: 'fa-link', items: [
                        { id: 'a8', title: 'LNK: E:\\holiday_photos.zip (removable drive, volume serial 5C2A-91F0)', time: D(-8, '23:41'),
                          detail: 'Windows created a shortcut when the archive was opened from drive E:, a removable volume. The volume serial number identifies the exact USB drive.', incriminating: true }
                    ]},
                    { label: 'USB device history (registry)', icon: 'fa-plug', items: [
                        { id: 'a9', title: 'USBSTOR: Kingston DataTraveler 3.0, serial 60A44C3E45E1', time: 'first connected ' + D(-8, '23:30'),
                          detail: 'A personal Kingston drive, not company-issued, first plugged in at 23:30 and mounted as E:. Its volume serial matches the shortcut.', incriminating: true },
                        { id: 'a10', title: 'Company-issued YubiKey', time: 'daily',
                          detail: 'A hardware security key issued by IT. Expected.', incriminating: false }
                    ]},
                    { label: 'Volume Shadow Copies', icon: 'fa-clone', items: [
                        { id: 'a11', title: 'Shadow copy from ' + D(-12) + ' holds the full payments-sdk tree', time: D(-12, '03:00'),
                          detail: 'An automatic restore point from before the clean-up still contains C:\\dev\\payments-sdk (14,212 files) and its git history. SDelete never touched the shadow copy.', incriminating: true }
                    ]}
                ]
            },
            {
                id: 'git4', type: 'Server logs', icon: 'fa-code-branch',
                name: 'GitLab audit events', device: 'Self-hosted GitLab, payments-sdk repository',
                size: '9,870 events', tool: 'GitLab audit log export',
                groups: [
                    { label: 'Repository events', icon: 'fa-code', items: [
                        { id: 'g1', title: 'Personal access token "backup" created with read_repository scope', time: D(-8, '23:15'),
                          detail: 'Created late at night, three minutes before the download below.', incriminating: true },
                        { id: 'g2', title: 'Repository archive downloaded: payments-sdk @ v4.0.0 (.zip)', time: D(-8, '23:18'),
                          detail: 'A full archive of the SDK, downloaded minutes before the archive appears on the laptop. Omar had not touched this repository in three weeks.', incriminating: true },
                        { id: 'g3', title: 'git clone of payments-sdk-docs', time: D(-20, '10:02'),
                          detail: 'A routine clone of the documentation repository during working hours, part of his job.', incriminating: false }
                    ]}
                ]
            },
            {
                id: 'hr4', type: 'Records', icon: 'fa-folder-open',
                name: 'HR and IT records', device: 'HR case file and IT asset log',
                size: '14 documents', tool: 'Document review',
                groups: [
                    { label: 'HR', icon: 'fa-user-tie', items: [
                        { id: 'h1', title: 'Resignation letter', time: D(-6, '09:00'),
                          detail: 'Handed in on the morning of the day the Security log was later cleared.', incriminating: true },
                        { id: 'h2', title: 'Signed IP assignment and acceptable use policy', time: 'signed at onboarding',
                          detail: 'Forbids copying source code to personal devices. It establishes that he knew the rule.', incriminating: true }
                    ]},
                    { label: 'IT', icon: 'fa-laptop-medical', items: [
                        { id: 'h3', title: 'Asset log: laptop returned "wiped by user"', time: D(-5, '08:30'),
                          detail: 'The service desk accepted the laptop without imaging it first. Fortunately nobody reinstalled it.', incriminating: false }
                    ]}
                ]
            }
        ],
        stages: [
            { type: 'integrity', id: 'int', points: 15,
              title: 'Decide what you can rely on',
              intro: 'Before you build the case, tell Legal which records are trustworthy as they stand and which the suspect altered.',
              items: [
                  { id: 'i1', title: '$STANDARD_INFORMATION timestamps on payments_sdk_design.docx', answer: 'altered', why: 'Rewritten by nTimestomp: earlier than $FN and with zeroed fractions.' },
                  { id: 'i2', title: '$FILE_NAME timestamps on the same file', answer: 'reliable', why: 'Set by the file system itself and not touched by the tool.' },
                  { id: 'i3', title: 'The Security event log', answer: 'altered', why: 'Cleared at 18:41 on the day he resigned; it only shows what happened afterwards.' },
                  { id: 'i4', title: 'The USN change journal', answer: 'reliable', why: 'Not cleared, and it records the create, rename and wipe of the archive.' },
                  { id: 'i5', title: 'The Volume Shadow Copy from ' + D(-12), answer: 'reliable', why: 'Taken automatically before the clean-up and untouched by SDelete.' },
                  { id: 'i6', title: 'The empty Recycle Bin', answer: 'altered', why: 'Emptied deliberately; its emptiness says nothing about what existed.' }
              ] }
        ],
        questions: [
            { id: 'q1', key: true, points: 10, type: 'single',
              q: 'What did Omar take?',
              options: [
                  { id: 'a', text: 'Customer card data' },
                  { id: 'b', text: 'The payments SDK source code (v4.0.0) as a zip archive' },
                  { id: 'c', text: 'HR salary files' },
                  { id: 'd', text: 'Nothing: the laptop was simply cleaned' }
              ], answer: 'b',
              explain: 'GitLab shows the v4.0.0 archive download, and the journal, shortcut and shadow copy trace it onto the laptop.' },
            { id: 'q2', key: true, points: 10, type: 'single',
              q: 'How did it leave GulfPay?',
              options: [
                  { id: 'a', text: 'Emailed to his personal address' },
                  { id: 'b', text: 'Pushed to a public GitHub repository' },
                  { id: 'c', text: 'On a personal Kingston USB drive (E:), after downloading it from GitLab' },
                  { id: 'd', text: 'Printed out' }
              ], answer: 'c',
              explain: 'The LNK file on E: and the USBSTOR entry share the same volume serial and the same night.' },
            { id: 'q3', points: 10, type: 'multi',
              q: 'What did he do to hide it? Select all that apply.',
              options: [
                  { id: 'ts', text: 'Changed file timestamps (timestomping)' },
                  { id: 'log', text: 'Cleared the Security event log' },
                  { id: 'sdel', text: 'Wiped files with SDelete' },
                  { id: 'ren', text: 'Renamed the archive to look like holiday photos' },
                  { id: 'fde', text: 'Encrypted the whole disk' },
                  { id: 'reinstall', text: 'Reinstalled Windows' },
                  { id: 'stego', text: 'Hid data inside images (steganography)' }
              ], answer: ['ts', 'log', 'sdel', 'ren'],
              explain: 'BitLocker was GulfPay\'s own encryption, Windows was never reinstalled, and nothing points at steganography.' },
            { id: 'q4', points: 10, type: 'multi',
              q: 'Which artifacts survived the clean-up and still prove the archive was there?',
              options: [
                  { id: 'usn', text: 'The USN change journal' },
                  { id: 'lnk', text: 'The LNK shortcut on E:' },
                  { id: 'vss', text: 'The Volume Shadow Copy' },
                  { id: 'usb', text: 'The USBSTOR registry entry' },
                  { id: 'bin', text: 'The Recycle Bin' },
                  { id: 'sec', text: 'The Security event log' },
                  { id: 'dl', text: 'The Downloads folder' }
              ], answer: ['usn', 'lnk', 'vss', 'usb'],
              explain: 'He cleaned what users see. Windows keeps its own records in places most people never look.' },
            { id: 'q5', points: 5, type: 'single',
              q: 'Why does the way the drive was acquired matter so much here?',
              options: [
                  { id: 'a', text: 'Imaging through a write-blocker with a verified hash proves nothing was changed, so the findings survive cross-examination' },
                  { id: 'b', text: 'It is faster' },
                  { id: 'c', text: 'It removes BitLocker' },
                  { id: 'd', text: 'It only matters in criminal cases' }
              ], answer: 'a',
              explain: 'A defence expert will ask first whether the evidence could have been altered after seizure. A verified hash answers that.' }
        ],
        debrief: {
            story: 'Nine days ago Omar created a personal access token and downloaded the payments SDK v4.0.0 from GitLab at 23:18. Within minutes the archive was on his laptop; he renamed it holiday_photos.zip and copied it to his own Kingston USB drive. He timestomped the design document to make it look seven years old, and on the day he resigned he wiped the archive with SDelete and cleared the Security log. He did not know about the USN journal, the shortcut Windows made on drive E:, the USB registry record or the shadow copy, and together they rebuild everything he tried to erase.',
            lessons: [
                'Acquire through a write-blocker and verify the hash. ISO/IEC 27037 and every defence expert will ask about it.',
                '$STANDARD_INFORMATION is easy to change; $FILE_NAME is not. $SI earlier than $FN, or zeroed fractions, means timestomping.',
                'Anti-forensics leaves its own traces: Prefetch records the wiping and timestamp tools.',
                'The USN journal, LNK files, USBSTOR and shadow copies often survive a user-level clean-up.',
                'Image the laptops of departing staff before IT reuses them, and control USB storage with DLP.'
            ],
            refs: ['ISO/IEC 27037 Identification, collection, acquisition and preservation of digital evidence', 'NIST SP 800-86', 'MITRE ATT&CK T1070.006 Timestomp, T1070.001 Clear Windows Event Logs, T1070.004 File Deletion', 'T1052.001 Exfiltration over USB, T1213.003 Code Repositories']
        }
    };

    /* ------------------------------------------------------------------
       LEVEL 5: Cryptocurrency tracing
       ------------------------------------------------------------------ */
    // Made-up P2WPKH-style addresses built from the bech32 alphabet (no real wallet).
    var B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    function fakeAddr(seed) {
        var x = (seed * 7919 + 17) % 2147483647, out = 'bc1q';
        for (var k = 0; k < 38; k++) { x = (x * 48271) % 2147483647; out += B32.charAt((x >> 3) % 32); }
        return out;
    }
    var A = { R: 'bc1qnv7x0d3s5h8p2c4mz9w6tq7lr5jfe8g3uxk3yv' };
    ['V1', 'V2', 'V3', 'A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'C1', 'Y1', 'Y2', 'P1', 'D1', 'M7', 'X1', 'X2', 'X3', 'X4', 'E1']
        .forEach(function (k, n) { A[k] = fakeAddr(n + 7); });

    var money = {
        id: 'crypto', level: 5, rank: 'Lead Investigator',
        caseNo: 'GP-IR-' + YEAR + '-0705-B',
        title: 'Follow the money',
        teaser: "NightVault's ransom wallet was paid by other victims. Trace the bitcoin through a peel chain and a mixer to the exchange where it was cashed out.",
        skills: ['Blockchain tracing', 'Change detection', 'Mixer analysis', 'Legal process'],
        brief: "GulfPay will not pay NightVault (Midnight encryption, Level 3). The group reuses one address for every victim, and the blockchain shows it has already received 5 BTC from three other organisations. The police have arrested a suspected money mule in Riyadh while he withdrew cash, and seized his phone. They have asked GulfPay's team to help trace the funds. Follow the money on the blockchain, flag every address the attackers control, corroborate it with the phone, and identify where the bitcoin was cashed out so a legal request can be served.",
        peopleLabel: 'Parties',
        people: [
            { name: 'NightVault', role: 'Ransomware group', note: 'Operator handle on Telegram: @vault_ops.' },
            { name: 'Sultan A.', role: 'Suspected money mule', note: 'University student, phone seized on arrest.' },
            { name: 'DuneX', role: 'Licensed crypto exchange abroad', note: 'Requires ID verification (KYC).' }
        ],
        hintCost: 4,
        hints: {
            examine: "The mule's phone holds an address. Search for it in the explorer.",
            trace: 'In a peel chain, each hop sends a round amount away and returns the larger, odd-looking remainder to the attackers. Coins spent together in one transaction are usually controlled by the same wallet.',
            conclude: 'Exchanges know their customers. That is where the trail turns into a name.'
        },
        evidence: [
            {
                id: 'note5', type: 'Documents', icon: 'fa-file-lines',
                name: 'Ransom note and negotiation portal', device: 'From FS-DMM01 and the NightVault Tor site',
                size: '3 files', tool: 'Document review',
                groups: [
                    { label: 'Ransom note', icon: 'fa-file', items: [
                        { id: 'n1', title: 'Payment address ' + A.R, time: D(0, '03:12'),
                          detail: 'The bitcoin address in README_RESTORE.txt on GulfPay\'s file server. It is the starting point of the trace.', incriminating: true },
                        { id: 'n2', title: '"How to buy bitcoin" guide in the note', time: 'n/a',
                          detail: 'Generic instructions copied into every NightVault note. Not specific evidence.', incriminating: false }
                    ]},
                    { label: 'Negotiation chat (Tor)', icon: 'fa-comments', items: [
                        { id: 'n3', title: '"Pay to the same address as everyone else. We confirm after 2 blocks."', time: D(0, '09:30'),
                          detail: 'The operators confirm the note\'s address is theirs and that they reuse it for every victim, so earlier payments to it are their proceeds.', incriminating: true }
                    ]}
                ]
            },
            {
                id: 'phone5', type: 'Mobile device', icon: 'fa-mobile-screen', phone: true,
                name: "Sultan's iPhone", device: 'iPhone 14, seized on arrest',
                size: '128 GB', tool: 'Full file-system extraction',
                groups: [
                    { label: 'Installed apps', icon: 'fa-grip', items: [
                        { id: 'f1', title: 'DuneX exchange app, account "sultan.a" with verified ID', time: 'installed ' + D(-15),
                          detail: 'The app shows a fully verified account (passport and selfie) opened two weeks ago.', incriminating: true },
                        { id: 'f2', title: 'Games, social media and university apps', time: 'various',
                          detail: 'Ordinary apps for a student. Not relevant.', incriminating: false }
                    ]},
                    { label: 'Notes and clipboard', icon: 'fa-note-sticky', items: [
                        { id: 'f3', title: 'Note: "' + A.E1 + '  deposit, wait, withdraw to card"', time: D(-3, '09:58'),
                          detail: 'A deposit address saved in Notes seven minutes before a large deposit reached it on the blockchain.', incriminating: true }
                    ]},
                    { label: 'Telegram', icon: 'fa-paper-plane', items: [
                        { id: 'f4', title: '@vault_ops: "Earn 5,000 SAR a week. You just receive and send."', time: D(-16, '22:40'),
                          detail: 'The recruitment message. Classic money-mule recruiting.', incriminating: true },
                        { id: 'f5', title: '@vault_ops: "2.6 is coming to your DuneX address. Keep 4%, withdraw the rest in cash."', time: D(-3, '10:02'),
                          detail: 'Instructions that match the 2.6 BTC deposit to the exchange.', incriminating: true },
                        { id: 'f6', title: 'Family and university group chats', time: 'various',
                          detail: 'Personal chats. Not relevant.', incriminating: false }
                    ]},
                    { label: 'SMS and screenshots', icon: 'fa-image', items: [
                        { id: 'f7', title: 'DuneX one-time codes for a withdrawal', time: D(-3, '11:40'),
                          detail: 'Security codes for a withdrawal from the DuneX account the same morning.', incriminating: true },
                        { id: 'f8', title: 'Screenshot of a DuneX balance: 2.59 BTC', time: D(-3, '10:24'),
                          detail: 'The deposit after the exchange fee, ready to sell.', incriminating: true }
                    ]}
                ]
            }
        ],
        stages: [
            { type: 'trace', id: 'trace', points: 20,
              title: 'Trace the funds on the blockchain',
              intro: 'Start at the ransom address. Open transactions, follow the outputs, and flag every address you believe the attackers control. Known services are labelled, as they would be in a commercial tracing tool. Unlabelled addresses could belong to anyone.',
              start: 'R',
              addr: {
                  R:  { a: A.R,  entity: 'attacker', label: 'Ransom address (from the note)' },
                  V1: { a: A.V1, entity: 'victim', label: 'Victim payment (company in Kuwait)' },
                  V2: { a: A.V2, entity: 'victim', label: 'Victim payment (hospital group)' },
                  V3: { a: A.V3, entity: 'victim', label: 'Victim payment (logistics firm)' },
                  A1: { a: A.A1, entity: 'attacker' },
                  A2: { a: A.A2, entity: 'attacker' },
                  A3: { a: A.A3, entity: 'attacker' },
                  A4: { a: A.A4, entity: 'attacker' },
                  A5: { a: A.A5, entity: 'attacker' },
                  B1: { a: A.B1, entity: 'service', label: 'LuckyHash Casino deposit (gambling, no ID checks)' },
                  C1: { a: A.C1, entity: 'service', label: 'WhirlMix deposit address (custodial mixer)' },
                  Y1: { a: A.Y1, entity: 'service', label: 'WhirlMix deposit address (custodial mixer)' },
                  Y2: { a: A.Y2, entity: 'service', label: 'WhirlMix deposit address (custodial mixer)' },
                  P1: { a: A.P1, entity: 'service', label: 'WhirlMix hot wallet (custodial mixer)' },
                  D1: { a: A.D1, entity: 'unknown' },
                  M7: { a: A.M7, entity: 'attacker' },
                  X1: { a: A.X1, entity: 'unknown' },
                  X2: { a: A.X2, entity: 'unknown' },
                  X3: { a: A.X3, entity: 'unknown' },
                  X4: { a: A.X4, entity: 'unknown' },
                  E1: { a: A.E1, entity: 'service', label: 'DuneX exchange (customer deposit address)' }
              },
              txs: [
                  { id: 'f3a9c1d2', time: D(-9, '14:02'), ins: [{ a: 'V1', v: 1.8012 }], outs: [{ a: 'R', v: 1.8000 }] },
                  { id: '0be417aa', time: D(-8, '09:41'), ins: [{ a: 'V2', v: 2.2511 }], outs: [{ a: 'R', v: 2.2500 }] },
                  { id: '7d22e05f', time: D(-6, '20:15'), ins: [{ a: 'V3', v: 0.9508 }], outs: [{ a: 'R', v: 0.9500 }] },
                  { id: '91c4aa30', time: D(-5, '03:10'), ins: [{ a: 'R', v: 1.8000 }, { a: 'R', v: 2.2500 }, { a: 'R', v: 0.9500 }], outs: [{ a: 'A1', v: 4.9991 }] },
                  { id: 'c06b3f71', time: D(-5, '03:31'), ins: [{ a: 'A1', v: 4.9991 }], outs: [{ a: 'B1', v: 0.7500 }, { a: 'A2', v: 4.2484 }] },
                  { id: '5ee810c4', time: D(-5, '04:02'), ins: [{ a: 'A2', v: 4.2484 }], outs: [{ a: 'C1', v: 1.2000 }, { a: 'A3', v: 3.0479 }] },
                  { id: '2f0a6d19', time: D(-5, '06:40'), ins: [{ a: 'C1', v: 1.2000 }, { a: 'Y1', v: 2.0000 }, { a: 'Y2', v: 3.2112 }], outs: [{ a: 'P1', v: 6.4108 }] },
                  { id: 'a4d7b2e8', time: D(-4, '11:20'), ins: [{ a: 'A3', v: 3.0479 }], outs: [{ a: 'D1', v: 0.5000 }, { a: 'A4', v: 2.5474 }] },
                  { id: 'e19f5c03', time: D(-4, '15:00'), ins: [{ a: 'P1', v: 6.4108 }], outs: [{ a: 'X1', v: 0.2500 }, { a: 'M7', v: 0.1000 }, { a: 'X2', v: 0.4000 }, { a: 'X3', v: 0.1000 }, { a: 'X4', v: 0.7500 }, { a: 'P1', v: 4.8104 }] },
                  { id: '3b8d0612', time: D(-3, '10:05'), ins: [{ a: 'A4', v: 2.5474 }, { a: 'M7', v: 0.1000 }], outs: [{ a: 'E1', v: 2.6000 }, { a: 'A5', v: 0.0468 }] }
              ],
              attacker: ['R', 'A1', 'A2', 'A3', 'A4', 'A5', 'M7'] }
        ],
        questions: [
            { id: 'q1', key: true, points: 10, type: 'single',
              q: 'In the first transaction that spends from the consolidation address (c06b3f71), which output is the attackers\' change?',
              options: [
                  { id: 'a', text: '0.7500 BTC' },
                  { id: 'b', text: '4.2484 BTC' }
              ], answer: 'b',
              explain: 'The payment is the round amount sent to a service; the odd remainder goes to a fresh address that spends again 31 minutes later. That is how a peel chain moves.' },
            { id: 'q2', key: true, points: 10, type: 'single',
              q: 'Where was most of the money cashed out?',
              options: [
                  { id: 'a', text: 'LuckyHash Casino' },
                  { id: 'b', text: 'WhirlMix mixer' },
                  { id: 'c', text: 'The DuneX exchange deposit address' },
                  { id: 'd', text: 'It is still in the ransom wallet' }
              ], answer: 'c',
              explain: '2.6 BTC, more than half of the 5 BTC, landed at a DuneX deposit address, the same address saved on the mule\'s phone.' },
            { id: 'q3', points: 10, type: 'single',
              q: 'What links the mixed coins back to the attackers?',
              options: [
                  { id: 'a', text: 'The mixer published its logs' },
                  { id: 'b', text: 'A mixer output was spent in the same transaction as the attackers\' own change (common-input ownership)' },
                  { id: 'c', text: 'The victims reused their addresses' },
                  { id: 'd', text: 'Nothing: mixing makes the coins untraceable' }
              ], answer: 'b',
              explain: 'The mixer pays out of a shared hot wallet, so its withdrawals cannot be matched to deposits. But transaction 3b8d0612 spends one of those withdrawals together with the attackers\' own change. Inputs spent together are normally signed by one wallet, which undoes the privacy the mixer bought them.' },
            { id: 'q4', points: 8, type: 'single',
              q: "What does the mule's phone add to the blockchain trace?",
              options: [
                  { id: 'a', text: 'It proves Sultan wrote the ransomware' },
                  { id: 'b', text: 'It ties the DuneX deposit address to a verified account, and to instructions from @vault_ops' },
                  { id: 'c', text: 'Nothing the blockchain does not already show' }
              ], answer: 'b',
              explain: 'The chain shows where the coins went. The phone shows who was told to receive them, by whom, and that the account behind the address is verified.' },
            { id: 'q5', key: true, points: 10, type: 'single',
              q: 'What is the right next step?',
              options: [
                  { id: 'a', text: 'Post the addresses publicly and ask the community to block them' },
                  { id: 'b', text: 'Message @vault_ops pretending to be a victim to obtain the private keys' },
                  { id: 'c', text: 'Ask DuneX, through the police and the proper legal channel, to freeze the account and preserve and disclose its KYC, login and withdrawal records' },
                  { id: 'd', text: 'Hack back the attackers\' wallet' }
              ], answer: 'c',
              explain: 'Exchanges are the choke point where pseudonymous coins meet real identities. Legal process through law enforcement can freeze funds and unmask the account holder; vigilante action ruins the case.' }
        ],
        debrief: {
            story: "Three victims paid a total of 5 BTC to NightVault's address. The operators consolidated the payments, then ran a peel chain: 0.75 BTC to a casino, 1.2 BTC into the WhirlMix mixer and 0.5 BTC to an unknown wallet, each time sending the change to a fresh address of their own. When the mixer paid them back from its hot wallet, they spent one of those withdrawals together with their remaining 2.55 BTC, which linked it back to them, and sent 2.6 BTC to a DuneX deposit address. That address was in the notes of a money mule recruited on Telegram, whose verified DuneX account is now the lead that turns a pseudonym into a person.",
            lessons: [
                'Bitcoin is pseudonymous, not anonymous: every hop is public and permanent.',
                'Peel chains send round payments away and the odd change onward; the change is the thread to follow.',
                'Coins spent together usually share an owner. One careless co-spend can undo a mixer.',
                'Exchanges with KYC are where trails become names; act fast to freeze funds before withdrawal.',
                'Money mules are often recruited students. They are evidence and witnesses as much as suspects.'
            ],
            refs: ['Meiklejohn et al., "A Fistful of Bitcoins" (2013): clustering by common-input ownership', 'FATF guidance on virtual assets and VASPs', 'US DOJ recovery of the Colonial Pipeline ransom (2021)', 'Aziz Alghamdi, Forensic Analysis of Cryptocurrency-Based Ransomware (working paper, 2026)'],
            readMore: { text: 'Read the research behind this case', href: '../../research/Ransomware_Cryptocurrency_Forensics_Alghamdi_2026.pdf' }
        }
    };

    window.DF_CASES = [bec, insider, ransom, antiforensics, money];
})();
