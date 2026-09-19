const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

class MockElement {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.style = {};
    this.listeners = {};
    this.removed = false;
    this.focused = false;
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.dataset = {};
  }

  addEventListener(type, callback) {
    this.listeners[type] = callback;
  }

  input(value) {
    this.value = value;
    return this.listeners.input({ currentTarget: this });
  }

  click() {
    if (this.disabled) return undefined;
    return this.listeners.click({ currentTarget: this });
  }

  change(checked = true) {
    this.checked = checked;
    return this.listeners.change({ currentTarget: this });
  }

  setAttribute() {}
  select() {}
  remove() { this.removed = true; }
  focus() { this.focused = true; }
}

const ids = [
  "font-size", "font-size-output",
  "vertical-padding", "vertical-padding-output",
  "horizontal-padding", "horizontal-padding-output",
  "border-radius", "border-radius-output",
  "border-width", "border-width-output",
  "background-color", "background-color-output",
  "text-color", "text-color-output",
  "border-color", "border-color-output",
  "card-width", "card-width-output",
  "card-padding", "card-padding-output",
  "card-border-radius", "card-border-radius-output",
  "card-border-width", "card-border-width-output",
  "card-background-color", "card-background-color-output",
  "card-text-color", "card-text-color-output",
  "card-border-color", "card-border-color-output",
  "generator-name", "generator-button", "generator-card",
  "generated-css", "copy-css", "copy-status",
];

const elements = Object.fromEntries(ids.map((id) => [id, new MockElement(id)]));
elements["copy-status"].textContent = "CSS ready to copy.";
elements["generator-button"].value = "button";
elements["generator-button"].checked = true;
elements["generator-card"].value = "card";
const preview = new MockElement("preview");
preview.dataset.generatorPreview = "button";
const cardPreview = new MockElement("card-preview");
cardPreview.dataset.generatorPreview = "card";
cardPreview.hidden = true;
const buttonControlView = new MockElement("button-controls");
buttonControlView.dataset.generatorControls = "button";
const cardControlView = new MockElement("card-controls");
cardControlView.dataset.generatorControls = "card";
cardControlView.hidden = true;
const outputFilename = new MockElement("output-filename");
const temporaryElements = [];
const fallbackWrites = [];
let fallbackResult = false;

const document = {
  body: { appendChild: (element) => temporaryElements.push(element) },
  getElementById: (id) => elements[id],
  querySelector(selector) {
    if (selector === ".generated-button") return preview;
    if (selector === ".generated-card") return cardPreview;
    if (selector === ".output-toolbar-label") return outputFilename;
    throw new Error(`Unexpected selector: ${selector}`);
  },
  querySelectorAll(selector) {
    if (selector === 'input[name="generator"]') {
      return [elements["generator-button"], elements["generator-card"]];
    }
    if (selector === "[data-generator-controls]") {
      return [buttonControlView, cardControlView];
    }
    if (selector === "[data-generator-preview]") {
      return [preview, cardPreview];
    }
    throw new Error(`Unexpected selector: ${selector}`);
  },
  createElement(tagName) {
    if (tagName !== "textarea") {
      throw new Error(`Unexpected element: ${tagName}`);
    }
    return new MockElement("temporary-textarea");
  },
  execCommand(command) {
    if (command !== "copy") {
      throw new Error(`Unexpected command: ${command}`);
    }
    const temporary = temporaryElements.at(-1);
    if (fallbackResult) fallbackWrites.push(temporary.value);
    return fallbackResult;
  },
};

const clipboardCalls = [];
const navigator = { clipboard: undefined };
const context = { document, navigator, console };
vm.createContext(context);
vm.runInContext(
  `${script}\nglobalThis.testApi = {
    state,
    generatorDefinitions,
    renderActive,
    renderButtonPreview,
    generateButtonCSS,
    renderCardPreview,
    generateCardCSS,
    switchGenerator,
    generatedCSS: () => generatedCSS,
  };`,
  context,
);

const failures = [];
let checkCount = 0;

