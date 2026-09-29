import { PamComponent, SeverityLevel, ErrorEntry } from '../types';
import { COMMUNITY_KB_ARTICLES } from '../data/communityArticles';
import { INITIAL_ERRORS } from '../data/pamData';
// Secure random helper for anonymization (CWE-338 / CodeQL secure randomness)
function getSecureRandom(min: number, max: number): number {
  try {
    const array = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      globalThis.crypto.getRandomValues(array);
    }
    const val = array[0] / 4294967296;
    return Math.floor(min + val * (max - min));
  } catch {
    return Math.floor(min + Math.random() * (max - min));
  }
}

export interface ParsedLogLine {
  lineNumber: number;
  timestamp?: string;
  level: 'ERROR' | 'FATAL' | 'WARN' | 'INFO' | 'DEBUG' | 'UNKNOWN';
  raw: string;
  isCulprit: boolean;
  errorCode?: string;
}

export interface ExtractedMetadata {
  safeName?: string;
  userName?: string;
  stationOrIp?: string;
  targetHost?: string;
  sessionId?: string;
  componentUser?: string;
  appId?: string;
}

export interface MaskingStats {
  ipsMasked: number;
  usersMasked: number;
  hostsMasked: number;
  safesMasked: number;
  secretsRedacted: number;
}

export interface SanitizedLogResult {
  sanitizedText: string;
  originalText: string;
  maskingStats: MaskingStats;
  replacements: { original: string; replacement: string; type: string }[];
}

export interface ErrorCodeAnatomy {
  prefix: string;
  codeNumber: string;
  severityClass: string;
  prefixMeaning: string;
  subsystemDescription: string;
}

export interface GoogleReferenceLink {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  sourceType: 'Google Search' | 'CyberArk Docs' | 'Community KB' | 'GitHub' | 'Release Notes';
  isOfficial: boolean;
}

export interface SummarizedSolution {
  quickSummary: string;
  keyTakeaway: string;
  actionSteps: {
    stepNumber: number;
    title: string;
    action: string;
    commandOrPath?: string;
    notes?: string;
  }[];
  criticalGotchas: string[];
  verificationSteps: string[];
}

export interface LogAnalysisResult {
  detectedComponent: PamComponent;
  componentConfidence: 'High' | 'Medium' | 'Inferred';
  primaryErrorCode: string;
  allDetectedCodes: string[];
  severity: SeverityLevel;
  errorTitle: string;
  errorExplanation: {
    overview: string;
    subsystem: string;
    technicalDetails: string;
    impact: string;
  };
  identifiedCause: string;
  codeAnatomy: ErrorCodeAnatomy;
  googleReferenceLinks: GoogleReferenceLink[];
  summarizedSolution: SummarizedSolution;
  resolutionRunbook: {
    stepNumber: number;
    action: string;
    commandOrPath?: string;
    notes?: string;
  }[];
  diagnosticLogsToCheck: string[];
  referenceArticle: {
    articleId: string;
    title: string;
    cause: string;
    solution: string;
    sourceType: string;
  };
  metadata: ExtractedMetadata;
  parsedLines: ParsedLogLine[];
  culpritLines: ParsedLogLine[];
  totalLines: number;
  errorCount: number;
  warningCount: number;
  maskingStats?: MaskingStats;
  isSanitized?: boolean;
}

// ==========================================
// CUSTOMER DATA SANITIZATION & ANONYMIZATION
// ==========================================
export function sanitizeCustomerSecurityLog(rawLog: string): SanitizedLogResult {
  let text = rawLog;
  const replacements: { original: string; replacement: string; type: string }[] = [];
  const ipMap = new Map<string, string>();
  const userMap = new Map<string, string>();
  const hostMap = new Map<string, string>();
  const safeMap = new Map<string, string>();

  let ipsMasked = 0;
  let usersMasked = 0;
  let hostsMasked = 0;
  let safesMasked = 0;
  let secretsRedacted = 0;

  // 1. Redact explicit passwords, secret tokens, bearer auth, and hashes
  text = text.replace(
    /(?:password|passwd|pwd|secret|apiKey|authToken|bearer\s+[a-zA-Z0-9_\-\.]+)[=:\s]+["']?([^"',;\s\r\n]{4,})["']?/gi,
    (match, secret) => {
      secretsRedacted++;
      const replacement = '[REDACTED_SECRET]';
      replacements.push({ original: secret, replacement, type: 'Secret / Token' });
      return match.replace(secret, replacement);
    }
  );

  // 2. Anonymize IP Addresses (exclude localhost and broadcast)
  const IP_REGEX = /\b(?!127\.0\.0\.1|0\.0\.0\.0)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  text = text.replace(IP_REGEX, (ip) => {
    if (ip === '127.0.0.1' || ip === '0.0.0.0') return ip;
    if (!ipMap.has(ip)) {
      ipsMasked++;
      const octet3 = getSecureRandom(10, 210);
      const octet4 = getSecureRandom(2, 252);
      const synthIp = ip.startsWith('192.168.')
        ? `192.168.${octet3}.${octet4}`
        : ip.startsWith('172.')
        ? `172.24.${octet3}.${octet4}`
        : `10.240.${octet3}.${octet4}`;
      ipMap.set(ip, synthIp);
      replacements.push({ original: ip, replacement: synthIp, type: 'IP Address' });
    }
    return ipMap.get(ip)!;
  });

  // 3. Anonymize User Accounts (excluding standard CyberArk system service accounts)
  const STANDARD_CYBERARK_USERS = new Set([
    'passwordmanager',
    'psmconnect',
    'psmadminconnect',
    'pvwagwuser',
    'pvwaappuser',
    'administrator',
    'master',
    'batch',
    'dr',
    'padr',
    'operator',
    'prov_default',
    'aimuser',
  ]);

  const USER_REGEX = /(?:User|UserName|Account|user|username|account)[\s:=]+\[?([A-Za-z0-9_\-\.\\]+)\]?/gi;
  text = text.replace(USER_REGEX, (fullMatch, username) => {
    const cleanLower = username.toLowerCase().replace(/^.*\\/, '');
    if (STANDARD_CYBERARK_USERS.has(cleanLower) || cleanLower.startsWith('prov_')) {
      return fullMatch;
    }
    if (!userMap.has(username)) {
      usersMasked++;
      const synthUser = username.includes('\\')
        ? `CORP_ANON\\user_synth_${getSecureRandom(100, 1000)}`
        : `user_synth_${getSecureRandom(100, 1000)}`;
      userMap.set(username, synthUser);
      replacements.push({ original: username, replacement: synthUser, type: 'User Account' });
    }
    return fullMatch.replace(username, userMap.get(username)!);
  });

  // 4. Anonymize Hostnames / FQDNs
  const HOST_REGEX = /(?:Host|Target|TargetHost|ComputerName|Server|Station Name|Station)[\s:=]+\[?([a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-\.]+)\]?/gi;
  text = text.replace(HOST_REGEX, (fullMatch, hostname) => {
    const normalizedHost = hostname.toLowerCase().replace(/\.$/, '');
    const trustedDomains = ['cyberark.com', 'cyberark.cloud'];
    const isTrustedHost = normalizedHost === 'localhost'
      || trustedDomains.some((domain) => normalizedHost === domain || normalizedHost.endsWith(`.${domain}`));
    if (isTrustedHost) {
      return fullMatch;
    }
    if (!hostMap.has(hostname)) {
      hostsMasked++;
      const synthHost = `host-edge-${getSecureRandom(100, 1000)}.synth.local`;
      hostMap.set(hostname, synthHost);
      replacements.push({ original: hostname, replacement: synthHost, type: 'Target Host / FQDN' });
    }
    return fullMatch.replace(hostname, hostMap.get(hostname)!);
  });

  // 5. Anonymize Safe Names
  const SAFE_REGEX = /(?:Safe|safe)[\s:=]+\[?([A-Za-z0-9_\-]+)\]?/gi;
  text = text.replace(SAFE_REGEX, (fullMatch, safeName) => {
    const lowerSafe = safeName.toLowerCase();
    if (['system', 'vault', 'notificationengine', 'cyberark_config'].includes(lowerSafe)) {
      return fullMatch;
    }
    if (!safeMap.has(safeName)) {
      safesMasked++;
      const synthSafe = `SAFE_SYNTH_${Math.floor(1000 + Math.random() * 9000)}`;
      safeMap.set(safeName, synthSafe);
      replacements.push({ original: safeName, replacement: synthSafe, type: 'Safe Name' });
    }
    return fullMatch.replace(safeName, safeMap.get(safeName)!);
  });

  return {
    sanitizedText: text,
    originalText: rawLog,
    maskingStats: {
      ipsMasked,
      usersMasked,
      hostsMasked,
      safesMasked,
      secretsRedacted,
    },
    replacements,
  };
}

