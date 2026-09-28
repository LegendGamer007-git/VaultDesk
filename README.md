Complete project overview with architecture diagram and feature list.
OS & Hardware Requirements: Documented support for Linux (Ubuntu, Debian, RHEL, Alpine), macOS (Apple Silicon & Intel), and Windows 10/11 (PowerShell & WSL2), along with CPU/RAM/Disk requirements.
Prerequisites: Minimum versions for Node.js (20.x or 22.x LTS), npm, and Git.
Step-by-Step Installation: Clean commands for cloning, configuring .env, installing dependencies (npm install / npm ci), running the dev server (npm run dev), and building for production (npm run build).
Environment Variables Reference: Documentation for GEMINI_API_KEY, APP_URL, and PORT.
Security Hardening Guide: Detailed breakdown of SAST compliance and mitigation steps.
Available NPM Scripts & API Reference: Full cheat sheet of commands and REST endpoints.
Troubleshooting FAQ: Port conflicts (EADDRINUSE:3000), peer dependency guidance, and optional API key testing.
.github/workflows/ci-security.yml:
Ready-to-use GitHub Actions workflow executing:
Deterministic dependency installation (npm ci)
TypeScript type-checking (npm run lint)
Production bundling (npm run build)
Dependency vulnerability audit (npm audit --audit-level=high)
GitHub CodeQL SAST Analysis for JavaScript and TypeScript.
.gitleaksignore:
Whitelist configuration for mock SAML assertion certificates.
