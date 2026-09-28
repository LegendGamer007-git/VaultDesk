---
version: "alpha"
name: "VaultDesk Design System"
description: "A premium, enterprise-grade design system fusing high-security industrial robustness with Apple-inspired minimalism. Optimized for high data-density security dashboards, low-fatigue extended dark-mode use, and surgical layout precision."

colors:
  mode: "dark-first"
  base:
    canvas: "#0B0E14"          # primary app background — deep slate, not pure black
    surface-1: "#12151C"       # base card/panel surface
    surface-2: "#1A1E27"       # elevated surface (modals, popovers)
    surface-3: "#232833"       # highest elevation (dropdowns, tooltips)
    overlay-scrim: "#05070ACC" # modal backdrop, 80% opacity
  border:
    subtle: "#232833"
    default: "#2E3440"
    strong: "#3D4454"
    focus-ring: "#0A84FF"
  text:
    primary: "#F5F6F8"         # body/headings on dark — ~17.8:1 on canvas
    secondary: "#A6AEC0"       # supporting text — ~7.9:1 on canvas
    tertiary: "#6E7787"        # metadata, timestamps — ~4.6:1 on canvas
    disabled: "#4B5261"
    inverse: "#0B0E14"         # text on light/accent-filled surfaces
  accent:
    primary: "#0A84FF"         # interactive default — links, primary actions
    primary-hover: "#3B9EFF"
    primary-pressed: "#0866CC"
    secondary: "#64D2FF"       # informational highlights, active states
  semantic:
    critical: "#FF453A"        # active exploit / breach / CVSS 9-10
    critical-surface: "#2A1414"
    high: "#FF6961"            # CVSS 7-8.9
    warning: "#FF9F0A"         # patch needed, degraded state
    warning-surface: "#2A1F0C"
    success: "#30D158"         # resolved, healthy, up to date
    success-surface: "#12241A"
    info: "#64D2FF"
    info-surface: "#101E26"
    neutral: "#8E97A8"
  data-viz:
    categorical:
      - "#0A84FF"
      - "#64D2FF"
      - "#30D158"
      - "#FF9F0A"
      - "#BF5AF2"
      - "#FF453A"
    sequential-heat: ["#12151C", "#1E3A5F", "#0A84FF", "#64D2FF"]
  contrast_policy: "All text/background pairings meet WCAG 2.1 AA (4.5:1 body, 3:1 large text/18px+ bold); primary text on canvas/surface pairings meet AAA (7:1+)."
  light_mode_note: "Optional light theme inverts to canvas #F5F6F7, surface-1 #FFFFFF, text-primary #14171C — accent and semantic hues unchanged, verified at same contrast ratios."

typography:
  font_families:
    primary: "'SF Pro Display', 'SF Pro Text', -apple-system, 'Inter', 'Segoe UI', sans-serif"
    mono: "'SF Mono', 'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace"
  usage_note: "Mono is reserved for error codes, CVE IDs, log output, hashes, and version strings — never for prose."
  scale:
    display:    { size: "40px", line_height: "48px", weight: 700, tracking: "-0.02em" }
    h1:         { size: "32px", line_height: "40px", weight: 700, tracking: "-0.015em" }
    h2:         { size: "24px", line_height: "32px", weight: 600, tracking: "-0.01em" }
    h3:         { size: "20px", line_height: "28px", weight: 600, tracking: "-0.005em" }
    h4:         { size: "17px", line_height: "24px", weight: 600, tracking: "0em" }
    body-lg:    { size: "16px", line_height: "24px", weight: 400, tracking: "0em" }
    body:       { size: "14px", line_height: "20px", weight: 400, tracking: "0em" }
    body-sm:    { size: "13px", line_height: "18px", weight: 400, tracking: "0em" }
    caption:    { size: "12px", line_height: "16px", weight: 500, tracking: "0.01em" }
    overline:   { size: "11px", line_height: "14px", weight: 600, tracking: "0.06em", transform: "uppercase" }
    code:       { size: "13px", line_height: "20px", weight: 400, tracking: "0em", family: "mono" }

spacing:
  base_unit: "4px"
  scale:
    xxs: "4px"
    xs: "8px"
    sm: "12px"
    md: "16px"
    lg: "24px"
    xl: "32px"
    xxl: "48px"
    xxxl: "64px"
    huge: "96px"
  radius:
    sm: "6px"
    md: "10px"
    lg: "14px"
    xl: "20px"
    pill: "999px"
  elevation:
    e0: "none"
    e1: "0 1px 2px rgba(0,0,0,0.4)"
    e2: "0 4px 12px rgba(0,0,0,0.45)"
    e3: "0 12px 32px rgba(0,0,0,0.55)"
  grid:
    columns: 12
    gutter: "24px"
    container_max: "1440px"
    sidebar_width: "280px"

components:
  button:
    primary: { bg: "accent.primary", text: "text.inverse", radius: "radius.md", padding: "10px 20px", hover_bg: "accent.primary-hover" }
    secondary: { bg: "transparent", border: "border.strong", text: "text.primary", radius: "radius.md" }
    destructive: { bg: "semantic.critical", text: "#FFFFFF", radius: "radius.md" }
    ghost: { bg: "transparent", text: "accent.primary", hover_bg: "surface-2" }
  card:
    surface: "surface-1"
    border: "border.subtle"
    radius: "radius.lg"
    padding: "spacing.lg"
    elevation: "e1"
  stat-widget:
    surface: "surface-1"
    accent_bar: "left, 3px, semantic-coded"
    label: "typography.overline, text.tertiary"
    value: "typography.h1, text.primary, mono for numerics"
  severity-badge:
    critical: { bg: "semantic.critical-surface", text: "semantic.critical", border: "semantic.critical" }
    high: { bg: "semantic.critical-surface", text: "semantic.high" }
    warning: { bg: "semantic.warning-surface", text: "semantic.warning" }
    success: { bg: "semantic.success-surface", text: "semantic.success" }
    info: { bg: "semantic.info-surface", text: "semantic.info" }
    shape: "radius.pill, 4px 10px padding, caption weight 600"
  data-table:
    row_height: "44px"
    header: { bg: "surface-1", text: "typography.overline, text.tertiary", border_bottom: "border.default" }
    row_divider: "border.subtle"
    row_hover: "surface-2"
    zebra: false
  input:
    bg: "surface-2"
    border: "border.default"
    focus_border: "accent.primary"
    focus_ring: "0 0 0 3px rgba(10,132,255,0.25)"
    radius: "radius.md"
    height: "40px"
  sidebar-nav:
    bg: "canvas"
    border_right: "border.subtle"
    item_active: { bg: "surface-2", text: "accent.primary", indicator: "2px left bar, accent.primary" }
    item_default: { text: "text.secondary" }
  modal:
    surface: "surface-2"
    scrim: "overlay-scrim"
    radius: "radius.xl"
    elevation: "e3"
  code-block:
    bg: "#080A0F"
    border: "border.subtle"
    text: "typography.code, text.primary"
    radius: "radius.md"
  tooltip:
    bg: "surface-3"
    text: "body-sm"
    radius: "radius.sm"
    elevation: "e2"
  alert-banner:
    critical: { bg: "semantic.critical-surface", border_left: "3px solid, semantic.critical" }
    warning: { bg: "semantic.warning-surface", border_left: "3px solid, semantic.warning" }
    info: { bg: "semantic.info-surface", border_left: "3px solid, semantic.info" }
---

# VaultDesk Design System
