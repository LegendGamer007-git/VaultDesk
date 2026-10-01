import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Activity,
  Server,
  Zap,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
  Globe,
  Printer,
  Mail,
  FileText,
  Download,
  BookOpen,
  Send,
  X,
  Layers,
  Sparkles,
  Clock,
  History,
  FileCode,
  FileType,
  FileSpreadsheet,
  Users,
  MessageSquare,
} from 'lucide-react';
import { UserProfile } from '../types';

export interface PrivilegedAccount {
  id: string;
  name: string;
  address: string;
  safe: string;
  platform: string;
  status: 'compliant' | 'non_compliant';
  reason: string;
  lastVerified: string;
  ip: string;
  port: number;
  errorCode?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  status: string;
  actor: string;
  badgeColor?: 'red' | 'green' | 'amber' | 'blue';
}

const SAMPLE_ACCOUNTS: PrivilegedAccount[] = [
  {
    id: 'acc-1',
    name: 'svc_sql_cluster',
    address: 'db-prod-cluster.corp.internal',
    ip: '10.240.12.45',
    port: 1433,
    safe: 'PAM_DB_Production_Safe',
    platform: 'Windows Domain Accounts',
    status: 'non_compliant',
    reason: 'Password Expiry Overdue (>90 Days) - CPM Auto-Change Failed (CACPM406E)',
    lastVerified: '12 days ago',
    errorCode: 'CACPM406E',
  },
  {
    id: 'acc-2',
    name: 'root_linux_app04',
    address: 'linux-app-04.corp.internal',
    ip: '10.240.18.104',
    port: 22,
    safe: 'PAM_Linux_Infrastructure',
    platform: 'Unix SSH Keys / Accounts',
    status: 'compliant',
    reason: 'Password verified & synchronized via CPM Engine',
    lastVerified: '2 hours ago',
  },
  {
    id: 'acc-3',
    name: 'aws_breakglass_secops',
    address: 'aws-secops-vault.cloud.internal',
    ip: '172.31.40.12',
    port: 443,
    safe: 'PAM_Cloud_Breakglass',
    platform: 'AWS IAM Access Keys',
    status: 'non_compliant',
    reason: 'CPM Verification Failed - Reachability Timeout & Credential Mismatch (CACPM250E)',
    lastVerified: '3 days ago',
    errorCode: 'CACPM250E',
  },
  {
    id: 'acc-4',
    name: 'svc_cpm_recon_vault',
    address: 'vault-primary.corp.internal',
    ip: '10.240.2.10',
    port: 1858,
    safe: 'PAM_Vault_Operators',
    platform: 'CyberArk Vault Service Accounts',
    status: 'non_compliant',
    reason: 'Out of Sync - Target Password Mismatch & Vault Credential Desync (CACPM072E)',
    lastVerified: 'Yesterday',
    errorCode: 'CACPM072E',
  },
];

interface ComplianceViewProps {
  currentUser?: UserProfile | null;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({ currentUser }) => {
  const [accounts, setAccounts] = useState<PrivilegedAccount[]>(SAMPLE_ACCOUNTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Expanded Account Timeline State
  const [expandedTimelineAccId, setExpandedTimelineAccId] = useState<string | null>(null);
  const [accountTimelines, setAccountTimelines] = useState<Record<string, TimelineEvent[]>>({});
  const [loadingTimelines, setLoadingTimelines] = useState<Record<string, boolean>>({});

  // Execution Terminal Modal State
  const [activeExecutingAcc, setActiveExecutingAcc] = useState<PrivilegedAccount | null>(null);
  const [activeActionName, setActiveActionName] = useState<string>('');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionFinished, setExecutionFinished] = useState(false);

  // Email Report Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState(
    currentUser?.email ? `${currentUser.email}, secops-leads@corp.internal` : '1393ndsd@gmail.com'
  );
  const [emailCustomNote, setEmailCustomNote] = useState(
    'Please find attached the latest CyberArk PAM Privileged Accounts Compliance Audit report. Several accounts require CPM password reconciliation.'
  );
  const [emailReportFormat, setEmailReportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  // Runbook Modal State
  const [activeRunbookAcc, setActiveRunbookAcc] = useState<PrivilegedAccount | null>(null);
  const [runbookData, setRunbookData] = useState<any | null>(null);
  const [isLoadingRunbook, setIsLoadingRunbook] = useState(false);

  const totalAccounts = accounts.length;
  const nonCompliantAccounts = accounts.filter((a) => a.status === 'non_compliant');
  const nonCompliantCount = nonCompliantAccounts.length;
  const compliantCount = accounts.filter((a) => a.status === 'compliant').length;
  const complianceRate = Math.round((compliantCount / totalAccounts) * 100);

  const allNonCompliantSelected =
    nonCompliantAccounts.length > 0 &&
    nonCompliantAccounts.every((acc) => selectedIds.includes(acc.id));

  // Toggle select all non-compliant accounts
  const handleToggleSelectAllNonCompliant = () => {
    if (allNonCompliantSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(nonCompliantAccounts.map((a) => a.id));
    }
  };

  // Toggle single account selection
  const handleToggleSelectAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Fetch or toggle account timeline
  const handleToggleTimeline = async (accountId: string) => {
    if (expandedTimelineAccId === accountId) {
      setExpandedTimelineAccId(null);
      return;
    }

    setExpandedTimelineAccId(accountId);

    if (!accountTimelines[accountId]) {
      setLoadingTimelines((prev) => ({ ...prev, [accountId]: true }));
      try {
        const res = await fetch(`/api/compliance/history/${accountId}`);
        if (res.ok) {
          const data = await res.json();
          setAccountTimelines((prev) => ({
            ...prev,
            [accountId]: data.history || [],
          }));
        }
      } catch (err) {
        console.error('Failed to load history timeline:', err);
      } finally {
        setLoadingTimelines((prev) => ({ ...prev, [accountId]: false }));
      }
    }
  };

  // Helper to append a new event into account timeline locally
  const appendTimelineEvent = (
    accId: string,
    title: string,
    description: string,
    status: string,
    badgeColor: 'red' | 'green' | 'amber' | 'blue' = 'green'
  ) => {
    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: 'Just now (' + new Date().toLocaleTimeString() + ')',
      type: 'user_action',
      title,
      description,
      status,
      actor: currentUser?.email || 'VaultDesk_SecOps_Operator',
      badgeColor,
    };

    setAccountTimelines((prev) => ({
      ...prev,
      [accId]: [newEvent, ...(prev[accId] || [])],
    }));
  };

