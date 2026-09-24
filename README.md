# Pulsar

Pulsar is a focused visual CSS generator with dedicated generators for common UI and layout patterns. It provides live previews for Button, Card, Input, and Flexbox configurations and produces deterministic CSS ready to copy into another project.

## Overview

The interface combines generator-specific controls, a spacious preview, and readable CSS output in one continuous workspace. Button, Card, Input, and Flexbox retain independent state for the current browser session, so switching generators does not discard in-progress changes.

## Current generators

### Button

Eight controls cover font size, vertical padding, horizontal padding, border radius, background color, text color, border width, and border color.

### Card

Seven controls cover width, padding, border radius, background color, text color, border width, and border color. Generated Card CSS includes `box-sizing: border-box` and `max-width: 100%` so configured widths remain practical in narrower containers.

### Input

Eight Base controls cover typography, spacing, shape, and colors. Four Focus controls cover border color, outline width, outline color, and outline offset. The preview is a native input, so pointer and keyboard focus exercise the real browser `:focus` behavior. Generated output contains deterministic `.input` and `.input:focus` rules, while preview-only responsive width, label, and placeholder scaffolding stay out of copied CSS.

### Flexbox

Five container-level controls cover `flex-direction`, `justify-content`, `align-items`, `flex-wrap`, and `gap`. The five-item preview updates from the same normalized state used to generate deterministic `.flexbox` CSS. Preview dimensions and item styling remain evaluation scaffolding and are not copied.

Flexbox does not currently generate per-child configuration such as `flex-grow`, `flex-shrink`, `flex-basis`, `order`, or `align-self`, and it does not expose `align-content`.

## Features

- Live preview and real-time CSS generation from the same normalized state
- Native four-generator selector with independent in-session generator state
- Deterministic, copy-ready CSS output with the active filename
- One-click copy with textual success/failure feedback, using the Clipboard API with a resilient fallback
- Responsive three-panel workspace that stacks cleanly at narrower widths
- Keyboard-accessible controls, visible focus indicators, and polite copy feedback
- Zero runtime or test dependencies, with no framework or build step

Pulsar does not persist settings between page loads.

## Architecture

```text
Controls
→ normalization
→ independent generator state
→ preview + deterministic CSS
→ clipboard
```

A small `generatorDefinitions` dispatch table connects each generator to its controls, preview renderer, CSS generator, and output filename. Each generator owns independent state while shared infrastructure handles normalization, active rendering, switching, output, and copying.

## Usage

Open `index.html` directly—there is no install or build step.

For the most reliable Clipboard API behavior, serve the directory from localhost with any basic static server. For example, if Python is available:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

Optional regression tests use Node.js built-ins only:

```sh
node tests/regression.cjs
```

## Accessibility and responsive behavior

Pulsar uses labelled native controls, a native radio group for generator selection, visible keyboard focus, a labelled editable Input preview, and polite textual copy feedback. Inactive generator views are natively hidden, while the Flexbox preview remains decorative and outside the keyboard path.

The desktop-first three-panel workspace stacks at narrower widths. Generated Cards and Inputs remain contained, and intentional Flexbox overflow stays inside its preview surface.

## Tech

- HTML
- CSS
- Vanilla JavaScript
- Node.js built-ins for optional regression tests

## Status

**Pulsar V4 — Flexbox Layout**

## Roadmap

Possible future directions include a Grid generator, additional focused CSS generators, Card enhancements, and optional presets or persistence. These are not part of V4.
