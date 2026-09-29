import { ErrorEntry, PamComponent } from '../types';
import { COMPONENT_SYMPTOM_PROFILES, SymptomAreaDetail, getAllSymptomAreas } from '../data/symptomAreas';

/**
 * Intelligent mapping of CyberArk PAM Error Codes and keywords to their primary Symptom Area
 */
export function getSymptomAreaForError(code: string, component: PamComponent): string {
  const normCode = code.toUpperCase().trim();
  const profile = COMPONENT_SYMPTOM_PROFILES[component];

  if (profile) {
    for (const sa of profile.symptomAreas) {
      if (sa.commonCodes.some((c) => normCode.includes(c.toUpperCase()))) {
        return sa.name;
      }
    }
  }

  // Component-based fallback defaults
  switch (component) {
    case 'Privilege Cloud':
      if (normCode.includes('407') || normCode.includes('PCLD001') || normCode.includes('TUNNEL')) {
        return 'Secure Tunnel TLS Handshake & Port 443 Block';
      }
      if (normCode.includes('401') || normCode.includes('PCLD004') || normCode.includes('TOKEN')) {
        return 'Connector Management Agent Offline & Token Expiry';
      }
      return 'SaaS Micro-Tunnel & Cloud Connectivity';

    case 'Vault':
      if (normCode.includes('006') || normCode.includes('ITATS006')) {
        return 'Station Authentication & IP Mismatch (ITATS006E)';
      }
      if (normCode.includes('375') || normCode.includes('ITATS375') || normCode.includes('QUOTA')) {
        return 'Safe Storage Quota & Capacity Saturation (ITATS375E)';
      }
      if (normCode.includes('028') || normCode.includes('PADR')) {
        return 'Disaster Recovery Replication Desync & Lag (PADR0022E)';
      }
      return 'Vault Storage & Authentication Subsystem';

    case 'CPM':
      if (normCode.includes('406') || normCode.includes('CACPM406') || normCode.includes('TIMEOUT')) {
        return 'Credential Verification & Change Timeout (CACPM406E)';
      }
      if (normCode.includes('072') || normCode.includes('CACPM072') || normCode.includes('CREDFILE')) {
        return 'User.ini Credential File Desync (CACPM072E)';
      }
      if (normCode.includes('146') || normCode.includes('80070005') || normCode.includes('RPC')) {
        return 'Windows RPC / WMI Access Denied (Error 80070005)';
      }
      return 'Password Rotation & Verification Lifecycle';

    case 'PSM':
      if (normCode.includes('037') || normCode.includes('PSMSR037') || normCode.includes('APPLOCKER')) {
        return 'AppLocker Restriction & Dispatcher Launch Abort (PSMSR037E)';
      }
      if (normCode.includes('945') || normCode.includes('PSMSR945') || normCode.includes('CHROME')) {
        return 'Web Browser & ChromeDriver Version Mismatch (PSMSR945E)';
      }
      if (normCode.includes('126') || normCode.includes('280') || normCode.includes('NLA')) {
        return 'RDP TLS / NLA Protocol Handshake Failure (PSMSR126E)';
      }
      return 'Privileged Session Brokering & Dispatcher Isolation';

    case 'PVWA':
      if (normCode.includes('500') || normCode.includes('APP-POOL')) {
        return 'IIS Application Pool Crash & HTTP 500.19 / 500.0';
      }
      if (normCode.includes('SAML') || normCode.includes('SSO')) {
        return 'SAML 2.0 Single Sign-On Assertion & Signature Errors';
      }
      if (normCode.includes('403') || normCode.includes('API')) {
        return 'REST API 403 Forbidden & Token Expiry';
      }
      return 'IIS Web Portal Stability & User Access';

    case 'CCP':
      if (normCode.includes('306') || normCode.includes('APPAP306')) {
        return 'Application Authentication & AppID Error (APPAP306E)';
      }
      if (normCode.includes('100') || normCode.includes('APPAP100')) {
        return 'AimProvider Service & Credfile Desynchronization (APPAP100E)';
      }
      return 'AAM REST Query Authorization & Credfile State';

    case 'PTA':
      if (normCode.includes('001') || normCode.includes('DIAMOND')) {
        return 'Diamond Daemon Service Disconnection & Inactive State';
      }
      if (normCode.includes('004') || normCode.includes('DISK') || normCode.includes('MONGO')) {
        return 'Disk Partition & MongoDB Database Saturation';
      }
      return 'Behavioral Threat Analytics & SIEM Pipeline';

    case 'Conjur':
      if (normCode.includes('001') || normCode.includes('CONJ001') || normCode.includes('401')) {
        return 'Host Authentication & 401 Unauthorized (CONJ001E)';
      }
      if (normCode.includes('005') || normCode.includes('REPL')) {
        return 'Follower Node Database Replication Disconnect';
      }
      if (normCode.includes('008') || normCode.includes('WEBHOOK') || normCode.includes('K8S')) {
        return 'Kubernetes Secrets Webhook Injection Timeout';
      }
      return 'Cloud Secrets Delivery & Kubernetes Webhook';

    default:
      return `${component} Operational Area`;
  }
}

/**
 * Returns observable symptoms for an error
 */
export function getObservedSymptomsForError(code: string, component: PamComponent): string[] {
  const normCode = code.toUpperCase().trim();
  const profile = COMPONENT_SYMPTOM_PROFILES[component];

  if (profile) {
    for (const sa of profile.symptomAreas) {
      if (sa.commonCodes.some((c) => normCode.includes(c.toUpperCase()))) {
        return sa.observedSymptoms;
      }
    }
  }

  return [
    `Endpoint returns error code ${code} during execution`,
    `Component ${component} reports operational disruption`,
    'Admin console displays degraded or disconnected state',
  ];
}

/**
 * Filter error list by a symptom area name or ID
 */
export function filterErrorsBySymptomArea(
  errors: ErrorEntry[],
  symptomAreaName: string
): ErrorEntry[] {
  if (!symptomAreaName || symptomAreaName === 'All') return errors;

  return errors.filter((err) => {
    const errSymptomArea = err.symptomArea || getSymptomAreaForError(err.code, err.component);
    return errSymptomArea.toLowerCase() === symptomAreaName.toLowerCase();
  });
}
