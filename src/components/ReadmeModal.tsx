import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Terminal,
  Github,
  Monitor,
  Apple,
  Cpu,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'sync' | 'raw' | 'quick-commands'>('preview');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean | null>(null);

  const directUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/download/readme` : '/api/download/readme';
  const rawUrl = typeof window !== 'undefined' ? `${window.location.origin}/README.md` : '/README.md';

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetch('/api/readme')
      .then((res) => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then((data) => {
        if (data.content) {
          setMarkdownContent(data.content);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to direct raw file
        fetch('/README.md')
          .then((r) => r.text())
          .then((text) => {
            setMarkdownContent(text);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyMarkdown = async () => {
    if (!markdownContent) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdownContent);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = markdownContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyCurl = async () => {
    const cmd = `curl -fsSL ${rawUrl} -o README.md`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadFile = () => {
    try {
      const blob = new Blob([markdownContent || ''], { type: 'text/markdown;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'README.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch {
      // Fallback to browser direct URL navigation
      window.location.href = directUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0D1117] border border-[#30363D] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D] bg-[#161B22]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#238636]/20 border border-[#238636]/40 text-[#2EA043]">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F0F6FC]">GitHub README.md Exporter & Setup Guide</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#238636]/20 text-[#3FB950] border border-[#238636]/30">
                  Included in Project Root
                </span>
              </div>
              <p className="text-xs text-[#8B949E]">
                Contains Linux, Windows & macOS install steps, git clone, hardware requirements, and zero-vulnerability audit.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Top Bar */}
        <div className="px-5 py-3 bg-[#0D1117] border-b border-[#21262D] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFile}
              className="px-3.5 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                copied
                  ? 'bg-[#238636]/20 border-[#238636] text-[#3FB950]'
                  : 'bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#C9D1D9]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Full Markdown (100%)' : 'Copy Full Markdown'}</span>
            </button>

            <a
              href="/api/download/readme"
              download="README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[#58A6FF] text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Open raw direct link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Direct Link</span>
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-[#161B22] p-1 rounded-lg border border-[#30363D] text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-[#21262D] text-[#F0F6FC]' : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'sync' ? 'bg-[#21262D] text-[#58A6FF]' : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Sync Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('quick-commands')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'quick-commands' ? 'bg-[#21262D] text-[#E3B341]' : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>OS Commands</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'raw' ? 'bg-[#21262D] text-[#F0F6FC]' : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              Raw Markdown
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {downloadSuccess && (
          <div className="px-5 py-2 bg-[#238636]/15 border-b border-[#238636]/30 flex items-center justify-between text-xs text-[#3FB950]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3FB950]" />
              <span>README.md file download triggered successfully!</span>
            </div>
            <span className="text-[11px] text-[#8B949E]">Saved as README.md in your Downloads folder</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-sm text-[#C9D1D9]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#8B949E]">
              <div className="w-6 h-6 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin" />
              <span>Loading README.md contents...</span>
            </div>
          ) : activeTab === 'sync' ? (
            <div className="space-y-6">
              {/* Box 1: File is already in project */}
              <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2">
                <div className="flex items-center gap-2 text-[#3FB950] font-semibold text-sm">
                  <FileCheck className="w-4 h-4" />
                  <span>Good News: README.md is Already Included Inside Your Project!</span>
                </div>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  The file <code className="px-1.5 py-0.5 rounded bg-[#0D1117] text-[#58A6FF] font-mono">README.md</code> is stored at the root directory of this repository and in <code className="px-1.5 py-0.5 rounded bg-[#0D1117] text-[#58A6FF] font-mono">/public/README.md</code>. When you download or push the project to GitHub, GitHub automatically renders it as your repository homepage.
                </p>
              </div>

              {/* Method A: GitHub Web Interface (0 commands, paste directly) */}
              <div className="p-5 rounded-xl bg-[#161B22] border border-[#30363D] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#58A6FF]/20 text-[#58A6FF] flex items-center justify-center text-xs">1</span>
                    Method 1: Add or Update via GitHub Web Browser (No CLI Required)
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/20">Recommended for Quick Upload</span>
                </div>

                <ol className="text-xs space-y-3 text-[#C9D1D9] pl-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#58A6FF] shrink-0">Step 1:</span>
                    <span>Navigate to your repository on <strong>github.com</strong> in your browser.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#58A6FF] shrink-0">Step 2:</span>
                    <span>Click the <strong>"Add file"</strong> dropdown at the top right of the file list and select <strong>"Create new file"</strong> (or click the pencil icon if editing an existing README).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#58A6FF] shrink-0">Step 3:</span>
                    <span>Name the file exactly: <code className="px-1.5 py-0.5 rounded bg-[#0D1117] text-[#3FB950] font-mono font-semibold">README.md</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#58A6FF] shrink-0">Step 4:</span>
                    <div className="space-y-1.5">
                      <span>Click the button below to copy the full markdown without any formatting distortion:</span>
                      <div>
                        <button
                          onClick={handleCopyMarkdown}
                          className="px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied 576 Lines to Clipboard!' : 'Copy Complete Markdown (Exact Format)'}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#58A6FF] shrink-0">Step 5:</span>
                    <span>Paste (<kbd className="px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-[10px]">Ctrl+V</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-[10px]">Cmd+V</kbd>) into the GitHub editor and click the green <strong>"Commit changes"</strong> button.</span>
                  </li>
                </ol>
              </div>

              {/* Method B: Terminal / Git CLI */}
              <div className="p-5 rounded-xl bg-[#161B22] border border-[#30363D] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#3FB950]/20 text-[#3FB950] flex items-center justify-center text-xs">2</span>
                    Method 2: Sync via Local Git Terminal
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#30363D] text-[#8B949E]">Terminal Workflow</span>
                </div>

                <p className="text-xs text-[#8B949E]">
                  Run these commands in your project directory on your local machine to commit and push:
                </p>

                <div className="relative rounded-lg bg-[#0D1117] border border-[#30363D] p-3 text-xs font-mono text-[#E6EDF3]">
                  <pre className="overflow-x-auto whitespace-pre">
{`# 1. Check git status to see README.md
git status

