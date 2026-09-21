# Pulsar

Pulsar is a focused visual CSS generator for building Button, Card, and Interactive Input styles, evaluating the result live, and copying deterministic CSS into another project.

## Overview

The interface combines generator-specific controls, a spacious preview, and readable CSS output in one continuous workspace. Button, Card, and Input retain independent state for the current browser session, so switching generators does not discard in-progress changes.

## Current generators

### Button

Configure font size, vertical padding, horizontal padding, border radius, background color, text color, border width, and border color.

### Card

Configure width, padding, border radius, background color, text color, border width, and border color. Generated Card CSS includes `box-sizing: border-box` and `max-width: 100%` so configured widths remain practical in narrower containers.

### Input

Configure Base typography, spacing, shape, and colors alongside Focus border color, outline width, outline color, and outline offset. The preview is a native input, so pointer and keyboard focus exercise the real browser `:focus` behavior. Generated output contains deterministic `.input` and `.input:focus` rules, while preview-only responsive width, label, and placeholder scaffolding stay out of copied CSS.

## Features

- Live preview and real-time CSS generation from the same normalized state
- Native Button/Card/Input selector with independent in-session generator state
- Deterministic, copy-ready CSS output with the active filename
- One-click copy using the Clipboard API with a resilient fallback
- Responsive three-panel workspace that stacks cleanly at narrower widths
- Keyboard-accessible controls, visible focus indicators, and polite copy feedback
- Zero runtime or test dependencies, with no framework or build step

Pulsar does not persist settings between page loads.

## Architecture

```text
Controls
→ active generator state
→ preview + generated CSS
→ shared clipboard
```

A small `generatorDefinitions` dispatch table connects each generator to its controls, preview renderer, CSS generator, and output filename. Normalization, active rendering, generator switching, output, and clipboard behavior remain shared.

## Usage

Open `index.html` directly—there is no install or build step.

For the most reliable Clipboard API behavior, serve the directory from localhost with any basic static server. For example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

Optional regression tests use Node.js built-ins only:

```sh
node tests/regression.cjs
```

## Tech

- HTML
- CSS
- Vanilla JavaScript
- Node.js built-ins for optional regression tests

## Status

**Pulsar V3 — Interactive Input**

## Roadmap

Potential future areas include additional focused CSS generators and carefully scoped output formats.