function check(condition, message) {
  checkCount += 1;
  if (!condition) failures.push(message);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function setClipboard(implementation) {
  navigator.clipboard = {
    writeText(text) {
      clipboardCalls.push(text);
      return implementation(text);
    },
  };
}

function expectedButtonCSS(state) {
  return `.button {
  font-size: ${state.fontSize}px;
  padding: ${state.verticalPadding}px ${state.horizontalPadding}px;
  border-radius: ${state.borderRadius}px;
  background-color: ${state.backgroundColor};
  color: ${state.textColor};
  border: ${state.borderWidth}px solid ${state.borderColor};
}`;
}

function expectedCardCSS(state) {
  return `.card {
  box-sizing: border-box;
  width: ${state.width}px;
  max-width: 100%;
  padding: ${state.padding}px;
  border-radius: ${state.borderRadius}px;
  background-color: ${state.backgroundColor};
  color: ${state.textColor};
  border: ${state.borderWidth}px solid ${state.borderColor};
}`;
}

function checkButtonSynchronization(label) {
  const state = context.testApi.state.generators.button;
  const generatedCSS = context.testApi.generatedCSS();
  const previewMatches =
    preview.style.fontSize === `${state.fontSize}px` &&
    preview.style.padding === `${state.verticalPadding}px ${state.horizontalPadding}px` &&
    preview.style.borderRadius === `${state.borderRadius}px` &&
    preview.style.backgroundColor === state.backgroundColor &&
    preview.style.color === state.textColor &&
    preview.style.borderWidth === `${state.borderWidth}px` &&
    preview.style.borderColor === state.borderColor &&
    preview.style.borderStyle === "solid";

  check(previewMatches, `${label}: preview matches state`);
  check(generatedCSS === expectedButtonCSS(state), `${label}: generated CSS matches state exactly`);
  check(elements["generated-css"].textContent === generatedCSS, `${label}: displayed CSS is authoritative`);
}

function checkCardSynchronization(label) {
  const state = context.testApi.state.generators.card;
  const generatedCSS = context.testApi.generatedCSS();
  const previewMatches =
    cardPreview.style.boxSizing === "border-box" &&
    cardPreview.style.width === `${state.width}px` &&
    cardPreview.style.maxWidth === "100%" &&
    cardPreview.style.padding === `${state.padding}px` &&
    cardPreview.style.borderRadius === `${state.borderRadius}px` &&
    cardPreview.style.backgroundColor === state.backgroundColor &&
    cardPreview.style.color === state.textColor &&
    cardPreview.style.borderWidth === `${state.borderWidth}px` &&
    cardPreview.style.borderColor === state.borderColor &&
    cardPreview.style.borderStyle === "solid";

  check(previewMatches, `${label}: Card preview matches state`);
  check(generatedCSS === expectedCardCSS(state), `${label}: Card CSS matches state exactly`);
  check(elements["generated-css"].textContent === generatedCSS, `${label}: displayed Card CSS is authoritative`);
}

async function run() {
  const rootState = context.testApi.state;
  const buttonState = rootState.generators.button;
  const cardState = rootState.generators.card;
  const copyButton = elements["copy-css"];
  const copyStatus = elements["copy-status"];

  check(
    JSON.stringify(buttonState) === JSON.stringify({
      fontSize: 16,
      verticalPadding: 12,
      horizontalPadding: 24,
      borderRadius: 8,
      backgroundColor: "#4f46e5",
      textColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#4338ca",
    }),
    "all eight defaults remain unchanged",
  );
  check(
    JSON.stringify(cardState) === JSON.stringify({
      width: 320,
      padding: 24,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      textColor: "#18181b",
      borderWidth: 1,
      borderColor: "#e4e4e7",
    }),
    "all seven Card defaults are correct",
  );
  check(rootState.activeGenerator === "button", "Button is the default active generator");
  check(
    JSON.stringify(Object.keys(rootState.generators)) === JSON.stringify(["button", "card"]),
    "state contains independent Button and Card generators",
  );
  check(
    JSON.stringify(Object.keys(context.testApi.generatorDefinitions)) === JSON.stringify(["button", "card"]),
    "dispatch table contains Button and Card definitions",
  );
  check(
    context.testApi.generatorDefinitions.button.renderPreview === context.testApi.renderButtonPreview &&
      context.testApi.generatorDefinitions.button.generateCSS === context.testApi.generateButtonCSS,
    "Button definition owns its preview and CSS functions",
  );
  check(outputFilename.textContent === "button.css", "Button definition supplies output metadata");

  const definition = context.testApi.generatorDefinitions.button;
  const originalRenderPreview = definition.renderPreview;
  const originalGenerateCSS = definition.generateCSS;
  let previewStateReceived;
  let cssStateReceived;
  definition.renderPreview = (receivedState) => {
    previewStateReceived = receivedState;
    originalRenderPreview(receivedState);
  };
  definition.generateCSS = (receivedState) => {
    cssStateReceived = receivedState;
    return originalGenerateCSS(receivedState);
  };
  context.testApi.renderActive();
  check(
    previewStateReceived === buttonState && cssStateReceived === buttonState,
    "active dispatch sends the same Button state to preview and CSS",
  );
  definition.renderPreview = originalRenderPreview;
  definition.generateCSS = originalGenerateCSS;
  checkButtonSynchronization("Button defaults");

  const numericCases = [
    ["font-size", "fontSize", 10, 32],
    ["vertical-padding", "verticalPadding", 4, 32],
    ["horizontal-padding", "horizontalPadding", 8, 64],
    ["border-radius", "borderRadius", 0, 32],
    ["border-width", "borderWidth", 0, 8],
  ];

  for (const [id, property, minimum, maximum] of numericCases) {
    elements[id].input(String(minimum));
    check(buttonState[property] === minimum, `${property} accepts its minimum`);
    checkButtonSynchronization(`${property} minimum`);

    elements[id].input(String(maximum));
    check(buttonState[property] === maximum, `${property} accepts its maximum`);
    checkButtonSynchronization(`${property} maximum`);

    const previous = buttonState[property];
    elements[id].input("");
    check(buttonState[property] === previous, `${property} rejects an empty value`);
    elements[id].input("not-a-number");
    check(buttonState[property] === previous, `${property} rejects a malformed value`);
    elements[id].input("Infinity");
    check(buttonState[property] === previous, `${property} rejects a non-finite value`);
    elements[id].input("-100");
    check(buttonState[property] === minimum, `${property} clamps a negative value`);
    elements[id].input(String(maximum + 100));
    check(buttonState[property] === maximum, `${property} clamps above its maximum`);
    checkButtonSynchronization(`${property} invalid values`);
  }

  const colorCases = [
    ["background-color", "backgroundColor", "#123abc"],
    ["text-color", "textColor", "#abcdef"],
    ["border-color", "borderColor", "#fedcba"],
  ];

  for (const [id, property, color] of colorCases) {
    elements[id].input(color.toUpperCase());
    check(buttonState[property] === color, `${property} normalizes a valid color`);
    checkButtonSynchronization(`${property} valid color`);
    elements[id].input("invalid");
    check(buttonState[property] === color, `${property} rejects an invalid color`);
    checkButtonSynchronization(`${property} invalid color`);
  }

  for (let value = 10; value <= 32; value += 1) {
    elements["font-size"].input(String(value));
  }
  check(buttonState.fontSize === 32, "rapid input retains the final value");
  checkButtonSynchronization("rapid Button input");

  const buttonCSSBeforeSwitch = context.testApi.generatedCSS();
  const delayedButtonSuccess = deferred();
  setClipboard(() => delayedButtonSuccess.promise);
  const delayedButtonSuccessCopy = copyButton.click();
  check(copyStatus.textContent === "CSS ready to copy.", "delayed Button success remains pending");
  delayedButtonSuccess.resolve();
  await delayedButtonSuccessCopy;
  check(copyStatus.textContent === "CSS copied", "delayed Button success resolves truthfully");
  check(clipboardCalls.at(-1) === buttonCSSBeforeSwitch, "delayed Button copy uses exact CSS");

  context.testApi.switchGenerator("card");
  context.testApi.switchGenerator("button");
  const delayed = deferred();
  setClipboard(() => delayed.promise);
  const delayedCopy = copyButton.click();
  check(clipboardCalls.at(-1) === buttonCSSBeforeSwitch, "modern API receives exact Button CSS");
  check(copyStatus.textContent === "CSS ready to copy.", "success waits for resolution");
  const preservedButtonState = JSON.stringify(buttonState);
  const preservedButtonCSS = buttonCSSBeforeSwitch;
  const preservedPreview = JSON.stringify(preview.style);
  elements["generator-button"].checked = false;
  elements["generator-card"].change(true);
  check(rootState.activeGenerator === "card", "Card radio updates the active generator");
  check(buttonControlView.hidden && !cardControlView.hidden, "Card controls replace Button controls");
  check(preview.hidden && !cardPreview.hidden, "Card preview replaces Button preview");
  checkCardSynchronization("Card defaults");
  check(outputFilename.textContent === "card.css", "Card mode updates the output filename");
  check(!copyButton.disabled, "Copy is enabled in Card mode");
  check(elements["generator-name"].textContent === "Card generator", "Card mode updates the generator label");
  check(copyStatus.textContent === "CSS ready to copy.", "switching resets Copy feedback");
  delayed.resolve();
  await delayedCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "delayed Button copy cannot overwrite Card feedback");

  check(
    context.testApi.generatorDefinitions.card.renderPreview === context.testApi.renderCardPreview &&
      context.testApi.generatorDefinitions.card.generateCSS === context.testApi.generateCardCSS,
    "Card definition owns its preview and CSS functions",
  );

  const cardNumericCases = [
    ["card-width", "width", 160, 640],
    ["card-padding", "padding", 0, 64],
    ["card-border-radius", "borderRadius", 0, 48],
    ["card-border-width", "borderWidth", 0, 12],
  ];

  for (const [id, property, minimum, maximum] of cardNumericCases) {
    elements[id].input(String(minimum));
    check(cardState[property] === minimum, `Card ${property} accepts its minimum`);
    checkCardSynchronization(`Card ${property} minimum`);

    elements[id].input(String(maximum));
    check(cardState[property] === maximum, `Card ${property} accepts its maximum`);
    checkCardSynchronization(`Card ${property} maximum`);

    const previous = cardState[property];
    elements[id].input("");
    check(cardState[property] === previous, `Card ${property} rejects an empty value`);
    elements[id].input("malformed");
    check(cardState[property] === previous, `Card ${property} rejects a malformed value`);
    elements[id].input("Infinity");
    check(cardState[property] === previous, `Card ${property} rejects a non-finite value`);
    elements[id].input(String(minimum - 100));
    check(cardState[property] === minimum, `Card ${property} clamps below its minimum`);
    elements[id].input(String(maximum + 100));
    check(cardState[property] === maximum, `Card ${property} clamps above its maximum`);
    checkCardSynchronization(`Card ${property} normalization`);
  }

  const cardColorCases = [
    ["card-background-color", "backgroundColor", "#102030"],
    ["card-text-color", "textColor", "#abcdef"],
    ["card-border-color", "borderColor", "#fedcba"],
  ];

  for (const [id, property, color] of cardColorCases) {
    elements[id].input(color.toUpperCase());
    check(cardState[property] === color, `Card ${property} normalizes a valid color`);
    checkCardSynchronization(`Card ${property} valid color`);
    elements[id].input("invalid");
    check(cardState[property] === color, `Card ${property} preserves the previous valid color`);
    checkCardSynchronization(`Card ${property} invalid color`);
  }

  elements["card-border-width"].input("0");
  check(cardState.borderColor === "#fedcba", "zero Card border width preserves border color state");
  check(
    context.testApi.generatedCSS().includes("border: 0px solid #fedcba;"),
    "zero-width Card border remains truthful in generated CSS",
  );

  for (let width = 160; width <= 640; width += 16) {
    elements["card-width"].input(String(width));
  }
  check(cardState.width === 640, "rapid Card updates retain the final value");
  checkCardSynchronization("rapid Card updates");
  check(cardPreview.style.maxWidth === "100%", "Card preview has narrow-container width safety");
  check(cardPreview.style.boxSizing === "border-box", "Card preview uses border-box sizing");

  const preservedCardState = JSON.stringify(cardState);
  const preservedCardCSS = context.testApi.generatedCSS();
  const preservedCardPreview = JSON.stringify(cardPreview.style);

  elements["generator-card"].checked = false;
  elements["generator-button"].change(true);
  check(rootState.activeGenerator === "button", "Button radio restores the active generator");
  check(!buttonControlView.hidden && cardControlView.hidden, "Button controls are restored");
  check(!preview.hidden && cardPreview.hidden, "Button preview is restored");
  check(!copyButton.disabled, "Copy is restored in Button mode");
  check(outputFilename.textContent === "button.css", "Button filename is restored");
  check(JSON.stringify(buttonState) === preservedButtonState, "Button state survives generator switches");
  check(context.testApi.generatedCSS() === preservedButtonCSS, "Button CSS survives generator switches");
  check(JSON.stringify(preview.style) === preservedPreview, "Button preview survives generator switches");

  elements["generator-button"].checked = false;
  elements["generator-card"].change(true);
  check(JSON.stringify(cardState) === preservedCardState, "Card state survives generator switches");
  check(context.testApi.generatedCSS() === preservedCardCSS, "Card CSS survives generator switches");
  check(JSON.stringify(cardPreview.style) === preservedCardPreview, "Card preview survives generator switches");

  const cardCSSForCopy = context.testApi.generatedCSS();
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === cardCSSForCopy, "modern API copies exact Card CSS");
  check(copyStatus.textContent === "CSS copied", "Card copy reports success");

  context.testApi.switchGenerator("button");
  context.testApi.switchGenerator("card");
  const delayedCardSuccess = deferred();
  setClipboard(() => delayedCardSuccess.promise);
  const delayedCardSuccessCopy = copyButton.click();
  check(copyStatus.textContent === "CSS ready to copy.", "delayed Card success remains pending");
  delayedCardSuccess.resolve();
  await delayedCardSuccessCopy;
  check(copyStatus.textContent === "CSS copied", "delayed Card success resolves truthfully");
  check(clipboardCalls.at(-1) === cardCSSForCopy, "delayed Card copy uses exact CSS");

  elements["generator-card"].checked = false;
  elements["generator-button"].change(true);
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === preservedButtonCSS, "modern API still copies exact Button CSS");

  fallbackResult = true;
  setClipboard(() => Promise.reject(new Error("denied")));
  await copyButton.click();
  check(fallbackWrites.at(-1) === preservedButtonCSS, "Button rejection fallback copies exact CSS");
  check(temporaryElements.at(-1).removed, "fallback removes its temporary element");
  check(copyButton.focused, "fallback restores Copy button focus");

  elements["generator-button"].checked = false;
  elements["generator-card"].change(true);
  navigator.clipboard = undefined;
  await copyButton.click();
  check(fallbackWrites.at(-1) === cardCSSForCopy, "missing Clipboard API falls back with exact Card CSS");

  fallbackResult = false;
  await copyButton.click();
  check(copyStatus.textContent.includes("select the CSS manually"), "Card fallback failure is truthful");

  setClipboard(() => Promise.resolve());
  await copyButton.click();
  await copyButton.click();
  check(copyStatus.textContent === "CSS copied", "repeated Card copies work");

  const first = deferred();
  const second = deferred();
  let clipboardCall = 0;
  setClipboard(() => (clipboardCall++ === 0 ? first.promise : second.promise));
  const firstCopy = copyButton.click();
  const secondCopy = copyButton.click();
  second.resolve();
  await secondCopy;
  first.reject(new Error("late failure"));
  await firstCopy;
  check(copyStatus.textContent === "CSS copied", "stale Card copy failure cannot replace newer success");

  const delayedCard = deferred();
  setClipboard(() => delayedCard.promise);
  const delayedCardCopy = copyButton.click();
  elements["generator-card"].checked = false;
  elements["generator-button"].change(true);
  check(copyStatus.textContent === "CSS ready to copy.", "Card to Button switch resets copy feedback");
  delayedCard.resolve();
  await delayedCardCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "delayed Card copy cannot overwrite Button feedback");

  for (let iteration = 0; iteration < 3; iteration += 1) {
    elements["generator-button"].checked = false;
    elements["generator-card"].change(true);
    elements["generator-card"].checked = false;
    elements["generator-button"].change(true);
  }
  check(rootState.activeGenerator === "button", "rapid generator switching ends in the selected mode");
  checkButtonSynchronization("rapid generator switching");
  elements["generator-button"].checked = false;
  elements["generator-card"].change(true);
  checkCardSynchronization("Card after rapid generator switching");

  const inputIds = [...html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
  const labelTargets = [...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((match) => match[1]);
  const buttonControlIds = inputIds.filter((id) =>
    [
      "font-size",
      "vertical-padding",
      "horizontal-padding",
      "border-radius",
      "background-color",
      "text-color",
      "border-width",
      "border-color",
    ].includes(id),
  );
  const cardControlIds = inputIds.filter((id) => id.startsWith("card-"));
  check(inputIds.length === 17, "markup contains two selector radios and fifteen property controls");
  check(labelTargets.length === 17, "markup contains a label for every radio and property control");
  check(buttonControlIds.length === 8, "Button view retains exactly eight controls");
  check(cardControlIds.length === 7, "Card view contains exactly seven controls");
  check(inputIds.every((id) => labelTargets.includes(id)), "every control has an associated label");
  check(
    html.includes('<fieldset class="generator-selector">') &&
      /id="generator-button"[\s\S]*?type="radio"[\s\S]*?value="button"[\s\S]*?checked/.test(html) &&
      /id="generator-card"[\s\S]*?type="radio"[\s\S]*?value="card"/.test(html),
    "generator selector uses a labelled native radio fieldset with Button selected",
  );
  check(
    cardControlIds.every((id) => {
      const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return !/\bdisabled\b/.test(input);
    }),
    "all Card property controls are enabled",
  );
  check(
    html.includes('data-generator-controls="card" hidden') &&
      html.includes('data-generator-preview="card" hidden'),
    "Card controls and preview start hidden",
  );
  check((html.match(/<h1\b/g) || []).length === 1, "markup contains one h1");
  check(
    html.includes('aria-labelledby="controls-title"') &&
      html.includes('aria-labelledby="preview-title"') &&
      html.includes('aria-labelledby="output-title"'),
    "all three workspace regions remain present",
  );
  check(html.includes('<link rel="stylesheet" href="styles.css" />'), "local stylesheet is linked");
  check(html.includes('<script src="script.js" defer></script>'), "local script is deferred");
  check(!html.includes("<style>"), "inline stylesheet was removed");
  check(!/<script>([\s\S]*?)<\/script>/.test(html), "inline script was removed");
  check(css.includes(":focus-visible"), "focus-visible styling remains extracted");
  check(css.includes(".generator-input:focus-visible + label"), "generator focus is visibly styled");
  check(css.includes("[hidden]"), "hidden generator views have an explicit layout safeguard");
  check(
    /\.preview-stage\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);[\s\S]*?min-width:\s*0;/.test(css),
    "preview grid contains maximum-width Cards at narrow viewports",
  );
  check(css.includes("@media (max-width: 1040px)"), "desktop breakpoint remains extracted");
  check(css.includes("@media (max-width: 700px)"), "narrow breakpoint remains extracted");
  check(!/\.innerHTML\s*=/.test(script), "generated content never uses innerHTML");
  check(
    !/(fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)/.test(script),
    "script has no network or storage behavior",
  );
  check(!/(\beval\s*\(|\bFunction\s*\()/.test(script), "script has no dynamic code execution");
  check(!/CARD_OUTPUT_PLACEHOLDER|coming in Task 4/.test(script + html), "Task 3 placeholder behavior is removed");
  check(!/(inputState|gridState)/.test(script), "later generator state is absent");
  check(!/(https?:\/\/|<link[^>]+(?:cdn|fonts))/i.test(html), "markup has no external runtime dependency");
  check(!fs.existsSync(path.join(root, "package.json")), "repository has no package tooling");
  check(readme.includes("## Overview"), "README includes a V2 overview");
  check(readme.includes("## Current generators"), "README documents current generators");
  check(readme.includes("### Button") && readme.includes("### Card"), "README documents Button and Card");
  check(readme.includes("## Architecture"), "README explains the generator architecture");
  check(readme.includes("## Usage") && readme.includes("node tests/regression.cjs"), "README documents usage and tests");
  check(readme.includes("**Pulsar V2 — Button + Card**"), "README reports the released V2 status");
  check(!/Pulsar V1|Cards, Inputs/.test(readme), "README contains no stale Button-only release claims");

  if (failures.length > 0) {
    console.error(`FAIL: ${failures.length} of ${checkCount} checks failed`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`PASS: ${checkCount} focused Pulsar regression checks`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