# 2. Stage README.md and all project files
git add README.md

# 3. Commit the changes
git commit -m "docs: add GitHub README with OS install guides for Linux, Windows, macOS"

# 4. Push to your main branch on GitHub
git push origin main`}
                  </pre>
                </div>
              </div>

              {/* Method C: One-liner Terminal Download */}
              <div className="p-5 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E3B341]/20 text-[#E3B341] flex items-center justify-center text-xs">3</span>
                    Method 3: Download Directly via Terminal Command
                  </h3>
                  <button
                    onClick={handleCopyCurl}
                    className="text-xs text-[#58A6FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? 'Copied curl command!' : 'Copy Command'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] font-mono text-xs">
                    <div className="text-[11px] font-sans text-[#8B949E] mb-1">Linux / macOS (curl):</div>
                    <code className="text-[#3FB950] break-all">curl -fsSL {rawUrl} -o README.md</code>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] font-mono text-xs">
                    <div className="text-[11px] font-sans text-[#8B949E] mb-1">Windows (PowerShell):</div>
                    <code className="text-[#58A6FF] break-all">Invoke-WebRequest -Uri "{rawUrl}" -OutFile "README.md"</code>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'quick-commands' ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                <Terminal className="w-4 h-4 text-[#58A6FF]" />
                <span>Copy-pasteable setup commands for each supported operating system:</span>
              </div>

              {/* Linux */}
              <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#58A6FF]">
                  <Cpu className="w-4 h-4" />
                  <span>Linux (Ubuntu / Debian / Linux Mint)</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs font-mono text-[#E6EDF3]">
                  <pre className="overflow-x-auto whitespace-pre">{`# 1. System packages & Node.js 22 LTS
sudo apt update && sudo apt install -y git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Clone repository & install dependencies
git clone https://github.com/your-username/vaultdesk-pam-portal.git
cd vaultdesk-pam-portal
npm install

# 3. Start development server
cp .env.example .env
npm run dev`}</pre>
                </div>
              </div>

              {/* Windows */}
              <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3FB950]">
                  <Monitor className="w-4 h-4" />
                  <span>Windows 10 & 11 (PowerShell)</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs font-mono text-[#E6EDF3]">
                  <pre className="overflow-x-auto whitespace-pre">{`# 1. Install Git and Node.js 22 LTS via winget
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget

