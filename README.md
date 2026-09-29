# VaultDesk — CyberArk PAM Operations, Troubleshooting Portal & PSM Connector Studio

[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%207.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Security Audit](https://img.shields.io/badge/Vulnerabilities-0%20Known-brightgreen?logo=dependabot&logoColor=white)](#security-hardening--scan-compliance)
[![CodeQL SAST](https://img.shields.io/badge/CodeQL-0%20Alerts%20Passed-brightgreen?logo=github&logoColor=white)](#security-hardening--scan-compliance)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**VaultDesk** is an enterprise-grade operational diagnostic portal, runbook knowledge repository, and **PSM Universal Web Connector Studio** purpose-built for Privileged Access Management (PAM) engineering and SecOps teams. It streamlines the day-to-day operations of enterprise PAM suites (including CyberArk PAS Self-Hosted and CyberArk Privilege Cloud) by unifying deep log parsing, root-cause diagnosis, automated web connector generation, rich-text standard operating procedure (SOP) authoring, live CVE tracking, and granular role-based access control (RBAC).

---

## 🎯 Problem Statement

### The Enterprise Challenge
Privileged Access Management (PAM) platforms protect an organization's most critical assets—domain controllers, cloud root accounts, database administrator credentials, and core infrastructure. However, operating and maintaining large-scale PAM deployments presents critical operational bottlenecks:

1. **Cryptic Failure Modes & High Downtime Costs**:
   * Failures spanning the Digital Vault, Central Policy Manager (CPM), Privileged Session Manager (PSM), Password Vault Web Access (PVWA), Central Credential Provider (CCP), and Privileged Threat Analytics (PTA) produce cryptic error codes (such as `ITATS006E`, `PSMSR037E`, `CACPM072E`, or `APPAP002E`).
   * Triage often demands hours of scouring disconnected documentation, vendor portals, and tribal knowledge, prolonging operational downtime during critical access blockages.

2. **Accidental Credential & PII Leakage in Log Triage**:
   * Raw component logs (`itaso001.log`, `pm_error.log`, `PSMTrace.log`, `WebApplicationDispatcher.log`) frequently contain clear-text passwords, session tokens, internal IP addresses, server hostnames, and safe naming conventions.
   * Operations teams troubleshooting incidents inadvertently risk pasting sensitive credentials into external ticketing systems or public AI models.

3. **Complex, Error-Prone PSM Web Connector Development**:
   * Onboarding internal web applications, SaaS dashboards, and administrative consoles into CyberArk PSM WebApp Dispatcher requires tedious manual DOM inspection, manual XPath/ID selector determination, and trial-and-error AutoIt / XML configuration.
   * Dispatcher errors (e.g. element not found, AppLocker blocks, dual-step MFA issues) lead to frequent connection drops.

4. **Fragmented Documentation & Lack of Governance**:
   * Standard operating procedures (SOPs) and disaster recovery runbooks are scattered across wikis, local drives, and spreadsheets without access control or change tracking.

### The VaultDesk Solution
VaultDesk bridges these operational gaps with an all-in-one, security-hardened portal:
* **Zero-Leakage Log Sanitizer**: Automatically detects and redacts passwords, IP addresses, session tokens, and safe names before analysis.
* **120+ Curated PAM Error Catalog & Diagnostic Wizard**: Instant diagnosis with verified root causes, remediation checklists, and log paths.
* **PSM Universal Connector Studio & WebForm Generator**: Live DOM scanner with SSRF-hardened dynamic domain authorization, synthesizing standard CyberArk `WebFormFields` sequences and AutoIt dispatchers in seconds.
* **Resilient Grounded AI Diagnostics**: Deep contextual resolution runbooks powered by `@google/genai` with search grounding and offline fail-safe runbook synthesis.
* **Enterprise SOP Knowledge Base & Granular RBAC**: Multi-space rich text authoring with 17 distinct privileges, LDAP/AD and SAML 2.0 SSO simulations.

---

## Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Key Features & Capabilities](#key-features--capabilities)
3. [Architecture Overview](#architecture-overview)
4. [Operating System & Hardware Requirements](#operating-system--hardware-requirements)
5. [Complete Step-by-Step Installation Guides](#complete-step-by-step-installation-guides)
   * [Guide A: Linux (Ubuntu / Debian / RHEL / Fedora / Arch)](#guide-a-linux-installation-ubuntu--debian--rhel--fedora--arch)
   * [Guide B: Windows 10 & 11 (PowerShell / WSL2)](#guide-b-windows-10--11-installation-powershell)
   * [Guide C: macOS (Apple Silicon M1-M4 & Intel)](#guide-c-macos-installation-apple-silicon--intel)
6. [Quick Installation Commands](#quick-installation-commands-by-os)
7. [Logging In & Default User Credentials](#logging-in--default-user-credentials)
8. [PSM Connector Studio & WebForm Generator Guide](#psm-connector-studio--webform-generator-guide)
9. [Environment Variables](#environment-variables)
10. [Building for Production](#building-for-production)
11. [Security Hardening & Scan Compliance](#security-hardening--scan-compliance)
12. [Running Security Scans Locally & on GitHub](#running-security-scans-locally--on-github)
13. [Available NPM Scripts](#available-npm-scripts)
14. [Project File Structure](#project-file-structure)
15. [API Endpoints Reference](#api-endpoints-reference)
16. [Troubleshooting & FAQ](#troubleshooting--faq)
17. [License](#license)

---

## Key Features & Capabilities

### 1. 🛡️ Log Analyzer & Automatic PII/Secret Redaction Engine
* Supports all primary CyberArk logs: `itaso001.log`, `pm_error.log`, `pm.log`, `PSMTrace.log`, `PSMConsole.log`, `CyberArk.WebConsole.log`, `APPConsole.log`, and `SecureTunnel.log`.
* Automatic regex-based masking of clear-text passwords, session tokens, private RFC-1918 IPv4 and IPv6 addresses, server hostnames, and safe identifiers.
* Identifies primary error codes, severity levels, affected components, and recommended remediation checklists.
* Export sanitized logs directly for audit compliance or vendor support cases.

### 2. ⚡ PSM Universal Connector Studio & WebForm Dispatcher Builder
* **Live DOM Analyzer**: Inspects real web application login pages and extracts input fields, submit buttons, password toggles, and verification headers.
* **CyberArk WebFormFields Auto-Generation**: Builds syntactically valid sequences formatted for `CyberArk.Extensions.Plugin.WebAppDispatcher` (e.g. `username > (SearchBy=id) [Target]`, `password > (SearchBy=id) [Target]`, `submit > (Button)`).
* **SSRF-Hardened Live Scanner**: Deep security controls preventing Server-Side Request Forgery (CWE-918), validating target hosts against public DNS and dynamic domain allowlists.
* **Custom Domain Management**: Allows administrators to dynamically authorize enterprise login domains (e.g., AWS IAM, Azure Portal, Okta, internal apps) for live scanning with one-click approval.
* **Multi-Format Export**: Generates CyberArk AutoIt (`.au3`) scripts, XML connection component definitions, and JSON profiles.

### 3. 📖 Curated PAM Error Catalog & Diagnostic Wizard
* **120+ Authentic Error Codes**: Comprehensive coverage across Vault (`ITATS`), CPM (`CACPM`), PSM (`PSMSR`), PVWA (`PASWS`), CCP (`APPAP`), PTA, and Conjur.
* **Interactive Diagnostic Wizard**: Step-by-step triage based on observed operational symptoms (e.g. credential rotation failure, connection drop, AppLocker execution block, certificate desync).
* **Direct Community & Docs Cross-Referencing**: Verified official resolution procedures linked directly to CyberArk technical docs and community advisories.

### 4. 🧠 Grounded AI Diagnostics & Offline Fallback Runbooks
* Integrated with Google Gen AI TypeScript SDK (`@google/genai`) using `gemini-3.8-flash` with Google Search grounding.
* **Offline Fallback Intelligence**: Operates seamlessly even without an external API key by synthesizing verified internal runbooks for all known error codes.
* One-click promotion of AI diagnoses into the curated organization-wide error catalog.

### 5. 📚 Collaborative SOP Knowledge Base
* Markdown and WYSIWYG rich text editor with syntax highlighting, callout alert boxes, collapsible sections, and diagnostic checklists.
* **XSS Neutralization (CWE-79)**: Multi-pass HTML sanitizer stripping all unsafe elements, inline JavaScript, and invalid URI schemes.
* Single-click document export to Microsoft Word (`.doc`), PDF, and raw Markdown (`.md`).

### 6. 🔐 Enterprise Identity & Granular Role-Based Access Control (RBAC)
* **17 Granular Privileges**: Control access over log analysis, runbook publishing, error promotion, user management, LDAP settings, and connector design.
* **Custom Role Matrix Builder**: Create tailored enterprise roles beyond built-in `admin`, `engineer`, and `reader`.
* **Enterprise Auth Simulators**: Test Local credentials, Active Directory / LDAP group-to-role mappings, SAML 2.0 Single Sign-On with JIT provisioning, and email invitation links.

### 7. 🔔 Live CVE Advisories & CyberArk Release Tracker
* Real-time tracking of active PAM security bulletins, CVEs, and mitigation patches.
* Version tracking and release note sync for **PAM Self-Hosted (15.2.0)** and **Privilege Cloud (15.0.3)**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VaultDesk Client                              │
│                React 19 + TypeScript + Tailwind CSS v4                  │
│        (Vite 8 Bundler • Lucide Icons • Motion Transitions)             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST APIs (Port 3000)
┌────────────────────────────────────▼────────────────────────────────────┐
│                        VaultDesk Express Backend                        │
│                   server.ts (Node.js runtime via TSX)                   │
│                                                                         │
│  • HTTP Security Headers (CWE-693)                                      │
│  • In-Memory Endpoint Rate Limiting (CWE-400)                           │
│  • Session & RBAC Permission Enforcement (OWASP API 5)                  │
│  • Cryptographically Secure Tokens (crypto.randomUUID)                  │
│  • SSRF-Hardened Domain Allowlist & DNS Resolver (CWE-918)              │
│  • Client/Server PII & Secret Redaction Engine                          │
│  • @google/genai SDK (Gemini AI Live Search Grounding)                  │
│  • Offline High-Fidelity PAM Runbook Synthesizer                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Operating System & Hardware Requirements

### Supported Operating Systems
| Operating System | Supported Versions | Architecture | Default Shell |
| :--- | :--- | :--- | :--- |
| **Linux** | Ubuntu 20.04/22.04/24.04 LTS, Debian 11/12, Fedora 38+, RHEL/Rocky/Alma 8/9, Arch Linux | x86_64, ARM64 | Bash / Zsh |
| **Windows** | Windows 10 (21H2+) or Windows 11 | x86_64, ARM64 | PowerShell 5.1+ / PowerShell 7+ / WSL2 |
| **macOS** | macOS 12 Monterey, 13 Ventura, 14 Sonoma, 15 Sequoia | Apple Silicon (M1–M4) & Intel | Zsh / Bash |

### Hardware Specifications
* **CPU**: 2 physical cores or virtual vCPUs (x86_64 or ARM64)
* **RAM**: 2 GB minimum (4 GB recommended for compiling Vite/React production builds)
* **Disk Storage**: 500 MB free disk space (includes `node_modules` and build output)
* **Network**: Outbound HTTPS (TCP port 443) access to npm registry (`registry.npmjs.org`) and optional Google Gemini API

---

## Complete Step-by-Step Installation Guides

Choose your operating system below for tailored, copy-pasteable installation instructions:

* [Guide A: Linux (Ubuntu / Debian / RHEL / Fedora / Arch)](#guide-a-linux-installation-ubuntu--debian--rhel--fedora--arch)
* [Guide B: Windows 10 & 11 (PowerShell / WSL2)](#guide-b-windows-10--11-installation-powershell)
* [Guide C: macOS (Apple Silicon M1-M4 & Intel Mac)](#guide-c-macos-installation-apple-silicon--intel)

---

### Guide A: Linux Installation (Ubuntu / Debian / RHEL / Fedora / Arch)

#### Step 1: Install System Prerequisites (Git, Curl, Build Tools)

##### On Ubuntu / Debian / Linux Mint:
```bash
sudo apt update && sudo apt install -y git curl build-essential
```

##### On Fedora / RHEL / CentOS / Rocky Linux:
```bash
sudo dnf install -y git curl make gcc-c++
```

##### On Arch Linux:
```bash
sudo pacman -Syu --noconfirm git curl base-devel
```

#### Step 2: Install Node.js 22 LTS & npm

We recommend the official NodeSource repository for modern Node.js 22:

##### On Ubuntu / Debian:
```bash
# Download and setup NodeSource repository for Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js (includes npm)
sudo apt install -y nodejs
```

##### On Fedora / RHEL:
```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

##### Alternative using NVM (Node Version Manager):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

#### Step 3: Verify Tool Installations
```bash
node -v      # Should print v22.x.x (or v20.x.x)
npm -v       # Should print 10.x.x or newer
git --version# Should print git version 2.30+
```

#### Step 4: Clone the Repository
```bash
git clone https://github.com/LegendGamer007-git/VaultDesk.git
cd VaultDesk
```

#### Step 5: Configure Environment Variables
```bash
cp .env.example .env
```
*(Optional)* If you have a Gemini API key for live search-grounded diagnostics, edit `.env`:
```bash
nano .env
# Set: GEMINI_API_KEY="your-actual-api-key"
```

#### Step 6: Install Node Dependencies
```bash
npm install
```

#### Step 7: Verify TypeScript Compilation
```bash
npm run lint
```
*Expected output: Exits cleanly with no errors.*

#### Step 8: Start the Development Server
```bash
npm run dev
```

#### Step 9: Open the Portal
Open your web browser and navigate to:
```
http://localhost:3000
```
*(Or launch from terminal: `xdg-open http://localhost:3000`)*

---

### Guide B: Windows 10 & 11 Installation (PowerShell)

You can run VaultDesk on Windows natively via **Windows PowerShell** or inside **WSL2 (Windows Subsystem for Linux)**. Below is the native Windows installation.

#### Step 1: Open PowerShell as Administrator
Press `Win + X` and select **Terminal (Admin)** or **Windows PowerShell (Admin)**.

#### Step 2: Install Git and Node.js 22 LTS via Windows Package Manager (`winget`)

Run the following command in PowerShell:
```powershell
# Install Git for Windows
winget install --id Git.Git -e --source winget

# Install Node.js 22 LTS
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

> **Manual Alternative (without winget)**:
> 1. Download Git from [git-scm.com/download/win](https://git-scm.com/download/win) and run the installer.
> 2. Download Node.js 22 LTS `.msi` from [nodejs.org](https://nodejs.org/) and run the installer.

#### Step 3: Restart PowerShell & Set Script Execution Policy
Close the administrator window and open a regular **PowerShell** window.

Ensure PowerShell allows running local developer scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Step 4: Verify Tool Installations
```powershell
node -v      # Expected: v22.x.x (or v20.x.x)
npm -v       # Expected: 10.x.x+
git --version# Expected: git version 2.x+
```

#### Step 5: Clone the Repository
```powershell
git clone https://github.com/LegendGamer007-git/VaultDesk.git
cd VaultDesk
```

#### Step 6: Configure Environment Variables
```powershell
Copy-Item .env.example .env
```
*(Optional)* Open `.env` in Notepad to add your Gemini API key:
```powershell
notepad .env
```

#### Step 7: Install Node Dependencies
```powershell
npm install
```

#### Step 8: Verify Code Quality & Types
```powershell
npm run lint
```

#### Step 9: Start the Development Server
```powershell
npm run dev
```

#### Step 10: Open in Browser
In PowerShell or your browser, navigate to:
```powershell
Start-Process http://localhost:3000
```

---

### Guide C: macOS Installation (Apple Silicon & Intel)

#### Step 1: Open Terminal
Press `Cmd + Space`, type `Terminal`, and press `Enter`.

#### Step 2: Install Apple Command Line Developer Tools (includes Git)
```bash
xcode-select --install
```
*A dialog will appear prompting you to install the command line developer tools. Click **Install** and wait for completion.*

#### Step 3: Install Homebrew (macOS Package Manager)
If you do not already have Homebrew installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Add Homebrew to your shell environment (for Apple Silicon Macs):
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Step 4: Install Node.js 22 LTS and Git via Homebrew
```bash
brew install node@22 git
brew link --overwrite --force node@22
```

#### Step 5: Verify Tool Installations
```bash
node -v      # Expected: v22.x.x (or v20.x.x)
npm -v       # Expected: 10.x.x+
git --version# Expected: git version 2.x+
```

#### Step 6: Clone the Repository
```bash
git clone https://github.com/LegendGamer007-git/VaultDesk.git
cd VaultDesk
```

#### Step 7: Configure Environment Variables
```bash
cp .env.example .env
```
*(Optional)* Add your Gemini API key in `.env`:
```bash
open -e .env
```

#### Step 8: Install Node Dependencies
```bash
npm install
```

#### Step 9: Verify TypeScript Compilation
```bash
npm run lint
```

#### Step 10: Launch the Development Server
```bash
npm run dev
```

#### Step 11: Open the Portal
```bash
open http://localhost:3000
```

---

## Quick Installation Commands by OS

### Linux Quick-Start (Ubuntu / Debian)
```bash
sudo apt update && sudo apt install -y git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
git clone https://github.com/LegendGamer007-git/VaultDesk.git
cd VaultDesk
npm install && cp .env.example .env && npm run dev
```

### Windows Quick-Start (PowerShell)
```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
git clone https://github.com/LegendGamer007-git/VaultDesk.git
cd VaultDesk
npm install; Copy-Item .env.example .env; npm run dev
```

### macOS Quick-Start (Terminal & Homebrew)
```bash
brew install git node@22 && brew link node@22 --force --overwrite
git clone https://github.com/LegendGamer007-git/VaultDesk.git
cd VaultDesk
npm install && cp .env.example .env && npm run dev
```

---

## Logging In & Default User Credentials

Once the application is running, the **VaultDesk Login Portal** will greet you. You can authenticate using any of the built-in identities:

| Account Type | Email Address | Role | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@vaultdesk.internal` | `admin` | Full system access: manage users, custom RBAC permissions, configure SSO/LDAP, approve scanner domains. |
| **PAM Operations Engineer** | `engineer@vaultdesk.internal` | `engineer` | Author runbooks, parse/anonymize logs, triage errors, and build PSM web connectors. |
| **Compliance Auditor (Reader)** | `reader@vaultdesk.internal` | `reader` | Read-only access: view curated runbooks, error codes, and export reports to Word/PDF. |

### Testing Enterprise Identity Workflows
* **Active Directory / LDAP**: Switch to the **Active Directory / LDAP** tab to test domain credential binding and automated role assignment.
* **SAML 2.0 Single Sign-On**: Switch to the **SAML 2.0 SSO** tab to simulate identity provider assertion and Just-In-Time (JIT) user provisioning.
* **Invitation Token**: Switch to the **Accept Invite** tab with token `inv-tok-9842f1a8` to test frictionless onboarding.

---

## PSM Connector Studio & WebForm Generator Guide

VaultDesk includes a dedicated **PSM Universal Web Connector Studio** accessible via the top navigation bar.

### Key Capabilities:
1. **Target URL Scanning**: Enter any enterprise login URL (e.g. `https://signin.aws.amazon.com/signin`, `https://portal.azure.com`, `https://login.wordpress.org`).
2. **Dynamic Domain Authorization**: VaultDesk enforces strict SSRF protections. Public domains can be auto-authorized on the fly or managed in the **Allowed Scanner Domains** modal.
3. **DOM Element Extraction**: Automatically identifies username fields, password inputs, submit buttons, OTP fields, and validation elements.
4. **AutoIt & XML Generation**: Copy or download ready-to-deploy CyberArk connection components:
   * **WebFormFields sequence**: `username > (SearchBy=id) [Target]`, `password > (SearchBy=id) [Target]`, `submit > (Button)`.
   * **AutoIt `.au3` dispatcher script**: Full boilerplate including browser launch, process locking, and error handling.
   * **PVWA XML Profile**: Importable XML configuration for direct upload into PVWA Administration > Connection Components.

---

## Environment Variables

| Variable | Required? | Default | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Optional | `""` | Gemini API key for live generative log analysis. Server-side only; never leaked to frontend. |
| `APP_URL` | Optional | `http://localhost:3000` | Fully qualified base URL of the deployment. |
| `PORT` | Optional | `3000` | Port for the Express server to listen on. |
| `NODE_ENV` | Optional | `development` | Node environment (`development` or `production`). |

---

## Building for Production

To create an optimized, production-ready bundle and run the standalone server:

```bash
# 1. Build frontend bundle and package backend server
npm run build

# 2. Start the production server
npm start
```

The build command outputs:
* `dist/`: Minified static HTML, CSS, and JS frontend assets.
* `dist/server.cjs`: Standalone Node.js CommonJS server script.

To clean previous build outputs:
```bash
npm run clean
```

---

## Security Hardening & Scan Compliance

VaultDesk has been engineered from the ground up to satisfy enterprise security audits, static analysis tools (SAST), and strict supply-chain checks:

### 1. 0 Known Vulnerabilities (`npm audit`)
* Dependency tree is aligned with Vite 8 and React 19.
* Zero reported vulnerabilities in `npm audit` across all dependencies.

### 2. GitHub CodeQL SAST Zero-Alert Compliance
* Full compliance with CodeQL JavaScript/TypeScript rule suites.
* **SSRF (CWE-918 / `js/request-forgery`)**: Resolved by strictly binding outbound HTTP requests to validated domain allowlists (`INITIAL_APPROVED_DOMAINS` and `customApprovedDomainsDb`) with DNS IP verification preventing loopback/RFC-1918 tunneling.
* **Missing Rate Limiting (CWE-400 / `js/missing-rate-limiting`)**: All public and sensitive endpoints (`/api/auth/*`, `/api/ai/*`, `/api/connectors/*`, `/api/logs/*`, `/api/readme`) are protected with dedicated in-memory token bucket rate limiters.

### 3. Cross-Site Scripting Neutralization (CWE-79)
* The Rich Text Runbook editor (`src/components/RichTextEditor.tsx`) implements a multi-pass HTML sanitizer (`sanitizeHtmlOutput`).
* Strips all executable tags (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<applet>`, `<style>`).
* Strips dangerous URI schemes (`javascript:`, `vbscript:`, `data:text/html`).
* Strips all inline JavaScript event handlers (`onload`, `onerror`, `onclick`, etc.).

### 4. Cryptographically Secure Tokens (CWE-330 / CWE-384)
* Authentication session tokens and email invitation tokens are generated using Node.js's native `crypto.randomUUID()` instead of pseudorandom numbers (`Math.random`).

### 5. Server-Side RBAC Enforcement (OWASP API 5 / BFLA)
* Mutating API endpoints (`POST /api/users`, `DELETE /api/users/:id`, `PUT /api/roles/:id`, `POST /api/kb`, `PUT /api/auth/ldap`) validate bearer authentication and inspect the user's role and granular permissions server-side.
* Unauthorized callers receive `401 Unauthorized` or `403 Forbidden`.

### 6. HTTP Security Headers (CWE-693)
The Express server automatically emits security headers on all responses:
* `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing attacks)
* `X-Frame-Options: SAMEORIGIN` (Protects against clickjacking)
* `X-XSS-Protection: 1; mode=block` (Enforces legacy browser XSS filters)
* `Referrer-Policy: strict-origin-when-cross-origin` (Safeguards internal URLs)

---

## Running Security Scans Locally & on GitHub

### 1. Run Dependency Audit
```bash
npm audit
```

### 2. Run TypeScript Static Type Analysis
```bash
npm run lint
```

### 3. Run Gitleaks Secret Scan (Optional)
If you have [Gitleaks](https://github.com/gitleaks/gitleaks) installed:
```bash
gitleaks detect --verbose
```

### 4. GitHub Actions Automated Scan
The repository includes `.github/workflows/ci-security.yml`, which automatically executes:
* Automated dependency installation via `npm ci`
* Static lint and compilation check (`npm run lint`)
* Production build verification (`npm run build`)
* Dependency vulnerability check (`npm audit --audit-level=high`)
* **GitHub CodeQL SAST Analysis** for JavaScript and TypeScript

---

## Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Starts the Express server with Vite middleware in development mode. |
| `npm run build` | `vite build && esbuild server.ts ...` | Builds the client static bundle and the server CommonJS bundle. |
| `npm start` | `node dist/server.cjs` | Runs the compiled production server. |
| `npm run lint` | `tsc --noEmit` | Runs the TypeScript compiler to check for type errors. |
| `npm run clean` | `rm -rf dist server.js` | Removes compiled distribution directories and temporary files. |
| `npm run preview` | `vite preview` | Previews the built frontend client locally. |

---

## Project File Structure

```
.
├── .env.example               # Template environment configuration (no secrets)
├── .github/
│   └── workflows/
│       └── ci-security.yml    # GitHub Actions CI & CodeQL SAST workflow
├── .gitignore                 # Excludes node_modules, build output, .env files
├── .gitleaksignore            # Gitleaks whitelist for mock test certificates
├── index.html                 # HTML entry point with metadata
├── package.json               # Dependencies and build scripts
├── package-lock.json          # Locked dependency tree for deterministic builds
├── server.ts                  # Express backend: APIs, RBAC, Gemini proxy, SSRF defenses
├── tsconfig.json              # TypeScript compilation config
├── vite.config.ts             # Vite frontend bundler config
└── src/
    ├── App.tsx                # Main portal gateway and session manager
    ├── main.tsx               # React application DOM root
    ├── index.css              # Global Tailwind CSS imports and custom rules
    ├── types.ts               # Core TypeScript data contracts and RBAC interfaces
    ├── components/
    │   ├── BookmarksDrawer.tsx            # Saved articles drawer
    │   ├── CommunityHub.tsx               # Tech community threads browser
    │   ├── ComponentErrorHeatmapWidget.tsx# Error frequency heatmap
    │   ├── DiagnosticWizard.tsx           # Step-by-step troubleshooting assistant
    │   ├── ErrorDetailModal.tsx           # Detailed error modal with recovery steps
    │   ├── LocalKnowledgeBase.tsx         # Knowledge base & runbook manager
    │   ├── LoginView.tsx                  # 4-mode authentication & invite acceptance
    │   ├── MarketplaceBrowser.tsx         # CyberArk plugins and integrations
    │   ├── Navbar.tsx                     # Header navigation, demo switcher, search
    │   ├── PsmConnectorStudio.tsx         # PSM Web Connector Studio & Dispatcher builder
    │   ├── ReadmeModal.tsx                # In-app README viewer and exporter
    │   ├── RichTextEditor.tsx             # Sanitized Markdown / WYSIWYG editor
    │   ├── SettingsView.tsx               # System preferences & telemetry config
    │   ├── TrendingIssuesWidget.tsx       # Trending PAM alerts widget
    │   ├── TroubleshootingDashboard.tsx   # Curated errors catalog & log triage
    │   ├── UpdatesDashboard.tsx           # CVE advisories & release tracker
    │   └── UserManagement.tsx             # User directory & custom RBAC matrix
    ├── data/
    │   ├── communityArticles.ts           # Pre-indexed community knowledge articles
    │   ├── initialLocalKb.ts              # Seed runbooks and standard operating procedures
    │   ├── pamData.ts                     # Curated PAM error codes, updates, advisories
    │   ├── rbacData.ts                    # System roles, custom roles, permissions matrix
    │   └── symptomAreas.ts                # Diagnostic symptom categorization
    └── utils/
        ├── exportHelper.ts                # Runbook export to Word, PDF, and Markdown
        ├── logAnalyzer.ts                 # Log parser with PII & credential anonymizer
        └── symptomHelper.ts               # Symptom classification logic
```

---

## API Endpoints Reference

### Authentication & Sessions
* `POST /api/auth/login` — Authenticate via local, LDAP, or SAML credentials.
* `GET /api/auth/me` — Retrieve active session profile and assigned permissions.
* `POST /api/auth/logout` — Terminate session.

### User Management & RBAC
* `GET /api/users` — List users with role, status, and search filters.
* `POST /api/users` — Create local user account (`users:manage`).
* `PUT /api/users/:id` — Update user role or status (`users:manage`).
* `DELETE /api/users/:id` — Remove user (`users:manage`).
* `POST /api/users/invite` — Generate time-limited invitation token (`users:invite`).
* `POST /api/users/invite/:token/accept` — Activate account via invitation token.
* `GET /api/roles` — Retrieve system role permissions and custom role definitions.
* `POST /api/roles` — Create custom role definition (`users:manage`).
* `PUT /api/roles/:id` — Update custom role privilege matrix (`users:manage`).
* `DELETE /api/roles/:id` — Remove custom role (`users:manage`).

### Diagnostics & Log Analysis
* `POST /api/analyze-log` — Parse and triage raw CyberArk logs with automatic sanitization (`logs:analyze`).
* `POST /api/logs/save` — Save sanitized log entry to server database.
* `GET /api/logs/saved` — List saved sanitized logs.
* `DELETE /api/logs/saved/:id` — Delete saved sanitized log.
* `POST /api/ai/diagnose` — Synthesize AI resolution using Gemini with search grounding or offline fallback.
* `POST /api/errors` — Promote AI diagnosis into curated error database (`troubleshoot:promote_ai`).

### PSM Web Connectors & WebForm Generator
* `GET /api/connectors` — List all custom PSM Web Connectors.
* `GET /api/connectors/:id` — Get single connector definition.
* `POST /api/connectors` — Create or update PSM connector.
* `DELETE /api/connectors/:id` — Delete PSM connector.
* `POST /api/connectors/generate-webform` — Scan live URL/DOM with SSRF protection & synthesize WebFormFields.
* `GET /api/connectors/allowed-domains` — List approved target scanner domains.
* `POST /api/connectors/allowed-domains` — Authorize a new target domain for live scanning.

### Knowledge Base & Runbooks
* `GET /api/kb` — Query runbooks with space, component, and keyword filters.
* `GET /api/kb/:id` — Retrieve full runbook article by ID or slug.
* `POST /api/kb` — Publish new knowledge article (`kb:write`).
* `PUT /api/kb/:id` — Update article content (`kb:write`).
* `DELETE /api/kb/:id` — Archive article (`kb:delete`).
* `POST /api/kb/:id/vote` — Upvote helpfulness of an article.

### README & Documentation
* `GET /api/readme` — Retrieve README.md content as JSON.
* `GET /api/download/readme` — Download raw README.md file directly.

---

## Troubleshooting & FAQ

### Q1: `Error: listen EADDRINUSE: address already in use :::3000`
**Cause**: Another process is occupying port 3000.  
**Solution**:
* *Linux/macOS*: `lsof -ti :3000 | xargs kill -9`
* *Windows (PowerShell)*: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force`
* Or specify a custom port: `PORT=3001 npm run dev`

### Q2: `npm error ERESOLVE could not resolve peer dependency`
**Cause**: Node package manager detecting conflicting version ranges from third-party plugins.  
**Solution**: Run with `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps
```
*(The repository's `package.json` and `package-lock.json` have already been resolved for full compatibility with Vite 8 and React 19).*

### Q3: How do I test the Gemini AI feature without an API key?
**Answer**: An API key is completely optional. When `GEMINI_API_KEY` is not present, VaultDesk automatically queries its pre-indexed offline knowledge database containing 120+ verified CyberArk runbooks and troubleshooting checklists without failing.

### Q4: Target domain rejected during PSM Connector live scan
**Cause**: VaultDesk enforces strict SSRF protections to prevent server-side request forgery against private networks.  
**Solution**: In the **PSM Connector Studio**, enable the **"Auto-authorize domain"** toggle, or click **"Allowed Domains"** to add your target enterprise host to the approved scanner list.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
