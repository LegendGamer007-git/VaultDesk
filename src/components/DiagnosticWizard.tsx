import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Wand2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Shield,
  Terminal,
  Layers,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Filter,
  Sparkles,
  Download,
  Info,
  ChevronRight,
  ChevronDown,
  Cpu,
  Search,
  Sliders,
  FolderOpen,
  Cloud,
  Server,
  Lock,
  Archive,
  Trash2,
  Globe,
  Flame,
  Link2,
  HelpCircle,
  Hash,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { PamComponent, SeverityLevel, ErrorEntry, SavedLogEntry } from '../types';
import { PAM_DIAGNOSTIC_WORKFLOWS, DiagnosticWorkflow } from '../data/diagnosticWorkflows';
import { analyzeCyberArkLog, LogAnalysisResult, sanitizeCustomerSecurityLog, MaskingStats } from '../utils/logAnalyzer';
import { COMMUNITY_KB_ARTICLES } from '../data/communityArticles';
import { COMPONENT_SYMPTOM_PROFILES, SymptomAreaDetail, getSymptomAreasForComponent } from '../data/symptomAreas';

interface DiagnosticWizardProps {
  onSelectError?: (error: ErrorEntry) => void;
  onBookmarkRunbook?: (title: string, code: string, component: PamComponent) => void;
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({
  onSelectError,
  onBookmarkRunbook,
}) => {
  // Main view mode: 'wizard' (guided step-by-step) vs 'logAnalyzer' (upload/paste logs)
  const [activeMode, setActiveMode] = useState<'wizard' | 'logAnalyzer'>('wizard');

  // ==========================================
  // WIZARD STATE
  // ==========================================
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedComponent, setSelectedComponent] = useState<PamComponent>('Privilege Cloud');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('pcld-wf-securetunnel');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [step1ViewMode, setStep1ViewMode] = useState<'cards' | 'matrix'>('cards');
  const [symptomSearchFilter, setSymptomSearchFilter] = useState<string>('');
  const [step2CategoryFilter, setStep2CategoryFilter] = useState<string>('All');

  // ==========================================
  // LOG ANALYZER STATE
  // ==========================================
  const [rawLogInput, setRawLogInput] = useState<string>('');
  const [analyzerComponent, setAnalyzerComponent] = useState<PamComponent | 'Auto'>('Auto');
  const [logAnalysis, setLogAnalysis] = useState<LogAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [logFilterQuery, setLogFilterQuery] = useState<string>('');
  const [showOnlyErrors, setShowOnlyErrors] = useState<boolean>(false);
  const [focusActualErrorsOnly, setFocusActualErrorsOnly] = useState<boolean>(false);
  const [copiedReferenceIndex, setCopiedReferenceIndex] = useState<number | null>(null);
  const jumpToErrorRef = useRef<HTMLDivElement>(null);
  const [autoAnonymize, setAutoAnonymize] = useState<boolean>(true);
  const [isSavedToServer, setIsSavedToServer] = useState<boolean>(false);
  const [savedServerLogId, setSavedServerLogId] = useState<string | null>(null);
  const [lastMaskingStats, setLastMaskingStats] = useState<MaskingStats | null>(null);
  const [serverSavedLogs, setServerSavedLogs] = useState<SavedLogEntry[]>([]);
  const [showSavedLogsModal, setShowSavedLogsModal] = useState<boolean>(false);
  const [isLoadingServerLogs, setIsLoadingServerLogs] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch server logs when modal opens
  const fetchServerLogs = async () => {
    setIsLoadingServerLogs(true);
    try {
      const res = await fetch('/api/logs/saved');
      if (res.ok) {
        const data = await res.json();
        setServerSavedLogs(data.logs || []);
      }
    } catch (e) {
      console.warn('Unable to load server saved logs:', e);
    } finally {
      setIsLoadingServerLogs(false);
    }
  };

  // Available components (including Privilege Cloud)
  const COMPONENTS: { name: PamComponent; label: string; desc: string; icon: string; count: number }[] = [
    { name: 'Privilege Cloud', label: 'Privilege Cloud', desc: 'SaaS tenant, ISPSS connector, Secure Tunnel & Cloud Connector Management', icon: 'Cloud', count: 12 },
    { name: 'Vault', label: 'Digital Vault', desc: 'Core security engine, database, and station authentication', icon: 'Shield', count: 18 },
    { name: 'CPM', label: 'Central Policy Manager', desc: 'Automated credential rotation, verify, change & reconcile', icon: 'RotateCcw', count: 22 },
    { name: 'PVWA', label: 'Password Vault Web Access', desc: 'IIS web portal, modern UI, REST API & SAML SSO', icon: 'Layers', count: 16 },
    { name: 'PSM', label: 'Privileged Session Manager', desc: 'RDP proxy, web dispatchers, drivers & AppLocker', icon: 'Terminal', count: 24 },
    { name: 'CCP', label: 'Central Credential Provider', desc: 'Application-to-Application (AAM) REST endpoints & agents', icon: 'Cpu', count: 10 },
    { name: 'PTA', label: 'Privileged Threat Analytics', desc: 'Behavioral security analytics, golden ticket & SIEM', icon: 'AlertTriangle', count: 8 },
    { name: 'Conjur', label: 'Conjur / Secrets Hub', desc: 'DevOps pipeline secrets, CI/CD & cloud integrations', icon: 'Sparkles', count: 6 },
  ];

  // Workflows for selected component
  const availableWorkflows = useMemo(() => {
    return PAM_DIAGNOSTIC_WORKFLOWS.filter((wf) => wf.component === selectedComponent);
  }, [selectedComponent]);

  const currentWorkflow = useMemo(() => {
    return PAM_DIAGNOSTIC_WORKFLOWS.find((wf) => wf.id === selectedWorkflowId) || availableWorkflows[0] || PAM_DIAGNOSTIC_WORKFLOWS[0];
  }, [selectedWorkflowId, availableWorkflows]);

  // Handle component select with optional specific symptom area targeting
  const handleSelectComponent = (comp: PamComponent, symptomAreaName?: string) => {
    setSelectedComponent(comp);
    setStep2CategoryFilter('All');
    const workflowsForComp = PAM_DIAGNOSTIC_WORKFLOWS.filter((wf) => wf.component === comp);
    if (workflowsForComp.length > 0) {
      if (symptomAreaName) {
        const matchingWf = workflowsForComp.find((wf) =>
          wf.title.toLowerCase().includes(symptomAreaName.toLowerCase()) ||
          wf.category.toLowerCase().includes(symptomAreaName.toLowerCase()) ||
          wf.commonCodes.some((code) => symptomAreaName.toUpperCase().includes(code.toUpperCase()))
        );
        setSelectedWorkflowId(matchingWf ? matchingWf.id : workflowsForComp[0].id);
      } else {
        setSelectedWorkflowId(workflowsForComp[0].id);
      }
    }
    setUserAnswers({});
    setCompletedSteps(new Set());
    setWizardStep(2);
  };