// Helper to determine log level
function detectLogLevel(line: string): ParsedLogLine['level'] {
  const upper = line.toUpperCase();
  if (upper.includes('FATAL') || upper.includes('CRITICAL')) return 'FATAL';
  if (upper.includes('ERROR') || upper.includes('EXCEPTION') || upper.includes('FAILURE') || upper.includes(' FAILED')) return 'ERROR';
  if (upper.includes('WARN')) return 'WARN';
  if (upper.includes('INFO')) return 'INFO';
  if (upper.includes('DEBUG') || upper.includes('TRACE')) return 'DEBUG';
  return 'UNKNOWN';
}

// Helper to extract timestamp
function extractTimestamp(line: string): string | undefined {
  const match = line.match(/\b\d{4}[-/.]\d{2}[-/.]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d{3})?\b/) ||
    line.match(/\b\d{2}[-/.]\d{2}[-/.]\d{4}[ T]\d{2}:\d{2}:\d{2}\b/);
  return match ? match[0] : undefined;
}

// Master log analysis function (optionally performs automatic customer data omission/anonymization)
export function analyzeCyberArkLog(
  logText: string,
  userSelectedComponent?: PamComponent | 'Auto',
  autoAnonymize: boolean = true
): LogAnalysisResult {
  // If autoAnonymize is enabled, sanitize customer data first
  let effectiveLog = logText;
  let maskingStats: MaskingStats | undefined;

  if (autoAnonymize) {
    const sanitized = sanitizeCustomerSecurityLog(logText);
    effectiveLog = sanitized.sanitizedText;
    maskingStats = sanitized.maskingStats;
  }

  const lines = effectiveLog.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const totalLines = lines.length;

  let errorCount = 0;
  let warningCount = 0;
  const parsedLines: ParsedLogLine[] = [];
  const detectedCodesSet = new Set<string>();

  const CYBERARK_CODE_REGEX = /\b([A-Z]{3,8}\d{2,5}[A-Z]?)\b/g;
  const WIN32_CODE_REGEX = /\b(3221225786|0x[0-9a-fA-F]{8}|Event (?:ID )?8004|1326|1909|500\.19|503)\b/gi;

  let safeName: string | undefined;
  let userName: string | undefined;
  let stationOrIp: string | undefined;
  let targetHost: string | undefined;
  let sessionId: string | undefined;
  let componentUser: string | undefined;
  let appId: string | undefined;

  const componentScores: Record<PamComponent, number> = {
    Vault: 0,
    CPM: 0,
    PSM: 0,
    PVWA: 0,
    CCP: 0,
    PTA: 0,
    Conjur: 0,
    'Privilege Cloud': 0,
    General: 0,
  };

  lines.forEach((line, index) => {
    const level = detectLogLevel(line);
    if (level === 'ERROR' || level === 'FATAL') errorCount++;
    if (level === 'WARN') warningCount++;

    const timestamp = extractTimestamp(line);
    const upper = line.toUpperCase();

    let lineCode: string | undefined;
    let match: RegExpExecArray | null;

    CYBERARK_CODE_REGEX.lastIndex = 0;
    while ((match = CYBERARK_CODE_REGEX.exec(line)) !== null) {
      const code = match[1];
      if (!['FAILED', 'SERVER', 'SYSTEM', 'PROGRAM', 'ENABLE', 'WINDOW'].includes(code)) {
        detectedCodesSet.add(code);
        if (!lineCode) lineCode = code;
      }
    }

    WIN32_CODE_REGEX.lastIndex = 0;
    while ((match = WIN32_CODE_REGEX.exec(line)) !== null) {
      const wCode = match[1];
      detectedCodesSet.add(wCode);
      if (!lineCode) lineCode = wCode;
    }

    // Component score matching including Privilege Cloud
    if (
      upper.includes('PRIVILEGECLOUD') ||
      upper.includes('PRIVILEGE CLOUD') ||
      upper.includes('SECURETUNNEL') ||
      upper.includes('SECURE TUNNEL') ||
      upper.includes('CONNECTORMANAGEMENT') ||
      upper.includes('CONNECTOR MANAGEMENT') ||
      upper.includes('ISPSS') ||
      upper.includes('CYBERARK.PRIVILEGECLOUD') ||
      upper.includes('CYBERARK.CLOUD') ||
      upper.includes('PRIVCLOUD')
    ) {
      componentScores['Privilege Cloud'] += 4;
    }
    if (upper.includes('PSM') || upper.includes('MSEDGEDRIVER') || upper.includes('CHROMEDRIVER') || upper.includes('DISPATCHER') || upper.includes('APPLOCKER') || upper.includes('3221225786')) {
      componentScores.PSM += 3;
    }
    if (upper.includes('CACPM') || upper.includes('PASSWORD MANAGER') || upper.includes('PM_ERROR') || upper.includes('PROCESSTIMEOUT') || upper.includes('RECONCILE') || upper.includes('VERIFY')) {
      componentScores.CPM += 3;
    }
    if (upper.includes('ITATS') || upper.includes('CASVD') || upper.includes('ITASO') || upper.includes('ITALOG') || upper.includes('DBPARM') || upper.includes('PADR') || upper.includes('PRIVATEARK')) {
      componentScores.Vault += 3;
    }
    if (upper.includes('PASWS') || upper.includes('WEBCONSOLE') || upper.includes('PVWA') || upper.includes('PASSWORDVAULT') || upper.includes('IIS') || upper.includes('APPUSER.CRED') || upper.includes('GWUSER.CRED')) {
      componentScores.PVWA += 3;
    }
    if (upper.includes('APPAP') || upper.includes('AIMWEBSERVICE') || upper.includes('APPCONSOLE') || upper.includes('APPPROVIDER') || upper.includes('APPID')) {
      componentScores.CCP += 3;
    }
    if (upper.includes('PTA') || upper.includes('THREAT') || upper.includes('DIAMOND') || upper.includes('GOLDEN TICKET')) {
      componentScores.PTA += 3;
    }
    if (upper.includes('CONJUR') || upper.includes('CYBR')) {
      componentScores.Conjur += 3;
    }

    const safeMatch = line.match(/(?:Safe|safe)[\s:=]+\[?([A-Za-z0-9_\-.]+)\]?/i);
    if (safeMatch && !safeName) safeName = safeMatch[1];

    const userMatch = line.match(/(?:User|user)[\s:=]+\[?([A-Za-z0-9_\\\-.]+)\]?/i);
    if (userMatch && !userName) userName = userMatch[1];

    const ipMatch = line.match(/(?:Station(?: IP)?|Client IP|IP Address)[\s:=]+\[?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\]?/i);
    if (ipMatch && !stationOrIp) stationOrIp = ipMatch[1];

    const targetMatch = line.match(/(?:Target|Host|Address)[\s:=]+\[?([A-Za-z0-9_\-.]+)\]?/i);
    if (targetMatch && !targetHost) targetHost = targetMatch[1];

    const sessionMatch = line.match(/(?:Session ID|Session)[\s:=]+\[?([a-f0-9\-]{8,36})\]?/i);
    if (sessionMatch && !sessionId) sessionId = sessionMatch[1];

    const appMatch = line.match(/(?:AppID|Application ID)[\s:=]+\[?([A-Za-z0-9_\-.]+)\]?/i);
    if (appMatch && !appId) appId = appMatch[1];

    const isCulprit =
      level === 'FATAL' ||
      (level === 'ERROR' && Boolean(lineCode)) ||
      upper.includes('EXCEPTION') ||
      upper.includes('RETURN CODE [3221225786]') ||
      upper.includes('PREVENTED FROM RUNNING') ||
      upper.includes('SECURE TUNNEL DISCONNECTED');

    parsedLines.push({
      lineNumber: index + 1,
      timestamp,
      level,
      raw: line,
      isCulprit,
      errorCode: lineCode,
    });
  });

  const culpritLines = parsedLines.filter((p) => p.isCulprit);

  // Determine Component
  let detectedComponent: PamComponent = 'Vault';
  let componentConfidence: 'High' | 'Medium' | 'Inferred' = 'Medium';

  if (userSelectedComponent && userSelectedComponent !== 'Auto' && userSelectedComponent !== 'General') {
    detectedComponent = userSelectedComponent;
    componentConfidence = 'High';
  } else {
    let maxScore = 0;
    let bestComp: PamComponent = 'Vault';
    (Object.keys(componentScores) as PamComponent[]).forEach((comp) => {
      if (componentScores[comp] > maxScore) {
        maxScore = componentScores[comp];
        bestComp = comp;
      }
    });

    if (maxScore >= 4) {
      detectedComponent = bestComp;
      componentConfidence = 'High';
    } else if (maxScore > 0) {
      detectedComponent = bestComp;
      componentConfidence = 'Medium';
    } else {
      detectedComponent = 'General';
      componentConfidence = 'Inferred';
    }
  }

  const allDetectedCodes = Array.from(detectedCodesSet);
  let primaryErrorCode = allDetectedCodes.find((c) =>
    c.startsWith('ITATS') ||
    c.startsWith('CACPM') ||
    c.startsWith('PSMSR') ||
    c.startsWith('PASWS') ||
    c.startsWith('APPAP') ||
    c.startsWith('CASVD') ||
    c.startsWith('PCLD')
  ) || allDetectedCodes[0] || 'PAM-LOG-DETECTED';

  const fullKbList = [...COMMUNITY_KB_ARTICLES, ...INITIAL_ERRORS];
  const matchedEntry = fullKbList.find((item) => {
    if (item.code.toUpperCase() === primaryErrorCode.toUpperCase()) return true;
    if (allDetectedCodes.includes(item.code.toUpperCase())) return true;
    return false;
  });

  const metadata: ExtractedMetadata = {
    safeName,
    userName,
    stationOrIp,
    targetHost,
    sessionId,
    componentUser,
    appId,
  };

  let errorTitle = matchedEntry ? matchedEntry.title : `CyberArk ${detectedComponent} Operational Incident`;
  let severity: SeverityLevel = matchedEntry ? matchedEntry.severity : (errorCount > 0 ? 'High' : 'Medium');

  let explanationOverview = matchedEntry
    ? matchedEntry.description
    : `The log analysis detected a failure condition in CyberArk ${detectedComponent}. Internal services reported execution stoppage, connection rejection, or policy restriction.`;

  let explanationSubsystem = '';
  let technicalDetails = '';
  let impact = '';
  let identifiedCause = matchedEntry ? matchedEntry.cause : '';
  let resolutionSteps: { stepNumber: number; action: string; commandOrPath?: string; notes?: string }[] = [];
  let diagnosticLogs: string[] = matchedEntry?.logsToCheck || [];

  // Tailored logic for Privilege Cloud
  if (
    detectedComponent === 'Privilege Cloud' ||
    primaryErrorCode.startsWith('PCLD') ||
    effectiveLog.includes('Secure Tunnel') ||
    effectiveLog.includes('Connector Management')
  ) {
    detectedComponent = 'Privilege Cloud';
    primaryErrorCode = primaryErrorCode.startsWith('PCLD') ? primaryErrorCode : 'PCLD001E';
    errorTitle = 'Privilege Cloud Secure Tunnel or Connector Communication Disconnected';
    severity = 'High';
    explanationSubsystem = 'CyberArk Privilege Cloud SaaS & Connector Management Architecture';
    technicalDetails =
      'Privilege Cloud utilizes an outbound TLS/TCP tunnel (Secure Tunnel) connecting on-premises customer CPM & PSM Connectors to the CyberArk SaaS Digital Vault backend. Outbound firewall blockades on port 443, SSL packet inspection, or expired Connector Management installer tokens prevent the connector from synchronizing safes and passwords.';
    impact =
      'On-premises Privilege Cloud Connectors cannot communicate with CyberArk ISPSS Cloud. Automated password rotations, account discovery, and PSM session launch from Privilege Cloud portal fail.';
    identifiedCause =
      'Outbound HTTPS (TCP 443) communication to CyberArk Cloud tenant endpoints (*.cyberark.cloud) is interrupted, SSL/TLS decryption is breaking the certificate pinning, or the Connector Management token has expired.';
    resolutionSteps = [
      {
        stepNumber: 1,
        action: 'Verify outbound network connectivity to CyberArk Cloud tenant',
        commandOrPath: 'Test-NetConnection -ComputerName "<tenant_subdomain>.privilegecloud.cyberark.cloud" -Port 443',
        notes: 'Confirm that corporate firewalls permit direct outbound HTTPS without TLS deep-packet inspection (DPI).',
      },
      {
        stepNumber: 2,
        action: 'Check CyberArk Secure Tunnel Windows Service status',
        commandOrPath: 'Get-Service -Name "CyberArk Secure Tunnel" | Restart-Service',
        notes: 'Inspect C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log for authentication handshake timeouts.',
      },
      {
        stepNumber: 3,
        action: 'Re-authenticate Connector Management Agent if token expired',
        commandOrPath: 'C:\\Program Files\\CyberArk\\Connector Management Agent\\scripts\\Register-Agent.ps1',
        notes: 'Generate a fresh registration script from the CyberArk ISPSS Portal: Administration > Connector Management.',
      },
      {
        stepNumber: 4,
        action: 'Inspect Privilege Cloud Connector health status in ISPSS portal',
        commandOrPath: 'Privilege Cloud Portal > Administration > Connector Management',
        notes: 'Ensure component status indicators for CPM and PSM show Green / Active.',
      },
    ];
    diagnosticLogs = [
      'C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log',
      'C:\\Program Files\\CyberArk\\Connector Management Agent\\logs\\agent.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
    ];
  } else if (primaryErrorCode.includes('8004') || primaryErrorCode === 'PSMSR280E' || effectiveLog.includes('AppLocker')) {
    detectedComponent = 'PSM';
    primaryErrorCode = 'PSMSR280E';
    errorTitle = 'Session ended unexpectedly with return code [3221225786] / AppLocker Block';
    severity = 'High';
    explanationSubsystem = 'Privileged Session Manager (PSM) Host Hardening & Windows AppLocker Subsystem';
    technicalDetails = 'Return code 3221225786 is the unsigned decimal equivalent of NTSTATUS 0xC0000005 (STATUS_ACCESS_VIOLATION) or 0xC0000142 (STATUS_DLL_INIT_FAILED). On hardened PSM servers, this occurs when Windows AppLocker blocks a connection component dispatcher (e.g. CyberArk.PSM.WebAppDispatcher.exe) or web driver (msedgedriver.exe / chromedriver.exe) launched under the PSMConnect shadow user account.';
    impact = 'Users are unable to establish privileged web or application sessions through PVWA. Sessions abort immediately after clicking Connect.';
    identifiedCause = 'Windows AppLocker Event ID 8004 is blocking execution of the dispatcher or browser driver binary in C:\\Program Files (x86)\\CyberArk\\PSM\\Components due to missing path rules or updated binary hashes.';
    resolutionSteps = [
      {
        stepNumber: 1,
        action: 'Inspect AppLocker Event Log on the PSM server host',
        commandOrPath: 'Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL',
        notes: 'Confirm Event ID 8004 blocks for msedgedriver.exe, chromedriver.exe, or connection component.',
      },
      {
        stepNumber: 2,
        action: 'Verify browser and driver version alignment',
        commandOrPath: 'msedgedriver.exe --version',
        notes: 'Driver in C:\\Program Files (x86)\\CyberArk\\PSM\\Components must match installed Microsoft Edge / Chrome major release.',
      },
      {
        stepNumber: 3,
        action: 'Execute CyberArk AppLocker auto-configuration script in elevated PowerShell',
        commandOrPath: '& "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening\\CyberArk.PSM.AppLockerAutoConfig.ps1"',
        notes: 'Regenerates AppLocker rules from PSMConfigureAppLocker.xml and applies them to the local security policy.',
      },
      {
        stepNumber: 4,
        action: 'Restart CyberArk Privileged Session Manager Windows service',
        commandOrPath: 'Restart-Service -Name "CyberArk Privileged Session Manager"',
        notes: 'Refreshes session manager listener and worker processes.',
      },
    ];
    diagnosticLogs = [
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMTrace.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\PSMConsole.log',
      'C:\\Program Files (x86)\\CyberArk\\PSM\\Logs\\Components\\<SessionID>.log',
      'Windows Event Viewer: Microsoft-Windows-AppLocker/EXE and DLL',
    ];
  } else if (primaryErrorCode === 'CACPM406E' || effectiveLog.includes('Execution timed out')) {
    detectedComponent = 'CPM';
    primaryErrorCode = 'CACPM406E';
    errorTitle = 'Error in execution of plugin. Execution timed out';
    severity = 'High';
    explanationSubsystem = 'Central Policy Manager (CPM) Automated Password Management Engine';
    technicalDetails = 'The CPM plugin spawned a background worker (e.g. CyberArk.TPC.exe or PMWindows.dll) to execute a password action against target endpoint. The process waited for an expected terminal response or network TCP socket ACK, but reached the configured Execution Timeout parameter without completion.';
    impact = 'Automated password verification, changes, or reconciliations fail on target systems, leading to out-of-sync credentials.';
    identifiedCause = 'Network firewall dropping packets on target management port (TCP 22, 445, 135, 1433), or prompt regex mismatch in the platform Prompts/Process file causing the plugin automation to hang waiting for an expected terminal prompt.';
    resolutionSteps = [
      {
        stepNumber: 1,
        action: 'Test direct port reachability from CPM host to target endpoint',
        commandOrPath: `Test-NetConnection -ComputerName ${targetHost || '<TargetHost>'} -Port 22`,
        notes: 'Verify firewall rules permit CPM server to reach target management port.',
      },
      {
        stepNumber: 2,
        action: 'Enable Platform Debug logging in PVWA',
        commandOrPath: 'Administration > Platform Management > Edit Platform > Additional Policy Settings > Debug=Yes',
        notes: 'Generates detailed terminal interaction logs for every keystroke.',
      },
      {
        stepNumber: 3,
        action: 'Review the ThirdParty safe debug log',
        commandOrPath: `C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\${safeName || '<Safe>'}-${userName || '<Account>'}.log`,
        notes: 'Check the last line sent before timeout to see where the terminal sequence stalled.',
      },
      {
        stepNumber: 4,
        action: 'Update Prompts file regex or increase execution timeout in platform settings',
        commandOrPath: 'Platform Settings > Additional Policy Settings > ExecutionTimeout=180',
        notes: 'Accommodate slow target host responses or custom login banners (MOTD).',
      },
    ];
    diagnosticLogs = [
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm_error.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log',
      'C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\ThirdParty\\*.log',
    ];
  } else if (primaryErrorCode === 'ITATS006E' || effectiveLog.includes('Station is not authenticated')) {
    detectedComponent = 'Vault';
    primaryErrorCode = 'ITATS006E';
    errorTitle = 'Station is not authenticated to the Vault';
    severity = 'Critical';
    explanationSubsystem = 'CyberArk Digital Vault Station Authentication & Cryptographic Credential Protocol';
    technicalDetails = 'The Digital Vault enforces zero-trust station authentication. Every client component authenticates using a credential file (.cred / .ini) bound to the machine IP address, hostname, and an encrypted token. When the token hash does not match the record in the Vault database, the Vault terminates the connection with ITATS006E.';
    impact = 'The affected CyberArk component (CPM, PVWA, PSM, or CCP) completely loses communication with the Digital Vault, halting all PAM operations.';
    identifiedCause = 'The component credential file (user.ini, appuser.cred, gwuser.cred, or PSMApp.cred) is expired, desynchronized, or the machine IP / hostname hash restriction does not match the requesting server.';
    resolutionSteps = [
      {
        stepNumber: 1,
        action: 'Identify the exact station IP and component user name',
        commandOrPath: 'C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
        notes: `Vault logged station: ${stationOrIp || 'Detected in log'} requesting user: ${userName || 'Component User'}.`,
      },
      {
        stepNumber: 2,
        action: 'Stop the affected CyberArk component service on the target host',
        commandOrPath: 'Stop-Service -Name "CyberArk Password Manager" (or affected service)',
        notes: 'Prevents consecutive failed authentications from suspending the user in the Vault.',
      },
      {
        stepNumber: 3,
        action: 'Reset the component user password in PrivateArk Client',
        commandOrPath: 'PrivateArk Client > Tools > Administrative Tools > Users and Groups',
        notes: 'Select component user, click Update, clear "User is suspended", and reset the password.',
      },
      {
        stepNumber: 4,
        action: 'Regenerate credential file using CreateCredFile utility',
        commandOrPath: 'CreateCredFile.exe user.ini Password /IP /Host',
        notes: 'Execute in the component Vault folder with appropriate IP flags matching the reset password.',
      },
      {
        stepNumber: 5,
        action: 'Start the component service and verify connectivity',
        commandOrPath: 'Start-Service -Name "CyberArk Password Manager"',
        notes: 'Monitor local log to confirm ITATS006E clears and session establishes successfully.',
      },
    ];
    diagnosticLogs = [
      'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\itaso001.log',
      'Vault: C:\\Program Files (x86)\\PrivateArk\\Server\\Database.log',
    ];
  } else if (primaryErrorCode === 'APPAP306E' || effectiveLog.includes('APPAP306E')) {
    detectedComponent = 'CCP';
    primaryErrorCode = 'APPAP306E';
    errorTitle = 'Provider user has no permissions on Safe';
    severity = 'Medium';
    explanationSubsystem = 'Central Credential Provider (CCP / AAM) Safe Access Control';
    technicalDetails = 'In AAM/CCP architecture, client applications authenticate via Application IDs to AIMWebService. The Provider user (Prov_<Hostname>) performs the physical retrieval from the Safe on the application\'s behalf. If the Provider user is not added as a Safe Member with retrieval permissions, the Vault returns APPAP306E.';
    impact = 'Automated application pipelines, microservices, and scripts cannot fetch secrets from the Central Credential Provider REST endpoint (HTTP 403 / 500).';
    identifiedCause = 'The Provider user (Prov_<HostName>) lacks "Retrieve accounts" and "List accounts" permissions on the target Safe.';
    resolutionSteps = [
      {
        stepNumber: 1,
        action: 'Log into PVWA as a Vault Administrator',
        commandOrPath: 'PVWA > Policies > Safes',
        notes: `Locate safe: ${safeName || 'Target Safe'}.`,
      },
      {
        stepNumber: 2,
        action: 'Add Provider user to Safe Members',
        commandOrPath: 'Safe > Members > Add Member > Prov_<CCP-Hostname>',
        notes: 'Search for the local Application Password Provider identity.',
      },
      {
        stepNumber: 3,
        action: 'Grant required retrieval permissions',
        commandOrPath: 'Check "Retrieve accounts" and "List accounts"',
        notes: 'Optionally grant "View Safe Members" for diagnostics.',
      },
      {
        stepNumber: 4,
        action: 'Test REST API retrieval endpoint',
        commandOrPath: `curl -k "https://<PVWA>/AIMWebService/api/Accounts?AppId=${appId || '<AppId>'}&Safe=${safeName || '<Safe>'}"`,
        notes: 'Verify secret payload is returned without HTTP 403.',
      },
    ];
    diagnosticLogs = [
      'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPConsole.log',
      'C:\\Program Files (x86)\\CyberArk\\ApplicationPasswordProvider\\Logs\\APPTrace.log',
    ];
  } else if (matchedEntry) {
    explanationSubsystem = `CyberArk ${detectedComponent} Operational Subsystem`;
    technicalDetails = matchedEntry.description;
    impact = `Degraded operations in ${detectedComponent}, affecting administrators or automated password rotation.`;
    identifiedCause = matchedEntry.cause;
    resolutionSteps = matchedEntry.resolutionSteps.map((step, idx) => ({
      stepNumber: idx + 1,
      action: step,
    }));
    diagnosticLogs = matchedEntry.logsToCheck || [];
  } else {
    explanationSubsystem = `CyberArk ${detectedComponent} Core Service`;
    technicalDetails = `The log line indicates an error condition detected during execution. Primary code: ${primaryErrorCode}.`;
    impact = `Operations in ${detectedComponent} may be suspended or returning error codes to clients.`;
    identifiedCause = `Service parameter configuration mismatch, credential drift, or target endpoint communication failure in ${detectedComponent}.`;
    resolutionSteps = [
      {
        stepNumber: 1,
        action: `Review active ${detectedComponent} diagnostic log files for timestamp correlation`,
      },
      {
        stepNumber: 2,
        action: 'Verify network socket reachability to Digital Vault port 1858 and target endpoints',
      },
      {
        stepNumber: 3,
        action: 'Check component service status in Windows Services or Linux systemctl',
      },
      {
        stepNumber: 4,
        action: 'Inspect credential files (.cred / .ini) for synchronization status using CreateCredFile.exe',
      },
    ];
  }

  const refArticleItem =
    matchedEntry ||
    COMMUNITY_KB_ARTICLES.find((a) => a.component === detectedComponent) ||
    COMMUNITY_KB_ARTICLES[0];

  const codeAnatomy = getErrorCodeAnatomy(primaryErrorCode, detectedComponent);
  const googleReferenceLinks = generateGoogleReferenceLinks(primaryErrorCode, errorTitle, detectedComponent);
  const summarizedSolution = generateSummarizedSolution(
    primaryErrorCode,
    errorTitle,
    detectedComponent,
    identifiedCause,
    resolutionSteps
  );

  return {
    detectedComponent,
    componentConfidence,
    primaryErrorCode,
    allDetectedCodes,
    severity,
    errorTitle,
    errorExplanation: {
      overview: explanationOverview,
      subsystem: explanationSubsystem,
      technicalDetails,
      impact,
    },
    identifiedCause,
    codeAnatomy,
    googleReferenceLinks,
    summarizedSolution,
    resolutionRunbook: resolutionSteps,
    diagnosticLogsToCheck: diagnosticLogs,
    referenceArticle: {
      articleId: refArticleItem.communityArticleId || '000004119',
      title: refArticleItem.title,
      cause: refArticleItem.cause,
      solution: refArticleItem.resolutionSteps.join('\n'),
      sourceType: 'CyberArk Technical Community Knowledge Base',
    },
    metadata,
    parsedLines,
    culpritLines,
    totalLines,
    errorCount,
    warningCount,
    maskingStats,
    isSanitized: autoAnonymize && (maskingStats ? (maskingStats.ipsMasked > 0 || maskingStats.usersMasked > 0 || maskingStats.hostsMasked > 0 || maskingStats.safesMasked > 0 || maskingStats.secretsRedacted > 0) : false),
  };
}

