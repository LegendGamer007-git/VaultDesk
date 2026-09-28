import { ErrorEntry } from '../types';

export const COMMUNITY_KB_ARTICLES: ErrorEntry[] = [
  // ==========================================
  // PRIVILEGE CLOUD COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-pcld001e',
    code: 'PCLD001E',
    title: 'Privilege Cloud Secure Tunnel connection failed',
    component: 'Privilege Cloud',
    severity: 'Critical',
    description: 'On-premises customer connector cannot establish or maintain an outbound micro-tunnel to the CyberArk Privilege Cloud SaaS tenant. As a result, safe synchronization and automated password management are suspended.',
    cause: 'Outbound TCP port 443 blocked on edge corporate firewall, TLS deep packet inspection (DPI) or SSL proxy intercepting pinned certificate, or CyberArk Secure Tunnel service crashed on the Connector host.',
    resolutionSteps: [
      'Confirm outbound network path to <subdomain>.privilegecloud.cyberark.cloud on port 443 using Test-NetConnection in PowerShell.',
      'Ensure corporate proxy or next-gen firewall bypasses SSL/TLS interception for *.cyberark.cloud and *.privilegecloud.cyberark.cloud.',
      'Open services.msc on the Privilege Cloud Connector host and check the status of the "CyberArk Secure Tunnel" service.',
      'Review C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log for handshake errors or HTTP 407 proxy authentication failures.',
      'Restart the Secure Tunnel service and confirm active tunnel establishment in ISPSS Connector Management portal.'
    ],
    affectedVersions: ['Privilege Cloud Standard', 'Privilege Cloud with ISPSS (2024-2026)'],
    logsToCheck: [
      'C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log',
      'C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Docs: Privilege Cloud Secure Tunnel Architecture & Ports',
        url: 'https://docs.cyberark.com/privilege-cloud/latest/en/content/securetunnel/secure-tunnel-troubleshooting.htm',
        type: 'Official Docs'
      }
    ],
    tags: ['privilege-cloud', 'secure-tunnel', 'ispss', 'connector', 'network'],
    lastUpdated: '2026-09-18',
    helpfulCount: 294,
    unhelpfulCount: 4,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006214'
  },
  {
    id: 'comm-pcld004e',
    code: 'PCLD004E',
    title: 'Privilege Cloud Connector Management Agent offline or token expired',
    component: 'Privilege Cloud',
    severity: 'High',
    description: 'The Connector Management Agent on the customer connector server failed to register with CyberArk Identity Security Platform Shared Services (ISPSS) due to an expired bootstrap token.',
    cause: 'The deployment script was executed after the 24-hour token validity window expired, or the agent cryptographic cache in C:\\Program Files\\CyberArk\\Connector Management Agent was corrupted.',
    resolutionSteps: [
      'Log into the CyberArk ISPSS Portal as an Administrator and navigate to Administration > Connector Management.',
      'Click "Add Connector" and generate a fresh registration command and token.',
      'Open an elevated PowerShell prompt on the connector host and execute the fresh registration command.',
      'Inspect C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log to confirm successful registration code 200.',
      'Verify that the connector displays "Active" and "Connected" in the cloud console.'
    ],
    affectedVersions: ['Privilege Cloud 13.x', 'Privilege Cloud 14.x ISPSS'],
    logsToCheck: [
      'C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Community KB: Connector Management Agent Token Expired Resolution',
        url: 'https://community.cyberark.com/s/article/Privilege-Cloud-Connector-Management-Token-Renewal',
        type: 'KB Article'
      }
    ],
    tags: ['privilege-cloud', 'connector-management', 'token-expired', 'ispss'],
    lastUpdated: '2026-09-15',
    helpfulCount: 185,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006328'
  },
  {
    id: 'comm-pcld007e',
    code: 'PCLD007E',
    title: 'Privilege Cloud Out-of-Band CPM password rotation timeout to target host',
    component: 'Privilege Cloud',
    severity: 'High',
    description: 'In Privilege Cloud environments, on-premises CPM initiated password verification or reconcile via customer connector, but connection to target device timed out.',
    cause: 'Target internal network firewall blocking TCP 22/445 from customer connector VM to target hosts, or Secure Tunnel latency exceeding the 90-second timeout threshold.',
    resolutionSteps: [
      'Test internal network reachability from Privilege Cloud Connector VM to target IP using PowerShell: Test-NetConnection -ComputerName <TargetIP> -Port 22/445.',
      'Inspect C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log on the connector server.',
      'Review ThirdParty debug log to identify terminal handshake pause.',
      'Increase Execution Timeout in PVWA platform settings to 180 seconds if target endpoint is situated over remote site VPN.'
    ],
    affectedVersions: ['Privilege Cloud 12.x - 14.x'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\*.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Community KB: Privilege Cloud CPM Out-of-Band Timeout',
        url: 'https://community.cyberark.com/s/article/Privilege-Cloud-CPM-Timeout-Troubleshooting',
        type: 'KB Article'
      }
    ],
    tags: ['privilege-cloud', 'cpm-timeout', 'firewall', 'network'],
    lastUpdated: '2026-09-10',
    helpfulCount: 162,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006419'
  },
  // ==========================================
  // VAULT COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-itats103e',
    code: 'ITATS103E',
    title: 'Authentication failure for user [UserName]',
    component: 'Vault',
    severity: 'High',
    description: 'A user or automated component failed to authenticate against the CyberArk Digital Vault. Frequent consecutive occurrences will trigger the MaxFailedLogins threshold and lock the account.',
    cause: 'Incorrect password supplied, user account locked out due to exceeding MaxFailedLogins threshold in dbparm.ini, directory mapping / LDAP authentication desynchronization, or component credfile mismatch.',
    resolutionSteps: [
      'Inspect the Vault itaso001.log (C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log) to identify the client IP, station, and exact failure reason code.',
      'Log into the PrivateArk Client as a Vault Administrator and navigate to Tools > Administrative Tools > Users and Groups.',
      'Select the locked user, click "Update", and verify if "User is suspended" or "Locked until" is active. Clear the suspension and reset the password if necessary.',
      'If the user is an LDAP directory user, test LDAP connectivity in PVWA Administration > LDAP Configuration to verify domain controller reachability and bind user credentials.',
      'For component users (e.g. PasswordManager, PSMApp, Prov_<Hostname>), verify that their corresponding .cred / .ini file has not desynchronized and re-run CreateCredFile.exe.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\PVWA.App.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: ITATS103E Authentication Failure Runbook',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['authentication', 'lockout', 'ldap', 'vault', 'privateark'],
    lastUpdated: '2026-06-18',
    helpfulCount: 234,
    unhelpfulCount: 5,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000004128'
  },
  {
    id: 'comm-itats106e',
    code: 'ITATS106E',
    title: 'Destination Station is not allowed for user [UserName]',
    component: 'Vault',
    severity: 'High',
    description: 'The Digital Vault rejected a login attempt because the connecting IP address or station hostname is not in the allowed workstation list configured for this user account.',
    cause: 'The user account or component user has Authorized Interfaces or Network Areas configured in PrivateArk that restrict connections to specific IP ranges, and the current connection originated from an unlisted IP or load-balanced VIP.',
    resolutionSteps: [
      'Check the incoming IP address logged in C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log.',
      'Open PrivateArk Client > Tools > Administrative Tools > Users and Groups.',
      'Select the affected user account, click "Update" > "Authorized Interfaces" tab.',
      'Add the connecting station IP address or configure a subnet range (e.g. 10.0.0.0/24).',
      'If the user is a CPM or PSM component user whose host IP was changed, update both the user record in PrivateArk and regenerate the credfile using CreateCredFile.exe with the new /IP flag.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: ITATS106E Station Authorization Guide',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['ip-restriction', 'station', 'network-areas', 'vault'],
    lastUpdated: '2026-05-12',
    helpfulCount: 189,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000003920'
  },
  {
    id: 'comm-itats375e',
    code: 'ITATS375E',
    title: 'Safe [SafeName] is not authorized for shared access',
    component: 'Vault',
    severity: 'Critical',
    description: 'PSM or PVWA failed to connect to a target account because the Safe hosting the target credentials has not been authorized for access through the PSM server gateway.',
    cause: 'The Safe permissions do not include the PSM server gateway user (PSMApp_<ServerName>) or the "Access Safe without Confirmation" right is missing.',
    resolutionSteps: [
      'Log into PVWA as a Safe Administrator or Vault Admin.',
      'Navigate to Policies > Safes > select the affected Safe > click "Members".',
      'Verify that the PSMApp user (e.g. PSMApp_PSM01) is added as a safe member with "Use accounts", "Retrieve accounts", and "List accounts" permissions.',
      'Confirm that the PSMGW user (PSMGW_PSM01) is also configured if shared cluster access is enabled.',
      'Save the safe permissions, then re-initiate the connection from PVWA to verify.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: ITATS375E Safe Shared Access Authorization',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'safe-permissions', 'psmapp', 'shared-access', 'vault'],
    lastUpdated: '2026-07-22',
    helpfulCount: 312,
    unhelpfulCount: 4,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000005819'
  },
  {
    id: 'comm-itats006e',
    code: 'ITATS006E',
    title: 'Station is not authenticated to the Vault (Credential File Desync)',
    component: 'Vault',
    severity: 'Critical',
    description: 'A component (PVWA, CPM, PSM, or AAM agent) attempted to communicate with the CyberArk Digital Vault, but the Vault rejected the credential file (credfile) or station identity.',
    cause: 'The component credential file (user.ini, app.cred, etc.) is corrupted, out of sync with the Vault-stored credential, has expired, or the machine IP / hostname hash restriction in the credfile does not match the requesting server.',
    resolutionSteps: [
      'Identify which component triggered the error by reviewing the Vault Server console/itaso001.log or the component local log.',
      'Stop the affected component service (e.g., CyberArk Password Manager or CyberArk Privileged Session Manager service).',
      'Navigate to the component installation directory (e.g., C:\\Program Files (x86)\\CyberArk\\Password Manager\\Vault).',
      'Use the CreateCredFile utility to generate a fresh credential file: CreateCredFile.exe user.ini Password /IP /Host.',
      'Reset the corresponding component user password in the PrivateArk Client or PVWA (e.g., PasswordManager or PSMApp_ServerName).',
      'Replace the existing .ini/.cred file with the newly generated credfile and ensure appropriate file permissions (read-only by component service account).',
      'Start the component service and inspect log files to confirm authentication succeeded.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: ITATS006E Component Credfile Regeneration',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['credfile', 'createcredfile', 'authentication', 'vault', 'cpm', 'psm'],
    lastUpdated: '2026-08-10',
    helpfulCount: 489,
    unhelpfulCount: 7,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000001045'
  },
  {
    id: 'comm-itats020e',
    code: 'ITATS020E',
    title: 'Safe [SafeName] does not exist or user lacks view permissions',
    component: 'Vault',
    severity: 'Medium',
    description: 'An API call, component action, or user operation requested access to a Safe that cannot be resolved in the Digital Vault directory.',
    cause: 'The Safe name was misspelled in the request or platform configuration, the Safe was deleted, or the authenticated user/component is not a member of the Safe.',
    resolutionSteps: [
      'Log into PrivateArk Client or PVWA with an Administrator account.',
      'Check whether the Safe exists under Safes list. Case sensitivity matters in legacy Vault configurations.',
      'If the Safe exists, open Safe Properties > Safe Members and verify if the user or component (e.g. PasswordManager) is assigned.',
      'Grant minimum permissions: "List accounts" and "Retrieve accounts".',
      'If using REST API, verify that the safeName parameter is properly URL-encoded.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: ITATS020E Safe Permissions and Visibility',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['safe', 'permissions', 'itats020e', 'vault'],
    lastUpdated: '2026-06-04',
    helpfulCount: 156,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000002891'
  },
  {
    id: 'comm-itats429e',
    code: 'ITATS429E',
    title: 'License violation: Maximum number of managed platforms or EPV users exceeded',
    component: 'Vault',
    severity: 'Critical',
    description: 'The Digital Vault license file (license.xml) capacity for registered user accounts or active platforms has been exceeded, preventing new user logins or platform onboarding.',
    cause: 'The active user count in the Vault exceeds the licensed EPVUser / CPMUser allocation, or an automated user onboarding synchronization created accounts past the contractual limit.',
    resolutionSteps: [
      'Log into PrivateArk Client as "Master" or Vault Admin and open Tools > Administrative Tools > License Usage.',
      'Check the breakdown of allocated licenses versus configured users.',
      'Disable or delete inactive or decommissioned user accounts from PrivateArk > Users and Groups.',
      'Verify if automated LDAP mapping groups inadvertently added an entire active directory domain.',
      'Contact CyberArk account representative to provision an updated license.xml file, and install it via PrivateArk Client > Server Properties > License.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      'C:\\Program Files (x86)\\PrivateArk\\Server\\padv.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: ITATS429E Vault License Usage Recovery',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['license', 'itats429e', 'epvuser', 'vault-capacity'],
    lastUpdated: '2026-07-19',
    helpfulCount: 198,
    unhelpfulCount: 3,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000007812'
  },
  {
    id: 'comm-casvd033e',
    code: 'CASVD033E',
    title: 'Vault service failed to start - Database corrupt or dbparm.ini syntax error',
    component: 'Vault',
    severity: 'Critical',
    description: 'The PrivateArk Server service (CyberArk Vault) fails to enter running state and immediately stops during startup.',
    cause: 'Invalid directive or typographical error in C:\\Program Files (x86)\\PrivateArk\\Server\\dbparm.ini, corrupted MySQL/MariaDB database files in the Safe directory, or missing encryption keys (Server Key) on the designated hardware HSM or drive.',
    resolutionSteps: [
      'Inspect C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log and padv.log to see the exact line failure.',
      'Verify recent changes to dbparm.ini. Ensure no trailing characters or invalid IP addresses exist.',
      'Confirm the Vault Server Key (server.key or HSM token) is mounted and readable.',
      'Run the database check utility: CAVaultManager.exe ValidateDatabaseFiles.',
      'In HA cluster environments, verify that the shared cluster drive is online and mounted.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      'C:\\Program Files (x86)\\PrivateArk\\Server\\padv.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CASVD033E Vault Service Startup Troubleshooting',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['vault-startup', 'dbparm.ini', 'server-key', 'casvd033e'],
    lastUpdated: '2026-08-05',
    helpfulCount: 378,
    unhelpfulCount: 4,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000008401'
  },

  // ==========================================
  // CPM COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-cacpm072e',
    code: 'CACPM072E',
    title: 'Password change failed. User [UserName] on machine [Machine] is locked',
    component: 'CPM',
    severity: 'High',
    description: 'Central Policy Manager attempted to rotate the password of a managed target account, but the target operating system or domain controller returned an account lockout status.',
    cause: 'Target account lockout caused by expired cached credentials on other servers, automated services utilizing old credentials, or brute-force attempts on the target system.',
    resolutionSteps: [
      'Review C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log and ThirdParty debug log for target system return code.',
      'Log into the Active Directory domain controller or target server as an administrator and unlock the account.',
      'If a reconcile account is associated with the platform, initiate a "Reconcile" task in PVWA rather than "Change" to reset the password without knowing the current password.',
      'Investigate target server event logs (Windows Event 4740 for Account Lockout) to locate the caller computer submitting invalid credentials.',
      'Once root cause lockout service is stopped, run "Change" or "Verify" in PVWA.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\<Safe>-<Account>.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CACPM072E Target Account Lockout Resolution',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['cpm', 'lockout', 'reconcile', 'windows-ad', 'password-change'],
    lastUpdated: '2026-04-10',
    helpfulCount: 205,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000004732'
  },
  {
    id: 'comm-cacpm070e',
    code: 'CACPM070E',
    title: 'Error in changepass to user [UserName] on domain. System error 1326 (Logon failure)',
    component: 'CPM',
    severity: 'High',
    description: 'CPM failed to change a Windows account password. Win32 Error 1326 signifies "Logon failure: unknown user name or bad password".',
    cause: 'The current password stored in the CyberArk Vault does not match the actual password on the domain or local machine, or the reconcile account lacks permissions.',
    resolutionSteps: [
      'Review the CPM ThirdParty log for the exact winerror 1326 context.',
      'Perform a manual verification in PVWA to confirm password mismatch (will return CACPM069E or CACPM070E).',
      'Trigger an automatic "Reconcile" in PVWA to force-reset the account to a new password using the designated Reconcile account.',
      'If Reconcile fails, verify that the Reconcile account has the "Reset Password" delegation on the target Active Directory Organizational Unit (OU).',
      'Ensure "ChangePasswordInResetMode" is enabled in Platform Management if the target policy requires reset-mode rotation.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CACPM070E System Error 1326 Recovery',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['cpm', 'win32-error-1326', 'logon-failure', 'reconcile', 'active-directory'],
    lastUpdated: '2026-07-05',
    helpfulCount: 278,
    unhelpfulCount: 3,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006114'
  },
  {
    id: 'comm-cacpm406e',
    code: 'CACPM406E',
    title: 'Error in execution of plugin. Execution timed out',
    component: 'CPM',
    severity: 'High',
    description: 'The Central Policy Manager (CPM) plugin initiated a verify, change, or reconcile action on a target system, but the process exceeded the configured Timeout value.',
    cause: 'Network firewall blocking port to target system, slow target host response, prompt regex mismatch in Process/Prompts file causing the script to hang waiting for an expected string, or DNS resolution latency on CPM server.',
    resolutionSteps: [
      'Open the safe where the target account resides in PVWA and check the platform configuration Settings > Additional Policy Settings.',
      'Check the Execution Timeout parameter (default 90 seconds); temporarily increase to 180s if the target system is over high-latency WAN.',
      'Verify network reachability from the CPM server to the target address on the target management port (e.g., Test-NetConnection -ComputerName <TargetIP> -Port 22/3389/1521).',
      'Enable CPM debug logging in Administration > Platform Management > Edit Platform > Automatic Password Management > Additional Policy Settings (set Debug=Yes).',
      'Trigger a Manual Verify on the account and check C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log and ThirdParty\\<SafeName>-<Account>.log.',
      'Examine the third-party log to see which prompt the plugin got stuck on (e.g. unexpected banner, sudo prompt, or SSH cipher mismatch).'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\<Safe>-<Account>-Check.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CACPM406E Execution Timeout Analysis',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['cpm', 'timeout', 'cacpm406e', 'plugin', 'prompt-regex'],
    lastUpdated: '2026-08-01',
    helpfulCount: 390,
    unhelpfulCount: 4,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000003418'
  },
  {
    id: 'comm-cacpm250e',
    code: 'CACPM250E',
    title: 'Operation failed. Reconcile account is not defined or lacks permission',
    component: 'CPM',
    severity: 'High',
    description: 'An automated or manual password reconciliation was triggered, but the platform cannot find an associated Reconcile Account or the associated account is disabled.',
    cause: 'No reconcile account linked in the account properties or platform settings, or the designated reconcile account is locked or in an unauthorized safe.',
    resolutionSteps: [
      'Open PVWA > Accounts > select the target account > click "Edit".',
      'Inspect the "Extra Information" section to verify if a Reconcile Account is specified.',
      'If not specified at the account level, check Administration > Platform Management > Edit Platform > Automatic Password Management > PasswordReconciliation.',
      'Verify that the Safe containing the Reconcile Account has granted the PasswordManager user full permissions (Retrieve, Store, Use).',
      'Confirm the Reconcile account status is "Verified" and not locked out.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CACPM250E Reconcile Account Configuration',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['reconcile', 'cacpm250e', 'cpm', 'account-linking'],
    lastUpdated: '2026-06-25',
    helpfulCount: 167,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000005129'
  },
  {
    id: 'comm-cacpm344e',
    code: 'CACPM344E',
    title: 'Target machine unreachable or RPC server unavailable (Win32 error 1722 / 0x800706BA)',
    component: 'CPM',
    severity: 'High',
    description: 'CPM failed to manage a Windows local or domain account because the target host could not be contacted via Windows RPC / SMB services.',
    cause: 'TCP ports 135 (RPC Endpoint Mapper) and dynamic high ports (49152-65535) or port 445 (SMB) are blocked between CPM and target server, Windows Remote Registry service is stopped, or DNS name cannot be resolved.',
    resolutionSteps: [
      'Execute PowerShell command from CPM server: Test-NetConnection -ComputerName <TargetHost> -Port 445 and Port 135.',
      'Log into the target Windows server and ensure "Remote Registry" service is set to Automatic and is Running.',
      'Verify Windows Firewall on target machine allows "Remote Service Management" and "File and Printer Sharing".',
      'Ensure the CPM machine can resolve the target FQDN via DNS (try ipconfig /flushdns).',
      'Once connectivity is verified, trigger a "Verify" action in PVWA.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\<Safe>-<Account>.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CACPM344E Windows RPC Unavailable Troubleshooting',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['cpm', 'rpc-error', 'win32-1722', 'smb', 'windows'],
    lastUpdated: '2026-05-30',
    helpfulCount: 284,
    unhelpfulCount: 3,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006734'
  },

  // ==========================================
  // PSM COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-psmsr009e',
    code: 'PSMSR009E',
    title: 'Privileged Session Manager agent was unable to connect to the Digital Vault',
    component: 'PSM',
    severity: 'Critical',
    description: 'The PSM service on the RDS host cannot establish or maintain communication with the Digital Vault, preventing all proxied sessions.',
    cause: 'Vault port 1858 blocked by firewall, Vault.ini misconfigured with wrong Vault IP/Address, or PSM credential file (psmapp.cred / psmgw.cred) expired or desynchronized.',
    resolutionSteps: [
      'Check C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log for exact Vault connection error codes.',
      'Test network connection from PSM to Vault: Test-NetConnection -ComputerName <VaultIP> -Port 1858 in PowerShell.',
      'Check C:\\Program Files (x86)\\CyberArk\\PSM\\Vault\\Vault.ini and confirm the IP and Address values point to the active Primary Vault.',
      'Regenerate PSM credentials using CreateCredFile.exe in C:\\Program Files (x86)\\CyberArk\\PSM\\Vault for both psmapp.cred and psmgw.cred.',
      'Reset the corresponding PSMApp and PSMGW user passwords in PrivateArk Client, replace files, and restart "CyberArk Privileged Session Manager" Windows service.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PSMSR009E PSM Vault Connectivity Runbook',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'psmsr009e', 'port-1858', 'credfile', 'connectivity'],
    lastUpdated: '2026-08-01',
    helpfulCount: 345,
    unhelpfulCount: 6,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000007219'
  },
  {
    id: 'comm-psmsr504e',
    code: 'PSMSR504E',
    title: '[Session ID] An error occurred while opening remote desktop session (RDP return code 3334 / 260)',
    component: 'PSM',
    severity: 'High',
    description: 'PSM failed to establish an outbound RDP session from the PSM server to the target Windows server. RDP return code 3334 represents network connection timeout; code 260 represents certificate negotiation failure.',
    cause: 'Target Windows server firewall dropping TCP port 3389, Network Level Authentication (NLA) cipher mismatch, or target host RDP certificate untrusted by the PSM server.',
    resolutionSteps: [
      'Check C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log for the exact sub-code and RDP error reason.',
      'Test port 3389 reachability from PSM server: Test-NetConnection -ComputerName <TargetIP> -Port 3389.',
      'In PVWA Platform Management > Edit Platform > UI & Workflows > Connection Components > PSM-RDP > Target Settings, verify "EnableNLA" setting matches target server configuration.',
      'If using SSL/TLS encryption, ensure the root CA certificate that issued the target server RDP certificate is installed in the PSM Trusted Root Certification Authorities store.',
      'Verify target machine Remote Desktop group membership for the connecting user.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PSMSR504E RDP Code 3334/260 Remediation',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'rdp', 'error-3334', 'error-260', 'nla'],
    lastUpdated: '2026-06-11',
    helpfulCount: 298,
    unhelpfulCount: 4,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000005510'
  },
  {
    id: 'comm-psmsr605e',
    code: 'PSMSR605E',
    title: 'Error opening web browser for session. Web dispatcher failed to initialize driver',
    component: 'PSM',
    severity: 'High',
    description: 'During a web application session launch via PSM, the Secure Web Application Dispatcher was unable to initialize the web driver (e.g. msedgedriver.exe or chromedriver.exe).',
    cause: 'Browser auto-updated to a newer version than the installed webdriver on the PSM server, AppLocker blocked driver execution (Event 8004), or driver binary missing from C:\\Program Files (x86)\\CyberArk\\PSM\\Components.',
    resolutionSteps: [
      'Check installed Microsoft Edge or Google Chrome version on PSM host (Edge > Settings > About).',
      'Download matching msedgedriver.exe or chromedriver.exe version and place it in C:\\Program Files (x86)\\CyberArk\\PSM\\Components.',
      'Inspect Windows Event Viewer > Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL for Event 8004 blocks on driver executable.',
      'Re-run AppLocker configuration script: powershell.exe -ExecutionPolicy Bypass -File "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\CyberArk.PSM.AppLockerAutoConfig.ps1".',
      'Test web connection from PVWA to confirm browser launches and authenticates properly.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log',
      'C:\\Windows\\System32\\winevt\\Logs\\Microsoft-Windows-AppLocker%4EXE and DLL.evtx'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PSMSR605E Web Dispatcher and Driver Synchronization',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'webdriver', 'applocker', 'chrome', 'edge', 'web-applications'],
    lastUpdated: '2026-07-30',
    helpfulCount: 412,
    unhelpfulCount: 3,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000008123'
  },
  {
    id: 'comm-psmsr126e',
    code: 'PSMSR126E',
    title: 'Session ended unexpectedly due to target RDP disconnect or AppLocker rule block',
    component: 'PSM',
    severity: 'High',
    description: 'A privileged session was terminated immediately after launching. The end user sees "The Privileged Session-Manager session has been disconnected".',
    cause: 'AppLocker policy blocked the dispatcher executable, the Shadow User profile failed to initialize, or the target application closed immediately due to missing command-line arguments.',
    resolutionSteps: [
      'Open Windows Event Viewer on PSM server > Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL.',
      'Filter for Event ID 8004 to find the exact binary or DLL blocked by policy.',
      'Open C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\PSMConfigureAppLocker.xml and ensure the dispatcher binary has an active allow rule.',
      'Run PowerShell command: & "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\CyberArk.PSM.AppLockerAutoConfig.ps1".',
      'Verify that PSM Shadow Users (PSM-XXXX) have write permissions to their temp directories.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PSMSR126E Disconnect & AppLocker Remediation',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'applocker', 'psmsr126e', 'shadow-users', 'disconnect'],
    lastUpdated: '2026-08-14',
    helpfulCount: 382,
    unhelpfulCount: 5,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006902'
  },
  {
    id: 'comm-psmsr280e',
    code: 'PSMSR280E',
    title: 'Failed to impersonate PSMConnect user during session launch',
    component: 'PSM',
    severity: 'High',
    description: 'Privileged Session Manager failed to launch the session because the local PSMConnect or PSMAdminConnect user could not be impersonated by the PSM service.',
    cause: 'The PSMConnect account password was changed or expired, the account is locked in Computer Management, or Group Policy revoked "Allow log on locally" or "Log on through Remote Desktop Services" rights.',
    resolutionSteps: [
      'Open Computer Management (compmgmt.msc) on the PSM server > Local Users and Groups > Users.',
      'Locate PSMConnect and PSMAdminConnect. Verify accounts are not disabled or locked.',
      'Ensure "Password never expires" and "User cannot change password" are both checked.',
      'Open Local Security Policy (secpol.msc) > Local Policies > User Rights Assignment.',
      'Verify that PSMConnect is listed under "Allow log on locally" and "Allow log on through Remote Desktop Services", and is NOT in any "Deny log on" rules.',
      'Regenerate PSM credentials if credentials were desynchronized in the Vault.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PSMSR280E PSMConnect User Rights Configuration',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'psmconnect', 'impersonation', 'user-rights', 'secpol'],
    lastUpdated: '2026-07-12',
    helpfulCount: 320,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000004519'
  },
  {
    id: 'comm-psmsr945e',
    code: 'PSMSR945E',
    title: 'Session recorder failed to capture video / keystrokes. Disk space threshold exceeded',
    component: 'PSM',
    severity: 'Critical',
    description: 'PSM session recording service aborted active recording because the recording storage volume dropped below the minimum free space safety threshold (default 10%).',
    cause: 'The recording staging directory (C:\\Program Files (x86)\\CyberArk\\PSM\\Recordings) filled up due to delayed upload to the Vault Safe or insufficient local disk capacity.',
    resolutionSteps: [
      'Check available disk space on the PSM recording drive in Windows File Explorer.',
      'Inspect C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log for disk threshold warnings.',
      'Confirm that the PSM Safe upload task is functional (verify PSMRecordings Safe exists in Vault and is not full).',
      'Safely archive or clean up old compressed diagnostic logs from C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Old.',
      'Expand the disk volume allocated for PSM Recordings or migrate the Recordings folder to a dedicated disk partition.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PSMSR945E Recordings Disk Threshold Recovery',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['psm', 'recordings', 'disk-space', 'session-recorder', 'vault'],
    lastUpdated: '2026-08-08',
    helpfulCount: 250,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000007328'
  },

  // ==========================================
  // PVWA COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-pasws035e',
    code: 'PASWS035E',
    title: 'The user is not authorized to perform this operation via REST API',
    component: 'PVWA',
    severity: 'High',
    description: 'A REST API request returned HTTP 403 Forbidden with error PASWS035E when invoking account, safe, or policy endpoints.',
    cause: 'The authenticated user account does not have required administrative Vault permissions (e.g. Add Safes, Manage Server, Reset Users Passwords) or lacks Safe Member permissions on the target Safe.',
    resolutionSteps: [
      'Identify the API endpoint being called (e.g. POST /PasswordVault/api/Safes or POST /PasswordVault/api/Accounts).',
      'In PrivateArk Client, navigate to Users and Groups > select the API user > click "Update".',
      'Review User Authorizations and ensure required flags (e.g., "Add Safes", "Manage Server File Categories") are checked.',
      'For account operations, verify the user is a Safe Member with "Add accounts", "Update accounts", or "Delete accounts" rights.',
      'Test the API call again with a fresh session token from /PasswordVault/api/auth/Logon.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log',
      'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\PVWA.App.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PASWS035E REST API Authorization Guide',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['pvwa', 'rest-api', 'authorization', 'permissions', '403-forbidden'],
    lastUpdated: '2026-07-15',
    helpfulCount: 221,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000006230'
  },
  {
    id: 'comm-pasws011e',
    code: 'PASWS011E',
    title: 'Invalid session token. Session has timed out or PVWA pool was recycled',
    component: 'PVWA',
    severity: 'Medium',
    description: 'API clients or web users experience sudden disconnection with PASWS011E: "Session token is invalid or expired".',
    cause: 'The authentication token exceeded the PVWA IdleTimeout period, the IIS PasswordVaultWebAccessPool was recycled, or multiple PVWA nodes behind a load balancer lack sticky sessions.',
    resolutionSteps: [
      'Check IIS Application Pool recycling settings for PasswordVaultWebAccessPool in IIS Manager (ensure Idle Time-out is appropriately tuned).',
      'If using a load balancer (F5, NetScaler, HAProxy), verify that Session Persistence / Sticky Sessions (Source IP or Cookie-based) is enabled.',
      'In client scripts, catch HTTP 401/403 and automatically execute re-authentication against /PasswordVault/api/auth/Logon.',
      'Review PVWA Web.config sessionState timeout value (default 20 minutes).'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\PVWA.App.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PASWS011E Session Token Timeout & Load Balancing',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['pvwa', 'session-timeout', 'token', 'load-balancer', 'rest-api'],
    lastUpdated: '2026-06-19',
    helpfulCount: 184,
    unhelpfulCount: 3,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000005910'
  },
  {
    id: 'comm-pvwa001e',
    code: 'PVWA001E',
    title: 'Password Vault Web Access HTTP 500.19 or White Screen after Windows Update',
    component: 'PVWA',
    severity: 'Critical',
    description: 'Users navigating to https://<PVWA>/PasswordVault receive an IIS HTTP 500.19 Internal Server Error or an entirely blank white screen.',
    cause: 'Windows updates modified IIS .NET Core hosting bundle permissions, corrupted applicationHost.config, or the URL Rewrite module was disabled/missing.',
    resolutionSteps: [
      'Open IIS Manager on PVWA server > check if PasswordVaultWebAccess application pool is Started.',
      'Open an administrative command prompt and run iisreset /noforce.',
      'Verify that URL Rewrite 2.1 module is installed and active in IIS.',
      'Inspect C:\\Windows\\System32\\inetsrv\\config\\applicationHost.config to ensure overrideModeDefault="Allow" for handlers and modules.',
      'Verify NTFS permissions on C:\\inetpub\\wwwroot\\PasswordVault (ensure IIS_IUSRS has Read & Execute rights).'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\inetpub\\logs\\LogFiles\\W3SVC1\\*.log',
      'C:\\inetpub\\wwwroot\\PasswordVault\\Logs\\CyberArk.WebConsole.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PVWA HTTP 500.19 Recovery Guide',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['pvwa', 'iis', 'http-500', 'white-screen', 'windows-update'],
    lastUpdated: '2026-08-02',
    helpfulCount: 367,
    unhelpfulCount: 5,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000008012'
  },

  // ==========================================
  // CCP / AAM COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-appap002e',
    code: 'APPAP002E',
    title: 'Application Password Provider user is not authorized for safe [SafeName]',
    component: 'CCP',
    severity: 'High',
    description: 'Central Credential Provider (CCP) or local CP agent failed to retrieve account credentials requested by an external application, returning code APPAP002E.',
    cause: 'The Provider user account (e.g. Prov_<Hostname> or Prov_CCP) has not been added as a member of the Safe containing the target account.',
    resolutionSteps: [
      'Identify the Provider user name from C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPConsole.log.',
      'Log into PVWA as an Administrator > Policies > Safes > select the target Safe > click "Members".',
      'Click "Add Member" and search for the Provider user (e.g. Prov_WEB01).',
      'Grant the following permissions: "Retrieve accounts" and "List accounts" (ensure "Access Safe without Confirmation" is enabled).',
      'Test the application API query again; credentials will now be returned successfully.'
    ],
    affectedVersions: ['11.x', '12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPConsole.log',
      'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: APPAP002E Provider Safe Permissions',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['ccp', 'aam', 'appap002e', 'safe-permissions', 'provider'],
    lastUpdated: '2026-06-28',
    helpfulCount: 260,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000004921'
  },
  {
    id: 'comm-appap100e',
    code: 'APPAP100E',
    title: 'Central Credential Provider (CCP) Web Service returned 403 Forbidden or invalid AppID',
    component: 'CCP',
    severity: 'High',
    description: 'A REST request to AIMWebService /api/Accounts fails with HTTP 403 or error APPAP100E: "Application authentication failure".',
    cause: 'The application ID specified in the query parameter (AppID) is not defined in PVWA, or client authentication constraints (Allowed IPs, Certificate Hash, OS User) failed validation.',
    resolutionSteps: [
      'Review C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log for the exact authentication rule violation.',
      'In PVWA, navigate to Applications > locate the AppID specified in the request.',
      'Check the "Authentication" tab: verify if "Allowed Machine IP Addresses" includes the requesting client IP (beware of NAT/proxy IP changes).',
      'If using Client Certificate authentication, verify that the client certificate serial number or SHA-1/SHA-256 fingerprint matches the application record.',
      'Test query via curl or PowerShell: Invoke-RestMethod -Uri "https://<PVWA>/AIMWebService/api/Accounts?AppId=<AppID>&Safe=<Safe>&Object=<Object>" -UseDefaultCredentials.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log',
      'C:\\inetpub\\logs\\LogFiles\\W3SVC1\\*.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: APPAP100E CCP Authentication Troubleshooting',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['ccp', 'aimwebservice', 'appid', 'client-ip', 'certificate-auth'],
    lastUpdated: '2026-07-25',
    helpfulCount: 310,
    unhelpfulCount: 3,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000007550'
  },
  {
    id: 'comm-appap330e',
    code: 'APPAP330E',
    title: 'Client certificate serial number or public key hash mismatch in CCP request',
    component: 'CCP',
    severity: 'High',
    description: 'Central Credential Provider rejected an incoming HTTPS request using mTLS authentication with code APPAP330E.',
    cause: 'The certificate presented by the client has renewed, changed thumbprint, or does not match the serial number registered in the PVWA Application ID definition.',
    resolutionSteps: [
      'Obtain the current client certificate details from the calling application server (certutil -dump <certfile.cer>).',
      'Log into PVWA > Applications > select the target Application ID > "Authentication" tab.',
      'Select Client Certificates > click "Update" and update the Serial Number and Issuer Distinguished Name.',
      'Ensure IIS AIMWebService has "Client Certificates" set to "Accept" or "Require" in SSL Settings.',
      'Re-test API call from the application server.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: APPAP330E Certificate Fingerprint Synchronization',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['ccp', 'certificate-hash', 'mtls', 'serial-number', 'appap330e'],
    lastUpdated: '2026-06-15',
    helpfulCount: 175,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000005432'
  },

  // ==========================================
  // PTA COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-pta0005e',
    code: 'PTA0005E',
    title: 'PTA diamond service could not connect to Digital Vault for security events ingestion',
    component: 'PTA',
    severity: 'Critical',
    description: 'Privileged Threat Analytics (PTA) daemon stopped processing real-time security alerts and syslog triggers because diamond service lost communication with the Vault.',
    cause: 'Network reachability down on port 1858, PTA server certificate expired or rejected by Vault, or PTA credential file out of sync after Vault DR failover.',
    resolutionSteps: [
      'Connect to the PTA server terminal via SSH and inspect /var/log/cyberark/pta/diamond.log.',
      'Test port 1858 connectivity: nc -zv <VaultIP> 1858.',
      'Run the PTA utility to re-synchronize Vault credentials: /opt/cyberark/pta/utility/synchronizeVaultCredentials.sh.',
      'Verify Vault root certificate trust: /opt/cyberark/pta/utility/importVaultCertificate.sh.',
      'Restart the PTA diamond service: service monit restart and service pta restart, then verify status: service pta status.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      '/var/log/cyberark/pta/diamond.log',
      '/var/log/cyberark/pta/webconsole.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PTA0005E Diamond Service Recovery',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['pta', 'threat-analytics', 'diamond-service', 'vault', 'linux'],
    lastUpdated: '2026-07-14',
    helpfulCount: 143,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000008912'
  },
  {
    id: 'comm-pta0012e',
    code: 'PTA0012E',
    title: 'PTA Network Sensor / Agent stopped reporting active packets to PTA server',
    component: 'PTA',
    severity: 'High',
    description: 'The PTA Network Sensor deployed on the Domain Controller or network tap ceased transmitting Kerberos Golden Ticket and unmanaged privileged session telemetry.',
    cause: 'Local Windows service CyberArk PTA Network Sensor stopped, firewall blocked port 7514/TCP or 514/UDP to PTA server, or sensor certificate mismatch.',
    resolutionSteps: [
      'Log into the Domain Controller hosting the sensor and open Services (services.msc).',
      'Verify status of "CyberArk PTA Network Sensor" service; start it if stopped.',
      'Check local agent log: C:\\Program Files\\CyberArk\\PTA Network Sensor\\Logs\\pta_sensor.log.',
      'Test communication from the DC to the PTA server on port 7514: Test-NetConnection -ComputerName <PTAServerIP> -Port 7514.',
      'If certificates were rotated on PTA, re-export the sensor certificate from PTA web console and install on the sensor host.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      'C:\\Program Files\\CyberArk\\PTA Network Sensor\\Logs\\pta_sensor.log',
      '/var/log/cyberark/pta/pta_server.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: PTA0012E Network Sensor Telemetry Troubleshooting',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['pta', 'network-sensor', 'golden-ticket', 'domain-controller'],
    lastUpdated: '2026-05-18',
    helpfulCount: 129,
    unhelpfulCount: 0,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000004210'
  },

  // ==========================================
  // CONJUR COMMUNITY ARTICLES
  // ==========================================
  {
    id: 'comm-conj0001e',
    code: 'CONJ0001E',
    title: 'Conjur follower node failed to synchronize with Master database',
    component: 'Conjur',
    severity: 'Critical',
    description: 'A Conjur Follower node stopped replicating secrets from the Conjur Master, leading to stale secrets or authentication errors in Kubernetes/OpenShift workloads.',
    cause: 'PostgreSQL replication stream broken, network port 5432 or 443 blocked between Follower and Master, or Follower seed file expired.',
    resolutionSteps: [
      'SSH into the Conjur Follower or exec into the Follower container pod.',
      'Check replication status: docker exec -it conjur-follower evoke status or pg_stat_replication on Master.',
      'Verify network reachability to Conjur Master on ports 443 and 5432: nc -zv <ConjurMasterHost> 5432.',
      'If replication is desynchronized, generate a fresh Follower seed on the Master: evoke seed follower <FollowerDNS> > follower-seed.tar.',
      'Unpack the new seed file on the Follower: evoke unpack seed follower-seed.tar and evoke configure follower.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      '/var/log/conjur/conjur.log',
      '/var/log/conjur/evoke.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CONJ0001E Conjur Follower Replication Guide',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['conjur', 'follower', 'replication', 'kubernetes', 'secrets'],
    lastUpdated: '2026-07-08',
    helpfulCount: 165,
    unhelpfulCount: 1,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000009110'
  },
  {
    id: 'comm-conj0004e',
    code: 'CONJ0004E',
    title: 'Conjur host authentication token expired or role unauthorized for secret path',
    component: 'Conjur',
    severity: 'High',
    description: 'An application or CI/CD runner attempting to fetch a secret via Conjur CLI or REST API receives HTTP 401 Unauthorized or HTTP 403 Forbidden.',
    cause: 'Short-lived token (8-minute TTL) expired without automatic renewal by Conjur sidecar / authenticator, or Conjur policy does not grant "read" and "execute" privileges to the host role.',
    resolutionSteps: [
      'Verify token freshness: Conjur session tokens expire after 8 minutes; ensure application utilizes conjur-authn-k8s sidecar or refreshes tokens prior to expiration.',
      'Check the Conjur policy file defining the secret variable: ensure the host identity is declared in the permit statement, e.g.:',
      '- !permit\n  role: !host cicd-runner\n  privilege: [ read, execute ]\n  resource: !variable database/password',
      'Inspect Conjur audit log (/var/log/conjur/audit.log) for the exact actor and resource mismatch.',
      'Load updated policy using: conjur policy load -b root -f policy.yml.'
    ],
    affectedVersions: ['12.x', '13.x', '14.x LTS'],
    logsToCheck: [
      '/var/log/conjur/audit.log',
      '/var/log/conjur/conjur.log'
    ],
    sourceLinks: [
      {
        title: 'CyberArk Technical Reference: CONJ0004E Conjur Policy Authorization',
        url: '#in-app-runbook',
        type: 'Community Article'
      }
    ],
    tags: ['conjur', 'token-expiry', 'policy', 'role-based-access', 'cicd'],
    lastUpdated: '2026-06-22',
    helpfulCount: 182,
    unhelpfulCount: 2,
    verifiedByCommunity: true,
    isCommunityResult: true,
    communityArticleId: '000008745'
  }
];
