# Pulsar

Pulsar is a focused visual CSS generator for Button, Card, Input, Flexbox, and Grid styles. It combines native controls, a live preview, and deterministic copy-ready CSS in one responsive workspace.

## Overview

Each of Pulsar's five generators keeps independent state during the current browser session. Switching generators restores its controls, preview, output filename, and generated CSS without carrying values into another generator.

## Current generators

### Button

Eight controls configure font size, vertical padding, horizontal padding, border radius, background color, text color, border width, and border color.

### Card

Seven controls configure width, padding, border radius, background color, text color, border width, and border color. Generated Card CSS includes `box-sizing: border-box` and `max-width: 100%` so configured widths remain truthful while the preview stays contained.

### Input

Eight Base controls configure font size, vertical padding, horizontal padding, border radius, background color, text color, border width, and border color.

Four Focus controls configure focus border color, outline width, outline color, and outline offset. The preview is a labelled native input, so pointer and keyboard focus use real browser behavior. Output contains deterministic `.input` and `.input:focus` rules; preview-only label, placeholder, and responsive sizing are not copied.

### Flexbox

Five container-level controls configure `flex-direction`, `justify-content`, `align-items`, `flex-wrap`, and `gap`. The preview uses five static decorative children and keeps overflow inside its preview surface when necessary.

Pulsar V5 generates Flexbox container CSS only. It does not configure individual children through properties such as `flex-grow`, `flex-shrink`, `flex-basis`, `order`, or `align-self`, and it does not expose `align-content`.

### Grid

Six container-level controls configure columns, rows, column gap, row gap, `justify-items`, and `align-items`. Columns and rows generate explicit equal-fraction tracks, while row and column gaps remain independent.

The preview uses a static pool of 96 decorative items and shows `columns × rows` items. Generated output is container-level Grid CSS only. Pulsar V5 does not configure item placement, spans, areas, arbitrary track syntax, implicit-grid behavior, `minmax()`, `auto-fit`, `auto-fill`, or responsive generated CSS.

## Features

- Live previews driven by the same normalized state as generated CSS
- Deterministic CSS output with an accurate filename for each generator
- One-click Copy with truthful success or failure feedback and a resilient fallback
- Five independent in-session generator states
- Native form controls and native keyboard interaction
- Visible focus treatment, labelled controls, and polite live feedback
- A responsive desktop-first workspace that remains usable at narrow widths
- Zero runtime dependencies and zero test dependencies
- No framework, package manager, or build step required

Pulsar does not persist settings between page loads.

## Architecture

```text
Controls
→ normalization
→ independent generator state
→ generator definition
→ preview + deterministic CSS generation
→ authoritative generatedCSS
→ clipboard
```

A small `generatorDefinitions` table connects each generator to its controls, preview renderer, CSS generator, and output filename. Shared infrastructure handles numeric, color, and enum normalization, active rendering, switching, output, and clipboard behavior.

## Usage

Open `index.html` directly; there is no install or build step.

For the most reliable Clipboard API behavior, serve the directory from localhost with any basic static server. For example, if Python is available:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Testing

The regression suite uses Node.js built-ins and has no package dependencies:

```sh
node tests/regression.cjs
```

## Accessibility and responsive behavior

Pulsar uses labelled native controls, a native five-option radio group, visible `:focus-visible` treatment, a labelled editable Input preview, keyboard-reachable CSS output, and polite copy feedback. Inactive generator views are natively hidden. Flexbox and Grid preview children are decorative and remain outside the keyboard path.

The three-panel desktop workspace moves the output below the editor at intermediate widths and stacks all panels on narrow screens. Cards and Inputs remain contained, while demanding Flexbox and Grid layouts use internal preview overflow instead of causing page-level horizontal scrolling.

## Tech

- HTML
- CSS
- Vanilla JavaScript
- Node.js built-ins for optional regression tests

## Status

**Pulsar V5 — Grid Layout**

## Roadmap

Possible future directions include additional focused CSS generators, deeper Flexbox and Grid controls, presets, persistence, and additional interaction states. These are future possibilities, not current functionality, and have no promised delivery dates.