  // Handle workflow select
  const handleSelectWorkflow = (wfId: string) => {
    setSelectedWorkflowId(wfId);
    setUserAnswers({});
    setCompletedSteps(new Set());
    setWizardStep(3);
  };

  // Handle answer select
  const handleSelectAnswer = (questionId: string, choiceId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  // Toggle runbook checklist item
  const handleToggleChecklist = (stepIdx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepIdx)) {
        next.delete(stepIdx);
      } else {
        next.add(stepIdx);
      }
      return next;
    });
  };

  // Copy text helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Switch to Log Analyzer with workflow sample log
  const handleSendLogToAnalyzer = (sampleText: string, comp: PamComponent) => {
    setRawLogInput(sampleText);
    setAnalyzerComponent(comp);
    setActiveMode('logAnalyzer');
    // Run instant analysis
    const result = analyzeCyberArkLog(sampleText, comp);
    setLogAnalysis(result);
  };

  // ==========================================
  // LOG ANALYZER ACTIONS & SERVER INTEGRATION
  // ==========================================
  const handleRunLogAnalysis = async () => {
    if (!rawLogInput.trim()) return;
    setIsAnalyzing(true);
    setIsSavedToServer(false);

    let effectiveInput = rawLogInput;
    let stats: MaskingStats | undefined;

    if (autoAnonymize) {
      const sanitized = sanitizeCustomerSecurityLog(rawLogInput);
      effectiveInput = sanitized.sanitizedText;
      stats = sanitized.maskingStats;
      setLastMaskingStats(stats);
      // Replace input with randomized synthetic data
      setRawLogInput(effectiveInput);
    }

    const result = analyzeCyberArkLog(effectiveInput, analyzerComponent, false);
    if (stats) {
      result.maskingStats = stats;
      result.isSanitized = true;
    }
    setLogAnalysis(result);
    setIsAnalyzing(false);

    // Save sanitized log to server
    try {
      const res = await fetch('/api/logs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanitizedLog: effectiveInput,
          component: result.detectedComponent,
          primaryErrorCode: result.primaryErrorCode,
          severity: result.severity,
          summary: result.errorTitle,
          maskingStats: stats,
          originalFileName: 'pasted_security_log.log',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsSavedToServer(true);
        setSavedServerLogId(data.entry?.id || null);
      }
    } catch (e) {
      console.warn('Notice: Server save endpoint:', e);
    }
  };

  const handleTransformToRandomData = () => {
    if (!rawLogInput.trim()) return;
    const sanitized = sanitizeCustomerSecurityLog(rawLogInput);
    setRawLogInput(sanitized.sanitizedText);
    setLastMaskingStats(sanitized.maskingStats);
    if (logAnalysis) {
      const updated = analyzeCyberArkLog(sanitized.sanitizedText, analyzerComponent, false);
      updated.maskingStats = sanitized.maskingStats;
      updated.isSanitized = true;
      setLogAnalysis(updated);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let content = event.target?.result as string;
      if (content) {
        let stats: MaskingStats | undefined;
        if (autoAnonymize) {
          const sanitized = sanitizeCustomerSecurityLog(content);
          content = sanitized.sanitizedText;
          stats = sanitized.maskingStats;
          setLastMaskingStats(stats);
        }
        setRawLogInput(content);
        // Automatically analyze uploaded content
        const result = analyzeCyberArkLog(content, analyzerComponent, false);
        if (stats) {
          result.maskingStats = stats;
          result.isSanitized = true;
        }
        setLogAnalysis(result);

        // Save sanitized log to server
        try {
          const res = await fetch('/api/logs/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sanitizedLog: content,
              component: result.detectedComponent,
              primaryErrorCode: result.primaryErrorCode,
              severity: result.severity,
              summary: result.errorTitle,
              maskingStats: stats,
              originalFileName: file.name,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setIsSavedToServer(true);
            setSavedServerLogId(data.entry?.id || null);
          }
        } catch (e) {
          console.warn('Notice: Server save failed:', e);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (sampleType: 'pcld' | 'psm' | 'cpm' | 'vault' | 'pvwa' | 'ccp') => {
    let sample = '';
    let comp: PamComponent = 'Privilege Cloud';

    if (sampleType === 'pcld') {
      const wf = PAM_DIAGNOSTIC_WORKFLOWS.find((w) => w.id === 'pcld-wf-securetunnel');
      sample = wf?.sampleLog || '';
      comp = 'Privilege Cloud';
    } else if (sampleType === 'psm') {
      const wf = PAM_DIAGNOSTIC_WORKFLOWS.find((w) => w.id === 'psm-wf-applocker');
      sample = wf?.sampleLog || '';
      comp = 'PSM';
    } else if (sampleType === 'cpm') {
      const wf = PAM_DIAGNOSTIC_WORKFLOWS.find((w) => w.id === 'cpm-wf-timeout');
      sample = wf?.sampleLog || '';
      comp = 'CPM';
    } else if (sampleType === 'vault') {
      const wf = PAM_DIAGNOSTIC_WORKFLOWS.find((w) => w.id === 'vault-wf-itats006e');
      sample = wf?.sampleLog || '';
      comp = 'Vault';
    } else if (sampleType === 'pvwa') {
      const wf = PAM_DIAGNOSTIC_WORKFLOWS.find((w) => w.id === 'pvwa-wf-500-apppool');
      sample = wf?.sampleLog || '';
      comp = 'PVWA';
    } else if (sampleType === 'ccp') {
      const wf = PAM_DIAGNOSTIC_WORKFLOWS.find((w) => w.id === 'ccp-wf-appap306e');
      sample = wf?.sampleLog || '';
      comp = 'CCP';
    }

    setRawLogInput(sample);
    setAnalyzerComponent(comp);
    const result = analyzeCyberArkLog(sample, comp, autoAnonymize);
    setLogAnalysis(result);
  };

  const handleLoadServerLog = (entry: SavedLogEntry) => {
    setRawLogInput(entry.sanitizedLog);
    setAnalyzerComponent(entry.component);
    setSavedServerLogId(entry.id);
    setIsSavedToServer(true);
    setLastMaskingStats(entry.maskingStats);
    const result = analyzeCyberArkLog(entry.sanitizedLog, entry.component, false);
    result.maskingStats = entry.maskingStats;
    result.isSanitized = true;
    setLogAnalysis(result);
    setShowSavedLogsModal(false);
  };

  const handleDeleteServerLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/logs/saved/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServerSavedLogs((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.warn('Failed to delete server log:', err);
    }
  };

  // Find ErrorEntry matching reference article to open in modal
  const handleOpenReferenceInModal = (articleIdOrCode: string) => {
    if (!onSelectError) return;
    const found = COMMUNITY_KB_ARTICLES.find(
      (a) =>
        a.communityArticleId === articleIdOrCode ||
        a.code.toUpperCase() === articleIdOrCode.toUpperCase() ||
        a.id === articleIdOrCode
    );
    if (found) {
      onSelectError(found);
    } else {
      // Create transient error entry for modal display
      const tempEntry: ErrorEntry = {
        id: `ref-${Date.now()}`,
        code: currentWorkflow.commonCodes[0] || 'PAM-REF',
        title: currentWorkflow.diagnosisRules.referenceArticleTitle,
        component: currentWorkflow.component,
        severity: currentWorkflow.severity,
        description: currentWorkflow.diagnosisRules.explanation,
        cause: currentWorkflow.diagnosisRules.communityCause,
        resolutionSteps: currentWorkflow.diagnosisRules.resolutionSteps,
        affectedVersions: ['12.x', '13.x', '14.x LTS'],
        logsToCheck: currentWorkflow.diagnosisRules.logsToCheck,
        sourceLinks: [
          {
            title: `CyberArk Community Article #${currentWorkflow.diagnosisRules.referenceArticleId}`,
            url: '#in-app-runbook',
            type: 'Community Article',
          },
        ],
        tags: ['cyberark-community', currentWorkflow.component.toLowerCase()],
        lastUpdated: '2026-09-26',
        helpfulCount: 88,
        unhelpfulCount: 1,
        verifiedByCommunity: true,
        isCommunityResult: true,
        communityArticleId: currentWorkflow.diagnosisRules.referenceArticleId,
      };
      onSelectError(tempEntry);
    }
  };

  // Filter parsed log lines
  const filteredLogLines = useMemo(() => {
    if (!logAnalysis) return [];
    return logAnalysis.parsedLines.filter((line) => {
      if (focusActualErrorsOnly) {
        if (!line.isCulprit && line.level !== 'ERROR' && line.level !== 'FATAL') {
          return false;
        }
      } else if (showOnlyErrors && line.level !== 'ERROR' && line.level !== 'FATAL' && !line.isCulprit) {
        return false;
      }
      if (logFilterQuery.trim()) {
        return line.raw.toLowerCase().includes(logFilterQuery.toLowerCase());
      }
      return true;
    });
  }, [logAnalysis, showOnlyErrors, focusActualErrorsOnly, logFilterQuery]);

  const handleJumpToActualError = () => {
    if (jumpToErrorRef.current) {
      jumpToErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const el = document.getElementById('actual-error-line-highlight');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyCulpritLines = () => {
    if (!logAnalysis) return;
    const errorText = logAnalysis.culpritLines.map((l) => `Line ${l.lineNumber}: ${l.raw}`).join('\n');
    handleCopy(errorText, 'all-culprits');
  };

  const handleCopySummarizedSolution = () => {
    if (!logAnalysis) return;
    const sol = logAnalysis.summarizedSolution;
    const text = `CyberArk PAM Incident Resolution: [${logAnalysis.primaryErrorCode}] ${logAnalysis.errorTitle}
Component: ${logAnalysis.detectedComponent} | Severity: ${logAnalysis.severity}

EXECUTIVE SUMMARY:
${sol.quickSummary}

CORE ROOT CAUSE TAKEAWAY:
${sol.keyTakeaway}

STEP-BY-STEP REMEDIATION ACTION PLAN:
${sol.actionSteps.map((s) => `${s.stepNumber}. ${s.title}\n   ${s.action}${s.commandOrPath ? `\n   Command: ${s.commandOrPath}` : ''}${s.notes ? `\n   Note: ${s.notes}` : ''}`).join('\n\n')}

CRITICAL FIELD GOTCHAS & PRECAUTIONS:
${sol.criticalGotchas.map((g) => `• ${g}`).join('\n')}

VERIFICATION STEPS:
${sol.verificationSteps.map((v) => `• ${v}`).join('\n')}

GOOGLE & TECHNICAL REFERENCE LINKS:
${logAnalysis.googleReferenceLinks.map((r) => `• ${r.title}: ${r.url}`).join('\n')}`;

    handleCopy(text, 'full-summarized-solution');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Interactive PAM Triage & Log Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              CyberArk Diagnostic Wizard & Log Analyzer
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Interactive step-by-step diagnostic workflow tailored to each PAM component, plus instant
              deep analysis of uploaded or pasted CyberArk log files with root causes, solutions, and community reference articles.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto shrink-0 shadow-inner">
            <button
              onClick={() => setActiveMode('wizard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeMode === 'wizard'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>Step-by-Step Wizard</span>
            </button>
            <button
              onClick={() => setActiveMode('logAnalyzer')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeMode === 'logAnalyzer'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Log Data Analyzer</span>
              {logAnalysis && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: STEP-BY-STEP DIAGNOSTIC WIZARD                                    */}
      {/* ========================================================================= */}
      {activeMode === 'wizard' && (
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Step 1 */}
              <button
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    wizardStep === 1
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30'
                      : wizardStep > 1
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {wizardStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-400">Step 1</div>
                  <div className={`text-sm font-bold ${wizardStep === 1 ? 'text-emerald-400' : 'text-slate-200'}`}>
                    PAM Component
                  </div>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-3 sm:mx-4 ${wizardStep > 1 ? 'bg-emerald-500/50' : 'bg-slate-800'}`}></div>

              {/* Step 2 */}
              <button
                onClick={() => setWizardStep(2)}
                className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    wizardStep === 2
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30'
                      : wizardStep > 2
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {wizardStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-400">Step 2</div>
                  <div className={`text-sm font-bold ${wizardStep === 2 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    Symptom Area
                  </div>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-3 sm:mx-4 ${wizardStep > 2 ? 'bg-emerald-500/50' : 'bg-slate-800'}`}></div>

              {/* Step 3 */}
              <button
                onClick={() => wizardStep >= 3 && setWizardStep(3)}
                disabled={wizardStep < 3}
                className="flex items-center gap-2.5 group cursor-pointer disabled:cursor-not-allowed focus:outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    wizardStep === 3
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30'
                      : wizardStep > 3
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {wizardStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-400">Step 3</div>
                  <div className={`text-sm font-bold ${wizardStep === 3 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    Guided Triage
                  </div>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-3 sm:mx-4 ${wizardStep > 3 ? 'bg-emerald-500/50' : 'bg-slate-800'}`}></div>

              {/* Step 4 */}
              <button
                onClick={() => wizardStep >= 4 && setWizardStep(4)}
                disabled={wizardStep < 4}
                className="flex items-center gap-2.5 group cursor-pointer disabled:cursor-not-allowed focus:outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    wizardStep === 4
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  4
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-400">Step 4</div>
                  <div className={`text-sm font-bold ${wizardStep === 4 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    Remediation Runbook
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: COMPONENT SELECTION & SYMPTOM AREAS                   */}
          {/* ------------------------------------------------------------- */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    Select CyberArk PAM Component & Symptom Area
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose the specific PAM component and observed failure symptoms matching your operational incident.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Symptom Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by symptom or code..."
                      value={symptomSearchFilter}
                      onChange={(e) => setSymptomSearchFilter(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52"
                    />
                    {symptomSearchFilter && (
                      <button
                        onClick={() => setSymptomSearchFilter('')}
                        className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* View Mode Switcher */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <button
                      onClick={() => setStep1ViewMode('cards')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                        step1ViewMode === 'cards'
                          ? 'bg-slate-700 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Component Cards
                    </button>
                    <button
                      onClick={() => setStep1ViewMode('matrix')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                        step1ViewMode === 'matrix'
                          ? 'bg-emerald-600 text-slate-950 shadow font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All PAM Symptoms Matrix
                    </button>
                  </div>
                </div>
              </div>

              {/* VIEW MODE 1: COMPONENT CARDS WITH SYMPTOM AREAS */}
              {step1ViewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                  {COMPONENTS.map((comp) => {
                    const isSelected = selectedComponent === comp.name;
                    const profile = COMPONENT_SYMPTOM_PROFILES[comp.name];
                    const symptoms = profile?.symptomAreas || [];

                    // Filter symptoms if search query exists
                    const filteredSymptoms = symptomSearchFilter
                      ? symptoms.filter(
                          (s) =>
                            s.name.toLowerCase().includes(symptomSearchFilter.toLowerCase()) ||
                            s.category.toLowerCase().includes(symptomSearchFilter.toLowerCase()) ||
                            s.commonCodes.some((c) => c.toLowerCase().includes(symptomSearchFilter.toLowerCase())) ||
                            s.observedSymptoms.some((obs) => obs.toLowerCase().includes(symptomSearchFilter.toLowerCase()))
                        )
                      : symptoms;

                    if (symptomSearchFilter && filteredSymptoms.length === 0) {
                      return null;
                    }

                    return (
                      <div
                        key={comp.name}
                        onClick={() => handleSelectComponent(comp.name)}
                        className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-950/50'
                            : 'bg-[#0e1422] border-slate-800/90 hover:border-slate-700 hover:bg-[#111928]'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-base group-hover:text-emerald-300 transition-colors">
                                  {comp.label}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 border border-slate-700 text-emerald-400">
                                  {comp.name}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                                  {symptoms.length} Symptom Areas
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{comp.desc}</p>
                            </div>
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                                  : 'bg-slate-800 text-slate-400 group-hover:bg-emerald-600 group-hover:text-slate-950'
                              }`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Symptom Areas Section */}
                          <div className="space-y-2 pt-2 border-t border-slate-800/70">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                Symptom Areas Covered:
                              </span>
                              <span className="text-[10px] text-slate-400">Click any symptom area to triage</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {filteredSymptoms.map((sa) => (
                                <button
                                  key={sa.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectComponent(comp.name, sa.name);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-950 hover:border-emerald-600 text-[11px] font-medium text-slate-200 hover:text-emerald-300 border border-slate-700/80 transition-all text-left group/badge"
                                  title={`Common codes: ${sa.commonCodes.join(', ')}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      sa.severity === 'Critical'
                                        ? 'bg-rose-400'
                                        : sa.severity === 'High'
                                        ? 'bg-amber-400'
                                        : 'bg-cyan-400'
                                    }`}
                                  />
                                  <span>{sa.name}</span>
                                  <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover/badge:opacity-100 transition-opacity ml-0.5" />
                                </button>
                              ))}
                            </div>

                            {/* Observable Symptoms Sample Checklist */}
                            {filteredSymptoms[0] && (
                              <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                                <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wide">
                                  Primary Observable Symptoms:
                                </span>
                                <ul className="space-y-0.5 text-slate-300">
                                  {filteredSymptoms[0].observedSymptoms.slice(0, 2).map((obs, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                                      <span className="truncate">{obs}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{comp.count}+ Verified Community Articles</span>
                          <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                            <span>Browse All Symptoms ({symptoms.length})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW MODE 2: COMPLETE PAM SYMPTOM MATRIX */}
              {step1ViewMode === 'matrix' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Complete PAM Failure Symptom Matrix</strong> — Scan and triage observable incident patterns across all 8 CyberArk components.
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-[11px] font-bold">
                      {Object.values(COMPONENT_SYMPTOM_PROFILES).reduce((acc, p) => acc + p.symptomAreas.length, 0)} Total Symptom Areas
                    </span>
                  </div>

                  <div className="space-y-3">
                    {COMPONENTS.map((comp) => {
                      const profile = COMPONENT_SYMPTOM_PROFILES[comp.name];
                      const symptoms = profile?.symptomAreas || [];
                      const filtered = symptomSearchFilter
                        ? symptoms.filter(
                            (s) =>
                              s.name.toLowerCase().includes(symptomSearchFilter.toLowerCase()) ||
                              s.category.toLowerCase().includes(symptomSearchFilter.toLowerCase()) ||
                              s.commonCodes.some((c) => c.toLowerCase().includes(symptomSearchFilter.toLowerCase())) ||
                              s.observedSymptoms.some((obs) => obs.toLowerCase().includes(symptomSearchFilter.toLowerCase()))
                          )
                        : symptoms;

                      if (symptomSearchFilter && filtered.length === 0) return null;

                      return (
                        <div key={comp.name} className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-white text-base">{comp.label}</span>
                              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-slate-800 text-emerald-400 border border-slate-700">
                                {comp.name}
                              </span>
                              <span className="text-xs text-slate-400">({filtered.length} Symptom Areas)</span>
                            </div>
                            <button
                              onClick={() => handleSelectComponent(comp.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors shadow"
                            >
                              <span>Triage {comp.name}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filtered.map((sa) => (
                              <div
                                key={sa.id}
                                onClick={() => handleSelectComponent(comp.name, sa.name)}
                                className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-600/80 cursor-pointer transition-all hover:bg-slate-900 group/item"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          sa.severity === 'Critical'
                                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                            : sa.severity === 'High'
                                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                        }`}
                                      >
                                        {sa.severity}
                                      </span>
                                      <span className="text-[11px] text-slate-400">{sa.category}</span>
                                    </div>
                                    <h4 className="font-bold text-white text-xs group-hover/item:text-emerald-300 transition-colors">
                                      {sa.name}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {sa.commonCodes.map((c) => (
                                      <span
                                        key={c}
                                        className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-400"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                                  {sa.observedSymptoms.slice(0, 2).map((obs, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                                      <span className="text-slate-300 line-clamp-1">{obs}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: SYMPTOM AREA SELECTION                                */}
          {/* ------------------------------------------------------------- */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              {/* Header with Component Switcher */}
              <div className="space-y-3 pb-2 border-b border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                        {selectedComponent} Component
                      </span>
                      <h2 className="text-lg font-bold text-white">Select Failure Symptom Area</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      Choose the specific failure symptom or error pattern matching your current environment incident.
                    </p>
                  </div>

                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors self-start sm:self-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Components Overview</span>
                  </button>
                </div>

                {/* Instant Component Switcher Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Switch Component:
                  </span>
                  {COMPONENTS.map((comp) => {
                    const isCurrent = selectedComponent === comp.name;
                    return (
                      <button
                        key={comp.name}
                        onClick={() => handleSelectComponent(comp.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          isCurrent
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {comp.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symptom Category Filter Tabs */}
              {(() => {
                const profile = COMPONENT_SYMPTOM_PROFILES[selectedComponent];
                const symptoms = profile?.symptomAreas || [];
                const categories = ['All', ...Array.from(new Set(symptoms.map((s) => s.category)))];

                const filteredSymptoms = step2CategoryFilter === 'All'
                  ? symptoms
                  : symptoms.filter((s) => s.category === step2CategoryFilter);

                return (
                  <div className="space-y-4">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-xs font-semibold text-slate-400 shrink-0">Category:</span>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setStep2CategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                            step2CategoryFilter === cat
                              ? 'bg-slate-700 text-white font-bold border border-slate-600'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Symptom Cards Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {filteredSymptoms.map((sa) => {
                        // Find matching workflow if any
                        const matchingWf = availableWorkflows.find(
                          (wf) =>
                            wf.title.toLowerCase().includes(sa.name.toLowerCase()) ||
                            wf.category.toLowerCase().includes(sa.category.toLowerCase()) ||
                            wf.commonCodes.some((code) => sa.commonCodes.includes(code))
                        ) || availableWorkflows[0];

                        const isSelected = matchingWf && selectedWorkflowId === matchingWf.id;

                        return (
                          <div
                            key={sa.id}
                            className={`p-5 rounded-xl border transition-all duration-200 space-y-4 ${
                              isSelected
                                ? 'bg-emerald-950/30 border-emerald-500 shadow-xl'
                                : 'bg-[#0f1624] border-slate-800/90 hover:border-slate-700 hover:bg-[#121a2b]'
                            }`}
                          >
                            {/* Top Details Line */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1.5 max-w-3xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    <Activity className="w-3 h-3 text-emerald-400" />
                                    <span>Symptom Area: {sa.category}</span>
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      sa.severity === 'Critical'
                                        ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                                        : sa.severity === 'High'
                                        ? 'bg-amber-950/90 text-amber-300 border border-amber-800'
                                        : 'bg-cyan-950/90 text-cyan-300 border border-cyan-800'
                                    }`}
                                  >
                                    {sa.severity}
                                  </span>

                                  <span className="text-xs text-slate-400">•</span>
                                  <span className="text-xs text-slate-400">Subsystem: {sa.targetSubsystem}</span>

                                  <div className="flex items-center gap-1 ml-auto sm:ml-0">
                                    {sa.commonCodes.map((code) => (
                                      <span
                                        key={code}
                                        className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[11px] font-medium"
                                      >
                                        {code}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-white">
                                  {sa.name}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                <button
                                  onClick={() => {
                                    if (matchingWf) {
                                      handleSelectWorkflow(matchingWf.id);
                                    } else if (availableWorkflows.length > 0) {
                                      handleSelectWorkflow(availableWorkflows[0].id);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-emerald-950/50"
                                >
                                  <span>Triage This Symptom</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Observable Symptoms Box */}
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Observable Symptoms in Logs or Admin Console:</span>
                              </div>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                                {sa.observedSymptoms.map((obs, idx) => (
                                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                    <span className="leading-snug">{obs}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Root Cause & Impact Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-1">
                                <span className="font-semibold text-amber-300 block">Root Cause Trigger:</span>
                                <p className="text-amber-200/90 leading-relaxed">{sa.rootCauseSummary}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-1">
                                <span className="font-semibold text-rose-300 block">Operational Impact:</span>
                                <p className="text-rose-200/90 leading-relaxed">{sa.operationalImpact}</p>
                              </div>
                            </div>

                            {/* Recommended First Check */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-slate-400 shrink-0 font-medium">First Triage Command:</span>
                                <code className="font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate">
                                  {sa.recommendedFirstCheck}
                                </code>
                              </div>
                              <button
                                onClick={() => handleCopy(sa.recommendedFirstCheck, `cmd-${sa.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition-colors self-start sm:self-auto"
                              >
                                {copiedText === `cmd-${sa.id}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 font-semibold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Command</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: GUIDED QUESTIONNAIRE                                  */}
          {/* ------------------------------------------------------------- */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      {currentWorkflow.component}
                    </span>
                    <span className="text-xs text-slate-400">/</span>
                    <span className="text-xs font-medium text-emerald-400">{currentWorkflow.category}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{currentWorkflow.title}</h2>
                  <p className="text-xs text-slate-400">
                    Answer the guided checks below to hone in on the precise root cause and executable commands.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Issues</span>
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow"
                  >
                    <span>View Remediation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {currentWorkflow.questions.map((q, qIndex) => {
                  const currentAnswer = userAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center border border-slate-700">
                              {qIndex + 1}
                            </span>
                            <span className="text-sm font-bold text-white">{q.question}</span>
                          </div>
                          {q.hint && (
                            <p className="text-xs text-slate-400 pl-7 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{q.hint}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Choice Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pl-7 pt-1">
                        {q.choices.map((choice) => {
                          const isSelected = currentAnswer === choice.id;
                          return (
                            <button
                              key={choice.id}
                              onClick={() => handleSelectAnswer(q.id, choice.id)}
                              className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                                isSelected
                                  ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{choice.label}</span>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleSendLogToAnalyzer(currentWorkflow.sampleLog, currentWorkflow.component)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Test with Realistic {currentWorkflow.component} Log Sample</span>
                </button>

                <button
                  onClick={() => setWizardStep(4)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all hover:translate-x-0.5"
                >
                  <span>Generate Tailored Runbook</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: DIAGNOSTIC FINDINGS & TAILORED RUNBOOK                */}
          {/* ------------------------------------------------------------- */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {currentWorkflow.component} Runbook
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          currentWorkflow.severity === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {currentWorkflow.severity} Priority
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{currentWorkflow.diagnosisRules.conditionSummary}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          `CyberArk PAM Diagnostic Runbook: ${currentWorkflow.title}
Component: ${currentWorkflow.component}
Root Cause: ${currentWorkflow.diagnosisRules.rootCause}
Remediation Steps:
${currentWorkflow.diagnosisRules.resolutionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
                          'all-runbook'
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                    >
                      {copiedText === 'all-runbook' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Runbook!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Runbook</span>
                        </>
                      )}
                    </button>

                    {onBookmarkRunbook && (
                      <button
                        onClick={() =>
                          onBookmarkRunbook(
                            currentWorkflow.title,
                            currentWorkflow.commonCodes[0] || 'PAM-DIAG',
                            currentWorkflow.component
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bookmark Runbook</span>
                      </button>
                    )}

                    <button
                      onClick={() => setWizardStep(1)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Restart Wizard"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Root Cause & Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-900/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wide">
                      <AlertCircle className="w-4 h-4" />
                      <span>Identified Root Cause</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {currentWorkflow.diagnosisRules.rootCause}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wide">
                      <Info className="w-4 h-4" />
                      <span>Technical Subsystem Explanation</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentWorkflow.diagnosisRules.explanation}
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Resolution Runbook with Checkboxes */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Prescriptive Resolution Runbook ({completedSteps.size}/{currentWorkflow.diagnosisRules.resolutionSteps.length} Completed)
                    </h3>
                    <span className="text-[11px] text-slate-400">Click steps to mark as done</span>
                  </div>

                  <div className="space-y-2">
                    {currentWorkflow.diagnosisRules.resolutionSteps.map((step, idx) => {
                      const isDone = completedSteps.has(idx);
                      const isCommand = step.includes('& "') || step.includes('CreateCredFile') || step.includes('Restart-Service') || step.includes('Test-NetConnection') || step.includes('iisreset');

                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleChecklist(idx)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-400'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950'
                                : 'border border-slate-700 bg-slate-900 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                Step {idx + 1}
                              </span>

                              {isCommand && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(step, `cmd-${idx}`);
                                  }}
                                  className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                                >
                                  {copiedText === `cmd-${idx}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Command</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <p className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                              {step}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Diagnostic Logs to Inspect */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Relevant Diagnostic Log Files to Review</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentWorkflow.diagnosisRules.logsToCheck.map((logPath, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between"
                      >
                        <span className="truncate">{logPath}</span>
                        <button
                          onClick={() => handleCopy(logPath, `log-${idx}`)}
                          className="text-slate-400 hover:text-emerald-400 transition-colors ml-2 shrink-0"
                          title="Copy file path"
                        >
                          {copiedText === `log-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reference CyberArk Community Knowledge Base Article */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/40 pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Verified CyberArk Community Reference Article
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-[10px] font-mono font-bold">
                        #{currentWorkflow.diagnosisRules.referenceArticleId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReferenceInModal(currentWorkflow.diagnosisRules.referenceArticleId)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow"
                      >
                        <span>Read In-App Community Article</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      {currentWorkflow.diagnosisRules.referenceArticleTitle}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-slate-200">Community Cause: </strong>
                      {currentWorkflow.diagnosisRules.communityCause}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      <strong className="text-slate-200">Community Solution: </strong>
                      {currentWorkflow.diagnosisRules.communitySolution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: LOG DATA UPLOAD & PASTE ANALYZER                                  */}
      {/* ========================================================================= */}
      {activeMode === 'logAnalyzer' && (
        <div className="space-y-6">
          {/* Upload & Paste Control Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-400" />
                  Upload or Paste CyberArk Component Log Data
                </h2>
                <p className="text-xs text-slate-400">
                  Paste raw log lines or upload .log files from PSM, CPM, Vault, PVWA, or CCP to automatically diagnose root causes, extract error codes, and obtain reference runbooks.
                </p>
              </div>

              {/* Component Context Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <label className="text-xs font-semibold text-slate-400">Target Component:</label>
                <select
                  value={analyzerComponent}
                  onChange={(e) => setAnalyzerComponent(e.target.value as PamComponent | 'Auto')}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Auto">Auto-Detect Component (AI/Regex)</option>
                  <option value="Privilege Cloud">Privilege Cloud (Secure Tunnel / ISPSS)</option>
                  <option value="Vault">Digital Vault (itaso001 / italog)</option>
                  <option value="CPM">Central Policy Manager (pm_error / pm)</option>
                  <option value="PSM">Privileged Session Manager (PSMTrace / PSMConsole)</option>
                  <option value="PVWA">Password Vault Web Access (WebConsole / App)</option>
                  <option value="CCP">Central Credential Provider (APPConsole)</option>
                  <option value="PTA">Privileged Threat Analytics</option>
                  <option value="Conjur">Conjur / Secrets Hub</option>
                </select>
              </div>
            </div>

            {/* Quick 1-Click Samples for Easy Testing */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Load Real Sample:
              </span>
              <button
                type="button"
                onClick={() => handleLoadSample('pcld')}
                className="px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs border border-emerald-800 transition-colors font-bold"
              >
                Privilege Cloud (PCLD001E)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('psm')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              >
                PSM AppLocker (3221225786)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('cpm')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              >
                CPM Timeout (CACPM406E)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('vault')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              >
                Vault Desync (ITATS006E)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('pvwa')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              >
                PVWA 500 (WebConsole)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('ccp')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              >
                CCP Safe Denial (APPAP306E)
              </button>
            </div>

            {/* Customer Data Masking & Randomization Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
              <label className="flex items-start sm:items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAnonymize}
                  onChange={(e) => setAutoAnonymize(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer mt-0.5 sm:mt-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Omit & Anonymize Customer Data with Random Realistic Data
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Replaces company IP addresses, customer usernames, target hostnames, and safe names with randomized realistic data before server saving & analysis.
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleTransformToRandomData}
                  disabled={!rawLogInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  title="Immediately replace customer data in input with random values"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Randomize Input Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fetchServerLogs();
                    setShowSavedLogsModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-sky-400" />
                  <span>Server Saved Logs</span>
                </button>
              </div>
            </div>

            {/* Main Log Input Field */}
            <div className="relative">
              <textarea
                value={rawLogInput}
                onChange={(e) => setRawLogInput(e.target.value)}
                placeholder="Paste log output from itaso001.log, pm_error.log, PSMTrace.log, WebConsole.log, or APPConsole.log here..."
                rows={8}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-y leading-relaxed"
              />

              {rawLogInput && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                    {rawLogInput.split('\n').length} lines
                  </span>
                  <button
                    onClick={() => {
                      setRawLogInput('');
                      setLogAnalysis(null);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".log,.txt"
              className="hidden"
            />

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span>Browse .log / .txt File</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunLogAnalysis}
                  disabled={!rawLogInput.trim() || isAnalyzing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Log Data...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Analyze Log & Diagnose</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* LOG ANALYSIS RESULTS                                          */}
          {/* ============================================================= */}
          {logAnalysis && (
            <div className="space-y-6 animate-fadeIn">
              {/* Server Saved Status Banner */}
              {isSavedToServer && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-600/70 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">
                        Sanitized Security Log Saved to Server
                      </p>
                      <p className="text-slate-300 text-[11px]">
                        Customer identifying data has been safely omitted and replaced with random realistic data. Stored with ID: <code className="font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200">{savedServerLogId || 'log-archive'}</code>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      fetchServerLogs();
                      setShowSavedLogsModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition-colors shrink-0"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>View Server Archive</span>
                  </button>
                </div>
              )}

              {/* Masking Statistics Banner */}
              {lastMaskingStats && (lastMaskingStats.ipsMasked > 0 || lastMaskingStats.usersMasked > 0 || lastMaskingStats.hostsMasked > 0 || lastMaskingStats.safesMasked > 0 || lastMaskingStats.secretsRedacted > 0) && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Customer Data Randomization Applied:
                  </span>
                  {lastMaskingStats.ipsMasked > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300">
                      {lastMaskingStats.ipsMasked} IPs randomized
                    </span>
                  )}
                  {lastMaskingStats.usersMasked > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300">
                      {lastMaskingStats.usersMasked} Users randomized
                    </span>
                  )}
                  {lastMaskingStats.hostsMasked > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300">
                      {lastMaskingStats.hostsMasked} Hosts randomized
                    </span>
                  )}
                  {lastMaskingStats.safesMasked > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300">
                      {lastMaskingStats.safesMasked} Safes randomized
                    </span>
                  )}
                  {lastMaskingStats.secretsRedacted > 0 && (
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-[11px] font-mono text-rose-300">
                      {lastMaskingStats.secretsRedacted} Secrets/Tokens redacted
                    </span>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION 1: HIGHLIGHT THE ACTUAL ERROR FROM THE PASTED LOG                */}
              {/* ========================================================================= */}
              <div
                id="section-highlighted-error-log"
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
              >
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-700/80 shadow-sm shadow-rose-950/50">
                        <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
                        <span>Pasted Log: Actual Error Highlighted</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-950 text-cyan-300 border border-slate-800">
                        {logAnalysis.primaryErrorCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                        {logAnalysis.detectedComponent}
                      </span>
                      <span className="text-xs text-rose-400 font-semibold font-mono">
                        {logAnalysis.culpritLines.length} Culprit Error Line{logAnalysis.culpritLines.length !== 1 ? 's' : ''} Detected
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      The primary culprit failure lines, stack trace markers, and error codes are highlighted in high-contrast red below.
                    </p>
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleJumpToActualError}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/40 hover:translate-x-0.5"
                      title="Scroll directly to the first highlighted error line"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Jump to Actual Error</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCulpritLines}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      {copiedText === 'all-culprits' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Error Lines!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Error Lines</span>
                        </>
                      )}
                    </button>

                    {/* View filter toggles */}
                    <div className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                      <button
                        onClick={() => setFocusActualErrorsOnly(false)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          !focusActualErrorsOnly
                            ? 'bg-slate-700 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All Lines ({logAnalysis.totalLines})
                      </button>
                      <button
                        onClick={() => setFocusActualErrorsOnly(true)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          focusActualErrorsOnly
                            ? 'bg-rose-900/90 text-rose-200 shadow'
                            : 'text-rose-400 hover:text-rose-300'
                        }`}
                      >
                        Errors Only ({logAnalysis.culpritLines.length})
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filter log..."
                        value={logFilterQuery}
                        onChange={(e) => setLogFilterQuery(e.target.value)}
                        className="pl-7 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 w-32 focus:w-44 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Highlighted Log Viewer Scrollbox */}
                <div className="max-h-[420px] overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] space-y-2 border border-slate-900 shadow-inner">
                  {filteredLogLines.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No log lines match current search filters.
                    </div>
                  ) : (
                    filteredLogLines.map((line, idx) => {
                      const isError = line.level === 'ERROR' || line.level === 'FATAL';
                      const isWarn = line.level === 'WARN';
                      const isFirstCulprit = line.isCulprit && !filteredLogLines.slice(0, idx).some((l) => l.isCulprit);

                      if (line.isCulprit) {
                        return (
                          <div
                            key={line.lineNumber}
                            ref={isFirstCulprit ? jumpToErrorRef : undefined}
                            id={isFirstCulprit ? 'actual-error-line-highlight' : undefined}
                            className="relative p-3 rounded-xl bg-rose-950/80 border-l-4 border-rose-500 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/60 text-rose-100 font-semibold space-y-1 animate-in fade-in"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>ACTUAL ERROR DETECTED</span>
                                </span>
                                <span className="font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-rose-800/80 font-bold">
                                  {line.errorCode || logAnalysis.primaryErrorCode}
                                </span>
                                <span className="text-slate-400">Line {line.lineNumber}</span>
                                {line.timestamp && <span className="text-slate-400">{line.timestamp}</span>}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(line.raw, `err-line-${line.lineNumber}`)}
                                className="text-[10px] text-rose-300 hover:text-white bg-rose-900/60 hover:bg-rose-800 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                              >
                                {copiedText === `err-line-${line.lineNumber}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Error Line</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="break-all whitespace-pre-wrap font-mono text-xs text-rose-100 font-bold pl-1 pt-0.5">
                              {line.raw}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={line.lineNumber}
                          className={`py-0.5 px-1.5 rounded flex items-start gap-2.5 transition-colors hover:bg-slate-900/50 ${
                            isError ? 'text-rose-300' : isWarn ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        >
                          <span className="text-slate-600 select-none w-8 text-right shrink-0">
                            {line.lineNumber}
                          </span>

                          {line.timestamp && (
                            <span className="text-slate-500 shrink-0 select-none text-[10px]">
                              {line.timestamp}
                            </span>
                          )}

                          {line.level !== 'UNKNOWN' && (
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                isError
                                  ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                                  : isWarn
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800/80 text-slate-400'
                              }`}
                            >
                              {line.level}
                            </span>
                          )}

                          <span className="break-all whitespace-pre-wrap">{line.raw}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 2: EXPLAIN THE ERROR AND THE ERROR CODE                           */}
              {/* ========================================================================= */}
              <div
                id="section-error-code-explanation"
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <span>Error & Error Code Analysis:</span>
                        <span className="font-mono text-cyan-300 bg-slate-950 px-2.5 py-0.5 rounded border border-cyan-800/80">
                          {logAnalysis.primaryErrorCode}
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Technical architectural anatomy, root cause, and subsystem failure details.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {logAnalysis.detectedComponent} Subsystem
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                        logAnalysis.severity === 'Critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {logAnalysis.severity} Severity
                    </span>
                  </div>
                </div>

                {/* Error Code Anatomy Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Code Prefix
                    </span>
                    <div className="font-mono font-black text-sm text-white">
                      {logAnalysis.codeAnatomy?.prefix || logAnalysis.primaryErrorCode.slice(0, 5)}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {logAnalysis.codeAnatomy?.prefixMeaning || 'CyberArk PAM Subsystem Protocol'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      Error Index
                    </span>
                    <div className="font-mono font-black text-sm text-white">
                      #{logAnalysis.codeAnatomy?.codeNumber || '001'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug truncate">
                      {logAnalysis.codeAnatomy?.subsystemDescription || `${logAnalysis.detectedComponent} Daemon`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Severity Class
                    </span>
                    <div className="font-mono font-black text-sm text-white">
                      {logAnalysis.codeAnatomy?.severityClass || 'Level E (Fatal Error)'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Requires immediate engineer intervention
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Target Component
                    </span>
                    <div className="font-mono font-black text-sm text-white">
                      {logAnalysis.detectedComponent}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Confidence: {logAnalysis.componentConfidence}
                    </p>
                  </div>
                </div>

                {/* Plain-English and Technical Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wide">
                      <Info className="w-4 h-4" />
                      <span>What This Error Means</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {logAnalysis.errorExplanation.overview}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                      <strong className="text-slate-300">Technical Details: </strong>
                      {logAnalysis.errorExplanation.technicalDetails}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wide">
                      <AlertCircle className="w-4 h-4" />
                      <span>Identified Root Cause & Impact</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                      {logAnalysis.identifiedCause}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      <strong className="text-rose-300">Operational Impact: </strong>
                      {logAnalysis.errorExplanation.impact}
                    </p>
                  </div>
                </div>

                {/* Extracted Session Context (if available) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Extracted Session Context:</span>
                  {logAnalysis.metadata.safeName && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                      Safe: <strong className="text-emerald-400">{logAnalysis.metadata.safeName}</strong>
                    </span>
                  )}
                  {logAnalysis.metadata.userName && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                      User: <strong className="text-emerald-400">{logAnalysis.metadata.userName}</strong>
                    </span>
                  )}
                  {logAnalysis.metadata.stationOrIp && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                      Station: <strong className="text-emerald-400">{logAnalysis.metadata.stationOrIp}</strong>
                    </span>
                  )}
                  {logAnalysis.metadata.targetHost && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                      Target: <strong className="text-emerald-400">{logAnalysis.metadata.targetHost}</strong>
                    </span>
                  )}
                  {logAnalysis.metadata.sessionId && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                      Session ID: <strong className="text-emerald-400">{logAnalysis.metadata.sessionId}</strong>
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 ml-auto font-mono">
                    {logAnalysis.errorCount} Errors • {logAnalysis.warningCount} Warnings
                  </span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 3: REFERENCE LINKS FROM GOOGLE RELATED TO THAT ERROR             */}
              {/* ========================================================================= */}
              <div
                id="section-google-reference-links"
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Reference Links from Google & Official Docs for {logAnalysis.primaryErrorCode}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Curated Google search index results, verified CyberArk Technical Community knowledge base articles, and official vendor runbooks.
                    </p>
                  </div>

                  {/* Direct 1-Click Search on Google Button */}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `CyberArk ${logAnalysis.primaryErrorCode} ${logAnalysis.errorTitle} solution`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/40 transition-all shrink-0 hover:translate-x-0.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search on Google</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

                {/* Reference Links Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {(logAnalysis.googleReferenceLinks || []).map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              ref.domain.includes('google')
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : ref.domain.includes('docs.cyberark')
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : ref.domain.includes('community')
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {ref.domain}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-500">
                            {ref.sourceType}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                          {ref.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                          {ref.snippet}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(ref.url);
                            setCopiedReferenceIndex(idx);
                            setTimeout(() => setCopiedReferenceIndex(null), 2000);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                        >
                          {copiedReferenceIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300 font-semibold">URL Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-300 text-xs font-semibold transition-all"
                        >
                          <span>Open Reference</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 4: SUMMARIZED SOLUTION FROM THOSE LINKS                          */}
              {/* ========================================================================= */}
              <div
                id="section-summarized-solution"
                className="bg-gradient-to-b from-slate-900 to-[#0a121e] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          Summarized Solution (Curated from Google References)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Synthesized remediation action plan compiled from official CyberArk documentation and verified community resolutions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySummarizedSolution}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all shrink-0 hover:translate-x-0.5"
                  >
                    {copiedText === 'full-summarized-solution' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Solution Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Incident Solution</span>
                      </>
                    )}
                  </button>
                </div>

                {/* TL;DR Executive Quick Summary Box */}
                <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-600/50 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Executive Summary & Immediate Fix</span>
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
                    {logAnalysis.summarizedSolution?.quickSummary}
                  </p>
                </div>

                {/* Core Root Cause Takeaway */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Core Architectural Takeaway</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {logAnalysis.summarizedSolution?.keyTakeaway}
                  </p>
                </div>

                {/* Step-by-Step Remediation Action Plan */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Step-by-Step Remediation Action Plan</span>
                  </h4>

                  <div className="space-y-2.5">
                    {(logAnalysis.summarizedSolution?.actionSteps || []).map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-900/60 border border-emerald-700 text-emerald-300 flex items-center justify-center text-[10px] font-mono font-black">
                              {step.stepNumber}
                            </span>
                            <span>{step.title}</span>
                          </span>

                          {step.commandOrPath && (
                            <button
                              type="button"
                              onClick={() => handleCopy(step.commandOrPath!, `cmd-${step.stepNumber}`)}
                              className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {copiedText === `cmd-${step.stepNumber}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Command</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pl-7">
                          {step.action}
                        </p>

                        {step.commandOrPath && (
                          <div className="ml-7 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                            {step.commandOrPath}
                          </div>
                        )}

                        {step.notes && (
                          <p className="text-[11px] text-slate-400 pl-7">
                            <strong className="text-slate-500">Note: </strong>
                            {step.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Gotchas & Verification Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Field Gotchas */}
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Field Precautions & Critical Gotchas</span>
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                      {(logAnalysis.summarizedSolution?.criticalGotchas || []).map((g, idx) => (
                        <li key={idx} className="text-slate-300">
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Post-Remediation Verification */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Post-Remediation Health Checks</span>
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                      {(logAnalysis.summarizedSolution?.verificationSteps || []).map((v, idx) => (
                        <li key={idx} className="text-slate-300">
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SERVER SAVED LOGS ARCHIVE MODAL                                           */}
      {/* ========================================================================= */}
      {showSavedLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-800/80 flex items-center justify-center">
                  <Archive className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Server-Side Saved Security Logs</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {serverSavedLogs.length} Saved
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sanitized logs stored securely on the server with customer PII replaced by randomized data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSavedLogsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {isLoadingServerLogs ? (
                <div className="py-12 text-center space-y-2">
                  <RotateCcw className="w-6 h-6 animate-spin text-sky-400 mx-auto" />
                  <p className="text-xs text-slate-400">Loading saved logs from server database...</p>
                </div>
              ) : serverSavedLogs.length === 0 ? (
                <div className="py-12 text-center space-y-3 border border-dashed border-slate-800 rounded-xl">
                  <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-300">No logs saved on server yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      When you paste or upload security logs in the Analyzer with anonymization enabled, they will be automatically saved here for shift handover.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {serverSavedLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => handleLoadServerLog(log)}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {log.primaryErrorCode}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {log.component}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.severity === 'Critical'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {log.severity}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ID: {log.id}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                            {log.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteServerLog(log.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete log from server"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                            Load <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {/* Masking Statistics Summary */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <span>Anonymized:</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {log.maskingStats.ipsMasked} IPs
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {log.maskingStats.usersMasked} Users
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {log.maskingStats.hostsMasked} Hosts
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {log.maskingStats.safesMasked} Safes
                        </span>
                        <span className="ml-auto text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>All customer data is randomized before server storage.</span>
              <button
                onClick={() => setShowSavedLogsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
