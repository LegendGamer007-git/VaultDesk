import { LocalKbArticle } from '../types';

export const INITIAL_LOCAL_KB_ARTICLES: LocalKbArticle[] = [
  {
    id: 'kb-dr-failover-sop',
    title: 'SOP: Emergency Disaster Recovery (DR) Vault Failover & PADR Resynchronization',
    slug: 'sop-emergency-dr-vault-failover-padr-resync',
    space: 'Runbooks & SOPs',
    component: 'Vault',
    severity: 'Critical',
    status: 'published',
    author: 'Elena Rostova',
    authorRole: 'Lead PAM Architect',
    summary: 'Standard Operating Procedure for handling Primary Vault outage, executing Disaster Recovery (DR) Vault failover, and safely falling back with PADR replication.',
    tags: ['DR', 'Failover', 'PADR', 'dbparm.ini', 'CAVaultManager', 'High Availability'],
    createdAt: '2026-08-15T10:30:00Z',
    updatedAt: '2026-09-22T16:45:00Z',
    views: 428,
    helpfulCount: 39,
    runbookSteps: [
      'Confirm Primary Vault hardware/network failure and isolate network interfaces to avoid split-brain.',
      'Stop CyberArk Disaster Recovery service on the DR Vault host.',
      'Set "FailoverMode=Yes" in padr.ini and launch CAVaultManager.exe to take over ownership.',
      'Re-point PVWA and CPM DNS records (or verify VIP routing) to DR Vault IP.',
      'Post-incident: Execute Reverse Replication from DR Vault back to Primary Vault using ResetFailoverMode.',
    ],
    content: `## 1. Executive Summary & Objective

This runbook defines the verified failover and failback procedures for the **CyberArk Enterprise Digital Vault** cluster. It covers both automatic and manual failover to Disaster Recovery (DR) Vaults, preventing split-brain conditions and ensuring zero Safe data corruption.

> **CRITICAL CAUTION**: Before promoting any DR Vault to active status, you MUST verify that the Primary Digital Vault is completely powered down or physically disconnected from the network. Never allow both Vaults to run active simultaneously!

---

## 2. Pre-Requisites & Requirements

- Remote Desktop or iLO/iDRAC console access to both **Vault-Primary** and **Vault-DR**.
- Local Windows Administrator credentials on the DR Vault host.
- CyberArk Emergency Master Key CD in air-gapped physical custody (only if emergency dbparm repair is required).
- Verification tool: \`Test-NetConnection -Port 1858\` to confirm listener state.

---

## 3. Step-by-Step Failover Procedure

### Step 3.1: Verify Primary Vault State
Ensure the Primary Digital Vault Windows service is stopped:

\`\`\`powershell
# Run from administrative PowerShell on DR Host to verify Primary is unreachable
Test-NetConnection -ComputerName 10.100.20.10 -Port 1858
# Expected: TcpTestSucceeded = False
\`\`\`

### Step 3.2: Initiate Manual Failover on DR Vault
1. Log into the DR Vault server via console.
2. Open Windows Services (\`services.msc\`) and stop **CyberArk Disaster Recovery**.
3. Open an administrative command prompt in \`C:\\Program Files (x86)\\PrivateArk\\PADR\`.
4. Inspect \`padr.ini\`:

\`\`\`ini
[General]
ServerPath=10.100.20.10
FailoverMode=Yes
EnableFailover=Yes
CheckInterval=30
\`\`\`

5. Start the **PrivateArk Database** and **PrivateArk Server** services on the DR Vault:

\`\`\`cmd
net start "PrivateArk Database"
net start "PrivateArk Server"
\`\`\`

6. Verify that the Vault listener has bound to port 1858:

\`\`\`cmd
netstat -ano | findstr :1858
\`\`\`

---

## 4. Post-Incident Failback & Re-synchronization

Once the primary data center and Primary Vault have been restored, execute reverse replication:

\`\`\`cmd
# In C:\\Program Files (x86)\\PrivateArk\\PADR on Original Primary Vault:
# Run full replication to catch up changes committed to DR Vault during the outage
padr.exe /reset
\`\`\`

Review \`padr.log\` to confirm:
\`\`\`text
PADR0016I Synchronizing Safe [System]...
PADR0016I Synchronizing Safe [VaultInternal]...
PADR0017I Safe data synchronized successfully. Replication completed.
\`\`\`

---

## 5. Verification Checklist

- [ ] DR Vault port 1858 accepting TCP connections.
- [ ] PVWA web interface loads successfully via VIP / DNS alias.
- [ ] Safe "PasswordManager" connects and CPM runs a sample password verification.
- [ ] PSM sessions establish through target dispatchers without certificate error.
- [ ] Disaster Recovery monitoring alert resolved in SIEM / SOC dashboard.`,
    attachments: [
      {
        id: 'att-1',
        name: 'padr.sample.ini',
        size: 1420,
        type: 'text/plain',
        uploadedAt: '2026-08-15T11:00:00Z',
        content: `[General]
ServerPath=10.100.20.10
ServerPort=1858
CheckInterval=30
EnableFailover=Yes
FailoverMode=No
SendTimeout=30
ReceiveTimeout=30`,
      },
      {
        id: 'att-2',
        name: 'validate_dr_replication.ps1',
        size: 2850,
        type: 'application/x-powershell',
        uploadedAt: '2026-08-16T09:20:00Z',
        content: `# Verify CyberArk PADR Replication Status
$LogPath = "C:\\Program Files (x86)\\PrivateArk\\PADR\\padr.log"
if (Test-Path $LogPath) {
    $LastLines = Get-Content $LogPath -Tail 20
    Write-Host "--- PADR Replication Heartbeat ---" -ForegroundColor Cyan
    $LastLines | ForEach-Object { Write-Host $_ }
}`,
      },
    ],
  },
  {
    id: 'kb-psm-applocker-ws2025',
    title: 'Architecture Guide: Windows Server 2025 PSM AppLocker Whitelist Exception Rules',
    slug: 'architecture-guide-windows-server-2025-psm-applocker-rules',
    space: 'Architecture & Hardening',
    component: 'PSM',
    severity: 'High',
    status: 'published',
    author: 'Marcus Vance',
    authorRole: 'Infrastructure SecOps Specialist',
    summary: 'Detailed hardening instructions for configuring Microsoft AppLocker on Windows Server 2025 with PAM 15.2.0, including Chrome, Edge, and custom SSH dispatchers.',
    tags: ['AppLocker', 'PSM', 'Windows Server 2025', 'Hardening', 'DLL Enforcement', 'Event 8004'],
    createdAt: '2026-09-02T14:15:00Z',
    updatedAt: '2026-09-26T11:20:00Z',
    views: 312,
    helpfulCount: 27,
    runbookSteps: [
      'Backup existing PSMConfigureAppLocker.xml in C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening.',
      'Add executable and DLL exception nodes with absolute hashes or publisher signatures.',
      'Run PSMConfigureAppLocker.ps1 in elevated PowerShell.',
      'Check Event Viewer: Applications and Services Logs > Microsoft > Windows > AppLocker.',
      'Validate dispatcher launch via PVWA privileged connection session.',
    ],
    content: `## 1. Context & Purpose

Windows Server 2025 introduces enhanced kernel execution protection and stricter DLL signature verification. When deploying or upgrading to **CyberArk PAM 15.2 LTS**, the default AppLocker configuration must be supplemented to support modern web drivers (\`msedgedriver.exe\`, \`chromedriver.exe\`) and custom in-house terminal dispatchers.

> **Warning (Event ID 8004)**: If AppLocker is enabled without DLL whitelist entries for third-party client libraries, user connections will immediately terminate with error **PSMSR126E** or **PSMSR280E**.

---

## 2. Configuration XML Modifications

Open \`C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\PSMConfigureAppLocker.xml\` in an administrative text editor. Add the following nodes inside the \`<Libraries>\` and \`<Applications>\` sections:

\`\`\`xml
<!-- Windows Server 2025 Browser Driver Exception -->
<Application Name="MsEdgeDriver"
             Type="Exe"
             Path="C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\msedgedriver.exe"
             Method="Publisher" />

<!-- Custom In-House SSH / SQL Dispatcher -->
<Application Name="EnterpriseSqlDispatcher"
             Type="Exe"
             Path="C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\CustomSqlDispatch.exe"
             Method="Hash" />

<Library Name="EnterpriseVendorDll"
         Path="C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\vendor_runtime*.dll"
         Method="Path" />
\`\`\`

---

## 3. Applying AppLocker Rules

Execute the script in an elevated PowerShell session:

\`\`\`powershell
Set-Location "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening"
Unblock-File .\\PSMConfigureAppLocker.ps1
.\\PSMConfigureAppLocker.ps1 -Verbose
\`\`\`

### Verification via Event Viewer
1. Open \`eventvwr.msc\`.
2. Expand **Applications and Services Logs** > **Microsoft** > **Windows** > **AppLocker** > **EXE and DLL**.
3. Verify Event ID **8002** (Allowed to run) appears for PSM processes instead of Event ID **8004** (Prevented from running).

---

## 4. Troubleshooting Table

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| Return code 3221225786 (PSMSR280E) | AppLocker blocked dynamic DLL loading | Check DLL log in Event Viewer; add rule by Hash |
| Browser closes after 2 seconds | Edge updated; driver version mismatch | Download matching msedgedriver from Microsoft |
| "Access is denied" on dispatcher | PSMConnect lacks execute rights | Re-run PSMHardening.ps1 |`,
    attachments: [
      {
        id: 'att-applocker-xml',
        name: 'PSMConfigureAppLocker.custom.xml',
        size: 8940,
        type: 'application/xml',
        uploadedAt: '2026-09-02T14:30:00Z',
        content: `<?xml version="1.0" encoding="utf-8"?>
<AppLockerConfiguration>
  <!-- Customized for Windows Server 2025 & PAM v15.2.0 -->
</AppLockerConfiguration>`,
      },
    ],
  },
  {
    id: 'kb-cpm-password-rotation-triage',
    title: 'Incident Playbook: CPM Bi-Weekly Windows Local Admin Password Rotation Failure',
    slug: 'incident-playbook-cpm-bi-weekly-password-rotation-failure',
    space: 'Incident Post-Mortems',
    component: 'CPM',
    severity: 'Medium',
    status: 'published',
    author: 'David Chen',
    authorRole: 'PAM Operations Engineer',
    summary: 'Root cause analysis and resolution playbook for recurring CACPM406E & Win32 1326 errors when rotating local administrator accounts across DMZ domain member hosts.',
    tags: ['CPM', 'CACPM406E', 'Win32 Error 1326', 'Password Change', 'Reconcile', 'DMZ'],
    createdAt: '2026-07-19T08:00:00Z',
    updatedAt: '2026-08-30T15:10:00Z',
    views: 198,
    helpfulCount: 22,
    runbookSteps: [
      'Identify target system IP and Safe name in PVWA Activity Log.',
      'Check pm_error.log on CPM node to isolate Win32 1326 (Bad password) vs Win32 5 (Access denied).',
      'If password desynchronized: Trigger Safe-level Reconcile Account in PVWA.',
      'Verify SMB TCP 445 / RPC 135 reachability from CPM server to target system.',
      'Confirm Windows Local Security Policy "Network access: Sharing and security model" is set to Classic.',
    ],
    content: `## 1. Incident Overview

- **Incident Reference**: INC-2026-8812
- **Trigger**: Bi-weekly automated policy rotation failed on 14 DMZ application servers with error code **CACPM406E** and system error **1326** (*Logon failure: unknown user name or bad password*).
- **Impact**: Accounts flagged as out-of-sync in PVWA; automated compliance score dropped 8%.

---

## 2. Root Cause Analysis (RCA)

1. A previous network firewall maintenance dropped stateful RPC dynamic ephemeral ports (TCP 49152-65535) between the CPM DMZ interface and target servers mid-rotation.
2. The Vault updated the stored password in the Safe, but the target Windows SAM database never finalized the change, resulting in credential desynchronization.

---

## 3. Remediation Procedure

### Step 1: Execute Account Reconciliation in PVWA
Do NOT attempt a manual "Change" action, as CPM will attempt to authenticate with the new stored password which the target system does not possess.

1. Navigate to **PVWA** > **Accounts**.
2. Locate the failed account and click **Reconcile**.
3. CPM uses the designated **Domain Admin / Reconcile Account** to force-set the target password via NetUserSetInfo API, bypassing the need for the existing password.

### Step 2: Validate Network & RPC Configuration
On the CPM host, run the following test script:

\`\`\`powershell
$Target = "dmz-app01.corp.internal"
Test-NetConnection -ComputerName $Target -Port 445
Test-NetConnection -ComputerName $Target -Port 135
\`\`\`

### Step 3: Local Security Policy Verification
On the target Windows server:
1. Open \`secpol.msc\`.
2. Navigate to **Local Policies** > **Security Options**.
3. Confirm **Network access: Sharing and security model for local accounts** is set to:
   - \`Classic - local users authenticate as themselves\` (NOT Guest only).

---

## 4. Key Learnings & Preventive Controls

- Enable CPM platform parameter \`EnforcePasswordPolicyOnCheck=Yes\` to catch policy mismatch before rotation.
- Configured dedicated Reconcile account association for all DMZ Safe templates.`,
    attachments: [],
  },
  {
    id: 'kb-privilege-cloud-connector-15',
    title: 'Deployment Guide: Privilege Cloud SIA Connector Setup & Auto-Healing Registration',
    slug: 'deployment-guide-privilege-cloud-sia-connector-setup',
    space: 'Upgrade Playbooks',
    component: 'Privilege Cloud',
    severity: 'High',
    status: 'published',
    author: 'Elena Rostova',
    authorRole: 'Lead PAM Architect',
    summary: 'Step-by-step implementation guide for deploying the 15.0.3 Privilege Cloud Connector with ISPSS Connector Management and Secure Infrastructure Access (SIA).',
    tags: ['Privilege Cloud', 'ISPSS', 'SIA', 'Connector Management', 'TLS 1.3', 'v15.0.3'],
    createdAt: '2026-09-19T13:00:00Z',
    updatedAt: '2026-09-24T18:30:00Z',
    views: 245,
    helpfulCount: 31,
    runbookSteps: [
      'Generate a 24-hour Connector Management installer token from ISPSS Management console.',
      'Verify host egress to *.cyberark.cloud on port 443 with TLS 1.3 inspection bypass.',
      'Execute Privilege Cloud Connector 15.0.3 silent installer.',
      'Validate Secure Tunnel v3.2 service health in services.msc.',
      'Confirm connector status appears Green in ISPSS Connector Management dashboard.',
    ],
    content: `## 1. Overview & Architecture

With the release of **CyberArk Privilege Cloud 15.0.3**, on-premises connector management has been unified under the **ISPSS Connector Management** framework. Connectors automatically manage health, security patches, and **Secure Infrastructure Access (SIA)** tunneling without requiring manual quarterly MSI upgrades.

---

## 2. Network Prerequisites

The connector host requires outbound access only (no inbound ports required):

| Destination | Port | Protocol | Purpose |
|---|---|---|---|
| \`<tenant_subdomain>.cyberark.cloud\` | 443 | TLS 1.3 | ISPSS API & Control Plane |
| \`connector-mgmt.<region>.cyberark.cloud\` | 443 | TLS 1.3 | Automated agent heartbeat |
| Target managed hosts | 22, 3389, 445 | TCP | Internal resource management |

---

## 3. Installation Execution

1. Log into your **CyberArk ISPSS Console** as Tenant Administrator.
2. Navigate to **Administration** > **Connector Management** > **Add Connector**.
3. Copy the PowerShell installation command with embedded short-lived registration token:

\`\`\`powershell
# Run in Administrative PowerShell on connector host
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://connector-mgmt.us1.cyberark.cloud/agent/install.ps1'))
\`\`\`

4. Monitor the installation output until:
\`\`\`text
[INFO] Connector registered successfully with ID: cn-east-01
[INFO] Secure Tunnel service active and connected.
[SUCCESS] Privilege Cloud Connector v15.0.3 installation finished.
\`\`\`

---

## 4. Verification

- Open \`services.msc\` and verify **CyberArk Secure Tunnel** is in the \`Running\` state.
- Return to ISPSS console and confirm the node status shows **Connected / Healthy**.`,
    attachments: [],
  },
];
