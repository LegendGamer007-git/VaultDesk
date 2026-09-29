import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Edit3,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Paperclip,
  CheckSquare,
  Square,
  Clock,
  User,
  Tag,
  FolderOpen,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  AlertTriangle,
  Info,
  ShieldAlert,
  Shield,
  Code2,
  Layers,
  FileCode,
  FilePlus,
  RefreshCw,
  X,
  FileDown,
  Printer,
  Calendar,
} from 'lucide-react';
import {
  LocalKbArticle,
  KbSpace,
  KbArticleStatus,
  PamComponent,
  SeverityLevel,
  KbAttachment,
  UserProfile,
} from '../types';
import { INITIAL_LOCAL_KB_ARTICLES } from '../data/initialLocalKb';
import { RichTextEditor } from './RichTextEditor';

interface LocalKnowledgeBaseProps {
  onBookmarkArticle?: (title: string, id: string, component: PamComponent) => void;
  initialSearchQuery?: string;
  currentUser?: UserProfile | null;
}

const SPACES: { name: KbSpace; description: string; iconColor: string }[] = [
  { name: 'Runbooks & SOPs', description: 'Step-by-step operational standard operating procedures', iconColor: 'text-[#0A84FF]' },
  { name: 'Incident Post-Mortems', description: 'RCA findings, preventive controls, and timeline reviews', iconColor: 'text-[#FF453A]' },
  { name: 'Architecture & Hardening', description: 'Infrastructure blueprints, security hardening, AppLocker rules', iconColor: 'text-[#30D158]' },
  { name: 'Upgrade Playbooks', description: 'Version upgrade guides, breaking changes, and migration plans', iconColor: 'text-[#FF9F0A]' },
  { name: 'Custom Connectors', description: 'In-house dispatchers, CPM plugins, and API integrations', iconColor: 'text-[#64D2FF]' },
  { name: 'General', description: 'Team guidelines, onboarding, and miscellaneous reference docs', iconColor: 'text-[#A6AEC0]' },
];

const COMPONENTS: (PamComponent | 'All')[] = [
  'All',
  'Vault',
  'PVWA',
  'CPM',
  'PSM',
  'PTA',
  'CCP',
  'Conjur',
  'Privilege Cloud',
  'General',
];

const generateSecureId = (prefix: string): string => {
  try {
    const array = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    }
    return `${prefix}-${Date.now()}-${array[0].toString(36)}`;
  } catch {
    return `${prefix}-${Date.now()}-${Date.now().toString(36)}`;
  }
};

const SAMPLE_SOP_TEMPLATE = `## 1. Objective & Scope
Briefly describe the purpose of this procedure and what environments (Prod, DR, Staging) it applies to.

## 2. Prerequisites & Safety Precautions
- Verify administrative access to the target host.
- [ ] Safe configuration backup completed.
- [ ] Change ticket approved (Ticket #CR-XXXX).

> **WARNING**: Review security policy requirements prior to stopping services.

## 3. Step-by-Step Execution
### Step 1: Preliminary Verification
\`\`\`powershell
# Verify service status
Get-Service -Name "CyberArk*"
\`\`\`

### Step 2: Main Procedure
1. Execute the maintenance task following vendor guidance.
2. Confirm configuration changes in the relevant .ini or .xml file.

## 4. Verification & Validation Checklist
- [ ] Service restarted and reports healthy state.
- [ ] Verification test account successfully verified in PVWA.
- [ ] Diagnostic logs show zero fatal exceptions.

## 5. Rollback Plan
If validation fails within the maintenance window:
1. Restore previous configuration file from backup.
2. Restart CyberArk service and notify on-call engineer.`;

