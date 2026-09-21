---
name: FinClaro
description: Finanzas personales explicadas de forma sencilla para España.
colors:
  ink: "#15181d"
  muted: "#66707b"
  line: "#dfe4e8"
  soft: "#f2f5f4"
  surface: "#f8f9f8"
  white: "#ffffff"
  accent: "#18794e"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(48px, 6.2vw, 82px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.065em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    lineHeight: 1.7
rounded:
  sm: "9px"
  md: "12px"
  lg: "14px"
spacing:
  sm: "12px"
  md: "24px"
  lg: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
---

# Design System: FinClaro

## Overview

**Creative North Star: "Editorial clarity"**

FinClaro should feel like a trustworthy Spanish personal-finance publication rather than a generic SaaS dashboard. Information hierarchy, search intent and practical tools lead the visual system.

**Key Characteristics:**
- Restrained finance-editorial palette.
- Dark ink surfaces balanced by warm-neutral page surfaces.
- Strong display hierarchy with compact supporting text.
- Moderate 12–14px corners rather than excessive pill/card treatment.
- Green reserved for useful actions and positive system accents.

## Colors

The palette is neutral-first with one restrained green accent.

### Primary
- **FinClaro green** (#18794e): primary actions, useful links and selected emphasis.

### Neutrals
- **Ink** (#15181d): headings, dark hero and footer.
- **Muted** (#66707b): secondary text.
- **Line** (#dfe4e8): borders and separators.
- **Soft** (#f2f5f4): low-emphasis surfaces.
- **Page** (#f8f9f8): page background.

## Typography

Display headings use a tight, high-contrast system sans scale. Body copy stays readable and restrained. Headings use negative tracking selectively; body text should not be tightly tracked.

## Layout

Use a 1240px maximum content container. Prefer asymmetry where it improves hierarchy, especially in the homepage hero. Use 12-column editorial grids for topic/navigation areas, collapsing to 6-column and then single-column layouts on smaller screens.

## Elevation & Depth

Prefer borders and tonal separation over heavy shadows. Shadows should be soft and used only on interactive elevation changes.

## Shapes

Use 9–14px radii for controls and cards. Avoid turning every container into a pill. Pills are reserved for compact metadata/filter controls.

## Components

Buttons have clear primary/secondary hierarchy and visible focus. Cards are used when content is independently actionable; do not nest cards. Topic and article cards should have restrained hover lift.

## Do's and Don'ts

- Do preserve the editorial reading path.
- Do use real labels and semantic controls.
- Do keep mobile layouts simple and touch-friendly.
- Do use the green accent sparingly.
- Don't introduce gradient text, decorative emoji icons, or excessive glassmorphism.
- Don't replace useful content with decorative UI.