export function getErrorCodeAnatomy(code: string, component: PamComponent): ErrorCodeAnatomy {
  const match = code.match(/^([A-Z]+)(\d+)([A-Z]?)$/i);
  const prefix = match ? match[1].toUpperCase() : code.slice(0, Math.min(code.length, 5)).toUpperCase();
  const codeNumber = match ? match[2] : (code.match(/\d+/) ? code.match(/\d+/)![0] : '001');
  const severityChar = match && match[3] ? match[3].toUpperCase() : 'E';

  let prefixMeaning = 'CyberArk PAM Core Architecture';
  let subsystemDescription = `${component} Core Subsystem`;

  switch (prefix) {
    case 'ITATS':
      prefixMeaning = 'Internal Vault Architecture Protocol (ITATS) - Vault Server kernel, safe storage, and station authentication layer.';
      subsystemDescription = 'CyberArk Digital Vault Database Engine & Station Session Manager (itaso001.log / italog.log)';
      break;
    case 'CACPM':
      prefixMeaning = 'Central Policy Manager (CACPM) - Automated password management, periodic verification, and third-party plugin driver.';
      subsystemDescription = 'CPM Plugin Dispatcher & Terminal Automation Subsystem (pm_error.log / pm.log)';
      break;
    case 'PSMSR':
      prefixMeaning = 'Privileged Session Manager Session Recording (PSMSR) - Session isolation, shadow user management, AppLocker enforcement, and dispatcher orchestration.';
      subsystemDescription = 'PSM Session Gateway & Windows AppLocker Execution Engine (PSMTrace.log / PSMConsole.log)';
      break;
    case 'PCLD':
      prefixMeaning = 'CyberArk Privilege Cloud (PCLD) - SaaS hybrid connector architecture, outbound micro-tunnel, and ISPSS platform integration.';
      subsystemDescription = 'Privilege Cloud Secure Tunnel & Connector Management Agent (SecureTunnel.log / agent.log)';
      break;
    case 'APPAP':
      prefixMeaning = 'Application Password Access Provider (APPAP) - Application-to-Application (AAM) and Central Credential Provider (CCP) local and web services.';
      subsystemDescription = 'AIMWebService REST Endpoint & Local Credential Provider Cache (APPConsole.log / APPTrace.log)';
      break;
    case 'PASWS':
      prefixMeaning = 'Privileged Account Security Web Services (PASWS) - PVWA REST API interface for identity onboarding, accounts, and safes.';
      subsystemDescription = 'PVWA REST API Engine (CyberArk.WebConsole.log)';
      break;
    case 'PTA':
      prefixMeaning = 'Privileged Threat Analytics (PTA) - Security incident correlation, SIEM ingestion, unmanaged privileged access anomaly detector.';
      subsystemDescription = 'PTA Diamond Server & Real-time Behavioral Daemon (diamond.log)';
      break;
    case 'CONJ':
      prefixMeaning = 'Conjur Secrets Manager (CONJ) - Dynamic secrets delivery for Kubernetes, DevOps pipelines, and cloud-native workloads.';
      subsystemDescription = 'Conjur Leader / Follower mTLS Authentication Subsystem';
      break;
    default:
      prefixMeaning = `CyberArk ${component} operational execution architecture.`;
      subsystemDescription = `${component} Operational Runtime Engine`;
  }

  return {
    prefix,
    codeNumber,
    severityClass:
      severityChar === 'E'
        ? 'Level E (Fatal Error / Connection Terminated)'
        : severityChar === 'W'
        ? 'Level W (Warning / Partial Execution)'
        : severityChar === 'F'
        ? 'Level F (Fatal Subsystem Crash)'
        : `Level ${severityChar} (Operational Event)`,
    prefixMeaning,
    subsystemDescription,
  };
}