export const LocalKnowledgeBase: React.FC<LocalKnowledgeBaseProps> = ({
  onBookmarkArticle,
  initialSearchQuery = '',
  currentUser,
}) => {
  const canAuthor = !currentUser || currentUser.role === 'admin' || currentUser.role === 'engineer' || currentUser.permissions?.includes('kb:write');
  const isReaderRole = currentUser?.role === 'reader';

  // Articles state (loaded from API with localStorage fallback)
  const [articles, setArticles] = useState<LocalKbArticle[]>(() => {
    try {
      const saved = localStorage.getItem('vaultdesk_local_kb');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LOCAL_KB_ARTICLES;
  });

  // Navigation & View Mode
  const [selectedSpace, setSelectedSpace] = useState<string>('All');
  const [selectedComponent, setSelectedComponent] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'updated' | 'views' | 'helpful' | 'title'>('updated');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Active viewing/editing article
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Editor form state
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [editorSpace, setEditorSpace] = useState<KbSpace>('Runbooks & SOPs');
  const [editorComponent, setEditorComponent] = useState<PamComponent>('Vault');
  const [editorSeverity, setEditorSeverity] = useState<SeverityLevel>('Medium');
  const [editorStatus, setEditorStatus] = useState<KbArticleStatus>('published');
  const [editorAuthor, setEditorAuthor] = useState<string>('Internal SecOps');
  const [editorAuthorRole, setEditorAuthorRole] = useState<string>('PAM Engineer');
  const [editorSummary, setEditorSummary] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorTagInput, setEditorTagInput] = useState<string>('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorAttachments, setEditorAttachments] = useState<KbAttachment[]>([]);
  const [editorMode, setEditorMode] = useState<'write' | 'split' | 'preview'>('write');

  // UI feedback states
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [votedArticles, setVotedArticles] = useState<Set<string>>(new Set());
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, boolean>>({});

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Sync to API on mount and load freshest data
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/kb');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setArticles(data);
            localStorage.setItem('vaultdesk_local_kb', JSON.stringify(data));
          }
        }
      } catch (err) {
        console.warn('Could not fetch from /api/kb, using local state:', err);
      }
    };
    fetchArticles();
  }, []);

  // Sync state to localStorage whenever articles change
  useEffect(() => {
    try {
      localStorage.setItem('vaultdesk_local_kb', JSON.stringify(articles));
    } catch {
      // ignore
    }
  }, [articles]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Currently active article object
  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return articles.find((a) => a.id === activeArticleId) || null;
  }, [activeArticleId, articles]);

  // Filtered & sorted articles
  const filteredArticles = useMemo(() => {
    return articles
      .filter((art) => {
        if (selectedSpace !== 'All' && art.space.toLowerCase() !== selectedSpace.toLowerCase()) {
          return false;
        }
        if (selectedComponent !== 'All' && art.component.toLowerCase() !== selectedComponent.toLowerCase()) {
          return false;
        }
        if (selectedStatus !== 'All' && art.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = art.title.toLowerCase().includes(q);
          const matchSummary = art.summary.toLowerCase().includes(q);
          const matchContent = art.content.toLowerCase().includes(q);
          const matchTags = art.tags.some((t) => t.toLowerCase().includes(q));
          const matchAuthor = art.author.toLowerCase().includes(q);
          const matchSteps = art.runbookSteps?.some((s) => s.toLowerCase().includes(q));
          return matchTitle || matchSummary || matchContent || matchTags || matchAuthor || matchSteps;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'views') {
          return (b.views || 0) - (a.views || 0);
        }
        if (sortBy === 'helpful') {
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        }
        return a.title.localeCompare(b.title);
      });
  }, [articles, selectedSpace, selectedComponent, selectedStatus, searchQuery, sortBy]);

  // Space stats counts
  const spaceCounts = useMemo(() => {
    const counts: Record<string, number> = { All: articles.length };
    articles.forEach((a) => {
      counts[a.space] = (counts[a.space] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Open editor for creating new article
  const handleOpenCreate = () => {
    if (!canAuthor) {
      showNotification('Reader Mode: Creating runbooks requires Engineer or Admin privileges.');
      return;
    }
    setEditorTitle('');
    setEditorSpace(selectedSpace !== 'All' ? (selectedSpace as KbSpace) : 'Runbooks & SOPs');
    setEditorComponent(selectedComponent !== 'All' ? (selectedComponent as PamComponent) : 'Vault');
    setEditorSeverity('Medium');
    setEditorStatus('published');
    setEditorAuthor(currentUser?.name || 'Alexander Ward');
    setEditorAuthorRole(
      currentUser?.role === 'custom' && currentUser?.customRoleName
        ? currentUser.customRoleName
        : currentUser?.role
        ? currentUser.role.toUpperCase()
        : 'PAM Operations Engineer'
    );
    setEditorSummary('');
    setEditorContent(SAMPLE_SOP_TEMPLATE);
    setEditorTags(['Runbook', 'Internal', 'SOP']);
    setEditorTagInput('');
    setEditorAttachments([]);
    setEditorMode('write');
    setIsCreating(true);
    setIsEditing(false);
  };

  // Open editor for updating existing article
  const handleOpenEdit = (article: LocalKbArticle) => {
    if (!canAuthor) {
      showNotification('Reader Mode: Editing runbooks requires Engineer or Admin privileges.');
      return;
    }
    setEditorTitle(article.title);
    setEditorSpace(article.space);
    setEditorComponent(article.component);
    setEditorSeverity(article.severity || 'Medium');
    setEditorStatus(article.status);
    setEditorAuthor(article.author);
    setEditorAuthorRole(article.authorRole || 'PAM Engineer');
    setEditorSummary(article.summary);
    setEditorContent(article.content);
    setEditorTags([...article.tags]);
    setEditorTagInput('');
    setEditorAttachments([...article.attachments]);
    setEditorMode('write');
    setIsEditing(true);
    setIsCreating(false);
  };

  // Save article (Create or Update)
  const handleSaveArticle = async (statusOverride?: KbArticleStatus) => {
    if (!editorTitle.trim()) {
      alert('Please provide an article title.');
      return;
    }

    const finalStatus = statusOverride || editorStatus;
    const now = new Date().toISOString();
    const slug = editorTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (isCreating) {
      const newArticle: LocalKbArticle = {
        id: generateSecureId('kb'),
        title: editorTitle.trim(),
        slug,
        space: editorSpace,
        component: editorComponent,
        severity: editorSeverity,
        status: finalStatus,
        author: editorAuthor.trim() || 'Internal Operator',
        authorRole: editorAuthorRole.trim() || 'SecOps',
        summary: editorSummary.trim() || editorContent.slice(0, 160).replace(/[#*`]/g, '') + '...',
        content: editorContent,
        tags: editorTags,
        createdAt: now,
        updatedAt: now,
        views: 1,
        helpfulCount: 0,
        attachments: editorAttachments,
      };

      // Optimistic state update
      setArticles((prev) => [newArticle, ...prev]);
      setActiveArticleId(newArticle.id);
      setIsCreating(false);
      showNotification(`Article "${newArticle.title}" created successfully!`);

      // Backend sync
      try {
        await fetch('/api/kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArticle),
        });
      } catch (err) {
        console.warn('Backend sync failed, stored in localStorage:', err);
      }
    } else if (isEditing && activeArticle) {
      const updated: LocalKbArticle = {
        ...activeArticle,
        title: editorTitle.trim(),
        slug,
        space: editorSpace,
        component: editorComponent,
        severity: editorSeverity,
        status: finalStatus,
        author: editorAuthor.trim() || activeArticle.author,
        authorRole: editorAuthorRole.trim() || activeArticle.authorRole,
        summary: editorSummary.trim() || editorContent.slice(0, 160).replace(/[#*`]/g, '') + '...',
        content: editorContent,
        tags: editorTags,
        attachments: editorAttachments,
        updatedAt: now,
      };

      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setIsEditing(false);
      showNotification(`Article "${updated.title}" updated.`);

      try {
        await fetch(`/api/kb/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.warn('Backend sync failed, updated in localStorage:', err);
      }
    }
  };

  // Save article callback from RichTextEditor (supports auto-save, drafts, and publication)
  const handleSaveArticleFromEditor = async (
    data: Partial<LocalKbArticle>,
    finalStatus: KbArticleStatus
  ) => {
    const now = new Date().toISOString();
    const cleanTitle = (data.title || editorTitle || '').trim();
    if (!cleanTitle) {
      alert('Please provide an article title before saving.');
      return;
    }

    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (isCreating) {
      const newArticle: LocalKbArticle = {
        id: generateSecureId('kb'),
        title: cleanTitle,
        slug,
        space: data.space || editorSpace || 'Runbooks & SOPs',
        component: data.component || editorComponent || 'Vault',
        severity: data.severity || editorSeverity || 'Medium',
        status: finalStatus,
        author: (data.author || editorAuthor || 'SecOps Team').trim(),
        authorRole: (data.authorRole || editorAuthorRole || 'PAM Operations Engineer').trim(),
        summary:
          (data.summary || editorSummary || '').trim() ||
          (data.content || '').slice(0, 160).replace(/[#*`\n]/g, ' ').trim() + '...',
        content: data.content || '',
        tags: data.tags || editorTags || ['Runbook'],
        createdAt: now,
        updatedAt: now,
        views: 1,
        helpfulCount: 0,
        attachments: data.attachments || editorAttachments || [],
      };

      setArticles((prev) => [newArticle, ...prev]);
      setActiveArticleId(newArticle.id);
      setIsCreating(false);
      showNotification(`Article "${newArticle.title}" saved successfully!`);

      try {
        await fetch('/api/kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArticle),
        });
      } catch (err) {
        console.warn('Backend sync failed, saved in local storage:', err);
      }
    } else if (isEditing && activeArticle) {
      const updated: LocalKbArticle = {
        ...activeArticle,
        title: cleanTitle,
        slug,
        space: data.space || activeArticle.space,
        component: data.component || activeArticle.component,
        severity: data.severity || activeArticle.severity,
        status: finalStatus,
        author: (data.author || activeArticle.author).trim(),
        authorRole: (data.authorRole || activeArticle.authorRole || '').trim(),
        summary:
          (data.summary || '').trim() ||
          (data.content || activeArticle.content).slice(0, 160).replace(/[#*`\n]/g, ' ').trim() + '...',
        content: data.content !== undefined ? data.content : activeArticle.content,
        tags: data.tags || activeArticle.tags,
        attachments: data.attachments || activeArticle.attachments,
        updatedAt: now,
      };

      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setIsEditing(false);
      showNotification(`Article "${updated.title}" updated.`);

      try {
        await fetch(`/api/kb/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.warn('Backend sync failed, updated in localStorage:', err);
      }
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = articles.find((a) => a.id === id);
    if (!target) return;

    if (!window.confirm(`Are you sure you want to delete "${target.title}"?`)) {
      return;
    }

    setArticles((prev) => prev.filter((a) => a.id !== id));
    if (activeArticleId === id) {
      setActiveArticleId(null);
      setIsEditing(false);
    }
    showNotification(`Deleted "${target.title}".`);

    try {
      await fetch(`/api/kb/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete failed, removed locally:', err);
    }
  };

  // Duplicate article
  const handleDuplicateArticle = (article: LocalKbArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const now = new Date().toISOString();
    const duplicated: LocalKbArticle = {
      ...article,
      id: generateSecureId('kb'),
      title: `${article.title} (Copy)`,
      slug: `${article.slug}-copy`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      views: 0,
      helpfulCount: 0,
    };
    setArticles((prev) => [duplicated, ...prev]);
    setActiveArticleId(duplicated.id);
    showNotification(`Duplicated as draft: "${duplicated.title}"`);
  };

  // Vote helpful
  const handleVoteHelpful = async (id: string) => {
    if (votedArticles.has(id)) return;
    setVotedArticles((prev) => new Set(prev).add(id));

    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, helpfulCount: (a.helpfulCount || 0) + 1 } : a))
    );

    try {
      await fetch(`/api/kb/${id}/vote`, { method: 'POST' });
    } catch {
      // ignore
    }
  };

  // Tag manipulation
  const handleAddTag = () => {
    const trimmed = editorTagInput.trim().replace(/^#/, '');
    if (trimmed && !editorTags.includes(trimmed)) {
      setEditorTags([...editorTags, trimmed]);
      setEditorTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditorTags(editorTags.filter((t) => t !== tagToRemove));
  };

  // File import (Markdown / Confluence export file upload)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const titleGuess = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const formattedTitle = titleGuess.charAt(0).toUpperCase() + titleGuess.slice(1);

      // Populate into creator
      setEditorTitle(formattedTitle);
      setEditorSpace('Runbooks & SOPs');
      setEditorComponent('General');
      setEditorSeverity('Medium');
      setEditorStatus('published');
      setEditorAuthor('File Importer');
      setEditorAuthorRole('Confluence Migration');
      setEditorSummary(content.slice(0, 150).replace(/[#*`]/g, '') + '...');
      setEditorContent(content);
      setEditorTags(['Imported', 'Confluence']);
      setEditorAttachments([]);
      setIsCreating(true);
      setIsEditing(false);
      showNotification(`Imported file "${file.name}". Review and publish.`);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Add file attachment to editor
  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        const newAtt: KbAttachment = {
          id: generateSecureId('att'),
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          uploadedAt: new Date().toISOString(),
          content: fileContent,
        };
        setEditorAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // Export current article to Markdown (.md)
  const handleExportMarkdown = (article: LocalKbArticle) => {
    const frontmatter = `---
title: "${article.title}"
space: "${article.space}"
component: "${article.component}"
severity: "${article.severity}"
author: "${article.author}"
date: "${article.updatedAt}"
tags: [${article.tags.map((t) => `"${t}"`).join(', ')}]
---

`;
    const fullText = frontmatter + article.content;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${article.slug || 'runbook'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Exported "${article.title}.md"`);
  };

  // Export current article to Microsoft Word (.doc)
  const handleExportDoc = (article: LocalKbArticle) => {
    let html = article.content
      .replace(/^### (.*$)/gim, '<h3 style="font-size:13pt;color:#2E3440;margin-top:12pt;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:16pt;color:#12151C;border-bottom:1pt solid #ccc;padding-bottom:3pt;margin-top:16pt;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size:20pt;color:#0A84FF;border-bottom:2pt solid #0A84FF;padding-bottom:4pt;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre style="background:#f1f3f7;padding:10pt;border:1pt solid #d0d7de;font-family:Consolas,monospace;font-size:10pt;margin:10pt 0;">$1</pre>')
      .replace(/`([^`]+)`/gim, '<code style="background:#f1f3f7;font-family:Consolas,monospace;padding:2pt 4pt;font-size:10pt;">$1</code>')
      .replace(/\n/gim, '<br/>');

    const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${article.title}</title>
<style>
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1e24; margin: 2cm; }
  h1 { font-size: 20pt; color: #0A84FF; border-bottom: 2pt solid #0A84FF; padding-bottom: 4pt; margin-top: 0; }
  .meta-box { background: #f4f6fa; border: 1pt solid #d0d7de; padding: 10pt; margin-bottom: 16pt; font-size: 10pt; }
</style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="meta-box">
    <strong>Space:</strong> ${article.space} &nbsp;|&nbsp;
    <strong>Component:</strong> ${article.component} &nbsp;|&nbsp;
    <strong>Severity:</strong> ${article.severity || 'Medium'} &nbsp;|&nbsp;
    <strong>Author:</strong> ${article.author} (${article.authorRole || 'SecOps'}) &nbsp;|&nbsp;
    <strong>Date:</strong> ${new Date(article.updatedAt).toLocaleDateString()}<br/>
    <strong>Tags:</strong> ${article.tags.join(', ')}<br/>
    <strong>Summary:</strong> ${article.summary}
  </div>
  ${html}
</body>
</html>`;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${article.slug || 'runbook'}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Exported "${article.title}.doc"`);
  };

  // Export current article to PDF via browser print view
  const handleExportPdf = (article: LocalKbArticle) => {
    let html = article.content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre>$1</pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br/>');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups for PDF generation.');
      return;
    }

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${article.title} - VaultDesk PDF Export</title>
  <style>
    @page { margin: 1.8cm; size: A4 portrait; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; line-height: 1.6; color: #111827; padding: 20px; }
    h1 { font-size: 22pt; color: #0A84FF; border-bottom: 2px solid #0A84FF; padding-bottom: 6px; }
    h2 { font-size: 15pt; color: #1F2937; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin-top: 20px; }
    h3 { font-size: 12pt; color: #374151; margin-top: 14px; }
    .meta-box { background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 10pt; color: #4B5563; }
    pre { background: #1E293B; color: #F8FAFC; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 10pt; white-space: pre-wrap; }
    code { font-family: monospace; background: #E2E8F0; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="meta-box">
    <strong>Space:</strong> ${article.space} | <strong>Component:</strong> ${article.component} | <strong>Severity:</strong> ${article.severity || 'Medium'}<br/>
    <strong>Author:</strong> ${article.author} (${article.authorRole || 'SecOps'}) | <strong>Date:</strong> ${new Date(article.updatedAt).toLocaleDateString()}<br/>
    <strong>Tags:</strong> ${article.tags.join(', ')}<br/>
    <strong>Summary:</strong> ${article.summary}
  </div>
  ${html}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
    showNotification(`Opened print view for "${article.title}.pdf"`);
  };

  // Copy code block helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeSnippet(id);
    setTimeout(() => setCopiedCodeSnippet(null), 2500);
  };

  // Copy article link
  const handleCopyArticleLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper for severity badge
  const getSeverityBadge = (sev?: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return 'bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/40 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'High':
        return 'bg-[#2A1F0C] text-[#FF9F0A] border border-[#FF9F0A]/40 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'Medium':
        return 'bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'Low':
        return 'bg-[#12241A] text-[#30D158] border border-[#30D158]/30 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      default:
        return 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440] rounded-full px-2.5 py-0.5 text-xs font-semibold';
    }
  };

  // Helper for status pill
  const getStatusPill = (status: KbArticleStatus) => {
    switch (status) {
      case 'published':
        return 'bg-[#12241A] text-[#30D158] border border-[#30D158]/30';
      case 'draft':
        return 'bg-[#2A1F0C] text-[#FF9F0A] border border-[#FF9F0A]/40';
      case 'under-review':
        return 'bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30';
      case 'archived':
        return 'bg-[#1A1E27] text-[#6E7787] border border-[#2E3440]';
      default:
        return 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]';
    }
  };

  // Simple Markdown Parser & Renderer for the Reader view
  const renderMarkdown = (raw: string) => {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeBlockIndex = 0;

    lines.forEach((line, idx) => {
      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const currentCode = codeBuffer.join('\n');
          const snippetId = `code-block-${codeBlockIndex++}`;
          elements.push(
            <div key={snippetId} className="my-4 rounded-[10px] bg-[#0B0E14] border border-[#2E3440] overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#12151C] border-b border-[#232833] text-xs font-mono text-[#A6AEC0]">
                <span>{codeLanguage || 'terminal'}</span>
                <button
                  onClick={() => handleCopyCode(currentCode, snippetId)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1A1E27] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440] transition-colors"
                >
                  {copiedCodeSnippet === snippetId ? (
                    <>
                      <Check className="w-3 h-3 text-[#30D158]" />
                      <span className="text-[#30D158]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#F5F6F8] overflow-x-auto leading-relaxed whitespace-pre">
                {currentCode}
              </pre>
            </div>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headings
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${idx}`} className="text-lg sm:text-xl font-bold text-[#F5F6F8] tracking-tight mt-6 mb-3 pb-1 border-b border-[#232833] flex items-center gap-2">
            <span>{line.replace('## ', '')}</span>
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="text-base font-semibold text-[#F5F6F8] tracking-tight mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }

      // Blockquotes / Warnings
      if (line.startsWith('> ')) {
        const calloutText = line.replace('> ', '');
        const isCritical = calloutText.toLowerCase().includes('critical') || calloutText.toLowerCase().includes('danger');
        const isWarning = calloutText.toLowerCase().includes('warning') || calloutText.toLowerCase().includes('caution');

        elements.push(
          <div
            key={`quote-${idx}`}
            className={`my-3 p-3.5 rounded-[10px] text-xs leading-relaxed flex items-start gap-2.5 ${
              isCritical
                ? 'bg-[#2A1414] border border-[#FF453A]/40 text-[#FF857D]'
                : isWarning
                ? 'bg-[#2A1F0C] border border-[#FF9F0A]/40 text-[#FFB340]'
                : 'bg-[#101E26] border border-[#64D2FF]/30 text-[#64D2FF]'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#FF453A] mt-0.5" />
            ) : isWarning ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF9F0A] mt-0.5" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-[#64D2FF] mt-0.5" />
            )}
            <div className="flex-1 font-sans">{calloutText}</div>
          </div>
        );
        return;
      }

      // Checklists: - [ ] or - [x]
      if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
        const isCheckedDefault = line.trim().startsWith('- [x] ');
        const itemText = line.trim().replace(/- \[[ x]\] /, '');
        const checkKey = `item-${activeArticleId}-${idx}`;
        const isChecked = checkedChecklistItems[checkKey] !== undefined ? checkedChecklistItems[checkKey] : isCheckedDefault;

        elements.push(
          <div
            key={`check-${idx}`}
            onClick={() =>
              setCheckedChecklistItems((prev) => ({
                ...prev,
                [checkKey]: !isChecked,
              }))
            }
            className="flex items-start gap-2.5 py-1 text-xs cursor-pointer group select-none text-[#F5F6F8] hover:text-[#0A84FF] transition-colors"
          >
            <button className="mt-0.5 text-[#0A84FF] shrink-0">
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-[#30D158]" />
              ) : (
                <Square className="w-4 h-4 text-[#6E7787] group-hover:text-[#0A84FF]" />
              )}
            </button>
            <span className={isChecked ? 'line-through text-[#6E7787]' : 'text-[#F5F6F8]'}>
              {itemText}
            </span>
          </div>
        );
        return;
      }

      // Standard list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={`li-${idx}`} className="text-xs text-[#A6AEC0] ml-4 list-disc my-1 leading-relaxed">
            {line.trim().slice(2)}
          </li>
        );
        return;
      }

      // Table formatting check (simple check for pipe characters)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const columns = line.split('|').map((c) => c.trim()).filter(Boolean);
        const isDivider = columns.every((c) => c.startsWith('---'));
        if (isDivider) return; // skip header divider

        elements.push(
          <div key={`table-row-${idx}`} className="grid grid-cols-3 gap-2 py-1.5 px-3 rounded-[6px] text-xs font-mono bg-[#1A1E27] my-1 border border-[#2E3440]">
            {columns.map((col, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? 'font-bold text-[#F5F6F8]' : 'text-[#A6AEC0]'}>
                {col}
              </span>
            ))}
          </div>
        );
        return;
      }

      // Divider
      if (line.trim() === '---') {
        elements.push(<hr key={`hr-${idx}`} className="my-5 border-[#232833]" />);
        return;
      }

      // Normal paragraph
      if (line.trim().length > 0) {
        elements.push(
          <p key={`p-${idx}`} className="text-xs sm:text-sm text-[#A6AEC0] leading-relaxed my-2">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/50 text-xs text-[#30D158] shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#30D158]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hidden File Input for Markdown / Confluence Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* VIEW MODE 1: RICH TEXT RUNBOOK EDITOR & INTERNAL KNOWLEDGE ENGINE */}
      {(isCreating || isEditing) && (
        <RichTextEditor
          initialTitle={editorTitle}
          initialSpace={editorSpace}
          initialComponent={editorComponent}
          initialSeverity={editorSeverity}
          initialStatus={editorStatus}
          initialAuthor={editorAuthor}
          initialAuthorRole={editorAuthorRole}
          initialSummary={editorSummary}
          initialContent={editorContent}
          initialTags={editorTags}
          initialAttachments={editorAttachments}
          articleId={isEditing && activeArticle ? activeArticle.id : undefined}
          isNew={isCreating}
          onSave={handleSaveArticleFromEditor}
          onCancel={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
        />
      )}

      {/* VIEW MODE 2: ARTICLE READER (DETAILED VIEW) */}
      {activeArticle && !isEditing && !isCreating && (
        <div className="rounded-[14px] bg-[#12151C] border border-[#232833] shadow-[0_1px_2px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Reader Top Bar & Breadcrumbs */}
          <div className="p-4 sm:p-6 border-b border-[#232833] bg-[#12151C] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setActiveArticleId(null)}
                className="inline-flex items-center gap-1.5 text-xs text-[#0A84FF] hover:text-[#3B9EFF] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Knowledge Library</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleCopyArticleLink()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
                  title="Copy link to this article"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
                </button>

                <button
                  onClick={() => handleExportMarkdown(activeArticle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
                  title="Export to Markdown (.md)"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>

                <button
                  onClick={() => handleExportDoc(activeArticle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
                  title="Export to Microsoft Word (.doc)"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Export .doc</span>
                </button>

                <button
                  onClick={() => handleExportPdf(activeArticle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
                  title="Export to PDF document (.pdf)"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF9F0A]" />
                  <span>Export .pdf</span>
                </button>

                {onBookmarkArticle && (
                  <button
                    onClick={() => {
                      onBookmarkArticle(activeArticle.title, activeArticle.id, activeArticle.component);
                      showNotification('Pinned to Bookmarks Drawer!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#FF9F0A] text-xs font-semibold border border-[#2E3440] transition-colors"
                    title="Pin this runbook to Bookmarks Drawer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Bookmark</span>
                  </button>
                )}

                {canAuthor ? (
                  <button
                    onClick={() => handleOpenEdit(activeArticle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Article</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] text-[#A6AEC0] text-xs font-semibold border border-[#2E3440]">
                    <Shield className="w-3.5 h-3.5 text-[#FF9F0A]" />
                    <span>Read-Only Mode</span>
                  </span>
                )}
              </div>
            </div>

            {/* Article Title & Metadata Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-[6px] font-semibold bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440]">
                  {activeArticle.space}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-[6px] font-semibold bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
                  {activeArticle.component}
                </span>
                <span className={getSeverityBadge(activeArticle.severity)}>
                  {activeArticle.severity || 'Medium'} Severity
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${getStatusPill(activeArticle.status)}`}>
                  {activeArticle.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F6F8] tracking-tight">
                {activeArticle.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A6AEC0] pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#6E7787]" />
                  <span className="text-[#F5F6F8] font-medium">{activeArticle.author}</span>
                  {activeArticle.authorRole && (
                    <span className="text-[#6E7787]">({activeArticle.authorRole})</span>
                  )}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#6E7787]" />
                  <span>Updated {new Date(activeArticle.updatedAt).toLocaleDateString()}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#6E7787]" />
                  <span>{activeArticle.views || 1} views</span>
                </div>
              </div>

              {/* Tags */}
              {activeArticle.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {activeArticle.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reader Body Content */}
          <div className="p-6 sm:p-8 space-y-6 max-w-4xl">
            {/* Summary Callout Banner */}
            {activeArticle.summary && (
              <div className="p-4 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-xs sm:text-sm text-[#F5F6F8] leading-relaxed">
                <strong className="text-[#0A84FF] block mb-1 uppercase tracking-wider text-[11px]">
                  Executive Overview:
                </strong>
                {activeArticle.summary}
              </div>
            )}

            {/* Structured Runbook Steps Highlights if present */}
            {activeArticle.runbookSteps && activeArticle.runbookSteps.length > 0 && (
              <div className="p-4 rounded-[10px] bg-[#101E26]/60 border border-[#64D2FF]/30 space-y-2.5">
                <span className="text-xs font-bold text-[#64D2FF] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#64D2FF]" />
                  Quick Action Sequence:
                </span>
                <ol className="space-y-1.5 text-xs text-[#F5F6F8] list-decimal list-inside leading-relaxed font-sans">
                  {activeArticle.runbookSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Markdown Rendered Content */}
            <div className="prose prose-invert max-w-none text-[#F5F6F8]">
              {renderMarkdown(activeArticle.content)}
            </div>

            {/* Attachments Section */}
            {activeArticle.attachments && activeArticle.attachments.length > 0 && (
              <div className="pt-6 border-t border-[#232833] space-y-3">
                <h3 className="text-sm font-bold text-[#F5F6F8] uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[#0A84FF]" />
                  <span>Attached Configuration Files & Scripts ({activeArticle.attachments.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeArticle.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCode className="w-5 h-5 text-[#0A84FF] shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[#F5F6F8] font-mono font-medium block truncate">
                            {att.name}
                          </span>
                          <span className="text-[#6E7787] text-[10px] block">
                            {Math.round(att.size / 1024)} KB • {new Date(att.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {att.content && (
                        <button
                          onClick={() => {
                            const blob = new Blob([att.content || ''], { type: att.type || 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = att.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-2.5 py-1 rounded-[6px] bg-[#12151C] hover:bg-[#232833] text-[#64D2FF] border border-[#2E3440] font-semibold text-xs transition-colors shrink-0"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Helpful Feedback Vote */}
            <div className="p-4 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
              <div className="text-xs text-[#A6AEC0]">
                Did this internal runbook help resolve your technical issue or maintenance?
              </div>
              <button
                onClick={() => handleVoteHelpful(activeArticle.id)}
                disabled={votedArticles.has(activeArticle.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                  votedArticles.has(activeArticle.id)
                    ? 'bg-[#12241A] text-[#30D158] border border-[#30D158]/30 cursor-default'
                    : 'bg-[#12151C] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>
                  {votedArticles.has(activeArticle.id) ? 'Marked as Helpful' : 'Helpful'} (
                  {activeArticle.helpfulCount || 0}
                  )
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: KNOWLEDGE BASE EXPLORER & SPACE BROWSER */}
      {!activeArticleId && !isCreating && !isEditing && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-[14px] bg-[#12151C] border border-[#232833] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-3xl space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30">
                  <BookOpen className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Internal PAM Confluence Knowledge Base</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F6F8] tracking-tight">
                  Team Runbooks, SOPs & Incident Documentation
                </h1>
                <p className="text-sm text-[#A6AEC0] leading-relaxed">
                  Centralized workspace for your team's custom standard operating procedures, failover runbooks, AppLocker hardening rules, and incident post-mortems. Create, edit, and upload documentation just like Confluence.
                </p>
              </div>

            {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  id="btn-import-confluence"
                  onClick={() => {
                    if (!canAuthor) {
                      showNotification('Reader Mode: Importing runbooks requires Engineer or Admin privileges.');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#1A1E27] hover:bg-[#232833] text-[#F5F6F8] font-semibold text-xs border border-[#2E3440] transition-colors shadow-sm ${
                    !canAuthor ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={canAuthor ? 'Upload a .md, .txt, or JSON file to import into Local KB' : 'Read-Only Mode'}
                >
                  <Upload className="w-4 h-4 text-[#64D2FF]" />
                  <span>Import / Upload File</span>
                </button>

                <button
                  id="btn-create-article"
                  onClick={handleOpenCreate}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white font-semibold text-xs shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all ${
                    !canAuthor ? 'opacity-50' : ''
                  }`}
                  title={canAuthor ? 'Create a new runbook or SOP' : 'Requires Engineer or Admin role'}
                >
                  <Plus className="w-4 h-4" />
                  <span>{canAuthor ? 'Create Article' : 'Create Article (Locked)'}</span>
                </button>
              </div>
            </div>

            {/* Reader Role Notice Banner */}
            {isReaderRole && (
              <div className="mt-4 p-3 rounded-[10px] bg-[#1A1E27]/90 border border-[#2E3440] flex items-center gap-3 text-xs text-[#A6AEC0]">
                <Shield className="w-4 h-4 text-[#FF9F0A] shrink-0" />
                <span>
                  <strong className="text-[#F5F6F8]">Reader / Auditor Access Mode:</strong> You have read-only privileges. Standard operating procedures and runbooks can be searched, executed, and exported as Word (.doc), PDF, or Markdown. Runbook creation requires PAM Engineer or Administrator privileges.
                </span>
              </div>
            )}

            {/* Search Input Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787] pointer-events-none" />
                <input
                  id="input-kb-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title, content, command, author, or tags (e.g. failover, AppLocker, Reconcile, PADR)..."
                  className="w-full pl-10 pr-24 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25 focus:border-[#0A84FF]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 px-2 py-0.5 text-xs text-[#A6AEC0] hover:text-[#F5F6F8] bg-[#12151C] border border-[#2E3440] rounded-[6px]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Spaces & Filters Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: Spaces Directory */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-3">
                <div className="flex items-center justify-between border-b border-[#232833] pb-2">
                  <span className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-[#0A84FF]" />
                    <span>Knowledge Spaces</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#6E7787]">
                    {articles.length} total
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedSpace('All')}
                    className={`w-full text-left px-3 py-2 rounded-[8px] text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedSpace === 'All'
                        ? 'bg-[#0A84FF] text-white shadow-sm'
                        : 'text-[#A6AEC0] hover:bg-[#1A1E27] hover:text-[#F5F6F8]'
                    }`}
                  >
                    <span>All Spaces</span>
                    <span className="font-mono text-[11px]">{articles.length}</span>
                  </button>

                  {SPACES.map((space) => {
                    const count = spaceCounts[space.name] || 0;
                    const isSelected = selectedSpace === space.name;
                    return (
                      <button
                        key={space.name}
                        onClick={() => setSelectedSpace(space.name)}
                        className={`w-full text-left px-3 py-2 rounded-[8px] text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#0A84FF] text-white shadow-sm'
                            : 'text-[#A6AEC0] hover:bg-[#1A1E27] hover:text-[#F5F6F8]'
                        }`}
                      >
                        <span className="truncate pr-2">{space.name}</span>
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded-[4px] ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#1A1E27] text-[#6E7787]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div className="p-4 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-2.5">
                <span className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider block">
                  Publication Status
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'published', 'draft', 'under-review'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-medium capitalize transition-colors ${
                        selectedStatus === st
                          ? 'bg-[#1A1E27] text-[#F5F6F8] border border-[#0A84FF] font-semibold'
                          : 'bg-[#12151C] text-[#6E7787] hover:text-[#A6AEC0] border border-[#2E3440]'
                      }`}
                    >
                      {st === 'under-review' ? 'In Review' : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Area: Article Cards */}
            <div className="lg:col-span-3 space-y-4">
              {/* Controls bar: Component Pills + Sort */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[12px] bg-[#12151C] border border-[#232833]">
                {/* Component filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-semibold text-[#6E7787] uppercase mr-1">
                    Component:
                  </span>
                  {COMPONENTS.slice(0, 6).map((comp) => (
                    <button
                      key={comp}
                      onClick={() => setSelectedComponent(comp)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedComponent === comp
                          ? 'bg-[#0A84FF] text-white font-semibold'
                          : 'bg-[#1A1E27] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440]'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-[#A6AEC0]">
                  <span className="text-[#6E7787]">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 rounded-[6px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] text-xs focus:outline-none"
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="views">Most Views</option>
                    <option value="helpful">Highest Voted</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Articles Grid */}
              {filteredArticles.length === 0 ? (
                <div className="p-12 text-center rounded-[14px] bg-[#12151C] border border-[#232833] space-y-3">
                  <BookOpen className="w-12 h-12 text-[#6E7787] mx-auto opacity-50" />
                  <h3 className="text-base font-bold text-[#F5F6F8]">No matching articles found</h3>
                  <p className="text-xs text-[#A6AEC0] max-w-sm mx-auto">
                    Try adjusting your search keywords, clear the space filter, or create a brand-new runbook article.
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0A84FF] text-white text-xs font-semibold shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Article</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => setActiveArticleId(article.id)}
                      className="p-5 rounded-[14px] bg-[#12151C] border border-[#232833] hover:border-[#0A84FF]/50 transition-all cursor-pointer flex flex-col justify-between group shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                    >
                      <div className="space-y-2.5">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440]">
                              {article.space}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
                              {article.component}
                            </span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusPill(article.status)}`}>
                            {article.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-[#F5F6F8] group-hover:text-[#64D2FF] transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h3>

                        {/* Summary Excerpt */}
                        <p className="text-xs text-[#A6AEC0] line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>

                        {/* Tags */}
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1E27] text-[#6E7787] font-mono border border-[#2E3440]"
                              >
                                #{tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-[10px] text-[#6E7787] self-center">
                                +{article.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 mt-3 border-t border-[#232833] flex items-center justify-between text-[11px] text-[#6E7787]">
                        <div className="flex items-center gap-2">
                          <span className="text-[#A6AEC0] font-medium">{article.author}</span>
                          <span>•</span>
                          <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {article.attachments && article.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-[#64D2FF]" title="Attachments">
                              <Paperclip className="w-3 h-3" />
                              <span>{article.attachments.length}</span>
                            </span>
                          )}

                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="w-3 h-3" />
                            <span>{article.views || 0}</span>
                          </span>

                          <span className="flex items-center gap-1" title="Helpful Votes">
                            <ThumbsUp className="w-3 h-3 text-[#30D158]" />
                            <span>{article.helpfulCount || 0}</span>
                          </span>

                          <button
                            onClick={(e) => handleDuplicateArticle(article, e)}
                            className="p-1 hover:text-[#F5F6F8] rounded transition-colors"
                            title="Duplicate as draft"
                          >
                            <Copy className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteArticle(article.id, e)}
                            className="p-1 hover:text-[#FF453A] rounded transition-colors"
                            title="Delete article"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