  // Export Non-Compliant Account List as CSV file
  const handleExportCSV = () => {
    const listToExport = nonCompliantAccounts.length > 0 ? nonCompliantAccounts : accounts;
    const headers = [
      'Account ID',
      'Account Name',
      'Target Address',
      'IP Address',
      'Port',
      'CPM Safe',
      'Platform ID',
      'Compliance Status',
      'Failure Finding / Reason',
      'Last Verified',
      'CPM Error Code',
    ];

    const rows = listToExport.map((a) => [
      a.id,
      `"${a.name}"`,
      `"${a.address}"`,
      a.ip,
      a.port,
      `"${a.safe}"`,
      `"${a.platform}"`,
      a.status,
      `"${a.reason.replace(/"/g, '""')}"`,
      `"${a.lastVerified}"`,
      a.errorCode || 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VaultDesk_Non_Compliant_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Execute single CPM Action
  const handleExecuteAction = async (
    account: PrivilegedAccount,
    action: 'remediate' | 'reachability' | 'change' | 'reconcile' | 'verify',
    actionLabel: string
  ) => {
    setOpenDropdownId(null);
    setActiveExecutingAcc(account);
    setActiveActionName(actionLabel);
    setIsExecuting(true);
    setExecutionFinished(false);
    setExecutionLogs([
      `[SYSTEM] Initializing CPM Automation Dispatch for ${account.name}...`,
      `[TARGET] Host: ${account.address} (${account.ip}:${account.port})`,
      `[SAFE] Safe: ${account.safe} | Platform: ${account.platform}`,
    ]);

    try {
      const res = await fetch('/api/compliance/cpm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id, action }),
      });

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise((r) => setTimeout(r, 400));
          setExecutionLogs((prev) => [...prev, data.logs[i]]);
        }
      }

      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id
              ? {
                  ...a,
                  status: 'compliant',
                  reason: 'Remediated & Verified successfully via CyberArk CPM REST API',
                  lastVerified: 'Just now',
                }
              : a
          )
        );
        setSelectedIds((prev) => prev.filter((id) => id !== account.id));

