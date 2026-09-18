# Pulsar

Pulsar is a visual CSS generator — adjust properties, see the result live, and copy the CSS immediately.

## What it is

Pulsar is a focused workspace for visually building CSS without losing sight of the code. Controls feed a live preview and readable CSS output from the same configuration.

## V1

Pulsar V1 introduces the Button generator. It provides a polished foundation for shaping a button and taking the resulting CSS into another project.

## Features

- Live controls for font size, padding, radius, background, text, and border
- Preview and generated CSS kept in sync through one state object
- One-click CSS copying with accessible success and failure feedback
- Responsive three-panel interface with keyboard-visible focus
- No dependencies, framework, build step, storage, or network requirement

## How it works

`Controls → State → Preview + CSS`

Every control update is normalized into one state object. The preview and CSS output are then rendered from that same state, so they cannot drift apart.

## Running locally

Open `index.html` directly for the simplest setup.

For the most reliable Clipboard API behavior, serve the directory through localhost with any basic static server. Python is one dependency-free option for the project itself:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Stack

- HTML
- CSS
- JavaScript

## Roadmap

Future releases may explore additional generators such as Cards, Inputs, and Grids. These are possibilities, not features included in V1.

## Project status

Pulsar V1 — Button Generator is complete.
