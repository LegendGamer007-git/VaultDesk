import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  FileCode,
  AlertTriangle,
  Info,
  ShieldAlert,
  Quote,
  Minus,
  Table,
  Link2,
  Save,
  Download,
  FileText,
  FileDown,
  Printer,
  Sparkles,
  Paperclip,
  Check,
  X,
  Eye,
  Edit3,
  Columns,
  RotateCcw,
  HardDrive,
  Copy,
  Tag,
  Share2,
} from 'lucide-react';
import {
  LocalKbArticle,
  KbSpace,
  KbArticleStatus,
  PamComponent,
  SeverityLevel,
  KbAttachment,
} from '../types';

export interface RichTextEditorProps {
  initialTitle?: string;
  initialSpace?: KbSpace;
  initialComponent?: PamComponent;
  initialSeverity?: SeverityLevel;
  initialStatus?: KbArticleStatus;
  initialAuthor?: string;
  initialAuthorRole?: string;
  initialSummary?: string;
  initialContent?: string;
  initialTags?: string[];
  initialAttachments?: KbAttachment[];
  articleId?: string;
  isNew?: boolean;
  onSave: (articleData: Partial<LocalKbArticle>, status: KbArticleStatus) => void;
  onCancel: () => void;
}

const TEMPLATES: { name: string; description: string; content: string }[] = [
  {
    name: 'SOP Runbook Template',
    description: 'Enterprise operational standard operating procedure with verification checklist',
    content: `## 1. Executive Summary & Objective
Briefly describe the purpose of this procedure, affected systems, and operational boundaries.

## 2. Prerequisites & Safety Precautions
- Verify remote administrative access to primary and standby hosts.
- [ ] Active Change Record approved (CR-XXXX).
- [ ] Verified recent Safe and dbparm backup in secure storage.
- [ ] On-call engineer notified via PagerDuty / Slack.

> **CRITICAL CAUTION**: Review authentication tokens and network firewall rules before stopping target services.

## 3. Step-by-Step Execution Procedure
### Step 3.1: Service Status Check
\`\`\`powershell
# Run in elevated PowerShell on target host
Get-Service -Name "CyberArk*" | Select-Object Name, Status, StartType
\`\`\`

### Step 3.2: Primary Maintenance Action
1. Stop the target connector service gracefully.
2. Backup existing configuration file to \`.bak\` timestamp.
3. Apply updated configuration settings.
4. Restart the service and observe initial startup log messages.

## 4. Verification & Health Validation Checklist
- [ ] Primary service reports "Running" status without warning events.
- [ ] Test target verification account password validation in PVWA.
- [ ] Verify zero error lines in diagnostic log \`pm_error.log\` or \`PSMTrace.log\`.
- [ ] End-to-end user session established via PSM dispatcher.

## 5. Emergency Rollback Plan
If verification criteria fail within maintenance window:
1. Revert to backed-up configuration file.
2. Restart service and verify original operation.
3. Escalate to PAM engineering on-call.`,
  },
  {
    name: 'Incident RCA Post-Mortem',
    description: 'Root cause analysis, incident timeline, and preventive controls',
    content: `## 1. Incident Overview
- **Incident Ticket**: INC-2026-XXXX
- **Severity**: High / Critical
- **Date & Time of Outage**: ${new Date().toLocaleDateString()}
- **Duration**: 42 minutes
- **Impacted Components**: Vault / PVWA / CPM / PSM

## 2. Executive Summary & Impact
Summary of the failure, business impact, and resolution timeline.

## 3. Detailed Incident Timeline
| Time (UTC) | Event / Symptom | Operator Action |
|---|---|---|
| 08:14 | First error alert received (CACPM406E) | On-call engineer paged |
| 08:22 | Triage identified credential desync | Reconcile account triggered |
| 08:45 | Service restored and fleet verified | Incident closed |

## 4. Root Cause Analysis (RCA)
Detailed technical findings, logs, and failure trigger.

\`\`\`text
CACPM406E Error resetting password for account [TargetSafe/AdminUser]. Win32 Error: 1326
\`\`\`

## 5. Preventive Controls & Action Items
- [ ] Add pre-rotation network reachability checks for SMB/RPC ports.
- [ ] Update AppLocker whitelist rules for target dispatcher runtime.
- [ ] Conduct refresher session on automated reconcile policies.`,
  },
  {
    name: 'Hardening & AppLocker Playbook',
    description: 'Security baseline, Windows Server hardening, and dispatcher rules',
    content: `## 1. Hardening Scope & Target Platforms
Applies to Windows Server 2022 / 2025 PSM, CPM, and PVWA worker nodes.

## 2. AppLocker XML Rule Definition
\`\`\`xml
<!-- Whitelist Custom In-House Dispatcher -->
<Application Name="EnterpriseCustomDispatcher"
             Type="Exe"
             Path="C:\\Program Files (x86)\\CyberArk\\PSM\\Components\\CustomDispatcher.exe"
             Method="Publisher" />
\`\`\`

## 3. PowerShell Deployment Script
\`\`\`powershell
Set-Location "C:\\Program Files (x86)\\CyberArk\\PSM\\Hardening"
.\\PSMConfigureAppLocker.ps1 -Verbose
\`\`\`

## 4. Verification Checklist
- [ ] Event Viewer > Applications and Services > Microsoft > Windows > AppLocker shows Event ID 8002 (Allowed).
- [ ] PSM sessions launch without PSMSR126E or PSMSR280E exceptions.`,
  },
  {
    name: 'Blank Document',
    description: 'Empty canvas for custom documentation',
    content: `## 1. Overview\n\nStart writing your troubleshooting guide or operational note here...\n\n`,
  },
];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialTitle = '',
  initialSpace = 'Runbooks & SOPs',
  initialComponent = 'Vault',
  initialSeverity = 'Medium',
  initialStatus = 'published',
  initialAuthor = 'Internal SecOps',
  initialAuthorRole = 'PAM Engineer',
  initialSummary = '',
  initialContent = '',
  initialTags = ['Runbook'],
  initialAttachments = [],
  articleId,
  isNew = false,
  onSave,
  onCancel,
}) => {
  // Metadata state
  const [title, setTitle] = useState(initialTitle);
  const [space, setSpace] = useState<KbSpace>(initialSpace);
  const [component, setComponent] = useState<PamComponent>(initialComponent);
  const [severity, setSeverity] = useState<SeverityLevel>(initialSeverity);
  const [status, setStatus] = useState<KbArticleStatus>(initialStatus);
  const [author, setAuthor] = useState(initialAuthor);
  const [authorRole, setAuthorRole] = useState(initialAuthorRole);
  const [summary, setSummary] = useState(initialSummary);
  const [content, setContent] = useState(initialContent || TEMPLATES[0].content);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<KbAttachment[]>(initialAttachments);

  // Editor mode: 'visual' (WYSIWYG contentEditable) | 'markdown' | 'split' | 'preview'
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown' | 'split' | 'preview'>('visual');

  // Auto-save state
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // WYSIWYG ContentEditable ref
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  const draftStorageKey = `vaultdesk_editor_draft_${articleId || 'new'}`;

  // Notify helper
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Generate cryptographically secure attachment ID
  const generateSecureAttachmentId = (): string => {
    try {
      const arr = new Uint32Array(1);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(arr);
      }
      return `att-${Date.now()}-${arr[0].toString(36)}`;
    } catch {
      return `att-${Date.now()}-${Date.now().toString(36)}`;
    }
  };

  // Sanitize HTML using DOMPurify to eliminate Cross-Site Scripting (XSS / CWE-79)
  const sanitizeHtmlOutput = (input: string): string => {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
        'pre', 'code', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
        'div', 'span', 'hr', 'a', 'b', 'i'
      ],
      ALLOWED_ATTR: ['class', 'data-lang', 'style', 'href', 'target', 'rel']
    });
  };

  // Convert markdown to clean HTML for visual editor and preview
  const markdownToHtml = (md: string): string => {
    if (!md) return '';
    let html = md;

    // Code blocks ```lang ... ```
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre class="kb-code-block" data-lang="${lang || 'text'}"><code>${escaped}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="kb-inline-code">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="kb-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="kb-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="kb-h1">$1</h1>');

    // Blockquote callouts
    html = html.replace(/^\> \*\*CRITICAL(.*?)\*\*:? (.*$)/gim, '<div class="kb-callout kb-callout-critical"><strong>CRITICAL$1</strong>: $2</div>');
    html = html.replace(/^\> \*\*WARNING(.*?)\*\*:? (.*$)/gim, '<div class="kb-callout kb-callout-warning"><strong>WARNING$1</strong>: $2</div>');
    html = html.replace(/^\> \*\*INFO(.*?)\*\*:? (.*$)/gim, '<div class="kb-callout kb-callout-info"><strong>INFO$1</strong>: $2</div>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="kb-quote">$1</blockquote>');

    // Checklists: - [ ] or - [x]
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="kb-checklist-item checked"><span class="check-box checked">☑</span> <span class="check-text checked">$1</span></div>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="kb-checklist-item"><span class="check-box">☐</span> <span class="check-text">$1</span></div>');

    // Bullet lists
    html = html.replace(/^- (.*$)/gim, '<li class="kb-bullet-item">$1</li>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.every((c) => c.startsWith('---'))) return '';
      const cellHtml = cells.map((c) => `<td style="border: 1px solid #2E3440; padding: 6px 10px;">${c}</td>`).join('');
      return `<table style="border-collapse: collapse; width: 100%; margin: 8px 0;"><tr>${cellHtml}</tr></table>`;
    });

    // Dividers
    html = html.replace(/^---$/gim, '<hr class="kb-divider" />');

    // Wrap plain lines in paragraphs
    const paragraphs = html
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '<br/>';
        if (
          trimmed.startsWith('<h1') ||
          trimmed.startsWith('<h2') ||
          trimmed.startsWith('<h3') ||
          trimmed.startsWith('<pre') ||
          trimmed.startsWith('<div') ||
          trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<li') ||
          trimmed.startsWith('<table') ||
          trimmed.startsWith('<hr') ||
          trimmed.startsWith('<br')
        ) {
          return line;
        }
        return `<p class="kb-p">${line}</p>`;
      })
      .join('\n');

    return sanitizeHtmlOutput(paragraphs);
  };

  // Convert HTML back to clean Markdown
  const htmlToMarkdown = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtmlOutput(html);

    let md = tempDiv.innerHTML;
    // Replace headings
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

    // Code blocks
    md = md.replace(/<pre[^>]*data-lang="([^"]*)"[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```$1\n$2\n```\n\n');
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```text\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Callouts
    md = md.replace(/<div class="kb-callout kb-callout-critical"[^>]*>([\s\S]*?)<\/div>/gi, '> **CRITICAL**: $1\n\n');
    md = md.replace(/<div class="kb-callout kb-callout-warning"[^>]*>([\s\S]*?)<\/div>/gi, '> **WARNING**: $1\n\n');
    md = md.replace(/<div class="kb-callout kb-callout-info"[^>]*>([\s\S]*?)<\/div>/gi, '> **INFO**: $1\n\n');
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');

    // Checklist items
    md = md.replace(/<div class="kb-checklist-item checked"[^>]*>.*?<span class="check-text checked">(.*?)<\/span><\/div>/gi, '- [x] $1\n');
    md = md.replace(/<div class="kb-checklist-item"[^>]*>.*?<span class="check-text">(.*?)<\/span><\/div>/gi, '- [ ] $1\n');

    // Lists
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Strong & em
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Paragraphs & breaks
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<hr[^>]*>/gi, '---\n\n');

    // Clean up entity encodes
    md = md
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');

    return md.trim();
  };

  // Sync visual editor innerHTML when switching to 'visual' mode
  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = markdownToHtml(content);
    }
  }, [editorMode]);

  // Check for auto-saved draft in localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftStorageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.content && parsed.content !== content) {
          // If there's an existing draft, prompt or note
          setLastAutoSaved(parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString() : 'Previous session');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Periodic Auto-Save to localStorage every 15 seconds if changes occurred
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasUnsavedChanges && (title.trim() || content.trim())) {
        saveDraftLocally();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [hasUnsavedChanges, title, content, space, component, severity, tags, attachments]);

  const saveDraftLocally = () => {
    const draftData = {
      title,
      space,
      component,
      severity,
      status,
      author,
      authorRole,
      summary,
      content,
      tags,
      attachments,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
      setLastAutoSaved(new Date().toLocaleTimeString());
      setHasUnsavedChanges(false);
      return true;
    } catch (e) {
      console.warn('Could not auto-save to localStorage:', e);
      return false;
    }
  };

  const handleManualSaveLocal = () => {
    const success = saveDraftLocally();
    if (success) {
      notify('Draft successfully saved to browser local storage!');
    }
  };

  // Visual Editor Command Executer
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorMode === 'visual') {
      document.execCommand(command, false, value);
      if (visualEditorRef.current) {
        setContent(htmlToMarkdown(visualEditorRef.current.innerHTML));
        setHasUnsavedChanges(true);
      }
    } else {
      // Markdown mode insertions
      insertMarkdownSyntax(command, value);
    }
  };

  // Markdown syntax insertion helper
  const insertMarkdownSyntax = (command: string, param?: string) => {
    let insert = '';
    switch (command) {
      case 'bold':
        insert = '**bold text**';
        break;
      case 'italic':
        insert = '*italic text*';
        break;
      case 'underline':
        insert = '<u>underlined text</u>';
        break;
      case 'strikeThrough':
        insert = '~~strikethrough~~';
        break;
      case 'h1':
        insert = '\n# Heading 1\n';
        break;
      case 'h2':
        insert = '\n## Heading 2\n';
        break;
      case 'h3':
        insert = '\n### Heading 3\n';
        break;
      case 'insertUnorderedList':
        insert = '\n- List item 1\n- List item 2\n';
        break;
      case 'insertOrderedList':
        insert = '\n1. First step\n2. Second step\n';
        break;
      case 'checklist':
        insert = '\n- [ ] Verification step 1\n- [ ] Verification step 2\n';
        break;
      case 'codeblock':
        insert = `\n\`\`\`${param || 'powershell'}\n# Enter code/commands here\n\`\`\`\n`;
        break;
      case 'inlinecode':
        insert = '`code_snippet`';
        break;
      case 'callout-warning':
        insert = '\n> **WARNING**: Review safety precautions prior to executing this step.\n';
        break;
      case 'callout-critical':
        insert = '\n> **CRITICAL CAUTION**: Split-brain risk! Ensure Primary node is isolated.\n';
        break;
      case 'callout-info':
        insert = '\n> **INFO**: This parameter requires Digital Vault restart to take effect.\n';
        break;
      case 'table':
        insert = '\n| Parameter | Recommended Value | Description |\n|---|---|---|\n| CheckInterval | 30 | Vault heartbeat frequency |\n| FailoverMode | Yes | Auto promotion flag |\n';
        break;
      case 'hr':
        insert = '\n---\n';
        break;
      case 'link':
        insert = '[CyberArk Documentation Link](https://docs.cyberark.com)';
        break;
      default:
        break;
    }

    setContent((prev) => prev + insert);
    setHasUnsavedChanges(true);
  };

  // Handle Visual Editor changes
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const updatedMarkdown = htmlToMarkdown(visualEditorRef.current.innerHTML);
      setContent(updatedMarkdown);
      setHasUnsavedChanges(true);
    }
  };

  // Handle Tags
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  // Handle Template Selection
  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    if (
      content.trim().length > 30 &&
      !window.confirm(`Replace current content with "${tmpl.name}"? Current edits will be overwritten.`)
    ) {
      return;
    }
    setContent(tmpl.content);
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = markdownToHtml(tmpl.content);
    }
    setHasUnsavedChanges(true);
    notify(`Loaded ${tmpl.name}`);
  };

  // File Import (Markdown, Text, Confluence HTML export)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      if (!fileData) return;

      const guessedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanTitle = guessedTitle.charAt(0).toUpperCase() + guessedTitle.slice(1);

      setTitle((prev) => prev || cleanTitle);
      setContent(fileData);
      if (editorMode === 'visual' && visualEditorRef.current) {
        visualEditorRef.current.innerHTML = markdownToHtml(fileData);
      }
      setHasUnsavedChanges(true);
      notify(`Imported content from "${file.name}"`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Attachment upload
  const handleAddAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        const newAtt: KbAttachment = {
          id: generateSecureAttachmentId(),
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          uploadedAt: new Date().toISOString(),
          content: textContent,
        };
        setAttachments((prev) => [...prev, newAtt]);
        setHasUnsavedChanges(true);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // ==========================================
  // MULTI-FORMAT EXPORT ENGINE
  // ==========================================

  // 1. Export as Microsoft Word DOC (.doc)
  const handleExportDoc = () => {
    const renderedBodyHtml = markdownToHtml(content);
    const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title || 'Troubleshooting Runbook'}</title>
  <style>
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1e24;
      margin: 2cm;
    }
    h1 {
      font-size: 22pt;
      color: #0A84FF;
      border-bottom: 2pt solid #0A84FF;
      padding-bottom: 6pt;
      margin-top: 0;
    }
    h2 {
      font-size: 16pt;
      color: #12151C;
      border-bottom: 1pt solid #ccc;
      padding-bottom: 4pt;
      margin-top: 18pt;
    }
    h3 {
      font-size: 13pt;
      color: #2E3440;
      margin-top: 12pt;
    }
    .meta-box {
      background-color: #f4f6fa;
      border: 1pt solid #d0d7de;
      padding: 10pt;
      margin-bottom: 18pt;
      font-size: 10pt;
    }
    pre, code {
      font-family: Consolas, 'Courier New', monospace;
      font-size: 10pt;
      background-color: #f1f3f7;
      color: #0c1524;
    }
    pre {
      padding: 10pt;
      border: 1pt solid #d0d7de;
      margin: 10pt 0;
    }
    .kb-callout {
      padding: 8pt 12pt;
      margin: 10pt 0;
      border-left: 4pt solid #0A84FF;
      background-color: #f0f7ff;
    }
    .kb-callout-critical {
      border-left-color: #FF453A;
      background-color: #fff2f2;
      color: #900;
    }
    .kb-callout-warning {
      border-left-color: #FF9F0A;
      background-color: #fffaf0;
      color: #8a5000;
    }
    .kb-callout-info {
      border-left-color: #64D2FF;
      background-color: #f0faff;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }
    th, td {
      border: 1pt solid #d0d7de;
      padding: 6pt 8pt;
      text-align: left;
    }
    th {
      background-color: #f4f6fa;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${title || 'CyberArk PAM Troubleshooting Runbook'}</h1>
  <div class="meta-box">
    <strong>Space:</strong> ${space} &nbsp;|&nbsp;
    <strong>Component:</strong> ${component} &nbsp;|&nbsp;
    <strong>Severity:</strong> ${severity} &nbsp;|&nbsp;
    <strong>Author:</strong> ${author} (${authorRole}) &nbsp;|&nbsp;
    <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
    <strong>Tags:</strong> ${tags.join(', ') || 'Runbook'}<br/>
    <strong>Summary:</strong> ${summary || 'Operational knowledge runbook created in VaultDesk.'}
  </div>

  ${renderedBodyHtml}
</body>
</html>`;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
    const cleanFilename = (title || 'troubleshooting_article').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.doc';
    downloadBlob(blob, cleanFilename);
    notify(`Exported article as Word Document (.doc)`);
    setShowExportMenu(false);
  };

  // 2. Export as PDF (Browser Clean Print Sheet)
  const handleExportPdf = () => {
    const renderedBodyHtml = markdownToHtml(content);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups for PDF generation.');
      return;
    }

    const safePrintTitle = escapeHtml(title || 'Runbook');
    const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safePrintTitle} - VaultDesk PDF Export</title>
  <style>
    @page {
      margin: 1.8cm;
      size: A4 portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111827;
      background: #ffffff;
      padding: 20px;
    }
    h1 {
      font-size: 22pt;
      color: #0056b3;
      border-bottom: 2px solid #0056b3;
      padding-bottom: 8px;
      margin-top: 0;
    }
    h2 {
      font-size: 15pt;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-top: 24px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12pt;
      color: #374151;
      margin-top: 16px;
      page-break-after: avoid;
    }
    .header-card {
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 9.5pt;
    }
    pre, code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
      background: #f3f4f6;
      color: #111827;
    }
    pre {
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    .kb-callout {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      padding: 8px 12px;
      margin: 12px 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .kb-callout-critical {
      border-left-color: #ef4444;
      background: #fef2f2;
      color: #991b1b;
    }
    .kb-callout-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
      color: #92400e;
    }
    .kb-callout-info {
      border-left-color: #06b6d4;
      background: #ecfeff;
      color: #155e75;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 6px 10px;
      text-align: left;
      font-size: 9.5pt;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .print-footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 8.5pt;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <h1>${title || 'CyberArk PAM Troubleshooting Runbook'}</h1>
  <div class="header-card">
    <div><strong>Space:</strong> ${space} &nbsp;|&nbsp; <strong>Component:</strong> ${component} &nbsp;|&nbsp; <strong>Severity:</strong> ${severity}</div>
    <div style="margin-top: 4px;"><strong>Author:</strong> ${author} (${authorRole}) &nbsp;|&nbsp; <strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    ${tags.length > 0 ? `<div style="margin-top: 4px;"><strong>Tags:</strong> ${tags.map((t) => `#${t}`).join(', ')}</div>` : ''}
    ${summary ? `<div style="margin-top: 6px; color: #4b5563;"><em>${summary}</em></div>` : ''}
  </div>

  ${renderedBodyHtml}

  <div class="print-footer">
    <span>VaultDesk Enterprise Knowledge Base</span>
    <span>Confidential - Internal Operations</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    notify('Opened PDF Print Dialog. Select "Save as PDF"');
    setShowExportMenu(false);
  };

  // 3. Export as Markdown (.md)
  const handleExportMarkdown = () => {
    const frontmatter = `---
title: "${title || 'Troubleshooting Runbook'}"
space: "${space}"
component: "${component}"
severity: "${severity}"
status: "${status}"
author: "${author}"
authorRole: "${authorRole}"
date: "${new Date().toISOString()}"
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
summary: "${(summary || '').replace(/"/g, '\\"')}"
---