        appendTimelineEvent(
          account.id,
          `Executed ${actionLabel}`,
          `Action '${action}' completed over CyberArk REST API. Account status updated to COMPLIANT.`,
          'compliant',
          'green'
        );
      }
    } catch (err: any) {
      setExecutionLogs((prev) => [
        ...prev,
        `[ERROR] CPM Workflow failed: ${err.message || 'Execution error'}`,
      ]);

      appendTimelineEvent(
        account.id,
        `Failed ${actionLabel}`,
        `CPM API returned error: ${err.message || 'Workflow failed'}`,
        'failed',
        'red'
      );
    } finally {
      setIsExecuting(false);
      setExecutionFinished(true);
    }
  };

  // Execute Bulk / Batch Remediation for selected items
  const handleRemediateSelected = async () => {
    if (selectedIds.length === 0) return;

    setActiveExecutingAcc({
      id: 'batch',
      name: `Batch (${selectedIds.length} Accounts)`,
      address: 'Multiple Targets',
      safe: 'Fleet Safe Collection',
      platform: 'Multi-Platform',
      status: 'non_compliant',
      reason: 'Batch Reconcile Action',
      lastVerified: 'Pending',
      ip: '0.0.0.0',
      port: 0,
    });
    setActiveActionName(`Batch CPM Reconcile (${selectedIds.length} Accounts)`);
    setIsExecuting(true);
    setExecutionFinished(false);
    setExecutionLogs([
      `[BATCH DISPATCH] Initializing CyberArk CPM Reconcile workflow across ${selectedIds.length} non-compliant accounts...`,
      `[TARGETS] Account IDs: ${selectedIds.join(', ')}`,
      `[AUTH] Authenticating Master Reconciliation Account...`,
    ]);

    try {
      const res = await fetch('/api/compliance/cpm-action-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: selectedIds, action: 'reconcile' }),
      });

      const data = await res.json();

      if (data.logsPerAccount) {
        for (const [id, logs] of Object.entries(data.logsPerAccount)) {
          const accName = accounts.find((a) => a.id === id)?.name || id;
          setExecutionLogs((prev) => [...prev, `\n--- Processing ${accName} ---`]);
          if (Array.isArray(logs)) {
            for (const line of logs) {
              await new Promise((r) => setTimeout(r, 200));
              setExecutionLogs((prev) => [...prev, line]);
            }
          }
          appendTimelineEvent(
            id,
            'Batch Automated CPM Reconcile',
            'Successfully reconciled password via Batch CyberArk REST API.',
            'compliant',
            'green'
          );
        }
      }

      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            selectedIds.includes(a.id)
              ? {
                  ...a,
                  status: 'compliant',
                  reason: 'Reconciled & Verified successfully via Batch CPM API',
                  lastVerified: 'Just now',
                }
              : a
          )
        );
        setSelectedIds([]);
      }
    } catch (err: any) {
      setExecutionLogs((prev) => [
        ...prev,
        `[ERROR] Batch remediation failed: ${err.message || 'Execution error'}`,
      ]);
    } finally {
      setIsExecuting(false);
      setExecutionFinished(true);
    }
  };

  // Open Detailed Remediation Runbook Modal
  const handleOpenRunbook = async (account: PrivilegedAccount) => {
    setOpenDropdownId(null);
    setActiveRunbookAcc(account);
    setIsLoadingRunbook(true);
    setRunbookData(null);

    const errorCode = account.errorCode || 'CACPM406E';
    try {
      const res = await fetch(`/api/compliance/runbook/${errorCode}`);
      if (res.ok) {
        const data = await res.json();
        setRunbookData(data);
      }
    } catch (err) {
      console.error('Failed to fetch runbook:', err);
    } finally {
      setIsLoadingRunbook(false);
    }
  };

  // Send Email Compliance Report to Multiple Recipients
  const handleSendEmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipients.trim()) return;

    setIsSendingEmail(true);
    setEmailStatusMsg(null);

    try {
      const res = await fetch('/api/compliance/email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: emailRecipients,
          customMessage: emailCustomNote,
          reportFormat: emailReportFormat,
          complianceRate,
          totalAccounts,
          nonCompliantCount,
          accounts,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailStatusMsg(
          `Report (${emailReportFormat.toUpperCase()}) successfully sent to: ${data.recipients?.join(', ') || emailRecipients}`
        );
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailStatusMsg(null);
        }, 2800);
      } else {
        setEmailStatusMsg(`Error: ${data.error || 'Failed to send email report.'}`);
      }
    } catch (err: any) {
      setEmailStatusMsg(`Failed to send email: ${err.message || 'Network error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Download Runbook as Plain Text (.TXT)
  const handleDownloadRunbookTxt = (account: PrivilegedAccount) => {
    const code = account.errorCode || 'CACPM406E';
    const content = `================================================================================
VAULTDESK AUTOMATED PAM COMPLIANCE RUNBOOK
Target Account: ${account.name} (${account.address})
Safe: ${account.safe} | Platform: ${account.platform}
CPM Error Code: ${code}
Generated: ${new Date().toLocaleString()}
================================================================================

1. ERROR SUMMARY
--------------------------------------------------------------------------------
Account '${account.name}' is non-compliant due to CPM failure '${account.reason}'.

2. ROOT CAUSE ANALYSIS
--------------------------------------------------------------------------------
- Network firewall socket timeout or ICMP/TCP ping block on target port ${account.port}.
- Target local/domain credentials changed out-of-band by unmanaged administrator.
- CyberArk CPM user.ini credential file desync or prompt regex mismatch in PVWA.

3. STEP-BY-STEP REMEDIATION PLAYBOOK
--------------------------------------------------------------------------------
Step 1: Check Network & Port Reachability
  Command: Test-NetConnection -ComputerName ${account.address} -Port ${account.port}

Step 2: Examine CPM Service Logs
  Location: C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log
  Look for: ${code} error code timestamps and prompt regex matches.

Step 3: Trigger Reconcile via CyberArk PVWA
  Action: Authenticate into PVWA > Accounts > ${account.safe} > ${account.name}
  Click "Reconcile" using Master Reconciliation Account credentials.

Step 4: Verify Credential Synchronization
  Action: Run "Verify" task to ensure target logon succeeds.

================================================================================
VaultDesk PAM Operations & Incident Diagnostic Engine
================================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VaultDesk_Runbook_${account.name}_${code}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Runbook as Word Document (.DOC / .DOCX)
  const handleDownloadRunbookDoc = (account: PrivilegedAccount) => {
    const code = account.errorCode || 'CACPM406E';
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>VaultDesk Remediation Runbook</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #1f2937; }
          h1 { color: #0070e0; font-size: 20pt; border-bottom: 2px solid #0070e0; padding-bottom: 8px; }
          h2 { color: #111827; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .badge { display: inline-block; background: #fee2e2; color: #dc2626; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .meta-table td { padding: 8px; border: 1px solid #e5e7eb; font-size: 10pt; }
          .meta-table th { padding: 8px; border: 1px solid #e5e7eb; background: #f3f4f6; text-align: left; font-size: 10pt; }
          .step-box { background: #f9fafb; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 12px; }
          .code-box { background: #111827; color: #10b981; font-family: monospace; padding: 8px; border-radius: 4px; font-size: 9pt; }
          .footer { font-size: 9pt; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>VaultDesk Privileged Account Remediation Runbook</h1>
        <p><strong>Target Account:</strong> ${account.name} &nbsp;|&nbsp; <strong>CPM Error:</strong> <span class="badge">${code}</span></p>

        <table class="meta-table">
          <tr><th>Target Address</th><td>${account.address} (${account.ip}:${account.port})</td></tr>
          <tr><th>Safe Name</th><td>${account.safe}</td></tr>
          <tr><th>Platform ID</th><td>${account.platform}</td></tr>
          <tr><th>Compliance Failure</th><td>${account.reason}</td></tr>
          <tr><th>Generated At</th><td>${new Date().toLocaleString()}</td></tr>
        </table>

        <h2>1. Root Cause Analysis</h2>
        <p>${runbookData?.summary || account.reason}</p>

        <h2>2. Step-by-Step Remediation Playbook</h2>
        ${
          runbookData?.remediationSteps
            ? runbookData.remediationSteps
                .map(
                  (s: any) => `
          <div class="step-box">
            <strong>Step ${s.step}: ${s.title}</strong>
            <p>${s.details}</p>
            ${s.cmd ? `<div class="code-box">${s.cmd}</div>` : ''}
          </div>
        `
                )
                .join('')
            : '<p>Execute automated CPM Reconcile workflow via CyberArk REST API.</p>'
        }

        <div class="footer">
          VaultDesk CyberArk PAM Incident Runbook • Confidential Internal Security Operations
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VaultDesk_Runbook_${account.name}_${code}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Runbook as Printable PDF Window
  const handlePrintRunbookPdf = (account: PrivilegedAccount) => {
    const code = account.errorCode || 'CACPM406E';
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>VaultDesk Runbook - ${account.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px; font-size: 24px; }
            .badge { background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; border: 1px solid #fca5a5; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 12px; margin: 20px 0; background: #f8fafc; p-16; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; }
            .step { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #f8fafc; }
            .code { background: #0f172a; color: #38bdf8; padding: 8px; font-family: monospace; border-radius: 4px; font-size: 12px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>VaultDesk Incident Runbook: ${account.name}</h1>
          <p>CPM Error Code: <span class="badge">${code}</span> | Target: <strong>${account.address}</strong></p>
          <div class="grid">
            <div><strong>Safe:</strong> ${account.safe}</div>
            <div><strong>Platform:</strong> ${account.platform}</div>
            <div><strong>IP & Port:</strong> ${account.ip}:${account.port}</div>
            <div><strong>Status:</strong> ${account.status}</div>
          </div>
          <h2>Root Cause Analysis</h2>
          <p>${runbookData?.summary || account.reason}</p>
          <h2>Remediation Playbook</h2>
          ${
            runbookData?.remediationSteps
              ? runbookData.remediationSteps
                  .map(
                    (s: any) => `
            <div class="step">
              <strong>Step ${s.step}: ${s.title}</strong>
              <p>${s.details}</p>
              ${s.cmd ? `<div class="code">${s.cmd}</div>` : ''}
            </div>
          `
                  )
                  .join('')
              : '<p>Execute CPM Reconcile task via CyberArk REST API.</p>'
          }
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Dedicated Print / PDF Trigger for Compliance Report
  const handlePrintComplianceReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to open the PDF Print View.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VaultDesk Privileged Accounts Compliance Audit Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #ffffff; }
            .header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .metrics-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
            .card-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; }
            .card-val { font-size: 28px; font-weight: 900; margin-top: 6px; font-family: monospace; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            .table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
            .badge-comp { background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
            .badge-non { background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
              Click to Save as PDF / Print Report
            </button>
          </div>

          <div class="header">
            <div>
              <h1 class="title">VaultDesk Privileged Account Compliance Report</h1>
              <div class="subtitle">CyberArk PAM & Privilege Cloud Fleet Audit • Generated ${new Date().toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold;">Audit Classification</div>
              <div style="font-size: 14px; font-weight: 800; color: #0284c7;">CONFIDENTIAL / SEC-OPS</div>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="card">
              <div class="card-title">Compliance Rate</div>
              <div class="card-val" style="color: ${complianceRate === 100 ? '#16a34a' : '#d97706'}">${complianceRate}%</div>
            </div>
            <div class="card">
              <div class="card-title">Total Accounts Managed</div>
              <div class="card-val" style="color: #0f172a">${totalAccounts}</div>
            </div>
            <div class="card">
              <div class="card-title">Non-Compliant Accounts</div>
              <div class="card-val" style="color: ${nonCompliantCount > 0 ? '#dc2626' : '#16a34a'}">${nonCompliantCount}</div>
            </div>
          </div>

          <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Managed Privileged Account Directory</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Account Name & Target</th>
                <th>Safe & Platform</th>
                <th>Compliance Status</th>
                <th>Reason / Findings</th>
                <th>Last Verified</th>
              </tr>
            </thead>
            <tbody>
              ${accounts
                .map(
                  (acc) => `
                <tr>
                  <td>
                    <strong>${acc.name}</strong><br/>
                    <span style="color: #64748b; font-family: monospace;">${acc.address} (${acc.ip}:${acc.port})</span>
                  </td>
                  <td>
                    <strong>${acc.safe}</strong><br/>
                    <span style="color: #64748b;">${acc.platform}</span>
                  </td>
                  <td>
                    <span class="${acc.status === 'compliant' ? 'badge-comp' : 'badge-non'}">
                      ${acc.status === 'compliant' ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </span>
                  </td>
                  <td style="color: ${acc.status === 'compliant' ? '#64748b' : '#dc2626'}">${acc.reason}</td>
                  <td style="font-family: monospace; color: #64748b;">${acc.lastVerified}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            VaultDesk Automated Governance & Compliance Platform • Internal CyberArk PAM Telemetry Audit Report
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0E131F] via-[#121826] to-[#0E131F] border border-[#232833] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Privileged Accounts Compliance Status
            </h2>
          </div>
          <p className="text-xs text-[#8E9BBA] leading-relaxed">
            Real-time compliance telemetry, ping reachability diagnostic, and automated CPM password reconciliation for CyberArk PAM & Privilege Cloud fleet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] text-white border border-[#232833] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
            title="Export Non-Compliant Account List as CSV File"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#30D158]" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handlePrintComplianceReport}
            className="px-3.5 py-2 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] text-white border border-[#232833] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
            title="Export Compliance Report as PDF / Print Preview"
          >
            <Printer className="w-4 h-4 text-[#0A84FF]" />
            <span>Export PDF</span>
          </button>

          {/* Email Report Button */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            title="Email Compliance Report to multiple stakeholders"
          >
            <Mail className="w-4 h-4" />
            <span>Email Report</span>
          </button>

          <div className="text-right pl-3 border-l border-[#232833]">
            <div className="text-xs text-[#8E9BBA] font-semibold">Fleet Compliance Rate</div>
            <div
              className={`text-2xl font-black font-mono ${
                complianceRate === 100 ? 'text-[#30D158]' : 'text-[#FF9F0A]'
              }`}
            >
              {complianceRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#8E9BBA]">Total Managed Accounts</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{totalAccounts}</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#1A1E2E] text-[#0A84FF] border border-white/5">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#FF453A]">Non-Compliant Accounts</div>
            <div className="text-2xl font-black text-[#FF453A] font-mono mt-1">
              {nonCompliantCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#30D158]">Compliant & Synced</div>
            <div className="text-2xl font-black text-[#30D158] font-mono mt-1">
              {compliantCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#12241A] text-[#30D158] border border-[#30D158]/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#64D2FF]">CPM API Engine Health</div>
            <div className="text-xs font-bold text-[#30D158] font-mono mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse"></span>
              <span>REST API Online</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#121E2E] text-[#64D2FF] border border-white/5">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Accounts Directory Table */}
      <div className="bg-[#12151F] border border-[#232833] rounded-3xl p-6 space-y-4 shadow-xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#232833] pb-4 gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="font-bold text-white text-base">
              Privileged Account Directory ({accounts.length})
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#8E9BBA]">
            <button
              onClick={handleExportCSV}
              className="text-[#30D158] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Non-Compliant CSV ({nonCompliantCount})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#232833] text-[#8E9BBA] font-bold uppercase tracking-wider text-[10px] bg-[#161B28]">
                {/* Select All Checkbox Column */}
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allNonCompliantSelected}
                    onChange={handleToggleSelectAllNonCompliant}
                    title="Select All Non-Compliant Accounts"
                    className="w-4 h-4 rounded bg-[#1A1F2C] border-[#3A4254] text-[#0A84FF] focus:ring-[#0A84FF] cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Account Name & Target Address</th>
                <th className="p-3.5">Safe & Platform</th>
                <th className="p-3.5">Compliance Status</th>
                <th className="p-3.5">Reason / Finding</th>
                <th className="p-3.5">Last Verified</th>
                <th className="p-3.5 text-right">Actions & CPM Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232833]">
              {accounts.map((account) => {
                const isNonCompliant = account.status === 'non_compliant';
                const isSelected = selectedIds.includes(account.id);
                const isTimelineExpanded = expandedTimelineAccId === account.id;

                return (
                  <React.Fragment key={account.id}>
                    <tr
                      className={`transition-colors font-medium text-white ${
                        isSelected ? 'bg-[#0A84FF]/10' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectAccount(account.id)}
                          className="w-4 h-4 rounded bg-[#1A1F2C] border-[#3A4254] text-[#0A84FF] focus:ring-[#0A84FF] cursor-pointer"
                        />
                      </td>

                      {/* Account Name & Address */}
                      <td className="p-3.5">
                        <div className="font-bold text-sm text-[#0A84FF] font-mono flex items-center gap-1.5">
                          <span>{account.name}</span>
                          {account.errorCode && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/30">
                              {account.errorCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8E9BBA] font-mono flex items-center gap-2 mt-0.5">
                          <Globe className="w-3 h-3 text-[#6E7787]" />
                          <span>{account.address}</span>
                          <span className="text-[#6E7787]">
                            ({account.ip}:{account.port})
                          </span>
                        </div>
                      </td>

                      {/* Safe & Platform */}
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{account.safe}</div>
                        <div className="text-[11px] text-[#8E9BBA] mt-0.5">{account.platform}</div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        {isNonCompliant ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/30">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Non-Compliant</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#12241A] text-[#30D158] border border-[#30D158]/30">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Compliant</span>
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="p-3.5 max-w-xs">
                        <p
                          className={`text-xs leading-relaxed ${
                            isNonCompliant ? 'text-[#FF6961]' : 'text-[#8E9BBA]'
                          }`}
                        >
                          {account.reason}
                        </p>
                      </td>

                      {/* Last Verified */}
                      <td className="p-3.5 font-mono text-[#8E9BBA] text-[11px]">
                        {account.lastVerified}
                      </td>

                      {/* Actions & Dropdown */}
                      <td className="p-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          {/* Timeline Toggle Button */}
                          <button
                            onClick={() => handleToggleTimeline(account.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isTimelineExpanded
                                ? 'bg-[#0A84FF] text-white'
                                : 'bg-[#1E2332] text-[#8E9BBA] hover:text-white border border-[#232833]'
                            }`}
                            title="View Visual Status Timeline History"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History</span>
                          </button>

                          {/* Remediate Button */}
                          <button
                            onClick={() =>
                              handleExecuteAction(
                                account,
                                'remediate',
                                'Automated Remediation & Reconcile'
                              )
                            }
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
                              isNonCompliant
                                ? 'bg-[#FF9F0A] hover:bg-[#E08A00] text-black shadow-[#FF9F0A]/20'
                                : 'bg-[#1E2332] hover:bg-[#2A3145] text-white border border-[#232833]'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isNonCompliant ? 'Remediate' : 'Re-verify'}</span>
                          </button>

                          {/* Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenDropdownId(openDropdownId === account.id ? null : account.id)
                              }
                              className="p-1.5 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] border border-[#232833] text-white transition-all cursor-pointer"
                              title="CPM Action Menu"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  openDropdownId === account.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {openDropdownId === account.id && (
                              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#161B28] border border-[#232833] p-2 shadow-2xl z-50 space-y-1 text-left animate-in fade-in zoom-in-95">
                                <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#6E7787] tracking-wider border-b border-[#232833]">
                                  CPM REST API Operations
                                </div>

                                <button
                                  onClick={() =>
                                    handleExecuteAction(
                                      account,
                                      'reachability',
                                      'Ping & Port Reachability Check'
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-[#232833] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Globe className="w-3.5 h-3.5 text-[#0A84FF]" />
                                  <span>Check Reachability (Ping)</span>
                                </button>

                                <button
                                  onClick={() =>
                                    handleExecuteAction(account, 'change', 'CPM Password Change')
                                  }
                                  className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-[#232833] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-[#30D158]" />
                                  <span>Initiate CPM Change</span>
                                </button>

                                <button
                                  onClick={() =>
                                    handleExecuteAction(account, 'reconcile', 'CPM Password Reconcile')
                                  }
                                  className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-[#232833] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 text-[#FF9F0A]" />
                                  <span>Initiate CPM Reconcile</span>
                                </button>

                                <button
                                  onClick={() =>
                                    handleExecuteAction(account, 'verify', 'CPM Password Verification')
                                  }
                                  className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-[#232833] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#64D2FF]" />
                                  <span>Initiate CPM Verify</span>
                                </button>

                                <div className="border-t border-[#232833] pt-1 mt-1">
                                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#6E7787] tracking-wider">
                                    Runbook & Diagnostics
                                  </div>
                                  <button
                                    onClick={() => handleOpenRunbook(account)}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-[#FF9F0A] hover:bg-[#232833] flex items-center gap-2 font-semibold cursor-pointer"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>View Detailed Runbook</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Visual Status Timeline Row */}
                    {isTimelineExpanded && (
                      <tr className="bg-[#0B0E14] border-b border-[#232833]">
                        <td colSpan={7} className="p-5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-[#232833] pb-2">
                              <div className="flex items-center gap-2 text-white font-bold text-xs">
                                <History className="w-4 h-4 text-[#0A84FF]" />
                                <span>Remediation & Status History Timeline for {account.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#8E9BBA]">
                                Fetched via /api/compliance/history/{account.id}
                              </span>
                            </div>

                            {loadingTimelines[account.id] ? (
                              <div className="flex items-center gap-2 py-4 text-xs text-[#8E9BBA] font-mono animate-pulse">
                                <RefreshCw className="w-4 h-4 animate-spin text-[#0A84FF]" />
                                <span>Loading remediation history events...</span>
                              </div>
                            ) : (accountTimelines[account.id] || []).length === 0 ? (
                              <div className="text-xs text-[#8E9BBA] py-3 italic">
                                No prior remediation attempts recorded.
                              </div>
                            ) : (
                              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#232833]">
                                {(accountTimelines[account.id] || []).map((evt) => (
                                  <div key={evt.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div
                                      className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#0B0E14] ${
                                        evt.badgeColor === 'red'
                                          ? 'bg-[#FF453A]'
                                          : evt.badgeColor === 'amber'
                                          ? 'bg-[#FF9F0A]'
                                          : evt.badgeColor === 'blue'
                                          ? 'bg-[#0A84FF]'
                                          : 'bg-[#30D158]'
                                      }`}
                                    />

                                    <div className="p-3 rounded-2xl bg-[#12151F] border border-[#232833] space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="font-bold text-xs text-white flex items-center gap-2">
                                          <span>{evt.title}</span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                              evt.status === 'compliant'
                                                ? 'bg-[#12241A] text-[#30D158]'
                                                : evt.status === 'non_compliant' || evt.status === 'failed'
                                                ? 'bg-[#2A1414] text-[#FF453A]'
                                                : 'bg-[#1E2332] text-[#64D2FF]'
                                            }`}
                                          >
                                            {evt.status}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#8E9BBA]">
                                          {evt.timestamp}
                                        </span>
                                      </div>

                                      <p className="text-xs text-[#8E9BBA] leading-relaxed">
                                        {evt.description}
                                      </p>

                                      <div className="text-[10px] text-[#6E7787] font-mono pt-1">
                                        Actor: <span className="text-[#8E9BBA] font-semibold">{evt.actor}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating 'Remediate Selected' Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#12151F] border border-[#0A84FF]/40 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-white text-xs font-bold font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-[#0A84FF] text-white">
              {selectedIds.length} Selected
            </span>
            <span>Non-Compliant Accounts Ready for CPM Reconcile</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRemediateSelected}
              className="px-5 py-2.5 rounded-xl bg-[#FF9F0A] hover:bg-[#E08A00] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#FF9F0A]/20 cursor-pointer active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Remediate Selected ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2.5 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] text-[#8E9BBA] hover:text-white text-xs font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Email Report Modal with Multiple Recipients & Format Option */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#12151F] border border-[#232833] rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-[#232833] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Mail className="w-5 h-5 text-[#0A84FF]" />
                <span>Email Executive Compliance Report</span>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-[#6E7787] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8E9BBA] leading-relaxed">
              Dispatch the CyberArk PAM Privileged Accounts Audit report to multiple security leads or stakeholders.
            </p>

            <form onSubmit={handleSendEmailReport} className="space-y-4">
              {/* Recipients Input */}
              <div>
                <label className="block text-xs font-bold text-[#8E9BBA] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Recipient Email Addresses (Comma-Separated)</span>
                  <Users className="w-3.5 h-3.5 text-[#0A84FF]" />
                </label>
                <input
                  type="text"
                  required
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="e.g. 1393ndsd@gmail.com, secops-leads@corp.internal, auditor@corp.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B0E14] border border-[#232833] text-white text-xs focus:outline-none focus:border-[#0A84FF] font-mono"
                />
                <span className="text-[10px] text-[#6E7787] mt-1 block">
                  Separate multiple email IDs with commas or semicolons.
                </span>
              </div>

              {/* Custom Cover Message */}
              <div>
                <label className="block text-xs font-bold text-[#8E9BBA] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Executive Email Cover Note</span>
                  <MessageSquare className="w-3.5 h-3.5 text-[#30D158]" />
                </label>
                <textarea
                  rows={3}
                  value={emailCustomNote}
                  onChange={(e) => setEmailCustomNote(e.target.value)}
                  placeholder="Write custom message or note to include at the top of the email..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B0E14] border border-[#232833] text-white text-xs focus:outline-none focus:border-[#0A84FF] resize-none"
                />
              </div>

              {/* Attachment Format Selection */}
              <div>
                <label className="block text-xs font-bold text-[#8E9BBA] uppercase tracking-wider mb-2">
                  Report Format Selection
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setEmailReportFormat('pdf')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      emailReportFormat === 'pdf'
                        ? 'bg-[#0A84FF]/10 border-[#0A84FF] text-white font-bold'
                        : 'bg-[#0B0E14] border-[#232833] text-[#8E9BBA]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={emailReportFormat === 'pdf'}
                      onChange={() => setEmailReportFormat('pdf')}
                      className="hidden"
                    />
                    <Printer className="w-4 h-4 text-[#0A84FF]" />
                    <div className="text-xs">
                      <div>PDF Report</div>
                      <div className="text-[10px] text-[#6E7787]">Formatted Executive PDF</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setEmailReportFormat('docx')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      emailReportFormat === 'docx'
                        ? 'bg-[#0A84FF]/10 border-[#0A84FF] text-white font-bold'
                        : 'bg-[#0B0E14] border-[#232833] text-[#8E9BBA]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={emailReportFormat === 'docx'}
                      onChange={() => setEmailReportFormat('docx')}
                      className="hidden"
                    />
                    <FileType className="w-4 h-4 text-[#30D158]" />
                    <div className="text-xs">
                      <div>Word (.DOCX)</div>
                      <div className="text-[10px] text-[#6E7787]">Editable Word Document</div>
                    </div>
                  </label>
                </div>
              </div>

              {emailStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                    emailStatusMsg.startsWith('Error') || emailStatusMsg.startsWith('Failed')
                      ? 'bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/30'
                      : 'bg-[#12241A] text-[#30D158] border border-[#30D158]/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{emailStatusMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1E2332] text-[#8E9BBA] hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSendingEmail ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSendingEmail ? 'Sending Email...' : 'Send Report to Recipients'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Remediation Runbook Modal */}
      {activeRunbookAcc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0E131F] border border-[#232833] rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative text-left font-sans">
            <div className="flex items-center justify-between border-b border-[#232833] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Remediation Runbook: {activeRunbookAcc.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/30">
                      {activeRunbookAcc.errorCode || 'CACPM406E'}
                    </span>
                  </h3>
                  <p className="text-xs text-[#8E9BBA] mt-0.5">
                    Synthesized from Knowledge Base, Community Hub, and Log Analyzer Telemetry
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveRunbookAcc(null)}
                className="text-[#6E7787] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingRunbook ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0A84FF] animate-spin" />
                <span className="text-xs text-[#8E9BBA] font-mono">
                  Synthesizing diagnostic runbook from CyberArk Community Hub & Log Analyzer...
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Account Header Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#12151F] border border-[#232833] text-xs font-mono">
                  <div>
                    <div className="text-[#8E9BBA] text-[10px] uppercase font-sans font-bold">Target Address</div>
                    <div className="text-white font-bold mt-0.5">{activeRunbookAcc.address}</div>
                  </div>
                  <div>
                    <div className="text-[#8E9BBA] text-[10px] uppercase font-sans font-bold">IP & Port</div>
                    <div className="text-white mt-0.5">{activeRunbookAcc.ip}:{activeRunbookAcc.port}</div>
                  </div>
                  <div>
                    <div className="text-[#8E9BBA] text-[10px] uppercase font-sans font-bold">CPM Safe</div>
                    <div className="text-[#0A84FF] font-bold mt-0.5">{activeRunbookAcc.safe}</div>
                  </div>
                  <div>
                    <div className="text-[#8E9BBA] text-[10px] uppercase font-sans font-bold">Platform</div>
                    <div className="text-white mt-0.5">{activeRunbookAcc.platform}</div>
                  </div>
                </div>

                {/* Root Cause Analysis */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Root Cause Analysis</span>
                  </h4>
                  <div className="p-4 rounded-2xl bg-[#1A1610] border border-[#FF9F0A]/30 text-xs text-[#D1D5DB] space-y-2">
                    <p className="font-semibold text-white">
                      {runbookData?.summary || activeRunbookAcc.reason}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#8E9BBA]">
                      {runbookData?.rootCauses?.map((rc: string, i: number) => (
                        <li key={i}>{rc}</li>
                      )) || (
                        <>
                          <li>Network firewall socket timeout or ping blockage.</li>
                          <li>Out-of-band credential reset on target host.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Step-by-Step Remediation Playbook */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#30D158] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Step-by-Step Remediation Playbook</span>
                  </h4>

                  <div className="space-y-3">
                    {runbookData?.remediationSteps?.map((s: any) => (
                      <div key={s.step} className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#30D158]/20 text-[#30D158] font-bold text-xs flex items-center justify-center shrink-0">
                            {s.step}
                          </span>
                          <span className="font-bold text-white text-xs">{s.title}</span>
                        </div>
                        <p className="text-xs text-[#8E9BBA] leading-relaxed pl-7">{s.details}</p>
                        {s.cmd && (
                          <div className="ml-7 p-2.5 rounded-xl bg-[#07090E] border border-[#1E2332] font-mono text-[11px] text-[#30D158] flex items-center justify-between">
                            <span>{s.cmd}</span>
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] text-xs text-[#8E9BBA]">
                        Execute automated CPM Reconcile workflow via CyberArk REST API.
                      </div>
                    )}
                  </div>
                </div>

                {/* Related KB & Community Articles */}
                <div className="p-4 rounded-2xl bg-[#12151F] border border-[#232833] space-y-2">
                  <h5 className="text-xs font-bold text-[#64D2FF] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Knowledge Base & Community References</span>
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    {runbookData?.kbReferences?.map((ref: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[#0A84FF] hover:underline cursor-pointer">
                        <span>{ref.title}</span>
                        <ExternalLink className="w-3 h-3 text-[#6E7787]" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Download Action Bar */}
                <div className="space-y-3 pt-4 border-t border-[#232833]">
                  <div className="text-xs font-bold text-[#8E9BBA] uppercase tracking-wider">
                    Download Runbook Formats
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadRunbookDoc(activeRunbookAcc)}
                        className="px-3.5 py-2 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] text-white border border-[#232833] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Download as Word Document (.DOC)"
                      >
                        <FileType className="w-4 h-4 text-[#0A84FF]" />
                        <span>Word (.DOC)</span>
                      </button>

                      <button
                        onClick={() => handlePrintRunbookPdf(activeRunbookAcc)}
                        className="px-3.5 py-2 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] text-white border border-[#232833] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Download / Save as PDF"
                      >
                        <Printer className="w-4 h-4 text-[#30D158]" />
                        <span>Print / PDF</span>
                      </button>

                      <button
                        onClick={() => handleDownloadRunbookTxt(activeRunbookAcc)}
                        className="px-3.5 py-2 rounded-xl bg-[#1E2332] hover:bg-[#2A3145] text-white border border-[#232833] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Download as Plain Text (.TXT)"
                      >
                        <FileCode className="w-4 h-4 text-[#8E9BBA]" />
                        <span>Text (.TXT)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveRunbookAcc(null)}
                        className="px-4 py-2 rounded-xl bg-[#1E2332] text-[#8E9BBA] hover:text-white font-bold text-xs cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          const acc = activeRunbookAcc;
                          setActiveRunbookAcc(null);
                          handleExecuteAction(acc, 'remediate', 'Automated Remediation & Reconcile');
                        }}
                        className="px-5 py-2 rounded-xl bg-[#FF9F0A] hover:bg-[#E08A00] text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
                      >
                        <Zap className="w-4 h-4 fill-black" />
                        <span>Trigger Auto-Fix Reconcile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal Execution Log Modal */}
      {activeExecutingAcc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0B0E14] border border-[#232833] rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl relative font-mono">
            <div className="flex items-center justify-between border-b border-[#232833] pb-3 font-sans">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Terminal className="w-5 h-5 text-[#0A84FF]" />
                <span>CPM Automation Log: {activeActionName}</span>
              </div>
              <button
                onClick={() => {
                  if (!isExecuting) {
                    setActiveExecutingAcc(null);
                  }
                }}
                disabled={isExecuting}
                className="text-[#6E7787] hover:text-white disabled:opacity-30 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Terminal Output Box */}
            <div className="bg-[#07090E] border border-[#1E2332] rounded-2xl p-4 h-64 overflow-y-auto space-y-1.5 text-xs text-[#30D158]">
              {executionLogs.map((log, i) => (
                <div key={i} className="leading-relaxed font-mono whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              {isExecuting && (
                <div className="flex items-center gap-2 text-[#0A84FF] pt-2 animate-pulse font-sans font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing CPM operation over CyberArk REST API...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 font-sans">
              <div className="text-xs text-[#8E9BBA]">
                {executionFinished
                  ? '🟢 Operation completed successfully!'
                  : '⚡ Processing CyberArk PAM workflow...'}
              </div>
              <button
                onClick={() => setActiveExecutingAcc(null)}
                disabled={isExecuting}
                className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
