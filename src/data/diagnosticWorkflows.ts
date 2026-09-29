import { PamComponent, SeverityLevel, ErrorEntry } from '../types';

export interface DiagnosticQuestionChoice {
  id: string;
  label: string;
  description?: string;
  isLikelyIndicator?: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  hint?: string;
  choices: DiagnosticQuestionChoice[];
}

export interface DiagnosticWorkflow {
  id: string;
  title: string;
  component: PamComponent;
  category: string;
  severity: SeverityLevel;
  summary: string;
  commonCodes: string[];
  questions: DiagnosticQuestion[];
  diagnosisRules: {
    conditionSummary: string;
    rootCause: string;
    explanation: string;
    resolutionSteps: string[];
    logsToCheck: string[];
    referenceArticleId: string;
    referenceArticleTitle: string;
    communityCause: string;
    communitySolution: string;
  };
  sampleLog: string;
}

export const PAM_DIAGNOSTIC_WORKFLOWS: DiagnosticWorkflow[] = [
  // ==========================================
  // PRIVILEGE CLOUD WORKFLOWS
  // ==========================================
  {
    id: 'pcld-wf-securetunnel',
    title: 'Privilege Cloud Secure Tunnel Disconnection & Handshake Timeout',
    component: 'Privilege Cloud',
    category: 'SaaS Connectivity & Micro-Tunnel',
    severity: 'Critical',
    summary: 'On-premises customer connector loses outbound connection to the CyberArk Privilege Cloud SaaS tenant, suspending safe retrieval and automated credential rotation.',
    commonCodes: ['PCLD001E', 'HTTP-407', 'ETIMEDOUT'],
    questions: [
      {
        id: 'q-pcld-port443',
        question: 'Can the connector host reach your tenant domain on port 443?',
        hint: 'Run: Test-NetConnection -ComputerName "<tenant>.privilegecloud.cyberark.cloud" -Port 443',
        choices: [
          { id: 'port_blocked', label: 'Connection failed / timed out (Firewall blocked)', isLikelyIndicator: true },
          { id: 'port_connected', label: 'Port 443 is open and connected', isLikelyIndicator: false },
          { id: 'not_tested', label: 'Have not tested port reachability yet', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-pcld-dpi',
        question: 'Does your corporate network perform SSL/TLS Deep Packet Inspection (DPI)?',
        hint: 'CyberArk Secure Tunnel uses certificate pinning; SSL proxy re-signing will break the handshake.',
        choices: [
          { id: 'dpi_enabled', label: 'Yes, TLS inspection / proxy is active on the network', isLikelyIndicator: true },
          { id: 'dpi_bypassed', label: 'No, cyberark.cloud domains are whitelisted/bypassed', isLikelyIndicator: false },
          { id: 'dpi_unsure', label: 'Not sure if proxy intercepts traffic', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-pcld-tunnel-service',
        question: 'Is the CyberArk Secure Tunnel Windows service running?',
        choices: [
          { id: 'service_stopped', label: 'Service is stopped or repeatedly crashing', isLikelyIndicator: true },
          { id: 'service_running', label: 'Service shows Running in services.msc', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'Privilege Cloud Secure Tunnel Outbound Communication Failure',
      rootCause: 'Outbound TCP port 443 is blocked on the enterprise firewall, corporate TLS inspection proxy is terminating the pinned certificate, or the CyberArk Secure Tunnel service has desynchronized.',
      explanation: 'Privilege Cloud architecture depends on the Secure Tunnel component on on-premises connectors to maintain persistent, encrypted outbound micro-tunnels to CyberArk ISPSS cloud backends. Because certificate pinning is enforced, any MITM proxy or packet drop interrupts communication immediately.',
      resolutionSteps: [
        'Test direct TCP 443 socket reachability to your tenant: Test-NetConnection -ComputerName "<tenant>.privilegecloud.cyberark.cloud" -Port 443.',
        'Configure the edge firewall and proxy to bypass TLS decryption for *.cyberark.cloud and *.privilegecloud.cyberark.cloud.',
        'Open services.msc on the connector host and ensure the "CyberArk Secure Tunnel" service is Started and set to Automatic.',
        'Review C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log for handshake error codes or HTTP 407 proxy authentication prompts.',
        'If using an authenticated corporate proxy, update proxy credentials in the Secure Tunnel configuration wizard: C:\\Program Files\\CyberArk\\Secure Tunnel\\SecureTunnelUI.exe.',
      ],
      logsToCheck: [
        'C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log',
        'C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log',
        'Windows Event Viewer: Application & System',
      ],
      referenceArticleId: '000006214',
      referenceArticleTitle: 'Privilege Cloud Secure Tunnel connection failed troubleshooting',
      communityCause: 'Outbound port 443 blocked or TLS inspection proxy invalidating pinned certificate.',
      communitySolution: 'Whitelist *.cyberark.cloud on proxy/firewall without SSL inspection and restart CyberArk Secure Tunnel service.',
    },
    sampleLog: `2026-09-26 14:32:01 [ERROR] [SecureTunnel] Failed to establish TLS micro-tunnel to tenant-prod.privilegecloud.cyberark.cloud:443
2026-09-26 14:32:01 [ERROR] [SecureTunnel] Handshake error: System.Security.Authentication.AuthenticationException: The remote certificate is invalid according to the validation procedure.
2026-09-26 14:32:01 [WARN] [SecureTunnel] Intermediate CA mismatch: Issuer [Acme Corporate SSL Proxy CA] untrusted by CyberArk certificate pinning.
2026-09-26 14:32:02 [FATAL] [SecureTunnel] PCLD001E Secure Tunnel disconnected. Retrying in 30 seconds...`,
  },
  {
    id: 'pcld-wf-connector-token',
    title: 'Connector Management Agent Offline or Token Expired',
    component: 'Privilege Cloud',
    category: 'Connector Management & ISPSS',
    severity: 'High',
    summary: 'The Connector Management Agent on the customer server fails to register or heartbeat with CyberArk ISPSS due to an expired registration script token.',
    commonCodes: ['PCLD004E', 'HTTP-401', 'TOKEN_EXPIRED'],
    questions: [
      {
        id: 'q-token-age',
        question: 'Was the connector registration script generated more than 24 hours ago?',
        choices: [
          { id: 'token_expired', label: 'Yes, generated more than 24 hours ago', isLikelyIndicator: true },
          { id: 'token_fresh', label: 'No, generated recently within 24 hours', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-agent-service',
        question: 'Is the "CyberArk Management Agent" Windows service running?',
        choices: [
          { id: 'agent_stopped', label: 'Service is stopped', isLikelyIndicator: true },
          { id: 'agent_running', label: 'Service is running but shows Offline in cloud portal', isLikelyIndicator: true },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'Privilege Cloud Connector Management Agent Registration Failure',
      rootCause: 'The deployment script was executed after the 24-hour token validity window expired, or the agent cryptographic cache in C:\\Program Files\\CyberArk\\Connector Management Agent was invalidated.',
      explanation: 'When installing or re-registering on-premises connectors for CyberArk Privilege Cloud with ISPSS, the cloud-generated bootstrap token has a strict 24-hour time-to-live. Once expired, the agent registration handshake returns HTTP 401 Unauthorized.',
      resolutionSteps: [
        'Log into CyberArk ISPSS Portal (https://<tenant>.cyberark.cloud) as an Administrator.',
        'Navigate to Administration > Connector Management and click "Add Connector".',
        'Generate a fresh PowerShell installation script with a new 24-hour token.',
        'Copy and run the script inside an elevated PowerShell prompt on the connector server.',
        'Inspect C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log to verify HTTP 200 registration success.',
      ],
      logsToCheck: [
        'C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log',
      ],
      referenceArticleId: '000006328',
      referenceArticleTitle: 'Connector Management Agent Token Expired Resolution',
      communityCause: 'The deployment script bootstrap token expired after 24 hours.',
      communitySolution: 'Generate a fresh connector registration command in ISPSS Connector Management and re-run in administrative PowerShell.',
    },
    sampleLog: `2026-09-26 10:18:44 [ERROR] [ConnectorManagementAgent] Failed to register agent with CyberArk ISPSS.
2026-09-26 10:18:44 [ERROR] [ConnectorManagementAgent] HTTP 401 Unauthorized: {"error": "token_expired", "error_description": "The registration token has expired. Tokens are valid for 24 hours from generation."}
2026-09-26 10:18:44 [FATAL] [ConnectorManagementAgent] PCLD004E Agent offline. Registration aborted.`,
  },
  // ==========================================
  // PSM WORKFLOWS
  // ==========================================
  {
    id: 'psm-wf-applocker',
    title: 'Windows AppLocker Execution Block (Event ID 8004 / Dispatcher Denied)',
    component: 'PSM',
    category: 'Security Hardening & Dispatcher',
    severity: 'High',
    summary: 'Privileged Session Manager fails to launch a connection component or browser dispatcher because Windows AppLocker policy restricted the binary.',
    commonCodes: ['PSMSR280E', 'PSMSR037E', '8004'],
    questions: [
      {
        id: 'q-event-viewer',
        question: 'Do you see Event ID 8004 in Windows Event Viewer?',
        hint: 'Check: Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL',
        choices: [
          { id: 'yes_8004', label: 'Yes, Event 8004 blocks msedgedriver.exe, chromedriver.exe, or dispatcher', isLikelyIndicator: true },
          { id: 'no_8004', label: 'No AppLocker events found', isLikelyIndicator: false },
          { id: 'unsure_event', label: 'Have not checked Event Viewer yet', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-recent-updates',
        question: 'Did Microsoft Edge, Google Chrome, or PSM patch update recently?',
        hint: 'Browser auto-updates frequently break AppLocker path rules or DLL hashes.',
        choices: [
          { id: 'updated_recently', label: 'Yes, browser or OS updated recently', isLikelyIndicator: true },
          { id: 'no_updates', label: 'No recent updates performed', isLikelyIndicator: false },
          { id: 'unknown_update', label: 'Not sure if auto-updates are enabled', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-hardening-script',
        question: 'Has the CyberArk AppLocker auto-configuration script been run?',
        hint: 'CyberArk.PSM.AppLockerAutoConfig.ps1 generates AppLocker rules based on PSMConfigureAppLocker.xml.',
        choices: [
          { id: 'not_run', label: 'No, script has not been re-run after changes', isLikelyIndicator: true },
          { id: 'already_run', label: 'Yes, script was executed recently', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'AppLocker Software Restriction Violation on PSM Host',
      rootCause: 'Windows AppLocker whitelist enforcement prevents the dispatcher executable or web driver (msedgedriver.exe / chromedriver.exe) from executing in C:\\Program Files (x86)\\CyberArk\\PSM\\Components due to missing path rules or updated binary checksums.',
      explanation: 'PSM utilizes Windows AppLocker to strictly restrict processes that shadow session users (PSMConnect) can launch. When a browser, driver, or custom executable is updated or added without updating PSMConfigureAppLocker.xml, the OS kernel refuses execution with error code 3221225786 (STATUS_DLL_INIT_FAILED) or Event ID 8004.',
      resolutionSteps: [
        'Open Windows Event Viewer on the PSM server and verify blocked paths under Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL.',
        'Edit C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\PSMConfigureAppLocker.xml in an elevated editor.',
        'Ensure the target dispatcher or browser executable path (e.g., msedgedriver.exe, CyberArk.PSM.WebAppDispatcher.exe) has an enabled rule.',
        'Launch an elevated PowerShell session and execute: & "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\CyberArk.PSM.AppLockerAutoConfig.ps1".',
        'Verify that AppLocker effective rules include the executable: Get-AppLockerPolicy -Effective | Test-AppLockerPolicy -Path "C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\msedgedriver.exe".',
        'Restart the "CyberArk Privileged Session Manager" Windows service and initiate a test session from PVWA.',
      ],
      logsToCheck: [
        'Windows Event Viewer: Microsoft-Windows-AppLocker/EXE and DLL',
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log',
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log',
      ],
      referenceArticleId: '000004389',
      referenceArticleTitle: 'PSM Web Dispatcher fails with Event ID 8004 in AppLocker Log',
      communityCause: 'Windows AppLocker policy lacks path or publisher rules for browser driver executables in the PSM Components directory following OS or browser updates.',
      communitySolution: 'Add executable paths to PSMConfigureAppLocker.xml and execute CyberArk.PSM.AppLockerAutoConfig.ps1 from an administrative PowerShell prompt.',
    },
    sampleLog: `2026-09-26 14:15:22 [0x00001f34] PSMSR037E An error occurred while launching connection component: [PSM-Edge]
2026-09-26 14:15:22 [0x00001f34] PSMSR280E [d74a2e88-0f04-4c8d-b088-29bf8b5a0342] Session ended unexpectedly with return code [3221225786]
2026-09-26 14:15:22 [0x00001f34] PSMSR009I Dispatcher [CyberArk.PSM.WebAppDispatcher.exe] was terminated by host execution restriction
Microsoft-Windows-AppLocker/EXE and DLL Event 8004: %PROGRAMFILES%\\CYBERARK\\PSM\\COMPONENTS\\MSEDGEDRIVER.EXE was prevented from running.`,
  },

  {
    id: 'psm-wf-driver-mismatch',
    title: 'Web Application Browser / Driver Version Mismatch (Edge / Chrome)',
    component: 'PSM',
    category: 'Web Dispatchers & Drivers',
    severity: 'High',
    summary: 'Web application connection components fail to open target web portals due to incompatible browser and driver builds.',
    commonCodes: ['PSMSR280E', 'WebDriverException', 'SessionNotCreated'],
    questions: [
      {
        id: 'q-driver-version',
        question: 'Does the driver version in PSM\\Components match the installed browser version?',
        hint: 'Check Edge version via edge://version and run "msedgedriver.exe --version" in PSM\\Components.',
        choices: [
          { id: 'version_mismatch', label: 'Versions differ (e.g. Browser v128, Driver v126)', isLikelyIndicator: true },
          { id: 'versions_match', label: 'Both versions are identical', isLikelyIndicator: false },
          { id: 'unsure_versions', label: 'Have not compared versions yet', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-target-portal',
        question: 'Does the failure occur immediately upon launching the browser or after entering credentials?',
        choices: [
          { id: 'instant_crash', label: 'Browser window closes immediately / does not open', isLikelyIndicator: true },
          { id: 'auth_fail', label: 'Browser opens but fails on login screen / element lookup', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'WebDriver Incompatibility with Host Browser Version',
      rootCause: 'The Chromium engine (Microsoft Edge or Google Chrome) was updated by Windows Update or enterprise software deployment, while the WebDriver binary in C:\\Program Files (x86)\\CyberArk\\PSM\\Components was not updated.',
      explanation: 'Selenium-based PSM Web App Dispatchers require exact major version parity with the installed browser. A version mismatch causes the driver initialization handshake to abort with SessionNotCreatedException or return code 3221225786.',
      resolutionSteps: [
        'Log into the PSM server, launch Microsoft Edge / Chrome, and note the exact version number in About Microsoft Edge (e.g. 128.0.2739.67).',
        'Download the matching WebDriver binary from the official vendor portal (e.g., Microsoft Edge WebDriver portal).',
        'Replace msedgedriver.exe or chromedriver.exe in C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\.',
        'Run the CyberArk AppLocker script to update rule hashes: & "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\CyberArk.PSM.AppLockerAutoConfig.ps1".',
        'Disable automatic browser updates on PSM hosts via Group Policy (Computer Configuration > Administrative Templates > Microsoft Edge > Update).',
      ],
      logsToCheck: [
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log',
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
      ],
      referenceArticleId: '000005122',
      referenceArticleTitle: 'PSM WebApp Dispatcher Session ended with code 3221225786 after Edge Update',
      communityCause: 'Microsoft Edge auto-updated to a newer major release without corresponding update to msedgedriver.exe in the PSM Components directory.',
      communitySolution: 'Download the exact matching msedgedriver build, place it in PSM\\Components, and execute CyberArk.PSM.AppLockerAutoConfig.ps1.',
    },
    sampleLog: `2026-09-26 11:02:18 [0x000021b0] PSMSR009I Dispatcher process started: C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\CyberArk.PSM.WebAppDispatcher.exe
2026-09-26 11:02:19 [0x000021b0] ERROR OpenQA.Selenium.SessionNotCreatedException: session not created: This version of Microsoft Edge WebDriver only supports Microsoft Edge version 126
Current browser version is 128.0.2739.67 with binary at C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe
2026-09-26 11:02:19 [0x000021b0] PSMSR280E Session ended unexpectedly with return code [3221225786]`,
  },

  // ==========================================
  // CPM WORKFLOWS
  // ==========================================
  {
    id: 'cpm-wf-timeout',
    title: 'Password Change / Verification Timeout (CACPM406E / Process Hanging)',
    component: 'CPM',
    category: 'Password Management & Plugins',
    severity: 'High',
    summary: 'CPM plugin initiated a verify, change, or reconcile operation on a target endpoint, but the process timed out before completion.',
    commonCodes: ['CACPM406E', 'CACPM250E', 'Win32-1326'],
    questions: [
      {
        id: 'q-target-platform',
        question: 'What is the target system type?',
        choices: [
          { id: 'target_unix', label: 'Unix / Linux (SSH terminal session)', isLikelyIndicator: true },
          { id: 'target_windows', label: 'Windows Domain / Local Administrator (RPC / SMB)', isLikelyIndicator: true },
          { id: 'target_database', label: 'Database (Oracle, MS SQL, PostgreSQL)', isLikelyIndicator: false },
          { id: 'target_api', label: 'Cloud / REST API target (AWS, Azure, GCP)', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-network-reachability',
        question: 'Can the CPM server reach the target port directly over the network?',
        hint: 'Run Test-NetConnection -ComputerName <TargetIP> -Port <22/445/135/1433/1521> on CPM server.',
        choices: [
          { id: 'port_blocked', label: 'Port is closed / timed out (Firewall blocked)', isLikelyIndicator: true },
          { id: 'port_open', label: 'Port is open and listening', isLikelyIndicator: false },
          { id: 'port_untested', label: 'Have not tested port connectivity yet', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-prompt-hang',
        question: 'Does the ThirdParty debug log stop at a specific terminal banner or prompt?',
        hint: 'Check C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\<Safe>-<Account>.log.',
        choices: [
          { id: 'terminal_hang', label: 'Yes, log hangs after password prompt or custom banner (MOTD)', isLikelyIndicator: true },
          { id: 'no_terminal_hang', label: 'No, failure is immediate or network-related', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'CPM Execution Timeout (CACPM406E)',
      rootCause: 'Firewall blocking the target management port (TCP 22, 445, 135, 1433) between CPM and target, or a prompt regex mismatch in the platform Prompts/Process file causing the plugin automation to wait indefinitely.',
      explanation: 'CACPM406E occurs when the Central Policy Manager reaches its Execution Timeout limit (default 90s). The plugin spawned the execution process, but the handshake never received an expected response—either due to silent packet drops on network firewalls, or because an unexpected login banner, sudo prompt, or MOTD did not match the platform regular expressions.',
      resolutionSteps: [
        'Test direct network connectivity from the CPM server: PowerShell: Test-NetConnection -ComputerName <TargetHost> -Port <Port>.',
        'If the target is Unix/SSH, open PVWA > Platform Management > Edit Platform > Target Account Platform > Automatic Password Management > Additional Policy Settings and set Debug=Yes.',
        'Trigger a manual "Verify" in PVWA and inspect C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\<Safe>-<Account>.log.',
        'If the log shows terminal output stopping at an unrecognized prompt, update the Prompts file (e.g. UnixPrompts.ini) to include the regex for the custom banner or prompt.',
        'Increase Execution Timeout parameter under Additional Policy Settings from 90 to 180 seconds if target endpoint has high latency.',
      ],
      logsToCheck: [
        'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
        'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log',
        'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\<SafeName>-<AccountName>.log',
      ],
      referenceArticleId: '000003841',
      referenceArticleTitle: 'CACPM406E Error in execution of plugin. Execution timed out',
      communityCause: 'Network firewall dropping packets on target port, or terminal session prompt regex mismatch in platform policy causing script hang.',
      communitySolution: 'Enable CPM debug logging, inspect ThirdParty safe log for prompt stall, verify TCP port reachability, and update Prompts.ini regex if custom banners are present.',
    },
    sampleLog: `2026-09-26 09:44:12 [0x00000d2c] CACPM406E Error in execution of plugin. Execution timed out.
2026-09-26 09:44:12 [0x00000d2c] CACPM250E Verification failed for account [Operating System-UnixSSH-10.20.4.15-root] in safe [UNIX-ROOT-PROD].
2026-09-26 09:44:12 [0x00000d2c] State: InProcess, Elapsed: 90000ms. Expected prompt expression: ".*[$#>:]\\s*$"
2026-09-26 09:44:12 [0x00000d2c] Last received line: "Unauthorized access is prohibited. Enter passphrase for MFA token: "`,
  },

  {
    id: 'cpm-wf-credfile-desync',
    title: 'CPM Credential File Desynchronization (CACPM072E / ITATS006E)',
    component: 'CPM',
    category: 'Authentication & Credential Files',
    severity: 'Critical',
    summary: 'Central Policy Manager cannot authenticate to the Digital Vault database because the local user.ini credential file is out of sync.',
    commonCodes: ['CACPM072E', 'ITATS006E', 'ITATS103E'],
    questions: [
      {
        id: 'q-cpm-service',
        question: 'Does the CyberArk Password Manager service stop shortly after starting?',
        choices: [
          { id: 'service_stops', label: 'Yes, service stops after 5-10 seconds', isLikelyIndicator: true },
          { id: 'service_runs', label: 'No, service stays running but throws errors in pm_error.log', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-password-manager-user',
        question: 'Is the PasswordManager user in PrivateArk Client suspended or has a recent password reset?',
        hint: 'Check PrivateArk Client > Tools > Administrative Tools > Users and Groups > PasswordManager.',
        choices: [
          { id: 'user_suspended', label: 'User is suspended or password was changed', isLikelyIndicator: true },
          { id: 'user_active', label: 'User appears active', isLikelyIndicator: false },
          { id: 'not_checked_user', label: 'Have not checked in PrivateArk yet', isLikelyIndicator: true },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'CPM Component Credential File Desynchronization',
      rootCause: 'The user.ini credfile on the CPM host contains an expired, corrupted, or desynchronized cryptographic token that does not match the PasswordManager user record in the Digital Vault.',
      explanation: 'CPM relies on user.ini (located in C:\\Program Files (x86)\\CyberArk\\Password Manager\\Vault) to authenticate to the Digital Vault on port 1858. If the password was reset on the Vault without updating user.ini, or if machine IP/hostname changed, the Vault rejects the station with ITATS006E, and CPM logs CACPM072E before shutting down.',
      resolutionSteps: [
        'Stop the "CyberArk Password Manager" service on the CPM server.',
        'Open PrivateArk Client, log in as Vault Administrator, go to Tools > Administrative Tools > Users and Groups.',
        'Select the "PasswordManager" user (or PasswordManager_<CPM_Name>), click "Update", clear "User is suspended", and reset the password to a known secret string.',
        'On the CPM server, open an elevated command prompt in C:\\Program Files (x86)\\CyberArk\\Password Manager\\Vault.',
        'Execute: CreateCredFile.exe user.ini Password /IP /Host.',
        'Enter the exact password set in PrivateArk Client when prompted.',
        'Start the "CyberArk Password Manager" service and review C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log to confirm successful connection.',
      ],
      logsToCheck: [
        'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
        'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log',
        'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      ],
      referenceArticleId: '000004812',
      referenceArticleTitle: 'CACPM072E Authentication failure to the Vault with user.ini',
      communityCause: 'The local user.ini file password or machine hash is out of sync with the PasswordManager user in the Vault.',
      communitySolution: 'Stop CPM service, reset PasswordManager user password in PrivateArk, regenerate user.ini via CreateCredFile.exe, and restart service.',
    },
    sampleLog: `2026-09-26 08:12:01 [0x000010a8] CACPM072E Password Manager user authentication failure.
2026-09-26 08:12:01 [0x000010a8] ITATS006E Station is not authenticated to the Vault (Station IP: 10.10.2.14, User: PasswordManager).
2026-09-26 08:12:01 [0x000010a8] CACPM070E Service cannot initialize connection to Vault. Shutting down.`,
  },

  // ==========================================
  // VAULT WORKFLOWS
  // ==========================================
  {
    id: 'vault-wf-itats006e',
    title: 'Station is Not Authenticated to the Vault (ITATS006E)',
    component: 'Vault',
    category: 'Core Vault Authentication',
    severity: 'Critical',
    summary: 'A CyberArk component or client was rejected by the Digital Vault due to invalid credentials, machine IP mismatch, or station hash conflict.',
    commonCodes: ['ITATS006E', 'ITATS103E', 'ITATS106E'],
    questions: [
      {
        id: 'q-originating-component',
        question: 'Which component is experiencing the authentication failure?',
        choices: [
          { id: 'comp_cpm', label: 'Central Policy Manager (CPM)', isLikelyIndicator: true },
          { id: 'comp_pvwa', label: 'Password Vault Web Access (PVWA)', isLikelyIndicator: true },
          { id: 'comp_psm', label: 'Privileged Session Manager (PSM)', isLikelyIndicator: true },
          { id: 'comp_ccp', label: 'Central Credential Provider (CCP / AAM)', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-itaso001',
        question: 'What exact station and user does itaso001.log indicate on the Vault?',
        hint: 'Open C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log on the active Vault node.',
        choices: [
          { id: 'mismatch_ip', label: 'Station IP is shown but rejected with "Station is not authenticated"', isLikelyIndicator: true },
          { id: 'suspended_user', label: 'User suspended / locked out message appears', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'Station Authentication Verification Failure (ITATS006E)',
      rootCause: 'The credential file used by the connecting component (appuser.cred, user.ini, PSMApp.cred, or aim.ini) does not match the hashed password or station restriction stored in the Vault database.',
      explanation: 'The CyberArk Vault enforces zero-trust station authentication. Component credfiles contain an encrypted password and cryptographic hash tied to the host IP and OS machine ID. If any component server IP changes, the host was cloned, or the password was modified without re-creating the credfile, the Vault immediately drops the session with ITATS006E.',
      resolutionSteps: [
        'Check Vault Server itaso001.log to identify the connecting user name (e.g. PVWAAppUser, PasswordManager, PSMApp_ServerName).',
        'Stop the corresponding component service on the requesting host.',
        'Reset the component user password in PrivateArk Client > Users and Groups.',
        'Run CreateCredFile.exe on the component server to generate a fresh credential file matching the reset password.',
        'Ensure the new credfile has read-only NTFS permissions restricted to the component service identity.',
        'Restart the component service and inspect both component log and Vault itaso001.log for successful logon.',
      ],
      logsToCheck: [
        'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
        'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\Database.log',
      ],
      referenceArticleId: '000004119',
      referenceArticleTitle: 'ITATS006E Station is not authenticated to the Vault Troubleshooting',
      communityCause: 'Component credential file desynchronized, expired, or station IP hash restriction failed validation.',
      communitySolution: 'Identify the component user from itaso001.log, reset user password in PrivateArk Client, and regenerate credfile via CreateCredFile.exe utility.',
    },
    sampleLog: `2026-09-26 13:40:02 ITATS006E Station is not authenticated to the Vault (Station IP: 10.10.5.22, Station Name: PVWA-SRV01, User: PVWAAppUser).
2026-09-26 13:40:02 CASVD034E Station identification failed: cryptographic token does not match stored fingerprint.
2026-09-26 13:40:02 Connection closed by Vault server for client 10.10.5.22:1858`,
  },

  // ==========================================
  // PVWA WORKFLOWS
  // ==========================================
  {
    id: 'pvwa-wf-500-apppool',
    title: 'HTTP 500 Internal Server Error / PasswordVault Application Pool Stopped',
    component: 'PVWA',
    category: 'Web Application & IIS',
    severity: 'High',
    summary: 'PVWA web portal returns HTTP 500 error or is unavailable because the IIS Application Pool has crashed or failed to load .NET assemblies.',
    commonCodes: ['HTTP-500', 'HTTP-503', 'PASWS011E', 'APPPOOL'],
    questions: [
      {
        id: 'q-iis-status',
        question: 'Is the PasswordVaultWebAccessPool in IIS Manager Started or Stopped?',
        choices: [
          { id: 'apppool_stopped', label: 'Application Pool is Stopped (Rapid Fail Protection)', isLikelyIndicator: true },
          { id: 'apppool_started', label: 'Application Pool is Started, but website returns HTTP 500', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-webconsole-log',
        question: 'Does C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log show credential desynchronization?',
        choices: [
          { id: 'gwuser_desync', label: 'Yes, mentions PVWAGWUser or PVWAAppUser authentication error', isLikelyIndicator: true },
          { id: 'net_exception', label: 'Shows .NET runtime unhandled exception or missing assembly', isLikelyIndicator: true },
          { id: 'log_empty', label: 'No new entries in WebConsole.log', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'PVWA Web Service Failure (HTTP 500 / AppPool Crash)',
      rootCause: 'PVWAGWUser or PVWAAppUser credential files (appuser.cred / gwuser.cred) in C:\\inetpub\\wwwroot\\PasswordVault\\Vault are out of sync with Vault, or IIS Application Pool identity lacks local rights.',
      explanation: 'PVWA uses two credential accounts: PVWAGWUser (gateway user for anonymous initialization) and PVWAAppUser (retrieving web application configuration and assets). If either credfile desynchronizes, the IIS worker process w3wp.exe cannot complete startup and aborts with HTTP 500 or terminates the application pool.',
      resolutionSteps: [
        'Open IIS Manager and check the status of PasswordVaultWebAccessPool.',
        'Review C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log and PVWA.App.log.',
        'If credential errors are present, reset PVWAGWUser and PVWAAppUser in PrivateArk Client.',
        'Open an elevated command prompt in C:\\inetpub\\wwwroot\\PasswordVault\\Vault and run CreateCredFile.exe for both appuser.cred and gwuser.cred.',
        'Ensure IIS_IUSRS group has Read permissions on the Vault folder and web.config.',
        'Run "iisreset /noforce" in an administrative command prompt.',
      ],
      logsToCheck: [
        'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log',
        'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\PVWA.App.log',
        'Windows Event Viewer: Application (W3WP crash events)',
      ],
      referenceArticleId: '000004523',
      referenceArticleTitle: 'PVWA HTTP 500 Internal Server Error after Credfile Desynchronization',
      communityCause: 'PVWAGWUser or PVWAAppUser credfile out of sync or permissions missing on web application folder.',
      communitySolution: 'Reset PVWAGWUser and PVWAAppUser in PrivateArk Client, regenerate appuser.cred and gwuser.cred, and restart IIS via iisreset.',
    },
    sampleLog: `2026-09-26 10:14:33,120 ERROR [1] CyberArk.Web.Common.Global - Application_Error: System.Web.HttpException (0x80004005): 
ITATS006E Station is not authenticated to the Vault (User: PVWAGWUser, Station: 127.0.0.1)
   at CyberArk.Services.Session.OpenSession()
   at CyberArk.Web.Common.Services.Initialize()
2026-09-26 10:14:33,125 FATAL [1] PasswordVault application failed to initialize gateway. HTTP 500.0 Internal Server Error returned.`,
  },

  // ==========================================
  // CCP WORKFLOWS
  // ==========================================
  {
    id: 'ccp-wf-appap306e',
    title: 'Provider User Lacks Safe Permissions (APPAP306E)',
    component: 'CCP',
    category: 'AAM & Central Credential Provider',
    severity: 'Medium',
    summary: 'Application Password Provider or Central Credential Provider receives safe authorization denial when querying secrets.',
    commonCodes: ['APPAP306E', 'APPAP002E', 'APPAP100E'],
    questions: [
      {
        id: 'q-safe-membership',
        question: 'Is the Provider user (e.g. Prov_<Hostname>) added as a member of the target Safe?',
        hint: 'Check PVWA > Policies > Safes > Select Safe > Members.',
        choices: [
          { id: 'not_member', label: 'No, Provider user is not listed as Safe Member', isLikelyIndicator: true },
          { id: 'is_member', label: 'Yes, Provider user is listed as Member', isLikelyIndicator: false },
          { id: 'unsure_safe', label: 'Have not checked Safe members yet', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-safe-rights',
        question: 'Does the Provider member have "Retrieve accounts" and "List accounts" checked?',
        choices: [
          { id: 'rights_missing', label: 'Retrieve accounts or List accounts permission is missing', isLikelyIndicator: true },
          { id: 'rights_granted', label: 'Both permissions are fully checked', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'CCP Provider Safe Permission Deficiency (APPAP306E)',
      rootCause: 'The Central Credential Provider user (Prov_<HostName>) has not been granted Safe Member permissions (Retrieve accounts, List accounts) on the Safe holding the target secret object.',
      explanation: 'In CyberArk AAM/CCP architecture, the Provider background user executes queries on behalf of client applications. Even if the application ID authentication passes, the Provider user itself must possess explicit Safe retrieval rights.',
      resolutionSteps: [
        'Log into PVWA as a Vault Administrator.',
        'Navigate to Policies > Safes and select the target Safe.',
        'Click "Members" and verify if the Provider user (e.g. Prov_<Hostname>) is in the list.',
        'If not present, click "Add Member", search for the Provider user, and add them.',
        'Ensure the following permissions are granted: "Retrieve accounts", "List accounts", and optionally "View Safe Members".',
        'Save safe changes and re-run the CCP REST query from your client application or curl.',
      ],
      logsToCheck: [
        'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPConsole.log',
        'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log',
      ],
      referenceArticleId: '000003920',
      referenceArticleTitle: 'APPAP306E Authentication and Safe Authorization in Central Credential Provider',
      communityCause: 'Provider user lacks "Retrieve accounts" or "List accounts" permission on the target Safe in PVWA.',
      communitySolution: 'Add the Provider user (Prov_<Hostname>) as a member of the target Safe with Retrieve and List permissions.',
    },
    sampleLog: `2026-09-26 15:20:10 [0x0000189c] APPAP306E Failed to retrieve password object. Reason: Provider user [Prov_CCP-PROD-01] has no permissions on Safe [DATABASE-SECRETS-PROD].
2026-09-26 15:20:10 [0x0000189c] Request from AppID: [PaymentGatewayService], Client IP: [10.50.3.11].
2026-09-26 15:20:10 [0x0000189c] HTTP/1.1 403 Forbidden returned by AIMWebService REST endpoint.`,
  },
  {
    id: 'ccp-wf-appprovider-desync',
    title: 'AppProviderUser Credential Desynchronization & IIS 503 Unavailable',
    component: 'CCP',
    category: 'Authentication & Credential Files',
    severity: 'Critical',
    summary: 'The Central Credential Provider AIMWebService application pool crashes or rejects queries because appprovideruser.cred is invalid or station IP hash restriction failed.',
    commonCodes: ['APPAP100E', 'ITATS006E', 'HTTP-503'],
    questions: [
      {
        id: 'q-ccp-credfile',
        question: 'Does APPConsole.log report ITATS006E Station is not authenticated?',
        hint: 'Check C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPConsole.log',
        choices: [
          { id: 'cred_invalid', label: 'Yes, mentions appprovideruser.cred authentication failure', isLikelyIndicator: true },
          { id: 'cred_ok', label: 'No, credential file validates without error', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-ccp-iis-apppool',
        question: 'Is the AIMWebServiceAppPool started in IIS Manager?',
        choices: [
          { id: 'apppool_down', label: 'Application pool is stopped', isLikelyIndicator: true },
          { id: 'apppool_up', label: 'Application pool is running', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'CCP Local Credential File (appprovideruser.cred) Desynchronization',
      rootCause: 'The appprovideruser.cred credential file in C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Vault has desynchronized from the AppProviderUser in the Vault, or the host IP address was modified.',
      explanation: 'Central Credential Provider uses a dedicated credential file to authenticate its background queries to the Vault on port 1858. If this credential expires or host IP changes, queries return HTTP 503 and log APPAP100E.',
      resolutionSteps: [
        'Stop IIS on the CCP server: iisreset /stop.',
        'Reset the AppProviderUser password in PrivateArk Client > Users and Groups.',
        'Open an elevated command prompt in C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Vault.',
        'Execute: CreateCredFile.exe appprovideruser.cred Password /IP /Host.',
        'Ensure the IIS Application Pool identity has Read permissions to the appprovideruser.cred file.',
        'Restart IIS: iisreset /start and issue a test HTTP GET request.',
      ],
      logsToCheck: [
        'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPConsole.log',
        'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log',
        'C:\\inetpub\\logs\\LogFiles\\W3SVC1',
      ],
      referenceArticleId: '000004921',
      referenceArticleTitle: 'How to reset AppProviderUser credential file for CCP',
      communityCause: 'appprovideruser.cred desynchronized from Vault or IIS identity lacks file access permissions.',
      communitySolution: 'Reset AppProviderUser in PrivateArk Client, run CreateCredFile.exe, verify NTFS permissions, and restart IIS.',
    },
    sampleLog: `2026-09-26 16:42:01 [ERROR] [AIMWebService] APPAP100E Failed to initialize provider engine.
2026-09-26 16:42:01 [ERROR] [AIMWebService] ITATS006E Station is not authenticated to the Vault (Station IP: 10.30.1.20, User: AppProviderUser).
2026-09-26 16:42:01 [FATAL] [AIMWebService] HTTP 503.0 Service Unavailable returned to client caller.`,
  },

  // ==========================================
  // PTA (PRIVILEGED THREAT ANALYTICS) WORKFLOWS
  // ==========================================
  {
    id: 'pta-wf-diamond-disconnection',
    title: 'PTA Diamond Server Disconnection & Vault Syslog Ingestion Halted',
    component: 'PTA',
    category: 'Threat Ingestion & Vault Telemetry',
    severity: 'High',
    summary: 'The Privileged Threat Analytics (PTA) engine stops receiving telemetry from the Digital Vault, and PVWA Security Events dashboard indicates a disconnected diamond agent.',
    commonCodes: ['PTA0001E', 'PTA0006E', 'SYSLOG-DROPPED'],
    questions: [
      {
        id: 'q-pta-status',
        question: 'What is the status of the PTA service on the Linux host?',
        hint: 'Log into PTA server as root and run: service pta status or /opt/pta/diagnostic/runDiagnostics.sh',
        choices: [
          { id: 'pta_stopped', label: 'PTA service is stopped or inactive', isLikelyIndicator: true },
          { id: 'pta_active', label: 'PTA service is running normally', isLikelyIndicator: false },
          { id: 'pta_not_checked', label: 'Have not checked service status on server', isLikelyIndicator: true },
        ],
      },
      {
        id: 'q-pta-ports',
        question: 'Can the Vault server reach the PTA host on TCP 22443 and UDP 514 (Syslog)?',
        hint: 'Run netstat -tulnp | grep -E "(22443|514)" on PTA host.',
        choices: [
          { id: 'ports_blocked', label: 'Ports are blocked or listener is not active', isLikelyIndicator: true },
          { id: 'ports_open', label: 'Ports 22443 and 514 are listening and reachable', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-pta-disk',
        question: 'Is the /opt or /var partition utilization on the PTA server above 90%?',
        hint: 'Run: df -h /opt /var/log on the PTA Linux server.',
        choices: [
          { id: 'disk_full', label: 'Disk space exceeds 90% (PTA halts ingestion automatically)', isLikelyIndicator: true },
          { id: 'disk_ok', label: 'Disk space is well under 80%', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'PTA Diamond Server Connection or Telemetry Forwarding Disruption',
      rootCause: 'The PTA Diamond background service is stopped, local firewall is blocking TCP port 22443 or UDP port 514, or disk utilization on /opt has exceeded 90% causing safe auto-shutdown.',
      explanation: 'PTA continuously ingests real-time syslog streams from Vault nodes and Windows Event logs from domain controllers. If the PTA service halts or disk space fills up, security incident detection and unmanaged privileged session alerting suspend immediately.',
      resolutionSteps: [
        'Log into the PTA Linux server via SSH as user pta or root.',
        'Run the official diagnostic tool: /opt/pta/diagnostic/runDiagnostics.sh and review failed health indicators.',
        'Check disk usage with "df -h". If /opt or /var/log exceeds 90%, purge archived logs in /opt/tomcat/logs/ to restore free space.',
        'Verify PTA service status: service pta status. If stopped, restart with: service pta restart.',
        'Verify listening ports: netstat -tulnp | grep -E "(22443|514)".',
        'Review /opt/tomcat/logs/diamond.log for database or ActiveMQ connection errors.',
        'In PVWA, navigate to Security > Security Events and verify the PTA status indicator returns to Green.',
      ],
      logsToCheck: [
        '/opt/tomcat/logs/diamond.log',
        '/opt/pta/service/service.log',
        '/var/log/messages',
        'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      ],
      referenceArticleId: '000004922',
      referenceArticleTitle: 'Troubleshooting PTA Diamond Server Disconnections and Port Verification',
      communityCause: 'PTA background daemon stopped due to disk exhaustion or firewall dropping TCP 22443 / UDP 514 syslog traffic.',
      communitySolution: 'Clear disk space on /opt, restart PTA daemon via "service pta restart", and confirm listening ports with netstat.',
    },
    sampleLog: `2026-09-26 12:11:05 [ERROR] [DiamondService] PTA0001E Unable to connect to PTA Diamond daemon. Connection refused on 127.0.0.1:22443.
2026-09-26 12:11:05 [WARN] [SyslogReceiver] Vault syslog stream interrupted: no packets received on UDP 514 for 600 seconds.
2026-09-26 12:11:06 [FATAL] [HealthMonitor] Partition /opt is at 94% capacity. Halting real-time security event parsing to prevent database corruption.`,
  },
  {
    id: 'pta-wf-disk-cert-exhaustion',
    title: 'PTA Expired SSL/TLS Certificate or Disk Space Exhaustion (/opt > 90%)',
    component: 'PTA',
    category: 'Certificates & System Storage',
    severity: 'Critical',
    summary: 'PTA web portal and API fail with TLS handshake failure or ActiveMQ halts due to expired server certificate or full partition.',
    commonCodes: ['PTA0012E', 'CERT_EXPIRED', 'DISK_FULL'],
    questions: [
      {
        id: 'q-pta-cert-date',
        question: 'Has the PTA server SSL certificate expired?',
        hint: 'Run: openssl x509 -in /opt/pta/cert/pta.crt -text -noout | grep -A 2 Validity',
        choices: [
          { id: 'cert_expired', label: 'Yes, certificate NotAfter date has passed', isLikelyIndicator: true },
          { id: 'cert_valid', label: 'No, certificate is valid', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-pta-df',
        question: 'Does df -h show any partition at 100%?',
        choices: [
          { id: 'partition_full', label: 'Yes, /opt or /var is 100% full', isLikelyIndicator: true },
          { id: 'partition_ok', label: 'Disk space is normal', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'PTA SSL/TLS Certificate Expiration or Storage Saturation',
      rootCause: 'The SSL certificate installed at /opt/pta/cert/pta.crt has expired, preventing PVWA from establishing trusted REST communication, or /opt filesystem is saturated.',
      explanation: 'PVWA communicates with PTA via mutual HTTPS REST calls. When the certificate on the PTA appliance expires, PVWA rejects the connection with SSLHandshakeException.',
      resolutionSteps: [
        'SSH to PTA host as root: run "openssl x509 -in /opt/pta/cert/pta.crt -enddate -noout".',
        'If expired, generate a new CSR or install updated enterprise CA certificate: /opt/pta/utility/sslCertificateManagement.sh.',
        'Run disk cleanup: rm -rf /opt/tomcat/logs/diamond.log.*.gz older than 30 days.',
        'Restart PTA services: service pta restart.',
        'In PVWA Administration > Options > Privileged Threat Analytics, confirm URL matches certificate Common Name.',
      ],
      logsToCheck: [
        '/opt/tomcat/logs/catalina.out',
        '/opt/tomcat/logs/diamond.log',
      ],
      referenceArticleId: '000005431',
      referenceArticleTitle: 'How to renew SSL certificate on CyberArk PTA Server',
      communityCause: 'PTA certificate expired or /opt partition disk full.',
      communitySolution: 'Renew PTA certificate using sslCertificateManagement.sh utility and clear old Tomcat logs.',
    },
    sampleLog: `2026-09-26 13:01:22 [ERROR] [TomcatSSL] PTA0012E SSL Handshake failed: Certificate /opt/pta/cert/pta.crt expired on 2026-09-20.
2026-09-26 13:01:22 [ERROR] [RESTGateway] PVWA node at 10.10.5.22 rejected untrusted self-signed / expired certificate.`,
  },

  // ==========================================
  // CONJUR (SECRETS MANAGER & SECRETS HUB) WORKFLOWS
  // ==========================================
  {
    id: 'conjur-wf-authn-failure',
    title: 'Conjur Workload Host Authentication Failure & API Key Drift (CONJ001E / 401)',
    component: 'Conjur',
    category: 'Workload Identity & Secrets Delivery',
    severity: 'High',
    summary: 'Application workloads, CI/CD runners, or Kubernetes sidecars fail to authenticate to the Conjur Leader/Follower cluster, receiving HTTP 401 Unauthorized.',
    commonCodes: ['CONJ001E', 'HTTP-401', 'AUTHN_TOKEN_INVALID'],
    questions: [
      {
        id: 'q-conjur-host-id',
        question: 'Does the host identity exist in the Conjur root policy?',
        hint: 'Run: conjur host show -i host/workloads/app-service',
        choices: [
          { id: 'host_not_found', label: 'Host identity not found (404 Not Found)', isLikelyIndicator: true },
          { id: 'host_exists', label: 'Host exists in policy branch', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-api-key-drift',
        question: 'Was the workload API key rotated recently or did container restart with stale credentials?',
        choices: [
          { id: 'key_stale', label: 'Yes, container or secret injection used old key', isLikelyIndicator: true },
          { id: 'key_current', label: 'Key was not intentionally changed', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'Conjur Workload API Token Authentication Rejection',
      rootCause: 'The workload API key has rotated, host annotation expired, or Kubernetes ServiceAccount token signature was rejected by authn-k8s authenticator.',
      explanation: 'Conjur validates workloads using cryptographic tokens. If the API key in environment variables or volume mounts drifts, the Conjur cluster immediately denies secrets retrieval with 401 Unauthorized.',
      resolutionSteps: [
        'Check Conjur audit log: docker logs conjur-leader | grep -i authn.',
        'Rotate the host API key using Conjur CLI: conjur host rotate-api-key -i host/workloads/<app-name>.',
        'Update the secret injection Kubernetes manifest or CI/CD runner secret with the new API key.',
        'Verify host policy permissions: conjur check host/workloads/<app-name> read variable:<secret-path>.',
      ],
      logsToCheck: [
        'Conjur Leader: /var/log/conjur/audit.log',
        'K8s: kubectl logs -l app=conjur-authenticator',
      ],
      referenceArticleId: '000006711',
      referenceArticleTitle: 'Troubleshooting Conjur Host Authentication 401 Unauthorized',
      communityCause: 'Workload API key desynchronized or host policy lacks permissions on secret variable.',
      communitySolution: 'Rotate host API key via Conjur CLI and verify policy grant permissions.',
    },
    sampleLog: `2026-09-26 14:02:11 [conjur] [audit] [error] CONJ001E Authentication failed for host/workloads/payment-processor. HTTP 401 Unauthorized.
2026-09-26 14:02:11 [conjur] [audit] Invalid token signature or API key mismatch.`,
  },
  {
    id: 'conjur-wf-follower-replication',
    title: 'Conjur Follower Database Replication Slot Disconnected (CONJ004E)',
    component: 'Conjur',
    category: 'High Availability & Replication',
    severity: 'Critical',
    summary: 'Conjur Follower nodes in Kubernetes or remote regions lose synchronization with the Leader master database, returning stale secret values.',
    commonCodes: ['CONJ004E', 'PG_REPL_LAG', 'SLOT_DISCONNECTED'],
    questions: [
      {
        id: 'q-follower-health',
        question: 'Does the Follower /health endpoint return "ok: true"?',
        hint: 'Curl https://<follower-ip>/health',
        choices: [
          { id: 'health_false', label: 'Returns ok: false or replication lag > 60s', isLikelyIndicator: true },
          { id: 'health_ok', label: 'Returns ok: true', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'Conjur Follower Database Streaming Replication Lag',
      rootCause: 'Network firewall interruption on port 5432 (PostgreSQL replication) or replication slot overflow on the Conjur Leader cluster.',
      explanation: 'Followers maintain asynchronous read-only PostgreSQL streaming replication from the Leader node. If connection drops, secrets changes are not propagated to applications.',
      resolutionSteps: [
        'Check Follower health: curl -k https://<follower>/health.',
        'Verify network connectivity on TCP 5432 from Follower to Leader.',
        'Inspect Leader container: docker exec conjur-leader pg_isready.',
        'Re-seed the Follower node using: conjurctl follower reseed <seedfile.tar>.',
      ],
      logsToCheck: [
        'Follower: docker logs conjur-follower',
        'Leader: /var/log/conjur/pg_replication.log',
      ],
      referenceArticleId: '000006715',
      referenceArticleTitle: 'Conjur Follower Replication Lag and PostgreSQL Slot Recovery',
      communityCause: 'PostgreSQL streaming replication connection severed between Leader and Follower.',
      communitySolution: 'Verify TCP 5432 network path and reseed Follower node using fresh seedfile.',
    },
    sampleLog: `2026-09-26 14:33:02 [ERROR] CONJ004E PostgreSQL streaming replication disconnected.
2026-09-26 14:33:02 [WARN] Follower replication lag: 1840 seconds behind Leader. Stale secrets cached.`,
  },

  // ==========================================
  // VAULT WORKFLOWS (ADDITIONAL)
  // ==========================================
  {
    id: 'vault-wf-safe-quota',
    title: 'Safe Storage Quota Exceeded & Database Table Lock (ITATS375E / ITATS028E)',
    component: 'Vault',
    category: 'Storage & Database Quota',
    severity: 'High',
    summary: 'CPM cannot write new password versions or users cannot upload files because safe quota limit is reached.',
    commonCodes: ['ITATS375E', 'ITATS028E', 'QUOTA_EXCEEDED'],
    questions: [
      {
        id: 'q-safe-size',
        question: 'Does the Safe Properties dialog in PrivateArk show safe size at or near maximum?',
        hint: 'Check PrivateArk Client > Open Safe > Safe Properties > Max Size (MB).',
        choices: [
          { id: 'safe_full', label: 'Yes, current size equals Max Size limit', isLikelyIndicator: true },
          { id: 'safe_has_space', label: 'No, safe appears to have space', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'Safe Storage Quota Saturation (ITATS375E)',
      rootCause: 'The safe maximum size limit specified in Safe Properties has been reached due to account version history buildup or large attachment storage.',
      explanation: 'Every CyberArk safe has a configurable quota. When an account password rotates, the Vault archives previous password versions. If the safe quota is reached, write actions fail with ITATS375E.',
      resolutionSteps: [
        'Open PrivateArk Client as a Vault Administrator.',
        'Right-click the affected Safe and select "Properties".',
        'Increase the "Max Size (MB)" parameter (e.g. from 50MB to 500MB).',
        'Review Safe History retention days (default 7 days / versions) to automatically purge ancient versions.',
        'Retry the account password change or file upload in PVWA.',
      ],
      logsToCheck: [
        'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      ],
      referenceArticleId: '000003712',
      referenceArticleTitle: 'ITATS375E Safe storage quota exceeded resolution',
      communityCause: 'Safe size quota reached due to accumulated account password history versions.',
      communitySolution: 'Increase Safe Max Size in PrivateArk Client Safe Properties and adjust version retention settings.',
    },
    sampleLog: `2026-09-26 15:10:44 ITATS375E Safe [UNIX-ROOT-PROD] quota limit exceeded (50MB / 50MB used).
2026-09-26 15:10:44 CACPM250E Password change aborted: Vault write operation denied.`,
  },
  {
    id: 'vault-wf-dr-replication',
    title: 'Disaster Recovery (DR) Vault Replication Desync (PADR0011E / PADR0005E)',
    component: 'Vault',
    category: 'Disaster Recovery & High Availability',
    severity: 'Critical',
    summary: 'The CyberArk Disaster Recovery service fails to replicate database transactions and safe files from Primary Vault to DR Vault.',
    commonCodes: ['PADR0011E', 'PADR0005E', 'DR_DESYNC'],
    questions: [
      {
        id: 'q-dr-log',
        question: 'Does padr.log show user DR authentication failure or network timeout?',
        hint: 'Check C:\\Program Files (x86)\\PrivateArk\\PADR\\padr.log on the DR Vault node.',
        choices: [
          { id: 'dr_auth_fail', label: 'Yes, mentions user DR authentication failure (ITATS006E)', isLikelyIndicator: true },
          { id: 'dr_net_timeout', label: 'Network timeout connecting to Primary Vault on port 1858', isLikelyIndicator: true },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'CyberArk Disaster Recovery Database Replication Interruption',
      rootCause: 'The user.ini credential file for user "DR" in the PADR directory is invalid, or network firewall blocked port 1858 between Vault nodes.',
      explanation: 'The PADR service synchronizes database transactions from Primary to Standby Vault on a continuous interval. If user DR is suspended or credfile desynchronizes, replication halts.',
      resolutionSteps: [
        'Stop the "CyberArk Vault Disaster Recovery" service on the DR Vault.',
        'Reset user DR password in PrivateArk Client on Primary Vault.',
        'In C:\\Program Files (x86)\\PrivateArk\\PADR, run: CreateCredFile.exe user.ini Password /IP /Host.',
        'Test TCP 1858 connectivity from DR Vault to Primary Vault.',
        'Start CyberArk Vault Disaster Recovery service and inspect padr.log to confirm successful replication.',
      ],
      logsToCheck: [
        'DR: C:\\Program Files (x86)\\PrivateArk\\PADR\\padr.log',
        'Primary Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      ],
      referenceArticleId: '000004112',
      referenceArticleTitle: 'PADR0011E How to resynchronize CyberArk Disaster Recovery Vault',
      communityCause: 'DR user credential file out of sync or port 1858 firewall block between Vault clusters.',
      communitySolution: 'Stop PADR service, reset user DR password, generate fresh user.ini via CreateCredFile.exe, and restart service.',
    },
    sampleLog: `2026-09-26 15:40:12 PADR0011E Error occurred while replicating database. (ITATS006E Station is not authenticated to the Vault).
2026-09-26 15:40:12 PADR0005E Disaster Recovery synchronization cycle aborted.`,
  },

  // ==========================================
  // PVWA WORKFLOWS (ADDITIONAL)
  // ==========================================
  {
    id: 'pvwa-wf-saml-sso',
    title: 'SAML 2.0 / IdP SSO Authentication Loop or Signature Failure (PASWS013E)',
    component: 'PVWA',
    category: 'Single Sign-On & Identity Provider',
    severity: 'High',
    summary: 'Users attempting to sign into PVWA using Okta, Azure AD / Entra ID, or PingIdentity get redirected in an infinite loop or receive SAML response signature verification failure.',
    commonCodes: ['PASWS013E', 'SAML-403', 'SIGNATURE_INVALID'],
    questions: [
      {
        id: 'q-saml-cert',
        question: 'Has the IdP Token-Signing Certificate been renewed recently in Azure AD or Okta?',
        choices: [
          { id: 'saml_cert_renewed', label: 'Yes, IdP certificate was updated recently', isLikelyIndicator: true },
          { id: 'saml_cert_unchanged', label: 'No, certificate is unchanged', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'PVWA SAML SSO Token Signature Verification Failure',
      rootCause: 'The SAML certificate configured in PVWA does not match the public signing key in the IdP metadata XML, or clock skew exceeds 300 seconds.',
      explanation: 'PVWA cryptographically validates SAML assertion tokens from the Identity Provider. If the IdP certificate was rolled over without updating PVWA, authentication aborts.',
      resolutionSteps: [
        'Download the latest Federation Metadata XML or Base64 signing certificate from your Identity Provider (Azure AD / Okta).',
        'Open PVWA > Administration > Options > Access Control > SAML and verify SigningCertificate and IdpURL.',
        'Ensure system clock on PVWA and Domain Controllers is synchronized via NTP (clock skew < 3 minutes).',
        'Run "iisreset" on PVWA servers to clear cached SAML metadata.',
      ],
      logsToCheck: [
        'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log',
      ],
      referenceArticleId: '000004991',
      referenceArticleTitle: 'Troubleshooting PVWA SAML 2.0 SSO Authentication and Certificate Renewal',
      communityCause: 'IdP Token Signing Certificate rolled over or clock skew between PVWA and Identity Provider.',
      communitySolution: 'Update IdP signing certificate in PVWA Administration options and run iisreset.',
    },
    sampleLog: `2026-09-26 16:11:02 [ERROR] PASWS013E SAML signature verification failed. The signature in the SAML response does not match the certificate configured in PVWA.`,
  },
  {
    id: 'pvwa-wf-session-timeout',
    title: 'Load Balancer Session Loss & Invalid Session ID (ITATS433E)',
    component: 'PVWA',
    category: 'Load Balancing & High Availability',
    severity: 'Medium',
    summary: 'Users navigating PVWA suddenly get logged out with "Session Expired" or "Invalid Session ID" due to missing sticky sessions on F5 / ALB.',
    commonCodes: ['ITATS433E', 'SESSION_LOST'],
    questions: [
      {
        id: 'q-lb-sticky',
        question: 'Is Session Persistence / Sticky Sessions enabled on your Load Balancer for PVWA?',
        choices: [
          { id: 'no_sticky', label: 'No, load balancer distributes round-robin across PVWAs', isLikelyIndicator: true },
          { id: 'sticky_active', label: 'Yes, sticky session cookie is enabled', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'PVWA Multi-Node Session Drift over Load Balancer',
      rootCause: 'The hardware load balancer lacks HTTP cookie persistence, causing client HTTP requests to bounce between different PVWA web nodes.',
      explanation: 'PVWA user session state is maintained locally in the web server memory. If a subsequent request hits a different PVWA node that has no active session token, the Vault rejects the call with ITATS433E.',
      resolutionSteps: [
        'Configure Source IP Affinity or HTTP Cookie-based Persistence (Cookie Insert) on the Load Balancer with a minimum 30-minute timeout.',
        'Synchronize SessionTimeout parameter in PVWA Administration > Options > General.',
        'Verify IIS application pool recycling is not configured for fixed intervals during working hours.',
      ],
      logsToCheck: [
        'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log',
      ],
      referenceArticleId: '000004118',
      referenceArticleTitle: 'ITATS433E Invalid Session ID troubleshooting behind Load Balancers',
      communityCause: 'Missing session persistence (sticky sessions) on Load Balancer routing requests to alternating PVWA nodes.',
      communitySolution: 'Enable cookie-based sticky sessions on the load balancer with 30-minute expiration.',
    },
    sampleLog: `2026-09-26 16:22:15 ITATS433E Invalid Session ID. Session has been closed by timeout or station mismatch.`,
  },

  // ==========================================
  // PSM WORKFLOWS (ADDITIONAL)
  // ==========================================
  {
    id: 'psm-wf-rdp-nla',
    title: 'Failed to Connect to Remote Host / RDP Network Level Authentication (PSMSR126E)',
    component: 'PSM',
    category: 'Session Isolation & RDP Proxy',
    severity: 'High',
    summary: 'Privileged Session Manager launches the session shadow user, but the connection dispatcher cannot authenticate to the target destination server.',
    commonCodes: ['PSMSR126E', 'Win32-1326', 'NLA-FAIL'],
    questions: [
      {
        id: 'q-target-rdp-direct',
        question: 'Can you connect directly from the PSM host to the target IP using mstsc.exe?',
        choices: [
          { id: 'mstsc_failed', label: 'Direct mstsc.exe fails (Network/Firewall or Credential issue)', isLikelyIndicator: true },
          { id: 'mstsc_succeeds', label: 'Direct mstsc.exe succeeds with target credentials', isLikelyIndicator: false },
        ],
      },
      {
        id: 'q-nla-enabled',
        question: 'Does the target Windows host enforce Network Level Authentication (NLA)?',
        choices: [
          { id: 'nla_strict', label: 'Yes, NLA is strictly enforced on destination', isLikelyIndicator: true },
          { id: 'nla_disabled', label: 'NLA is disabled', isLikelyIndicator: false },
        ],
      },
    ],
    diagnosisRules: {
      conditionSummary: 'PSM Dispatcher Destination Logon Authentication Failure (PSMSR126E)',
      rootCause: 'Target account password stored in CyberArk is unsynchronized, target Windows host enforces NLA while EnableNLA platform parameter is set to No, or local account lacks RDP logon rights.',
      explanation: 'PSM launches an isolated proxy session. When connecting to modern Windows servers with NLA enabled, the dispatcher must provide pre-authentication credentials. If the credential stored in the Safe differs from the actual machine password, the target OS rejects the logon with error 1326 (Logon failure).',
      resolutionSteps: [
        'Run a CPM "Verify" operation on the target account in PVWA to confirm password synchronization.',
        'Open PVWA > Administration > Platform Management > Edit Platform > UI & Workflows > Connection Components > PSM-RDP > Target Settings and set EnableNLA=Yes.',
        'Verify target server firewall allows TCP 3389 inbound from PSM host IP addresses.',
        'Ensure the target account is in the "Remote Desktop Users" group on the destination server.',
      ],
      logsToCheck: [
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
        'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log',
      ],
      referenceArticleId: '000004612',
      referenceArticleTitle: 'PSMSR126E Failed to successfully logon to the remote host',
      communityCause: 'Credential mismatch in Vault or NLA configuration mismatch between PSM platform and target Windows host.',
      communitySolution: 'Verify password via CPM, enable NLA in platform connection component, and verify target firewall TCP 3389.',
    },
    sampleLog: `2026-09-26 16:55:10 [0x00002b40] PSMSR126E Failed to successfully logon to the remote host. (Target: 10.10.80.15, Return Code: 1326)
2026-09-26 16:55:10 [0x00002b40] PSMSR009I Remote Desktop connection closed: User authentication failed.`,
  },
];