`;
    const fullMd = frontmatter + content;
    const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
    const cleanFilename = (title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.md';
    downloadBlob(blob, cleanFilename);
    notify(`Exported article as Markdown (.md)`);
    setShowExportMenu(false);
  };

  // 4. Export as Standalone HTML (.html)
  const handleExportHtml = () => {
    const renderedBodyHtml = markdownToHtml(content);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title || 'Troubleshooting Article'}</title>
  <style>
    body {
      background-color: #0B0E14;
      color: #F5F6F8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 24px;
      line-height: 1.6;
    }
    h1 { color: #0A84FF; border-bottom: 2px solid #232833; padding-bottom: 12px; }
    h2 { color: #F5F6F8; border-bottom: 1px solid #232833; padding-bottom: 6px; margin-top: 28px; }
    h3 { color: #64D2FF; margin-top: 20px; }
    pre { background: #12151C; border: 1px solid #2E3440; padding: 14px; border-radius: 8px; overflow-x: auto; color: #F5F6F8; }
    code { font-family: monospace; }
    .meta { background: #12151C; border: 1px solid #2E3440; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #A6AEC0; }
    .kb-callout { padding: 12px 16px; border-radius: 8px; margin: 16px 0; border: 1px solid; }
    .kb-callout-critical { background: #2A1414; border-color: #FF453A; color: #FF857D; }
    .kb-callout-warning { background: #2A1F0C; border-color: #FF9F0A; color: #FFB340; }
    .kb-callout-info { background: #101E26; border-color: #64D2FF; color: #64D2FF; }
  </style>
</head>
<body>
  <h1>${title || 'Troubleshooting Runbook'}</h1>
  <div class="meta">
    <strong>Space:</strong> ${space} | <strong>Component:</strong> ${component} | <strong>Severity:</strong> ${severity}<br/>
    <strong>Author:</strong> ${author} (${authorRole}) | <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
    <strong>Tags:</strong> ${tags.join(', ')}
  </div>
  ${renderedBodyHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const cleanFilename = (title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.html';
    downloadBlob(blob, cleanFilename);
    notify(`Exported standalone HTML document (.html)`);
    setShowExportMenu(false);
  };

  // Helper to trigger download
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle final save (publish / draft)
  const handleFinalSave = (targetStatus: KbArticleStatus = 'published') => {
    if (!title.trim()) {
      alert('Please provide a title for the troubleshooting article.');
      return;
    }

    // Save to local storage first
    saveDraftLocally();

    const articleData: Partial<LocalKbArticle> = {
      title: title.trim(),
      space,
      component,
      severity,
      status: targetStatus,
      author: author.trim() || 'Internal Operator',
      authorRole: authorRole.trim() || 'PAM Team',
      summary: summary.trim() || content.slice(0, 160).replace(/[#*`]/g, '') + '...',
      content,
      tags,
      attachments,
    };

    onSave(articleData, targetStatus);
  };

  return (
    <div className="rounded-[14px] bg-[#12151C] border border-[#232833] p-5 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.4)] space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/50 text-xs text-[#30D158] shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#30D158]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileImportRef}
        type="file"
        accept=".md,.txt,.json,.html,.doc"
        className="hidden"
        onChange={handleImportFile}
      />
      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAddAttachments}
      />

      {/* Editor Top Bar: Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#232833]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-center text-[#0A84FF]">
            {isNew ? <FileCode className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#F5F6F8]">
                {isNew ? 'New Troubleshooting Article' : `Editing: ${title || 'Article'}`}
              </h2>
              <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30">
                Rich-Text Engine
              </span>
              {lastAutoSaved && (
                <span className="flex items-center gap-1 text-[11px] text-[#30D158] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                  Auto-saved {lastAutoSaved}
                </span>
              )}
            </div>
            <p className="text-xs text-[#A6AEC0] mt-0.5">
              Author, format, preview, and save operational runbooks locally with multi-format doc & PDF exports.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* File Import */}
          <button
            type="button"
            onClick={() => fileImportRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
            title="Import text, markdown, or HTML from file"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
              title="Export article to Doc, PDF, Markdown, or HTML"
            >
              <Download className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Export As</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-1.5 z-40 space-y-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleExportDoc}
                  className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#F5F6F8] hover:bg-[#232833] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0A84FF]" />
                    <span>Word Document (.doc)</span>
                  </span>
                  <span className="text-[10px] text-[#A6AEC0] font-mono">MS Word</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#F5F6F8] hover:bg-[#232833] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#FF453A]" />
                    <span>PDF Document (.pdf)</span>
                  </span>
                  <span className="text-[10px] text-[#A6AEC0] font-mono">Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#F5F6F8] hover:bg-[#232833] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#30D158]" />
                    <span>Markdown (.md)</span>
                  </span>
                  <span className="text-[10px] text-[#A6AEC0] font-mono">MD</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#F5F6F8] hover:bg-[#232833] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-[#FF9F0A]" />
                    <span>Standalone Web Page (.html)</span>
                  </span>
                  <span className="text-[10px] text-[#A6AEC0] font-mono">HTML</span>
                </button>
              </div>
            )}
          </div>

          {/* Save to Local Storage Button */}
          <button
            type="button"
            onClick={handleManualSaveLocal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#30D158] text-xs font-semibold border border-[#2E3440] transition-colors"
            title="Explicitly save working copy to browser local storage"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Save to Local</span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
          >
            Cancel
          </button>

          {/* Draft button */}
          <button
            type="button"
            onClick={() => handleFinalSave('draft')}
            className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#FF9F0A] text-xs font-semibold border border-[#2E3440] transition-colors"
          >
            Save Draft
          </button>

          {/* Publish button */}
          <button
            type="button"
            onClick={() => handleFinalSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Article Metadata Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Title Input */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-xs font-semibold text-[#A6AEC0] block">
            Article Title <span className="text-[#FF453A]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="e.g. SOP: Emergency DR Vault Failover & PADR Resync..."
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF]"
          />
        </div>

        {/* Space Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#A6AEC0] block">
            Knowledge Space
          </label>
          <select
            value={space}
            onChange={(e) => {
              setSpace(e.target.value as KbSpace);
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="Runbooks & SOPs">Runbooks & SOPs</option>
            <option value="Incident Post-Mortems">Incident Post-Mortems</option>
            <option value="Architecture & Hardening">Architecture & Hardening</option>
            <option value="Upgrade Playbooks">Upgrade Playbooks</option>
            <option value="Custom Connectors">Custom Connectors</option>
            <option value="General">General</option>
          </select>
        </div>

        {/* PAM Component */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#A6AEC0] block">
            Target PAM Component
          </label>
          <select
            value={component}
            onChange={(e) => {
              setComponent(e.target.value as PamComponent);
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs focus:outline-none focus:border-[#0A84FF]"
          >
            {['Vault', 'PVWA', 'CPM', 'PSM', 'PTA', 'CCP', 'Conjur', 'Privilege Cloud', 'General'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#A6AEC0] block">
            Severity / Impact
          </label>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value as SeverityLevel);
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="Critical">Critical (P1 Outage / DR)</option>
            <option value="High">High (Service Degradation)</option>
            <option value="Medium">Medium (Standard Maintenance)</option>
            <option value="Low">Low (Informational SOP)</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#A6AEC0] block">
            Publication Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as KbArticleStatus);
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="under-review">Under Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Author */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#A6AEC0] block">
            Author & Role
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Author"
              className="w-1/2 px-2.5 py-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs"
            />
            <input
              type="text"
              value={authorRole}
              onChange={(e) => {
                setAuthorRole(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Role"
              className="w-1/2 px-2.5 py-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary Excerpt */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#A6AEC0] block">
          Executive Summary / Troubleshooting Excerpt
        </label>
        <input
          type="text"
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            setHasUnsavedChanges(true);
          }}
          placeholder="Brief 1-2 sentence description for quick previews in search results..."
          className="w-full px-3 py-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs placeholder-[#6E7787]"
        />
      </div>

      {/* Quick Template Selector Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[#6E7787] text-[11px] font-semibold mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#FF9F0A]" />
          Pre-Built Templates:
        </span>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.name}
            type="button"
            onClick={() => handleApplyTemplate(tmpl)}
            className="px-2.5 py-1 rounded-[6px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440] transition-colors text-[11px]"
            title={tmpl.description}
          >
            {tmpl.name}
          </button>
        ))}
      </div>

      {/* ========================================================
          RICH-TEXT FORMATTING TOOLBAR & MODE CONTROLS
          ======================================================== */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-[10px] bg-[#1A1E27] border border-[#2E3440]">
          {/* Formatting Buttons */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {/* Bold */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440]"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            {/* Italic */}
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440]"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            {/* Underline */}
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440]"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#A6AEC0] border border-[#2E3440]"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-5 bg-[#2E3440] mx-1" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => execCmd('h2')}
              className="px-2 py-1 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] font-bold text-xs border border-[#2E3440]"
              title="Heading 2 (## Section)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => execCmd('h3')}
              className="px-2 py-1 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] font-bold text-xs border border-[#2E3440]"
              title="Heading 3 (### Sub-section)"
            >
              H3
            </button>

            <span className="w-px h-5 bg-[#2E3440] mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440]"
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440]"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            {/* Checklist */}
            <button
              type="button"
              onClick={() => execCmd('checklist')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#30D158] font-semibold text-xs border border-[#2E3440]"
              title="Insert Interactive Checklist (- [ ])"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist</span>
            </button>

            <span className="w-px h-5 bg-[#2E3440] mx-1" />

            {/* Code Block */}
            <button
              type="button"
              onClick={() => execCmd('codeblock', 'powershell')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#0A84FF] font-mono text-[11px] border border-[#2E3440]"
              title="Insert PowerShell / Command Code Block"
            >
              <Code className="w-3.5 h-3.5" />
              <span>&lt;code&gt;</span>
            </button>

            {/* Callouts */}
            <button
              type="button"
              onClick={() => execCmd('callout-warning')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#2A1F0C] hover:bg-[#2A1F0C]/80 text-[#FF9F0A] font-semibold text-xs border border-[#FF9F0A]/40"
              title="Warning Callout Box"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Warn</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd('callout-critical')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#2A1414] hover:bg-[#2A1414]/80 text-[#FF453A] font-semibold text-xs border border-[#FF453A]/40"
              title="Critical Caution Box"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Crit</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd('callout-info')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#101E26] hover:bg-[#101E26]/80 text-[#64D2FF] font-semibold text-xs border border-[#64D2FF]/30"
              title="Info Callout Box"
            >
              <Info className="w-3 h-3" />
              <span>Info</span>
            </button>

            <span className="w-px h-5 bg-[#2E3440] mx-1" />

            {/* Table */}
            <button
              type="button"
              onClick={() => execCmd('table')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440]"
              title="Insert Table"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            {/* Divider */}
            <button
              type="button"
              onClick={() => execCmd('hr')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440]"
              title="Horizontal Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            {/* Link */}
            <button
              type="button"
              onClick={() => execCmd('link')}
              className="p-1.5 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440]"
              title="Insert Link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#12151C] p-0.5 rounded-[8px] border border-[#2E3440] text-xs shrink-0">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-colors ${
                editorMode === 'visual' ? 'bg-[#1A1E27] text-[#0A84FF] font-semibold' : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Visual WYSIWYG rich text editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('markdown')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-colors ${
                editorMode === 'markdown' ? 'bg-[#1A1E27] text-[#0A84FF] font-semibold' : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Markdown syntax source editor"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('split')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-colors hidden sm:inline-flex ${
                editorMode === 'split' ? 'bg-[#1A1E27] text-[#0A84FF] font-semibold' : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Split-screen editor and live preview"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-colors ${
                editorMode === 'preview' ? 'bg-[#1A1E27] text-[#0A84FF] font-semibold' : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Full reader preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            EDITOR WORKSPACES ACCORDING TO ACTIVE MODE
            ======================================================== */}

        {/* 1. VISUAL WYSIWYG MODE */}
        {editorMode === 'visual' && (
          <div className="relative">
            <div
              ref={visualEditorRef}
              contentEditable
              onInput={handleVisualInput}
              className="w-full min-h-[420px] max-h-[650px] overflow-y-auto p-5 rounded-[10px] bg-[#0B0E14] border border-[#2E3440] text-[#F5F6F8] text-sm leading-relaxed focus:outline-none focus:border-[#0A84FF] font-sans selection:bg-[#0A84FF] selection:text-[#0B0E14]"
              style={{ minHeight: '420px' }}
            />
          </div>
        )}

        {/* 2. MARKDOWN SOURCE MODE */}
        {editorMode === 'markdown' && (
          <textarea
            rows={18}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Type troubleshooting steps in Markdown. Use ## for headings, ```powershell for logs/commands, - [ ] for checklists..."
            className="w-full p-4 rounded-[10px] bg-[#0B0E14] border border-[#2E3440] text-[#F5F6F8] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#0A84FF] resize-y selection:bg-[#0A84FF] selection:text-[#0B0E14]"
          />
        )}

        {/* 3. SPLIT SCREEN MODE */}
        {editorMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[#6E7787] uppercase tracking-wider block">
                Source Editor (Markdown)
              </span>
              <textarea
                rows={18}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full p-4 rounded-[10px] bg-[#0B0E14] border border-[#2E3440] text-[#F5F6F8] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#0A84FF] resize-y"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[#6E7787] uppercase tracking-wider block">
                Live Rendered Document
              </span>
              <div
                className="p-5 rounded-[10px] bg-[#12151C] border border-[#2E3440] overflow-y-auto max-h-[460px] text-sm leading-relaxed text-[#F5F6F8]"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
              />
            </div>
          </div>
        )}

        {/* 4. FULL PREVIEW MODE */}
        {editorMode === 'preview' && (
          <div className="p-6 sm:p-8 rounded-[10px] bg-[#12151C] border border-[#2E3440] overflow-y-auto max-h-[600px] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <span className="text-xs font-semibold text-[#6E7787] uppercase tracking-wider">
                Published Document Preview
              </span>
              <span className="text-xs font-mono text-[#A6AEC0]">
                Space: {space} • {component}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#F5F6F8] tracking-tight">{title || 'Untitled Article'}</h1>
            {summary && <p className="text-sm text-[#A6AEC0] italic border-l-2 border-[#0A84FF] pl-3 py-1">{summary}</p>}

            <div
              className="text-sm leading-relaxed text-[#F5F6F8] pt-2"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}
      </div>

      {/* Tags & Attachments Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#232833]">
        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#A6AEC0] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Search & Filter Tags</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="e.g., Failover, AppLocker, CACPM406E..."
              className="flex-1 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs placeholder-[#6E7787]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-xs font-semibold border border-[#2E3440]"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-[#6E7787] hover:text-[#FF453A]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#A6AEC0] flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Attachments & Code Files ({attachments.length})</span>
            </label>
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#1A1E27] hover:bg-[#232833] text-xs font-semibold text-[#0A84FF] border border-[#2E3440]"
            >
              <span>+ Add File</span>
            </button>
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs text-[#6E7787] italic">
              No files attached. Attach .ps1 scripts, dbparm.ini snippets, or diagnostic traces.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
              {attachments.map((att, i) => (
                <div
                  key={att.id || i}
                  className="p-2 rounded-[6px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-[11px] truncate text-[#F5F6F8]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                    className="text-[#6E7787] hover:text-[#FF453A] ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