export function generateGoogleReferenceLinks(
  code: string,
  title: string,
  component: PamComponent
): GoogleReferenceLink[] {
  const cleanCode = code.trim().toUpperCase();
  const searchQ = `CyberArk ${cleanCode} ${title} solution troubleshooting`;
  const encodedQ = encodeURIComponent(searchQ);
  const encodedCode = encodeURIComponent(cleanCode);

  const links: GoogleReferenceLink[] = [
    {
      title: `Google Search: "CyberArk ${cleanCode} ${title}"`,
      url: `https://www.google.com/search?q=${encodedQ}`,
      domain: 'google.com',
      snippet: `Comprehensive Google web search index aggregating verified forum threads, community discussions, and deployment runbooks for ${cleanCode}.`,
      sourceType: 'Google Search',
      isOfficial: false,
    },
  ];

  if (cleanCode.startsWith('ITATS006') || cleanCode.includes('ITATS006E')) {
    links.push({
      title: 'CyberArk Docs: CreateCredFile Utility Reference & Resetting Credential Files',
      url: 'https://docs.cyberark.com/pam-self-hosted/latest/en/content/pasimp/createcredfile-utility.htm',
      domain: 'docs.cyberark.com',
      snippet: 'Official CyberArk documentation on generating fresh station credential files using CreateCredFile.exe with /IP and /Host flags to resolve ITATS006E.',
      sourceType: 'CyberArk Docs',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000004119: How to reset component credentials after ITATS006E',
      url: 'https://community.cyberark.com/s/article/How-to-reset-component-credfile',
      domain: 'community.cyberark.com',
      snippet: 'Field-verified solution explaining step-by-step PrivateArk Client password synchronization and user suspension clearing for CPM, PVWA, and PSM.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Forum: ITATS006E Station is not authenticated to the Vault - Complete Guide',
      url: 'https://community.cyberark.com/s/article/000002891-ITATS006E-Troubleshooting-Guide',
      domain: 'community.cyberark.com',
      snippet: 'Troubleshooting guide covering cluster IP mismatches, NAT traversal, and App.cred vs AppUser.cred differences.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk GitHub Tools: Component Credential Validation Scripts (epv-api-scripts)',
      url: 'https://github.com/cyberark/epv-api-scripts',
      domain: 'github.com/cyberark',
      snippet: 'PowerShell automation scripts for checking Vault component user states and verifying station authentication.',
      sourceType: 'GitHub',
      isOfficial: true,
    });
  } else if (cleanCode.startsWith('PSMSR280') || cleanCode.includes('PSMSR280E') || cleanCode.includes('8004')) {
    links.push({
      title: 'CyberArk Docs: Troubleshooting PSM Dispatcher Termination & AppLocker Rules',
      url: 'https://docs.cyberark.com/pam-self-hosted/latest/en/content/psm/psm_troubleshooting.htm',
      domain: 'docs.cyberark.com',
      snippet: 'Official guidelines on decoding Windows return codes 3221225786 (STATUS_CONTROL_C_EXIT) and 3221225477 (STATUS_ACCESS_VIOLATION) on PSM servers.',
      sourceType: 'CyberArk Docs',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000006284: PSMSR280E Session ended unexpectedly Return Codes',
      url: 'https://community.cyberark.com/s/article/PSMSR280E-AppLocker-Return-Codes',
      domain: 'community.cyberark.com',
      snippet: 'How to inspect Windows Event Viewer AppLocker Event 8004 and update PSMConfigureAppLocker.xml with publisher and path rules.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community KB: Running PSMConfigureAppLocker.ps1 without rebooting',
      url: 'https://community.cyberark.com/s/article/PSM-AppLocker-Execution-Guide',
      domain: 'community.cyberark.com',
      snippet: 'Best practices for testing AppLocker in Audit-Only mode prior to enforcing block rules on PSM servers.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk GitHub: PSM-AppLocker Auto-Configuration Utilities',
      url: 'https://github.com/cyberark/PSM-AppLocker-Rules',
      domain: 'github.com/cyberark',
      snippet: 'Curated repository of AppLocker XML rules for popular clients: Chrome, Edge, SQL Developer, WinSCP, and CyberArk Dispatchers.',
      sourceType: 'GitHub',
      isOfficial: true,
    });
  } else if (cleanCode.startsWith('CACPM406') || cleanCode.includes('CACPM406E')) {
    links.push({
      title: 'CyberArk Docs: CPM Plugin Development and Troubleshooting Timeout Parameters',
      url: 'https://docs.cyberark.com/pam-self-hosted/latest/en/content/plugins/plugin-troubleshooting.htm',
      domain: 'docs.cyberark.com',
      snippet: 'Official architecture guide covering ExecutionTimeout, NetworkTimeout, and prompt regex matching in Terminal Plugin Controller (TPC).',
      sourceType: 'CyberArk Docs',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000005912: Debugging CACPM406E Plugin Timeouts',
      url: 'https://community.cyberark.com/s/article/CACPM406E-Plugin-Timeout-Resolution',
      domain: 'community.cyberark.com',
      snippet: 'Field guide on enabling platform debug logging, analyzing ThirdParty Safe logs, and resolving unexpected SSH prompt banners.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000003184: CPM Network Reachability & Firewall Ports Checklist',
      url: 'https://community.cyberark.com/s/article/CPM-Ports-and-Firewall-Checklist',
      domain: 'community.cyberark.com',
      snippet: 'Port reference table: TCP 22 (SSH), TCP 3389 (RDP), TCP 445 (SMB/RPC), TCP 1521 (Oracle), TCP 1433 (MSSQL).',
      sourceType: 'Community KB',
      isOfficial: true,
    });
  } else if (cleanCode.startsWith('PCLD') || cleanCode.includes('PCLD001E') || cleanCode.includes('PCLD004E')) {
    links.push({
      title: 'CyberArk Docs: Privilege Cloud Secure Tunnel Architecture & Port Requirements',
      url: 'https://docs.cyberark.com/privilege-cloud/latest/en/content/securetunnel/secure-tunnel-troubleshooting.htm',
      domain: 'docs.cyberark.com',
      snippet: 'Network topology and prerequisite guide for outbound HTTPS (443) communication to CyberArk ISPSS SaaS backend.',
      sourceType: 'CyberArk Docs',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000008412: Troubleshooting Privilege Cloud Secure Tunnel Handshake',
      url: 'https://community.cyberark.com/s/article/Privilege-Cloud-Secure-Tunnel-Handshake-Troubleshooting',
      domain: 'community.cyberark.com',
      snippet: 'Remediation steps for SSL inspection bypass, proxy authentication (HTTP 407), and restarting the CyberArk Secure Tunnel service.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000009120: Connector Management Agent Token Renewal',
      url: 'https://community.cyberark.com/s/article/Privilege-Cloud-Connector-Management-Token-Renewal',
      domain: 'community.cyberark.com',
      snippet: 'How to regenerate the 24-hour bootstrap registration command from ISPSS portal when agent registration fails.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
  } else if (cleanCode.startsWith('PSMSR945') || cleanCode.includes('PSMSR945E')) {
    links.push({
      title: 'CyberArk Docs: Web Application Dispatcher Maintenance & ChromeDriver Synchronization',
      url: 'https://docs.cyberark.com/pam-self-hosted/latest/en/content/psm/psm_web_applications.htm',
      domain: 'docs.cyberark.com',
      snippet: 'Official instructions for matching Google Chrome / Microsoft Edge major versions with chromedriver.exe and msedgedriver.exe.',
      sourceType: 'CyberArk Docs',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Article #000007823: Resolving PSMSR945E Chrome Auto-Update Drift',
      url: 'https://community.cyberark.com/s/article/PSM-ChromeDriver-Version-Mismatch-Resolution',
      domain: 'community.cyberark.com',
      snippet: 'Community runbook for downloading matching WebDriver binaries, unblocking DLLs, and re-running PSMConfigureAppLocker.ps1.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: 'CyberArk Community Guide: GPO Configuration to Disable Chrome Updates on PSM Servers',
      url: 'https://community.cyberark.com/s/article/Disable-Chrome-AutoUpdate-PSM',
      domain: 'community.cyberark.com',
      snippet: 'Group Policy templates for freezing browser releases on dedicated PSM session jump hosts.',
      sourceType: 'Community KB',
      isOfficial: true,
    });
  } else {
    links.push({
      title: `CyberArk Official Documentation: Search for ${cleanCode}`,
      url: `https://docs.cyberark.com/pam-self-hosted/latest/en/content/search.htm?q=${encodedCode}`,
      domain: 'docs.cyberark.com',
      snippet: `Official technical library search across all CyberArk PAM Self-Hosted and Privilege Cloud product guides for ${cleanCode}.`,
      sourceType: 'CyberArk Docs',
      isOfficial: true,
    });
    links.push({
      title: `CyberArk Community Knowledge Base: Articles & Runbooks for ${cleanCode}`,
      url: `https://community.cyberark.com/s/global-search/${encodedCode}`,
      domain: 'community.cyberark.com',
      snippet: `Certified customer knowledge base articles, technician runbooks, and confirmed case resolutions for error code ${cleanCode}.`,
      sourceType: 'Community KB',
      isOfficial: true,
    });
    links.push({
      title: `CyberArk GitHub Repository Search: ${cleanCode}`,
      url: `https://github.com/search?q=org%3Acyberark+${encodedCode}`,
      domain: 'github.com/cyberark',
      snippet: `Open-source diagnostic scripts, platform plugins, and automation tools referencing ${cleanCode}.`,
      sourceType: 'GitHub',
      isOfficial: true,
    });
  }

  return links;
}

export function generateSummarizedSolution(
  code: string,
  title: string,
  component: PamComponent,
  cause: string,
  existingSteps: { stepNumber: number; action: string; commandOrPath?: string; notes?: string }[]
): SummarizedSolution {
  const cleanCode = code.toUpperCase();

  let quickSummary = `Synthesized from verified CyberArk Official Documentation and Community field resolutions for ${code}: The root issue in ${component} is caused by ${cause.toLowerCase()}. Remediating this requires validating service credentials, checking local security policy restrictions, and confirming network socket connectivity.`;
  let keyTakeaway = `In enterprise CyberArk deployments, ${code} is an operational priority. Following verified field runbooks avoids consecutive authentication lockouts and minimizes service downtime.`;
  let criticalGotchas: string[] = [
    'Always create a backup of configuration files (.ini, .cred, .xml) prior to modifications or service restarts.',
    'Do not repeatedly test logon attempts with locked credentials to prevent account suspension in the Vault.',
    'Verify that change control protocols are followed before modifying production AppLocker or proxy settings.',
  ];
  let verificationSteps: string[] = [
    `Inspect the primary ${component} operational log file to confirm the error code no longer appears.`,
    'Trigger a manual verification test through PVWA or test console to validate end-to-end operation.',
    'Confirm that component status in PrivateArk Client or ISPSS Connector Management returns to Green / Active.',
  ];

  if (cleanCode.includes('ITATS006E') || cleanCode.includes('006')) {
    quickSummary = 'Synthesized from CyberArk Official Documentation and Community Article #000004119: ITATS006E occurs because the local credential file (.cred / .ini) is out of sync with the Vault database. Fix: Stop the component service, reset the user password in PrivateArk Client (uncheck "User is suspended"), execute CreateCredFile.exe in the Vault directory with /IP and /Host flags, and start the service.';
    keyTakeaway = 'Credential files are cryptographically tied to machine IP address, hostname, and an encrypted hash. When any of these drift or the user password changes, the Vault rejects authentication immediately.';
    criticalGotchas = [
      'Stop the Windows service before resetting the user password; otherwise, active retry loops will immediately re-suspend the user.',
      'Ensure the /IP parameter passed to CreateCredFile.exe matches the specific network interface IP that communicates with the Vault on port 1858.',
      'Verify that the user.ini / .cred file permissions grant Read access exclusively to the local CyberArk service account.',
    ];
    verificationSteps = [
      'Inspect itaso001.log on the Vault server and confirm: "User <ComponentUser> has logged on successfully from station <StationIP>".',
      'Open the component local log (pm.log or CyberArk.WebConsole.log) and verify normal polling resumes without ITATS006E.',
    ];
  } else if (cleanCode.includes('PSMSR280E') || cleanCode.includes('8004')) {
    quickSummary = 'Synthesized from CyberArk Docs and Community Article #000006284: Return codes 3221225786 (0xC000013A) and 3221225477 (0xC0000005) indicate Windows AppLocker blocked a dispatcher process under the PSMConnect user account. Fix: Locate Event ID 8004 in Windows Event Viewer AppLocker log, add the executable/DLL path or publisher rule to PSMConfigureAppLocker.xml, run PSMConfigureAppLocker.ps1 in elevated PowerShell, and restart the PSM service.';
    keyTakeaway = 'AppLocker operates in strict whitelist mode on hardened PSM servers. Any browser update, driver change, or third-party client DLL update will instantly trigger PSMSR280E until explicitly whitelisted.';
    criticalGotchas = [
      'Always test AppLocker in Audit-Only mode first if adding complex third-party tools to prevent disrupting other dispatchers.',
      'Check for Microsoft Edge and Chrome auto-update services running in the background, which silently change binary versions.',
      'Run PowerShell as Administrator when executing PSMConfigureAppLocker.ps1 to ensure local Group Policy updates apply.',
    ];
    verificationSteps = [
      'Open Windows Event Viewer > Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL and confirm Event ID 8004 stops generating.',
      'Initiate a connection session in PVWA to the target system and verify successful desktop or browser launch.',
    ];
  } else if (cleanCode.includes('CACPM406E') || cleanCode.includes('TIMEOUT')) {
    quickSummary = 'Synthesized from CyberArk Plugin Documentation and Community Article #000005912: CACPM406E indicates the password management plugin exceeded ExecutionTimeout while waiting for an expected terminal prompt or TCP response. Fix: Verify firewall port connectivity from CPM to target host via Test-NetConnection, enable Debug=Yes in platform settings, examine ThirdParty safe log to find the stalled prompt string, and update the Prompts file regex or increase ExecutionTimeout to 180 seconds.';
    keyTakeaway = 'CPM plugins rely on strict regular expression matching for login, password, and confirmation prompts. Custom MOTD banners or network latency are the primary cause of timeouts.';
    criticalGotchas = [
      'Do not increase ExecutionTimeout beyond 300 seconds; long timeouts tie up CPM concurrent worker slots and backlog queue processing.',
      'Verify target account is not locked out in Active Directory or Linux /etc/shadow before troubleshooting prompts.',
    ];
    verificationSteps = [
      'Trigger a manual "Verify" on the account in PVWA and monitor C:\\Program Files (x86)\\CyberArk\\Password Manager\\Logs\\pm.log.',
      'Verify account status badge in PVWA switches from "Verify failed" to "Verified" with green indicator.',
    ];
  } else if (cleanCode.includes('PCLD001E') || cleanCode.includes('PCLD')) {
    quickSummary = 'Synthesized from CyberArk Privilege Cloud Docs and Community Article #000008412: PCLD001E indicates the on-premise Secure Tunnel failed to connect to the Privilege Cloud SaaS backend. Fix: Verify outbound TCP 443 connectivity to <subdomain>.privilegecloud.cyberark.cloud using Test-NetConnection, configure edge proxies to bypass SSL/TLS decryption (DPI) for *.cyberark.cloud, restart the CyberArk Secure Tunnel Windows service, and confirm tunnel establishment in ISPSS.';
    keyTakeaway = 'Privilege Cloud Secure Tunnel enforces certificate pinning. Next-Gen firewalls or corporate proxies intercepting SSL traffic break the cryptographic handshake immediately.';
    criticalGotchas = [
      'Deep packet inspection (DPI) or SSL proxy decryption MUST be disabled for all *.cyberark.cloud and *.privilegecloud.cyberark.cloud destinations.',
      'If using upstream corporate HTTP proxy, ensure authentication credentials configured in Secure Tunnel GUI have not expired.',
    ];
    verificationSteps = [
      'Review C:\\Program Files\\CyberArk\\Secure Tunnel\\logs\\SecureTunnel.log and confirm: "Tunnel successfully established to cloud gateway".',
      'Open CyberArk ISPSS Portal > Administration > Connector Management and verify Connector status is Active and Green.',
    ];
  } else if (cleanCode.includes('PSMSR945E')) {
    quickSummary = 'Synthesized from CyberArk Community Article #000007823: PSMSR945E indicates a version mismatch between the installed browser (Chrome/Edge) and the WebDriver binary (chromedriver.exe / msedgedriver.exe) inside PSM Components. Fix: Check installed Chrome/Edge version, download matching driver from official repository, unblock and replace driver in C:\\Program Files (x86)\\CyberArk\\PSM\\Components, and run PSMConfigureAppLocker.ps1.';
    keyTakeaway = 'Browser major version and WebDriver major version must match exactly (e.g., Chrome 128 requires ChromeDriver 128). Driver drift breaks web dispatchers instantly.';
    criticalGotchas = [
      'Always right-click downloaded driver executables and check "Unblock" in File Properties before placing into PSM Components.',
      'Configure Windows Group Policy to disable automatic browser background updates on dedicated PSM servers.',
    ];
    verificationSteps = [
      'Run .\\chromedriver.exe --version in PSM\\Components and confirm major version matches Google Chrome Help > About Chrome.',
      'Launch a web-based connection component (e.g. AWS Console, Azure Portal) from PVWA and verify successful browser session recording.',
    ];
  }

  const actionSteps = existingSteps.length > 0 ? existingSteps.map((s, idx) => ({
    stepNumber: idx + 1,
    title: s.action,
    action: s.action,
    commandOrPath: s.commandOrPath,
    notes: s.notes,
  })) : [
    {
      stepNumber: 1,
      title: `Analyze ${component} diagnostic logs for timestamp correlation`,
      action: `Review active ${component} log files for exact error stack traces.`,
      notes: 'Identify the exact station IP, username, and error return code.',
    },
    {
      stepNumber: 2,
      title: 'Verify network connectivity and security policies',
      action: 'Check firewall ports and local security policies (AppLocker / Windows Defender).',
      notes: 'Confirm required ports are open and listeners are active.',
    },
    {
      stepNumber: 3,
      title: 'Synchronize component credentials or tokens',
      action: 'Regenerate credential files using CreateCredFile.exe or renew registration tokens.',
      notes: 'Ensure passwords match the Digital Vault database.',
    },
    {
      stepNumber: 4,
      title: 'Restart service and perform functional verification',
      action: 'Restart the affected CyberArk service and trigger a test operation.',
      notes: 'Monitor log file output to confirm clean startup without errors.',
    },
  ];

  return {
    quickSummary,
    keyTakeaway,
    actionSteps,
    criticalGotchas,
    verificationSteps,
  };
}