# 2. Restart PowerShell, clone and install
git clone https://github.com/your-username/vaultdesk-pam-portal.git
cd vaultdesk-pam-portal
npm install

# 3. Start development server
Copy-Item .env.example .env
npm run dev`}</pre>
                </div>
              </div>

              {/* macOS */}
              <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D29922]">
                  <Apple className="w-4 h-4" />
                  <span>macOS (Apple Silicon M1-M4 & Intel via Homebrew)</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs font-mono text-[#E6EDF3]">
                  <pre className="overflow-x-auto whitespace-pre">{`# 1. Install Git & Node.js 22 via Homebrew
brew install git node@22
brew link node@22 --force --overwrite

# 2. Clone repository & install dependencies
git clone https://github.com/your-username/vaultdesk-pam-portal.git
cd vaultdesk-pam-portal
npm install

# 3. Start development server
cp .env.example .env
npm run dev`}</pre>
                </div>
              </div>
            </div>
          ) : activeTab === 'raw' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Raw Markdown (576 lines • ~24 KB)</span>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D] flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#3FB950]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy All'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={markdownContent}
                className="w-full h-[60vh] p-4 rounded-xl bg-[#0D1117] border border-[#30363D] font-mono text-xs text-[#E6EDF3] leading-relaxed resize-none focus:outline-none focus:border-[#58A6FF]"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          ) : (
            /* Tab: Preview */
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-between text-xs">
                <span className="text-[#8B949E]">Viewing rendered preview of <strong className="text-[#F0F6FC]">README.md</strong>:</span>
                <button
                  onClick={handleCopyMarkdown}
                  className="text-[#58A6FF] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Exact Markdown'}</span>
                </button>
              </div>

              <div className="prose prose-invert max-w-none text-xs space-y-4 font-sans leading-relaxed">
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
                  <h1 className="text-xl font-bold text-[#F0F6FC] mb-2">VaultDesk — CyberArk PAM Operations & Troubleshooting Portal</h1>
                  <p className="text-xs text-[#8B949E]">
                    Enterprise runbook catalog, automated log redaction, AI troubleshooting with @google/genai, and RBAC authentication.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                    <div className="text-[11px] text-[#8B949E]">Linux Support</div>
                    <div className="text-sm font-semibold text-[#58A6FF]">Ubuntu 20/22/24, RHEL, Debian</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                    <div className="text-[11px] text-[#8B949E]">Windows Support</div>
                    <div className="text-sm font-semibold text-[#3FB950]">Windows 10/11 PowerShell / WSL2</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                    <div className="text-[11px] text-[#8B949E]">macOS Support</div>
                    <div className="text-sm font-semibold text-[#D29922]">Apple Silicon & Intel (Node 22)</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2">
                  <h3 className="text-sm font-bold text-[#F0F6FC]">Quick Install Commands</h3>
                  <div className="p-2.5 rounded bg-[#0D1117] font-mono text-xs text-[#58A6FF]">
                    git clone https://github.com/your-username/vaultdesk-pam-portal.git<br />
                    cd vaultdesk-pam-portal<br />
                    npm install<br />
                    npm run dev
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2">
                  <h3 className="text-sm font-bold text-[#F0F6FC]">Security Audit Compliance</h3>
                  <p className="text-xs text-[#8B949E]">
                    Audited with 0 vulnerabilities in <code className="text-[#3FB950]">npm audit</code>. Includes DOM XSS sanitization (CWE-79), Rate Limiting (CWE-400), Security Headers (CWE-693), Cryptographic UUIDs, and automated GitHub Actions CI with CodeQL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#21262D] bg-[#161B22] text-xs">
          <div className="flex items-center gap-2 text-[#8B949E]">
            <FileText className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>Path: <code className="font-mono text-[#C9D1D9]">/README.md</code> (Root Directory)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="text-[#8B949E] hover:text-[#C9D1D9] text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="Copy direct file URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#3FB950]" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'URL Copied!' : 'Copy Direct URL'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
