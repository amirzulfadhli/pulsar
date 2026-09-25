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
    this.style = {
      setProperty(property, value) {
        this[property] = value;
      },
    };
    this.listeners = {};
    this.listenerRegistrations = {};
    this.removed = false;
    this.focused = false;
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.dataset = {};
    this.children = [];
  }

  addEventListener(type, callback) {
    this.listeners[type] = callback;
    this.listenerRegistrations[type] = (this.listenerRegistrations[type] ?? 0) + 1;
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

  changeValue(value) {
    this.value = value;
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
  "input-font-size", "input-font-size-output",
  "input-vertical-padding", "input-vertical-padding-output",
  "input-horizontal-padding", "input-horizontal-padding-output",
  "input-border-radius", "input-border-radius-output",
  "input-border-width", "input-border-width-output",
  "input-background-color", "input-background-color-output",
  "input-text-color", "input-text-color-output",
  "input-border-color", "input-border-color-output",
  "input-focus-border-color", "input-focus-border-color-output",
  "input-focus-outline-width", "input-focus-outline-width-output",
  "input-focus-outline-color", "input-focus-outline-color-output",
  "input-focus-outline-offset", "input-focus-outline-offset-output",
  "flex-direction", "justify-content", "align-items", "flex-wrap",
  "flex-gap", "flex-gap-output",
  "grid-columns", "grid-columns-output",
  "grid-rows", "grid-rows-output",
  "grid-column-gap", "grid-column-gap-output",
  "grid-row-gap", "grid-row-gap-output",
  "grid-justify-items", "grid-align-items",
  "generator-name", "generator-button", "generator-card", "generator-input", "generator-flexbox", "generator-grid",
  "generated-css", "copy-css", "copy-status",
];

const elements = Object.fromEntries(ids.map((id) => [id, new MockElement(id)]));
elements["copy-status"].textContent = "CSS ready to copy.";
elements["generator-button"].value = "button";
elements["generator-button"].checked = true;
elements["generator-card"].value = "card";
elements["generator-input"].value = "input";
elements["generator-flexbox"].value = "flexbox";
elements["generator-grid"].value = "grid";
elements["flex-direction"].value = "row";
elements["justify-content"].value = "flex-start";
elements["align-items"].value = "stretch";
elements["flex-wrap"].value = "nowrap";
elements["flex-gap"].value = "16";
elements["flex-gap-output"].textContent = "16px";
elements["grid-columns"].value = "3";
elements["grid-columns-output"].textContent = "3";
elements["grid-rows"].value = "2";
elements["grid-rows-output"].textContent = "2";
elements["grid-column-gap"].value = "16";
elements["grid-column-gap-output"].textContent = "16px";
elements["grid-row-gap"].value = "16";
elements["grid-row-gap-output"].textContent = "16px";
elements["grid-justify-items"].value = "stretch";
elements["grid-align-items"].value = "stretch";
const inputBaseControlIds = [
  "input-font-size",
  "input-vertical-padding",
  "input-horizontal-padding",
  "input-border-radius",
  "input-border-width",
  "input-background-color",
  "input-text-color",
  "input-border-color",
];
const inputFocusControlIds = [
  "input-focus-border-color",
  "input-focus-outline-width",
  "input-focus-outline-color",
  "input-focus-outline-offset",
];
const preview = new MockElement("preview");
preview.dataset.generatorPreview = "button";
const cardPreview = new MockElement("card-preview");
cardPreview.dataset.generatorPreview = "card";
cardPreview.hidden = true;
const inputPreview = new MockElement("input-preview");
inputPreview.dataset.generatorPreview = "input";
inputPreview.hidden = true;
const inputPreviewControl = new MockElement("generated-input");
const flexboxPreview = new MockElement("flexbox-preview");
flexboxPreview.dataset.generatorPreview = "flexbox";
flexboxPreview.hidden = true;
flexboxPreview.children = Array.from({ length: 5 }, (_, index) => new MockElement(`flex-item-${index + 1}`));
const originalFlexboxChildren = [...flexboxPreview.children];
const gridPreview = new MockElement("grid-preview");
gridPreview.dataset.generatorPreview = "grid";
gridPreview.hidden = true;
gridPreview.children = Array.from({ length: 96 }, (_, index) => {
  const child = new MockElement(`grid-item-${index + 1}`);
  child.hidden = index >= 6;
  return child;
});
const originalGridChildren = [...gridPreview.children];
const buttonControlView = new MockElement("button-controls");
buttonControlView.dataset.generatorControls = "button";
const cardControlView = new MockElement("card-controls");
cardControlView.dataset.generatorControls = "card";
cardControlView.hidden = true;
const inputControlView = new MockElement("input-controls");
inputControlView.dataset.generatorControls = "input";
inputControlView.hidden = true;
const flexboxControlView = new MockElement("flexbox-controls");
flexboxControlView.dataset.generatorControls = "flexbox";
flexboxControlView.hidden = true;
const gridControlView = new MockElement("grid-controls");
gridControlView.dataset.generatorControls = "grid";
gridControlView.hidden = true;
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
    if (selector === ".generated-input") return inputPreviewControl;
    if (selector === ".generated-flexbox") return flexboxPreview;
    if (selector === ".generated-grid") return gridPreview;
    if (selector === ".output-toolbar-label") return outputFilename;
    throw new Error(`Unexpected selector: ${selector}`);
  },
  querySelectorAll(selector) {
    if (selector === 'input[name="generator"]') {
      return [
        elements["generator-button"],
        elements["generator-card"],
        elements["generator-input"],
        elements["generator-flexbox"],
        elements["generator-grid"],
      ];
    }
    if (selector === "[data-generator-controls]") {
      return [buttonControlView, cardControlView, inputControlView, flexboxControlView, gridControlView];
    }
    if (selector === "[data-generator-preview]") {
      return [preview, cardPreview, inputPreview, flexboxPreview, gridPreview];
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
    renderInputPreview,
    generateInputCSS,
    inputNumericControls,
    inputColorControls,
    normalizeEnum,
    renderFlexboxPreview,
    generateFlexboxCSS,
    flexboxNumericControls,
    flexboxEnumControls,
    normalizeNumber,
    renderGridPreview,
    generateGridCSS,
    gridNumericControls,
    gridEnumControls,
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

function expectedInputCSS(state) {
  return `.input {
  box-sizing: border-box;
  font: inherit;
  font-size: ${state.fontSize}px;
  padding: ${state.verticalPadding}px ${state.horizontalPadding}px;
  border-radius: ${state.borderRadius}px;
  background-color: ${state.backgroundColor};
  color: ${state.textColor};
  border: ${state.borderWidth}px solid ${state.borderColor};
}

.input:focus {
  border-color: ${state.focusBorderColor};
  outline: ${state.focusOutlineWidth}px solid ${state.focusOutlineColor};
  outline-offset: ${state.focusOutlineOffset}px;
}`;
}

function expectedFlexboxCSS(state) {
  return `.flexbox {
  display: flex;
  flex-direction: ${state.flexDirection};
  justify-content: ${state.justifyContent};
  align-items: ${state.alignItems};
  flex-wrap: ${state.flexWrap};
  gap: ${state.gap}px;
}`;
}

function expectedGridCSS(state) {
  return `.grid {
  display: grid;
  grid-template-columns: repeat(${state.columns}, 1fr);
  grid-template-rows: repeat(${state.rows}, 1fr);
  column-gap: ${state.columnGap}px;
  row-gap: ${state.rowGap}px;
  justify-items: ${state.justifyItems};
  align-items: ${state.alignItems};
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

function checkInputSynchronization(label) {
  const inputState = context.testApi.state.generators.input;
  const generatedCSS = context.testApi.generatedCSS();
  const previewMatches =
    inputPreviewControl.style["--input-font-size"] === `${inputState.fontSize}px` &&
    inputPreviewControl.style["--input-padding-y"] === `${inputState.verticalPadding}px` &&
    inputPreviewControl.style["--input-padding-x"] === `${inputState.horizontalPadding}px` &&
    inputPreviewControl.style["--input-border-radius"] === `${inputState.borderRadius}px` &&
    inputPreviewControl.style["--input-background-color"] === inputState.backgroundColor &&
    inputPreviewControl.style["--input-text-color"] === inputState.textColor &&
    inputPreviewControl.style["--input-border-width"] === `${inputState.borderWidth}px` &&
    inputPreviewControl.style["--input-border-color"] === inputState.borderColor &&
    inputPreviewControl.style["--input-focus-border-color"] === inputState.focusBorderColor &&
    inputPreviewControl.style["--input-focus-outline-width"] === `${inputState.focusOutlineWidth}px` &&
    inputPreviewControl.style["--input-focus-outline-color"] === inputState.focusOutlineColor &&
    inputPreviewControl.style["--input-focus-outline-offset"] === `${inputState.focusOutlineOffset}px`;

  check(previewMatches, `${label}: Input preview variables match state`);
  check(generatedCSS === expectedInputCSS(inputState), `${label}: Input CSS matches state exactly`);
  check(elements["generated-css"].textContent === generatedCSS, `${label}: displayed Input CSS is authoritative`);
}

function checkFlexboxSynchronization(label) {
  const flexboxState = context.testApi.state.generators.flexbox;
  const generatedCSS = context.testApi.generatedCSS();
  const previewMatches =
    flexboxPreview.style.display === "flex" &&
    flexboxPreview.style.flexDirection === flexboxState.flexDirection &&
    flexboxPreview.style.justifyContent === flexboxState.justifyContent &&
    flexboxPreview.style.alignItems === flexboxState.alignItems &&
    flexboxPreview.style.flexWrap === flexboxState.flexWrap &&
    flexboxPreview.style.gap === `${flexboxState.gap}px`;

  check(previewMatches, `${label}: Flexbox preview matches state`);
  check(generatedCSS === expectedFlexboxCSS(flexboxState), `${label}: Flexbox CSS matches state exactly`);
  check(elements["generated-css"].textContent === generatedCSS, `${label}: displayed Flexbox CSS is authoritative`);
  check(elements["flex-gap-output"].textContent === `${flexboxState.gap}px`, `${label}: Gap output matches state`);
}

function checkGridSynchronization(label) {
  const gridState = context.testApi.state.generators.grid;
  const generatedCSS = context.testApi.generatedCSS();
  const visibleCount = gridState.columns * gridState.rows;
  const previewMatches =
    gridPreview.style.display === "grid" &&
    gridPreview.style.gridTemplateColumns === `repeat(${gridState.columns}, 1fr)` &&
    gridPreview.style.gridTemplateRows === `repeat(${gridState.rows}, 1fr)` &&
    gridPreview.style.columnGap === `${gridState.columnGap}px` &&
    gridPreview.style.rowGap === `${gridState.rowGap}px` &&
    gridPreview.style.justifyItems === gridState.justifyItems &&
    gridPreview.style.alignItems === gridState.alignItems;

  check(previewMatches, `${label}: Grid preview parent styles match state`);
  check(
    gridPreview.children.filter((child) => !child.hidden).length === visibleCount &&
      gridPreview.children.every((child, index) => child.hidden === (index >= visibleCount)),
    `${label}: exactly columns times rows items are visible`,
  );
  check(generatedCSS === expectedGridCSS(gridState), `${label}: Grid CSS matches state exactly`);
  check(elements["generated-css"].textContent === generatedCSS, `${label}: displayed Grid CSS is authoritative`);
  check(elements["grid-columns-output"].textContent === String(gridState.columns), `${label}: Columns output matches state`);
  check(elements["grid-rows-output"].textContent === String(gridState.rows), `${label}: Rows output matches state`);
  check(elements["grid-column-gap-output"].textContent === `${gridState.columnGap}px`, `${label}: Column gap output matches state`);
  check(elements["grid-row-gap-output"].textContent === `${gridState.rowGap}px`, `${label}: Row gap output matches state`);
}

async function run() {
  const rootState = context.testApi.state;
  const buttonState = rootState.generators.button;
  const cardState = rootState.generators.card;
  const inputState = rootState.generators.input;
  const flexboxState = rootState.generators.flexbox;
  const gridState = rootState.generators.grid;
  const copyButton = elements["copy-css"];
  const copyStatus = elements["copy-status"];

  const expectedListenerRegistrations = {
    input: [
      "font-size", "vertical-padding", "horizontal-padding", "border-radius", "border-width",
      "background-color", "text-color", "border-color", "card-width", "card-padding",
      "card-border-radius", "card-border-width", "card-background-color", "card-text-color",
      "card-border-color", "input-font-size", "input-vertical-padding", "input-horizontal-padding",
      "input-border-radius", "input-border-width", "input-background-color", "input-text-color",
      "input-border-color", "input-focus-border-color", "input-focus-outline-width",
      "input-focus-outline-color", "input-focus-outline-offset", "flex-gap",
      "grid-columns", "grid-rows", "grid-column-gap", "grid-row-gap",
    ],
    change: [
      "flex-direction", "justify-content", "align-items", "flex-wrap", "generator-button",
      "grid-justify-items", "grid-align-items", "generator-card", "generator-input",
      "generator-flexbox", "generator-grid",
    ],
    click: ["copy-css"],
  };

  Object.entries(expectedListenerRegistrations).forEach(([eventType, elementIds]) => {
    elementIds.forEach((id) => {
      check(
        elements[id].listenerRegistrations[eventType] === 1,
        `${id} has exactly one ${eventType} listener`,
      );
    });
  });

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
  check(
    JSON.stringify(inputState) === JSON.stringify({
      fontSize: 16,
      verticalPadding: 10,
      horizontalPadding: 14,
      borderRadius: 6,
      backgroundColor: "#ffffff",
      textColor: "#18181b",
      borderWidth: 1,
      borderColor: "#d4d4d8",
      focusBorderColor: "#4f46e5",
      focusOutlineWidth: 3,
      focusOutlineColor: "#2563eb",
      focusOutlineOffset: 2,
    }),
    "all twelve Input defaults are correct",
  );
  check(
    JSON.stringify(flexboxState) === JSON.stringify({
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexWrap: "nowrap",
      gap: 16,
    }),
    "Flexbox state contains exactly the five required defaults",
  );
  check(
    JSON.stringify(gridState) === JSON.stringify({
      columns: 3,
      rows: 2,
      columnGap: 16,
      rowGap: 16,
      justifyItems: "stretch",
      alignItems: "stretch",
    }),
    "Grid state contains exactly the six required defaults",
  );
  check(flexboxPreview.children.length === 5, "Flexbox preview harness retains exactly five children");
  check(rootState.activeGenerator === "button", "Button is the default active generator");
  check(
    JSON.stringify(Object.keys(rootState.generators)) === JSON.stringify(["button", "card", "input", "flexbox", "grid"]),
    "state contains five independent generators",
  );
  check(
    JSON.stringify(Object.keys(context.testApi.generatorDefinitions)) === JSON.stringify(["button", "card", "input", "flexbox", "grid"]),
    "dispatch table contains all five generator definitions",
  );
  check(
    context.testApi.normalizeEnum("column", ["row", "column"], "row") === "column" &&
      context.testApi.normalizeEnum("malformed", ["row", "column"], "column") === "column",
    "normalizeEnum accepts allow-listed values and otherwise preserves its fallback",
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

  check(
    context.testApi.generatorDefinitions.input.renderPreview === context.testApi.renderInputPreview &&
      context.testApi.generatorDefinitions.input.generateCSS === context.testApi.generateInputCSS,
    "Input definition owns its preview and CSS functions",
  );
  check(
    context.testApi.generatorDefinitions.input.numericControls === context.testApi.inputNumericControls &&
      context.testApi.generatorDefinitions.input.colorControls === context.testApi.inputColorControls &&
      context.testApi.generatorDefinitions.input.outputFilename === "input.css",
    "Input definition owns its Base controls and output metadata",
  );

  const pendingCardToInput = deferred();
  setClipboard(() => pendingCardToInput.promise);
  const pendingCardToInputCopy = copyButton.click();
  elements["generator-card"].checked = false;
  elements["generator-input"].change(true);
  check(rootState.activeGenerator === "input", "Input radio activates the functional generator");
  check(
    buttonControlView.hidden && cardControlView.hidden && !inputControlView.hidden,
    "Input controls replace Button and Card controls",
  );
  check(
    preview.hidden && cardPreview.hidden && !inputPreview.hidden,
    "Input preview replaces Button and Card previews",
  );
  check(elements["generator-name"].textContent === "Input generator", "Input mode updates the generator label");
  check(outputFilename.textContent === "input.css", "Input definition supplies the output filename");
  check(!copyButton.disabled, "Copy is enabled in Input mode");
  check(copyStatus.textContent === "CSS ready to copy.", "Input mode reports normal ready feedback");
  checkInputSynchronization("Input defaults");
  check(
    context.testApi.generatedCSS() === `.input {
  box-sizing: border-box;
  font: inherit;
  font-size: 16px;
  padding: 10px 14px;
  border-radius: 6px;
  background-color: #ffffff;
  color: #18181b;
  border: 1px solid #d4d4d8;
}

.input:focus {
  border-color: #4f46e5;
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}`,
    "default Input Base and focus CSS have exact deterministic formatting",
  );
  check(
    (context.testApi.generatedCSS().match(/\.input\s*\{/g) || []).length === 1 &&
      (context.testApi.generatedCSS().match(/\.input:focus\s*\{/g) || []).length === 1 &&
      !/focus-visible|\bwidth\s*:|max-width|placeholder|--input-|shadow|transition|outline:\s*none/.test(context.testApi.generatedCSS()),
    "Input CSS has one Base rule, one focus rule, and no forbidden output",
  );
  pendingCardToInput.resolve();
  await pendingCardToInputCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "pending Card copy cannot overwrite Input feedback");

  const inputNumericCases = [
    ["input-font-size", "fontSize", 10, 32],
    ["input-vertical-padding", "verticalPadding", 4, 32],
    ["input-horizontal-padding", "horizontalPadding", 8, 64],
    ["input-border-radius", "borderRadius", 0, 32],
    ["input-border-width", "borderWidth", 0, 8],
    ["input-focus-outline-width", "focusOutlineWidth", 1, 6],
    ["input-focus-outline-offset", "focusOutlineOffset", 0, 8],
  ];

  for (const [id, property, minimum, maximum] of inputNumericCases) {
    elements[id].input(String(minimum));
    check(inputState[property] === minimum, `Input ${property} accepts its minimum`);
    checkInputSynchronization(`Input ${property} minimum`);

    elements[id].input(String(maximum));
    check(inputState[property] === maximum, `Input ${property} accepts its maximum`);
    checkInputSynchronization(`Input ${property} maximum`);

    const previous = inputState[property];
    elements[id].input("");
    check(inputState[property] === previous, `Input ${property} rejects an empty value`);
    elements[id].input("malformed");
    check(inputState[property] === previous, `Input ${property} rejects a malformed value`);
    elements[id].input("Infinity");
    check(inputState[property] === previous, `Input ${property} rejects a non-finite value`);
    elements[id].input(String(minimum - 100));
    check(inputState[property] === minimum, `Input ${property} clamps below its minimum`);
    elements[id].input("-1");
    check(inputState[property] === minimum, `Input ${property} clamps negative values`);
    elements[id].input(String(maximum + 100));
    check(inputState[property] === maximum, `Input ${property} clamps above its maximum`);
    checkInputSynchronization(`Input ${property} normalization`);
  }

  elements["input-focus-outline-width"].input("0");
  check(inputState.focusOutlineWidth === 1, "Input focus outline width clamps zero to one");
  checkInputSynchronization("Input focus outline width zero clamp");

  const inputColorCases = [
    ["input-background-color", "backgroundColor", "#102030"],
    ["input-text-color", "textColor", "#abcdef"],
    ["input-border-color", "borderColor", "#fedcba"],
    ["input-focus-border-color", "focusBorderColor", "#654321"],
    ["input-focus-outline-color", "focusOutlineColor", "#123456"],
  ];

  for (const [id, property, color] of inputColorCases) {
    elements[id].input(color.toUpperCase());
    check(inputState[property] === color, `Input ${property} normalizes a valid color`);
    checkInputSynchronization(`Input ${property} valid color`);
    elements[id].input("invalid");
    check(inputState[property] === color, `Input ${property} preserves the previous valid color`);
    checkInputSynchronization(`Input ${property} invalid color`);
  }

  for (let value = 10; value <= 32; value += 1) {
    elements["input-font-size"].input(String(value));
  }
  check(inputState.fontSize === 32, "rapid Input updates retain the final value");
  checkInputSynchronization("rapid Input updates");

  const inputCollectionIds = [
    ...Object.values(context.testApi.inputNumericControls),
    ...Object.values(context.testApi.inputColorControls),
  ].map((control) => control.input.id);
  inputFocusControlIds.forEach((id) => {
    check(!elements[id].disabled, `${id} is enabled`);
    check(Boolean(elements[id].listeners.input), `${id} is wired through shared controls`);
    check(inputCollectionIds.includes(id), `${id} belongs to the existing Input collections`);
  });
  check(
    JSON.stringify(Object.keys(inputState)) === JSON.stringify([
      "fontSize",
      "verticalPadding",
      "horizontalPadding",
      "borderRadius",
      "backgroundColor",
      "textColor",
      "borderWidth",
      "borderColor",
      "focusBorderColor",
      "focusOutlineWidth",
      "focusOutlineColor",
      "focusOutlineOffset",
    ]),
    "Input state contains exactly twelve flat configurable properties",
  );

  const preservedInputState = JSON.stringify(inputState);
  const preservedInputCSS = context.testApi.generatedCSS();
  const preservedInputPreview = JSON.stringify(inputPreviewControl.style);
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === preservedInputCSS, "modern API copies exact Input CSS");
  check(copyStatus.textContent === "CSS copied", "Input copy reports success");

  const delayedInputToButton = deferred();
  setClipboard(() => delayedInputToButton.promise);
  const delayedInputToButtonCopy = copyButton.click();
  elements["generator-input"].checked = false;
  elements["generator-button"].change(true);
  delayedInputToButton.resolve();
  await delayedInputToButtonCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "pending Input success cannot overwrite Button feedback");
  check(JSON.stringify(buttonState) === preservedButtonState, "Button state survives Input modifications");
  check(context.testApi.generatedCSS() === preservedButtonCSS, "Button CSS survives Input modifications");
  checkButtonSynchronization("Button restored from functional Input");

  const pendingButtonToInput = deferred();
  setClipboard(() => pendingButtonToInput.promise);
  const pendingButtonToInputCopy = copyButton.click();
  elements["generator-button"].checked = false;
  elements["generator-input"].change(true);
  pendingButtonToInput.resolve();
  await pendingButtonToInputCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "pending Button copy cannot overwrite Input feedback");
  check(JSON.stringify(inputState) === preservedInputState, "Input state survives Button switching");
  check(context.testApi.generatedCSS() === preservedInputCSS, "Input CSS survives Button switching");
  check(JSON.stringify(inputPreviewControl.style) === preservedInputPreview, "Input preview survives Button switching");
  checkInputSynchronization("Input restored from Button");

  const delayedInputToCard = deferred();
  setClipboard(() => delayedInputToCard.promise);
  const delayedInputToCardCopy = copyButton.click();
  elements["generator-input"].checked = false;
  elements["generator-card"].change(true);
  delayedInputToCard.reject(new Error("late Input failure"));
  await delayedInputToCardCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "pending Input failure cannot overwrite Card feedback");
  check(JSON.stringify(cardState) === preservedCardState, "Card state survives Input modifications");
  check(context.testApi.generatedCSS() === preservedCardCSS, "Card CSS survives Input modifications");
  checkCardSynchronization("Card restored from functional Input");

  for (let iteration = 0; iteration < 3; iteration += 1) {
    elements["generator-card"].checked = false;
    elements["generator-input"].change(true);
    elements["generator-input"].checked = false;
    elements["generator-button"].change(true);
    elements["generator-button"].checked = false;
    elements["generator-card"].change(true);
  }
  check(rootState.activeGenerator === "card", "rapid three-generator switching ends in Card mode");
  checkCardSynchronization("rapid three-generator switching");

  const generatorRadios = {
    button: elements["generator-button"],
    card: elements["generator-card"],
    input: elements["generator-input"],
    flexbox: elements["generator-flexbox"],
    grid: elements["generator-grid"],
  };
  const controlViews = {
    button: buttonControlView,
    card: cardControlView,
    input: inputControlView,
    flexbox: flexboxControlView,
    grid: gridControlView,
  };
  const previewViews = {
    button: preview,
    card: cardPreview,
    input: inputPreview,
    flexbox: flexboxPreview,
    grid: gridPreview,
  };
  const expectedFilenames = {
    button: "button.css",
    card: "card.css",
    input: "input.css",
    flexbox: "flexbox.css",
    grid: "grid.css",
  };
  const expectedGenerators = {
    button: expectedButtonCSS,
    card: expectedCardCSS,
    input: expectedInputCSS,
    flexbox: expectedFlexboxCSS,
    grid: expectedGridCSS,
  };

  function selectTestGenerator(generatorName) {
    Object.values(generatorRadios).forEach((radio) => { radio.checked = false; });
    generatorRadios[generatorName].change(true);
  }

  function checkActiveConsistency(generatorName, label) {
    const expectedCSS = expectedGenerators[generatorName](rootState.generators[generatorName]);
    check(rootState.activeGenerator === generatorName, `${label}: active generator is synchronized`);
    check(
      Object.entries(controlViews).filter(([, view]) => !view.hidden).map(([name]) => name).join() === generatorName,
      `${label}: exactly one matching controls view is active`,
    );
    check(
      Object.entries(previewViews).filter(([, view]) => !view.hidden).map(([name]) => name).join() === generatorName,
      `${label}: exactly one matching preview view is active`,
    );
    check(outputFilename.textContent === expectedFilenames[generatorName], `${label}: filename is synchronized`);
    check(context.testApi.generatedCSS() === expectedCSS, `${label}: authoritative CSS is synchronized`);
    check(elements["generated-css"].textContent === expectedCSS, `${label}: visible CSS is synchronized`);
    check(!copyButton.disabled, `${label}: Copy is enabled`);
    check(copyStatus.textContent === "CSS ready to copy.", `${label}: status is reset truthfully`);
  }

  elements["font-size"].input("10");
  elements["vertical-padding"].input("32");
  elements["horizontal-padding"].input("64");
  elements["border-radius"].input("0");
  elements["border-width"].input("8");
  const boundaryButtonState = JSON.stringify(buttonState);
  const cardBeforeButtonInvalid = JSON.stringify(cardState);
  const inputBeforeButtonInvalid = JSON.stringify(inputState);
  elements["font-size"].input("invalid");
  check(JSON.stringify(cardState) === cardBeforeButtonInvalid, "invalid Button input cannot affect Card state");
  check(JSON.stringify(inputState) === inputBeforeButtonInvalid, "invalid Button input cannot affect Input state");
  selectTestGenerator("card");
  selectTestGenerator("input");
  selectTestGenerator("button");
  check(JSON.stringify(buttonState) === boundaryButtonState, "Button boundary state survives Card and Input switching");
  checkActiveConsistency("button", "Button boundary restoration");

  selectTestGenerator("card");
  elements["card-width"].input("160");
  elements["card-padding"].input("64");
  elements["card-border-radius"].input("48");
  elements["card-border-width"].input("12");
  const minimumWidthCardState = JSON.stringify(cardState);
  selectTestGenerator("input");
  selectTestGenerator("button");
  selectTestGenerator("card");
  check(JSON.stringify(cardState) === minimumWidthCardState, "Card 160px boundary survives switching");
  elements["card-width"].input("640");
  const maximumWidthCardState = JSON.stringify(cardState);
  selectTestGenerator("button");
  selectTestGenerator("input");
  selectTestGenerator("card");
  check(JSON.stringify(cardState) === maximumWidthCardState, "Card 640px boundary survives switching");
  checkActiveConsistency("card", "Card boundary restoration");

  selectTestGenerator("input");
  const inputMinimumValues = [
    ["input-font-size", "10"],
    ["input-vertical-padding", "4"],
    ["input-horizontal-padding", "8"],
    ["input-border-radius", "0"],
    ["input-border-width", "0"],
    ["input-focus-outline-width", "1"],
    ["input-focus-outline-offset", "0"],
  ];
  inputMinimumValues.forEach(([id, value]) => elements[id].input(value));
  elements["input-border-color"].input("#334155");
  elements["input-focus-border-color"].input("#dc2626");
  check(
    context.testApi.generatedCSS().includes("border: 0px solid #334155;") &&
      context.testApi.generatedCSS().includes("border-color: #dc2626;"),
    "zero Input border width preserves an independent focus border color",
  );
  elements["input-border-color"].input("#dc2626");
  check(
    context.testApi.generatedCSS().includes("border: 0px solid #dc2626;") &&
      context.testApi.generatedCSS().includes("border-color: #dc2626;"),
    "equal Input Base and focus border colors remain truthful",
  );
  const minimumInputState = JSON.stringify(inputState);
  selectTestGenerator("button");
  selectTestGenerator("card");
  selectTestGenerator("input");
  check(JSON.stringify(inputState) === minimumInputState, "Input minimum Base and focus state survives switching");
  checkInputSynchronization("Input minimum boundary restoration");

  const inputMaximumValues = [
    ["input-font-size", "32"],
    ["input-vertical-padding", "32"],
    ["input-horizontal-padding", "64"],
    ["input-border-radius", "32"],
    ["input-border-width", "8"],
    ["input-focus-outline-width", "6"],
    ["input-focus-outline-offset", "8"],
  ];
  inputMaximumValues.forEach(([id, value]) => elements[id].input(value));
  elements["input-border-color"].input("#111111");
  elements["input-focus-border-color"].input("#ff0000");
  elements["input-focus-outline-color"].input("#00ff00");
  const maximumInputState = JSON.stringify(inputState);
  const maximumInputCSS = context.testApi.generatedCSS();
  for (let iteration = 0; iteration < 8; iteration += 1) {
    selectTestGenerator("button");
    checkActiveConsistency("button", `rapid boundary switch ${iteration} Button`);
    selectTestGenerator("card");
    checkActiveConsistency("card", `rapid boundary switch ${iteration} Card`);
    selectTestGenerator("input");
    checkActiveConsistency("input", `rapid boundary switch ${iteration} Input`);
  }
  check(JSON.stringify(inputState) === maximumInputState, "Input maximum Base and focus state survives rapid switching");
  check(context.testApi.generatedCSS() === maximumInputCSS, "Input maximum CSS survives rapid switching");
  checkInputSynchronization("Input maximum boundary restoration");

  const defaultFlexboxCSS = `.flexbox {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  flex-wrap: nowrap;
  gap: 16px;
}`;
  const v3StateBeforeFlexbox = {
    button: JSON.stringify(buttonState),
    card: JSON.stringify(cardState),
    input: JSON.stringify(inputState),
  };

  selectTestGenerator("flexbox");
  checkActiveConsistency("flexbox", "first Flexbox visit");
  check(context.testApi.generatedCSS() === defaultFlexboxCSS, "Flexbox default CSS is exact and ordered");
  checkFlexboxSynchronization("Flexbox defaults");
  check(
    context.testApi.generatorDefinitions.flexbox.numericControls === context.testApi.flexboxNumericControls &&
      context.testApi.generatorDefinitions.flexbox.enumControls === context.testApi.flexboxEnumControls &&
      context.testApi.generatorDefinitions.flexbox.renderPreview === context.testApi.renderFlexboxPreview &&
      context.testApi.generatorDefinitions.flexbox.generateCSS === context.testApi.generateFlexboxCSS &&
      context.testApi.generatorDefinitions.flexbox.outputFilename === "flexbox.css",
    "Flexbox definition uses the shared numeric, enum, render, output, and filename architecture",
  );

  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === defaultFlexboxCSS, "modern API copies exact default Flexbox CSS");
  check(copyStatus.textContent === "CSS copied", "default Flexbox copy reports success");

  const enumCases = [
    ["flex-direction", "flexDirection", ["row", "row-reverse", "column", "column-reverse"]],
    ["justify-content", "justifyContent", ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]],
    ["align-items", "alignItems", ["stretch", "flex-start", "center", "flex-end", "baseline"]],
    ["flex-wrap", "flexWrap", ["nowrap", "wrap", "wrap-reverse"]],
  ];

  for (const [id, property, allowedValues] of enumCases) {
    check(!elements[id].disabled, `${property} select is enabled`);
    check(Boolean(elements[id].listeners.change), `${property} uses a native change listener`);
    check(
      JSON.stringify(context.testApi.flexboxEnumControls[property].allowedValues) === JSON.stringify(allowedValues),
      `${property} exposes only its exact allow-list`,
    );
    for (const value of allowedValues) {
      elements[id].changeValue(value);
      check(flexboxState[property] === value, `${property} accepts ${value}`);
      check(elements[id].value === value, `${property} control reflects ${value}`);
      checkFlexboxSynchronization(`${property} ${value}`);
    }
    const previousValidValue = flexboxState[property];
    elements[id].changeValue("malformed-value");
    check(flexboxState[property] === previousValidValue, `${property} rejects malformed input without resetting`);
    check(elements[id].value === previousValidValue, `${property} restores its previous valid control value`);
    checkFlexboxSynchronization(`${property} malformed protection`);
  }

  check(!elements["flex-gap"].disabled, "Gap range is enabled");
  check(Boolean(elements["flex-gap"].listeners.input), "Gap uses the shared immediate numeric input path");
  for (const value of [0, 16, 64]) {
    elements["flex-gap"].input(String(value));
    check(flexboxState.gap === value, `Gap accepts ${value}`);
    checkFlexboxSynchronization(`Gap ${value}`);
  }
  const validGap = flexboxState.gap;
  for (const invalidValue of ["", "malformed", "Infinity"]) {
    elements["flex-gap"].input(invalidValue);
    check(flexboxState.gap === validGap, `Gap preserves its valid value for ${invalidValue || "empty input"}`);
    checkFlexboxSynchronization(`Gap ${invalidValue || "empty"} protection`);
  }
  elements["flex-gap"].input("-1");
  check(flexboxState.gap === 0, "Gap clamps negative values to zero");
  elements["flex-gap"].input("65");
  check(flexboxState.gap === 64, "Gap clamps excessive values to 64");

  elements["flex-direction"].changeValue("column-reverse");
  elements["justify-content"].changeValue("space-evenly");
  elements["align-items"].changeValue("baseline");
  elements["flex-wrap"].changeValue("wrap-reverse");
  elements["flex-gap"].input("64");
  const modifiedFlexboxCSS = `.flexbox {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-evenly;
  align-items: baseline;
  flex-wrap: wrap-reverse;
  gap: 64px;
}`;
  check(context.testApi.generatedCSS() === modifiedFlexboxCSS, "non-default Flexbox CSS is exact and ordered");
  check(
    !/(?:^|\n)\s*(?:width|height|padding|border(?:-[a-z-]+)?|background(?:-color)?|overflow|font-size|color):/m.test(modifiedFlexboxCSS) &&
      !/flex-item/.test(modifiedFlexboxCSS),
    "Flexbox CSS excludes all preview-only scaffolding",
  );
  checkFlexboxSynchronization("modified Flexbox configuration");
  check(
    flexboxPreview.children.length === 5 &&
      flexboxPreview.children.every((child, index) => child === originalFlexboxChildren[index]),
    "Flexbox rendering reuses the same five child nodes",
  );
  const preservedFlexboxState = JSON.stringify(flexboxState);

  const flexboxRoutes = [
    ["input"],
    ["card"],
    ["button"],
    ["button", "card", "input"],
    ["input", "button", "card", "input"],
  ];
  for (const route of flexboxRoutes) {
    route.forEach(selectTestGenerator);
    selectTestGenerator("flexbox");
    check(JSON.stringify(flexboxState) === preservedFlexboxState, `Flexbox state survives ${route.join(" to ")}`);
    checkActiveConsistency("flexbox", `Flexbox restored after ${route.join(" to ")}`);
    checkFlexboxSynchronization(`Flexbox route ${route.join(" to ")}`);
  }

  check(JSON.stringify(buttonState) === v3StateBeforeFlexbox.button, "Button state survives Flexbox changes");
  check(JSON.stringify(cardState) === v3StateBeforeFlexbox.card, "Card state survives Flexbox changes");
  check(JSON.stringify(inputState) === v3StateBeforeFlexbox.input, "Input state survives Flexbox changes");
  selectTestGenerator("button");
  checkButtonSynchronization("Button restored from Flexbox");
  selectTestGenerator("card");
  checkCardSynchronization("Card restored from Flexbox");
  selectTestGenerator("input");
  checkInputSynchronization("Input restored from Flexbox");

  const generatorNames = ["button", "card", "input", "flexbox"];
  const fourGeneratorStateSnapshot = Object.fromEntries(
    generatorNames.map((generatorName) => [generatorName, JSON.stringify(rootState.generators[generatorName])]),
  );

  for (const source of generatorNames) {
    selectTestGenerator(source);
    for (const destination of generatorNames.filter((generatorName) => generatorName !== source)) {
      selectTestGenerator(destination);
      checkActiveConsistency(destination, `${source} to ${destination} directed switch`);
      check(
        JSON.stringify(rootState.generators[source]) === fourGeneratorStateSnapshot[source],
        `${source} state survives directed switch to ${destination}`,
      );
      selectTestGenerator(source);
      checkActiveConsistency(source, `${source} restored after ${destination}`);
    }
  }

  const switchingOrders = [
    ["button", "card", "input", "flexbox", "button"],
    ["flexbox", "input", "card", "button", "flexbox"],
    ["card", "flexbox", "button", "input", "card"],
  ];

  for (let round = 1; round <= 3; round += 1) {
    for (const order of switchingOrders) {
      order.forEach(selectTestGenerator);
      const destination = order.at(-1);
      checkActiveConsistency(destination, `round ${round} order ${order.join(" to ")}`);
      generatorNames.forEach((generatorName) => {
        check(
          JSON.stringify(rootState.generators[generatorName]) === fourGeneratorStateSnapshot[generatorName],
          `${generatorName} state survives round ${round} order ${order.join(" to ")}`,
        );
      });
    }
  }

  const clipboardPairs = generatorNames.flatMap((source) =>
    generatorNames.filter((destination) => destination !== source).map((destination) => [source, destination]),
  );

  for (const [source, destination] of clipboardPairs) {
    selectTestGenerator(source);
    const sourceCSS = context.testApi.generatedCSS();
    const success = deferred();
    setClipboard(() => success.promise);
    const pendingSuccess = copyButton.click();
    selectTestGenerator(destination);
    success.resolve();
    await pendingSuccess;
    check(clipboardCalls.at(-1) === sourceCSS, `${source} to ${destination}: pending success uses source CSS`);
    check(copyStatus.textContent === "CSS ready to copy.", `${source} to ${destination}: stale success cannot replace feedback`);

    selectTestGenerator(source);
    const failure = deferred();
    fallbackResult = false;
    setClipboard(() => failure.promise);
    const pendingFailure = copyButton.click();
    selectTestGenerator(destination);
    failure.reject(new Error(`${source} delayed failure`));
    await pendingFailure;
    check(copyStatus.textContent === "CSS ready to copy.", `${source} to ${destination}: stale failure cannot replace feedback`);
    checkActiveConsistency(destination, `${source} to ${destination} race destination`);
  }

  selectTestGenerator("button");
  const delayedDestinationEdit = deferred();
  setClipboard(() => delayedDestinationEdit.promise);
  const pendingDestinationEditCopy = copyButton.click();
  selectTestGenerator("flexbox");
  elements["flex-gap"].input("23");
  const destinationCSSAfterEdit = context.testApi.generatedCSS();
  delayedDestinationEdit.resolve();
  await pendingDestinationEditCopy;
  check(
    copyStatus.textContent === "CSS ready to copy.",
    "copy then switch then edit destination keeps stale success from replacing ready feedback",
  );
  check(
    context.testApi.generatedCSS() === destinationCSSAfterEdit,
    "copy then switch then edit destination preserves the destination CSS",
  );

  const editCases = [
    ["button", "font-size", "18", "19"],
    ["card", "card-width", "318", "319"],
    ["input", "input-font-size", "18", "19"],
    ["flexbox", "flex-gap", "18", "19"],
  ];

  for (const [generatorName, controlId, firstValue, secondValue] of editCases) {
    selectTestGenerator(generatorName);
    setClipboard(() => Promise.resolve());
    await copyButton.click();
    check(copyStatus.textContent === "CSS copied", `${generatorName}: copy succeeds before an edit`);

    elements[controlId].input(firstValue);
    check(
      copyStatus.textContent === "CSS ready to copy.",
      `${generatorName}: editing copied CSS resets feedback to ready`,
    );

    const staleSuccess = deferred();
    setClipboard(() => staleSuccess.promise);
    const pendingStaleSuccess = copyButton.click();
    elements[controlId].input(secondValue);
    const currentCSSAfterEdit = context.testApi.generatedCSS();
    staleSuccess.resolve();
    await pendingStaleSuccess;
    check(
      copyStatus.textContent === "CSS ready to copy.",
      `${generatorName}: delayed pre-edit success cannot publish stale feedback`,
    );
    check(
      context.testApi.generatedCSS() === currentCSSAfterEdit,
      `${generatorName}: delayed pre-edit success cannot replace current CSS`,
    );

    const staleFailure = deferred();
    fallbackResult = false;
    setClipboard(() => staleFailure.promise);
    const pendingStaleFailure = copyButton.click();
    elements[controlId].input(firstValue);
    staleFailure.reject(new Error(`${generatorName} delayed pre-edit failure`));
    await pendingStaleFailure;
    check(
      copyStatus.textContent === "CSS ready to copy.",
      `${generatorName}: delayed pre-edit failure cannot publish stale feedback`,
    );
    checkActiveConsistency(generatorName, `${generatorName} edit-race destination`);
  }

  selectTestGenerator("flexbox");
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  elements["flex-direction"].changeValue("row-reverse");
  check(
    copyStatus.textContent === "CSS ready to copy.",
    "Flexbox enum edits reset copied feedback through the shared edit path",
  );

  selectTestGenerator("button");
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  elements["background-color"].input("#123456");
  check(
    copyStatus.textContent === "CSS ready to copy.",
    "color edits reset copied feedback through the shared edit path",
  );

  for (const generatorName of generatorNames) {
    selectTestGenerator(generatorName);
    const currentCSS = context.testApi.generatedCSS();
    setClipboard(() => Promise.resolve());
    await copyButton.click();
    await copyButton.click();
    await copyButton.click();
    check(clipboardCalls.at(-1) === currentCSS, `${generatorName}: repeated copies use current CSS`);
    check(copyStatus.textContent === "CSS copied", `${generatorName}: repeated copies report success`);

    navigator.clipboard = undefined;
    fallbackResult = true;
    await copyButton.click();
    check(fallbackWrites.at(-1) === currentCSS, `${generatorName}: fallback copies current CSS`);
    check(temporaryElements.at(-1).removed, `${generatorName}: fallback cleans up its temporary element`);
    check(copyButton.focused, `${generatorName}: fallback restores Copy focus`);

    fallbackResult = false;
    await copyButton.click();
    check(copyStatus.textContent.includes("select the CSS manually"), `${generatorName}: fallback failure is truthful`);
  }

  const defaultGridCSS = `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  column-gap: 16px;
  row-gap: 16px;
  justify-items: stretch;
  align-items: stretch;
}`;
  const v4StateBeforeGrid = Object.fromEntries(
    generatorNames.map((generatorName) => [generatorName, JSON.stringify(rootState.generators[generatorName])]),
  );

  selectTestGenerator("grid");
  checkActiveConsistency("grid", "first Grid visit");
  checkGridSynchronization("Grid defaults");
  check(context.testApi.generatedCSS() === defaultGridCSS, "Grid default CSS is exact and ordered");
  check(
    context.testApi.generatorDefinitions.grid.numericControls === context.testApi.gridNumericControls &&
      context.testApi.generatorDefinitions.grid.enumControls === context.testApi.gridEnumControls &&
      context.testApi.generatorDefinitions.grid.renderPreview === context.testApi.renderGridPreview &&
      context.testApi.generatorDefinitions.grid.generateCSS === context.testApi.generateGridCSS &&
      context.testApi.generatorDefinitions.grid.outputFilename === "grid.css",
    "Grid definition uses the shared numeric, enum, render, output, and filename architecture",
  );
  check(
    JSON.stringify(Object.keys(context.testApi.gridNumericControls)) ===
      JSON.stringify(["columns", "rows", "columnGap", "rowGap"]) &&
      context.testApi.gridNumericControls.columns.integer === true &&
      context.testApi.gridNumericControls.rows.integer === true &&
      !context.testApi.gridNumericControls.columnGap.integer &&
      !context.testApi.gridNumericControls.rowGap.integer &&
      Object.values(context.testApi.gridNumericControls).every((control) => control.step === 1),
    "only Grid Columns and Rows opt into integer numeric normalization",
  );

  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === defaultGridCSS, "Grid default Copy uses exact authoritative CSS");
  check(copyStatus.textContent === "CSS copied", "Grid default Copy reports success");

  for (let value = 1; value <= 12; value += 1) {
    elements["grid-columns"].input(String(value));
    check(gridState.columns === value, `Columns accepts integer ${value}`);
    check(elements["grid-columns"].value === value, `Columns control restores normalized integer ${value}`);
    checkGridSynchronization(`Columns ${value}`);
  }
  for (let value = 1; value <= 8; value += 1) {
    elements["grid-rows"].input(String(value));
    check(gridState.rows === value, `Rows accepts integer ${value}`);
    check(elements["grid-rows"].value === value, `Rows control restores normalized integer ${value}`);
    checkGridSynchronization(`Rows ${value}`);
  }

  elements["grid-columns"].input("3");
  for (const value of ["1.5", "2.5", "7.25", "11.9"]) {
    elements["grid-columns"].input(value);
    check(gridState.columns === 3, `Columns rejects in-range fraction ${value} without changing state`);
    check(elements["grid-columns"].value === 3, `Columns restores previous value after fraction ${value}`);
    checkGridSynchronization(`Columns fraction ${value} rejection`);
  }
  elements["grid-rows"].input("3");
  for (const value of ["1.5", "2.5", "7.25"]) {
    elements["grid-rows"].input(value);
    check(gridState.rows === 3, `Rows rejects in-range fraction ${value} without changing state`);
    check(elements["grid-rows"].value === 3, `Rows restores previous value after fraction ${value}`);
    checkGridSynchronization(`Rows fraction ${value} rejection`);
  }

  for (const [id, property, maximum] of [
    ["grid-columns", "columns", 12],
    ["grid-rows", "rows", 8],
  ]) {
    elements[id].input("4");
    for (const invalidValue of ["", "malformed", "NaN", "Infinity", "-Infinity"]) {
      elements[id].input(invalidValue);
      check(gridState[property] === 4, `${property} preserves its valid value for ${invalidValue || "empty input"}`);
      check(elements[id].value === 4, `${property} restores its control for ${invalidValue || "empty input"}`);
    }
    elements[id].input("-3");
    check(gridState[property] === 1, `${property} clamps negative values to its minimum`);
    elements[id].input("-1.5");
    check(gridState[property] === 1, `${property} clamps finite fractional values below its minimum`);
    elements[id].input(String(maximum + 20));
    check(gridState[property] === maximum, `${property} clamps excessive values to its maximum`);
    elements[id].input(String(maximum + 0.9));
    check(gridState[property] === maximum, `${property} clamps finite fractional values above its maximum`);
    checkGridSynchronization(`${property} invalid and boundary handling`);
  }

  for (const [id, property] of [
    ["grid-column-gap", "columnGap"],
    ["grid-row-gap", "rowGap"],
  ]) {
    for (const value of [0, 9, 16, 41, 64]) {
      elements[id].input(String(value));
      check(gridState[property] === value, `${property} accepts ${value}`);
      checkGridSynchronization(`${property} ${value}`);
    }
    elements[id].input("12.5");
    check(gridState[property] === 12.5, `${property} retains ordinary fractional numeric semantics`);
    elements[id].input("-1");
    check(gridState[property] === 0, `${property} clamps below zero`);
    elements[id].input("65");
    check(gridState[property] === 64, `${property} clamps above 64`);
  }
  elements["grid-column-gap"].input("23");
  const rowGapBeforeIndependentEdit = gridState.rowGap;
  check(gridState.columnGap === 23 && gridState.rowGap === rowGapBeforeIndependentEdit, "Column gap edits cannot modify Row gap");
  elements["grid-row-gap"].input("37");
  check(gridState.columnGap === 23 && gridState.rowGap === 37, "Row gap edits cannot modify Column gap");

  const ordinaryButtonValue = buttonState.fontSize;
  selectTestGenerator("button");
  elements["font-size"].input("17.5");
  check(buttonState.fontSize === 17.5, "ordinary Button numeric controls still accept representative fractions");
  elements["font-size"].input(String(ordinaryButtonValue));
  selectTestGenerator("grid");

  const gridEnumCases = [
    ["grid-justify-items", "justifyItems"],
    ["grid-align-items", "alignItems"],
  ];
  for (const [id, property] of gridEnumCases) {
    check(
      JSON.stringify(context.testApi.gridEnumControls[property].allowedValues) ===
        JSON.stringify(["stretch", "start", "center", "end"]),
      `${property} exposes the exact allow-list`,
    );
    for (const value of ["stretch", "start", "center", "end"]) {
      elements[id].changeValue(value);
      check(gridState[property] === value, `${property} accepts ${value}`);
      check(elements[id].value === value, `${property} control reflects ${value}`);
      checkGridSynchronization(`${property} ${value}`);
    }
    const previousValidValue = gridState[property];
    elements[id].changeValue("malformed-value");
    check(gridState[property] === previousValidValue, `${property} preserves its previous valid value`);
    check(elements[id].value === previousValidValue, `${property} restores its previous valid control value`);
    checkGridSynchronization(`${property} malformed protection`);
  }

  elements["grid-columns"].input("12");
  elements["grid-rows"].input("8");
  elements["grid-column-gap"].input("64");
  elements["grid-row-gap"].input("64");
  elements["grid-justify-items"].changeValue("end");
  elements["grid-align-items"].changeValue("center");
  const modifiedGridCSS = `.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(8, 1fr);
  column-gap: 64px;
  row-gap: 64px;
  justify-items: end;
  align-items: center;
}`;
  check(context.testApi.generatedCSS() === modifiedGridCSS, "required non-default Grid CSS is exact and ordered");
  check(
    !/(?:^|\n)\s*(?:width|height|max-width|min-width|overflow|box-sizing|padding|border|background|grid-auto-[a-z-]+):/m.test(modifiedGridCSS) &&
      !/grid-item|item visibility|item labels/i.test(modifiedGridCSS),
    "Grid CSS excludes preview scaffolding, item styling, and implicit-grid properties",
  );
  checkGridSynchronization("required non-default Grid configuration");
  check(
    gridPreview.children.length === 96 &&
      gridPreview.children.every((child, index) => child === originalGridChildren[index]),
    "Grid rendering retains the same 96 static preview nodes",
  );
  check(gridPreview.children.every((child) => !child.hidden), "12 by 8 Grid exposes all 96 static items");

  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === modifiedGridCSS, "Grid modified Copy uses exact authoritative CSS");
  check(copyStatus.textContent === "CSS copied", "Grid modified Copy reports success");

  elements["grid-column-gap"].input("32");
  check(copyStatus.textContent === "CSS ready to copy.", "Grid numeric edit invalidates copied feedback");
  const staleGridNumeric = deferred();
  setClipboard(() => staleGridNumeric.promise);
  const pendingGridNumericCopy = copyButton.click();
  elements["grid-row-gap"].input("31");
  staleGridNumeric.resolve();
  await pendingGridNumericCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "delayed Grid copy cannot overwrite numeric-edit feedback");

  setClipboard(() => Promise.resolve());
  await copyButton.click();
  elements["grid-justify-items"].changeValue("start");
  check(copyStatus.textContent === "CSS ready to copy.", "Grid enum edit invalidates copied feedback");
  const staleGridEnum = deferred();
  setClipboard(() => staleGridEnum.promise);
  const pendingGridEnumCopy = copyButton.click();
  elements["grid-align-items"].changeValue("end");
  staleGridEnum.reject(new Error("late Grid enum copy failure"));
  await pendingGridEnumCopy;
  check(copyStatus.textContent === "CSS ready to copy.", "delayed Grid failure cannot overwrite enum-edit feedback");

  const preservedGridState = JSON.stringify(gridState);
  const preservedGridCSS = context.testApi.generatedCSS();
  for (const v4Generator of generatorNames) {
    selectTestGenerator(v4Generator);
    check(
      JSON.stringify(rootState.generators[v4Generator]) === v4StateBeforeGrid[v4Generator],
      `${v4Generator} state survives functional Grid edits`,
    );
    checkActiveConsistency(v4Generator, `${v4Generator} restored from Grid`);
    selectTestGenerator("grid");
    check(JSON.stringify(gridState) === preservedGridState, `Grid state survives ${v4Generator} round trip`);
    check(context.testApi.generatedCSS() === preservedGridCSS, `Grid CSS survives ${v4Generator} round trip`);
    checkGridSynchronization(`Grid restored from ${v4Generator}`);
  }

  const multiGeneratorRoute = ["button", "card", "input", "flexbox", "grid", "button"];
  multiGeneratorRoute.forEach(selectTestGenerator);
  checkActiveConsistency("button", "five-generator route destination");
  check(JSON.stringify(gridState) === preservedGridState, "Grid state survives the five-generator route");
  generatorNames.forEach((generatorName) => {
    check(
      JSON.stringify(rootState.generators[generatorName]) === v4StateBeforeGrid[generatorName],
      `${generatorName} state survives the five-generator route`,
    );
  });

  const gridClipboardPairs = generatorNames.flatMap((generatorName) => [
    ["grid", generatorName],
    [generatorName, "grid"],
  ]);
  for (const [source, destination] of gridClipboardPairs) {
    selectTestGenerator(source);
    const sourceCSS = context.testApi.generatedCSS();
    const delayedSuccess = deferred();
    setClipboard(() => delayedSuccess.promise);
    const pendingSuccess = copyButton.click();
    selectTestGenerator(destination);
    delayedSuccess.resolve();
    await pendingSuccess;
    check(clipboardCalls.at(-1) === sourceCSS, `${source} to ${destination}: pending success retains source CSS`);
    check(copyStatus.textContent === "CSS ready to copy.", `${source} to ${destination}: stale success cannot replace ready feedback`);
    checkActiveConsistency(destination, `${source} to ${destination} success-race destination`);

    selectTestGenerator(source);
    const delayedFailure = deferred();
    fallbackResult = false;
    setClipboard(() => delayedFailure.promise);
    const pendingFailure = copyButton.click();
    selectTestGenerator(destination);
    delayedFailure.reject(new Error(`${source} to ${destination} delayed failure`));
    await pendingFailure;
    check(copyStatus.textContent === "CSS ready to copy.", `${source} to ${destination}: stale failure cannot replace ready feedback`);
    checkActiveConsistency(destination, `${source} to ${destination} failure-race destination`);
  }

  selectTestGenerator("grid");
  elements["grid-columns"].input("12");
  elements["grid-rows"].input("8");
  elements["grid-column-gap"].input("64");
  elements["grid-row-gap"].input("64");
  elements["grid-justify-items"].changeValue("end");
  elements["grid-align-items"].changeValue("center");
  const demandingGridState = JSON.stringify(gridState);
  check(context.testApi.generatedCSS() === modifiedGridCSS, "demanding Grid CSS remains exact before hardening round trips");
  for (const generatorName of generatorNames) {
    selectTestGenerator(generatorName);
    checkActiveConsistency(generatorName, `demanding Grid route through ${generatorName}`);
  }
  selectTestGenerator("grid");
  check(JSON.stringify(gridState) === demandingGridState, "demanding Grid state survives all four V4 generators");
  check(context.testApi.generatedCSS() === modifiedGridCSS, "demanding Grid CSS survives all four V4 generators");
  check(gridPreview.children.every((child) => !child.hidden), "demanding Grid restores all 96 visible items");
  checkGridSynchronization("demanding Grid round trip");
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === modifiedGridCSS, "demanding Grid round-trip Copy remains exact");

  elements["grid-columns"].input("1");
  elements["grid-rows"].input("1");
  elements["grid-column-gap"].input("0");
  elements["grid-row-gap"].input("0");
  elements["grid-justify-items"].changeValue("start");
  elements["grid-align-items"].changeValue("end");
  const minimumGridCSS = `.grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-template-rows: repeat(1, 1fr);
  column-gap: 0px;
  row-gap: 0px;
  justify-items: start;
  align-items: end;
}`;
  const minimumGridState = JSON.stringify(gridState);
  check(context.testApi.generatedCSS() === minimumGridCSS, "minimum Grid CSS is exact and ordered");
  check(
    gridPreview.children.filter((child) => !child.hidden).length === 1 &&
      gridPreview.children.filter((child) => child.hidden).length === 95,
    "minimum Grid shows one item and hides the remaining 95",
  );
  for (const generatorName of generatorNames) {
    selectTestGenerator(generatorName);
    checkActiveConsistency(generatorName, `minimum Grid route through ${generatorName}`);
  }
  selectTestGenerator("grid");
  check(JSON.stringify(gridState) === minimumGridState, "minimum Grid state survives all four V4 generators");
  check(context.testApi.generatedCSS() === minimumGridCSS, "minimum Grid CSS survives all four V4 generators");
  checkGridSynchronization("minimum Grid round trip");
  setClipboard(() => Promise.resolve());
  await copyButton.click();
  check(clipboardCalls.at(-1) === minimumGridCSS, "minimum Grid round-trip Copy remains exact");
  check(
    gridPreview.children.length === 96 &&
      gridPreview.children.every((child, index) => child === originalGridChildren[index]),
    "Grid hardening routes preserve all 96 node identities and order",
  );

  // Task 5: exercise the complete five-generator system as one application.
  const allGeneratorNames = [...generatorNames, "grid"];
  const expectedStateKeys = {
    button: [
      "fontSize", "verticalPadding", "horizontalPadding", "borderRadius",
      "backgroundColor", "textColor", "borderWidth", "borderColor",
    ],
    card: [
      "width", "padding", "borderRadius", "backgroundColor", "textColor",
      "borderWidth", "borderColor",
    ],
    input: [
      "fontSize", "verticalPadding", "horizontalPadding", "borderRadius",
      "backgroundColor", "textColor", "borderWidth", "borderColor",
      "focusBorderColor", "focusOutlineWidth", "focusOutlineColor", "focusOutlineOffset",
    ],
    flexbox: ["flexDirection", "justifyContent", "alignItems", "flexWrap", "gap"],
    grid: ["columns", "rows", "columnGap", "rowGap", "justifyItems", "alignItems"],
  };
  const forbiddenStateKeys = [
    "generatedCSS", "filename", "clipboardStatus", "previewWidth", "previewHeight",
    "visibleCount", "itemCount", "children", "element", "node", "control",
  ];

  check(allGeneratorNames.length === 5, "Task 5 covers exactly five generators");
  for (const generatorName of allGeneratorNames) {
    const generatorState = rootState.generators[generatorName];
    check(
      JSON.stringify(Object.keys(generatorState)) === JSON.stringify(expectedStateKeys[generatorName]),
      `${generatorName}: state has its exact ordered property shape`,
    );
    check(
      forbiddenStateKeys.every((key) => !Object.prototype.hasOwnProperty.call(generatorState, key)),
      `${generatorName}: state excludes derived output, DOM, and preview bookkeeping`,
    );
    check(
      Object.values(generatorState).every((value) => typeof value === "number" || typeof value === "string"),
      `${generatorName}: state contains only serializable primitive values`,
    );
  }
  check(Object.keys(rootState.generators).length === 5, "state contains exactly five generator records");
  check(
    clipboardPairs.length + gridClipboardPairs.length === 20,
    "the delayed clipboard transition matrix contains all twenty directed generator routes",
  );
  check(
    (clipboardPairs.length + gridClipboardPairs.length) * 2 === 40,
    "the delayed clipboard matrix covers forty success and failure outcomes",
  );

  selectTestGenerator("button");
  elements["font-size"].input("20");
  elements["vertical-padding"].input("18");
  elements["horizontal-padding"].input("32");
  elements["border-radius"].input("14");
  elements["background-color"].input("#0f172a");
  elements["text-color"].input("#f8fafc");
  elements["border-width"].input("3");
  elements["border-color"].input("#38bdf8");

  selectTestGenerator("card");
  elements["card-width"].input("480");
  elements["card-padding"].input("32");
  elements["card-border-radius"].input("20");
  elements["card-background-color"].input("#f8fafc");
  elements["card-text-color"].input("#0f172a");
  elements["card-border-width"].input("2");
  elements["card-border-color"].input("#64748b");

  selectTestGenerator("input");
  elements["input-font-size"].input("20");
  elements["input-vertical-padding"].input("14");
  elements["input-horizontal-padding"].input("20");
  elements["input-border-radius"].input("10");
  elements["input-background-color"].input("#f8fafc");
  elements["input-text-color"].input("#0f172a");
  elements["input-border-width"].input("2");
  elements["input-border-color"].input("#64748b");
  elements["input-focus-border-color"].input("#e11d48");
  elements["input-focus-outline-width"].input("6");
  elements["input-focus-outline-color"].input("#f59e0b");
  elements["input-focus-outline-offset"].input("8");

  selectTestGenerator("flexbox");
  elements["flex-direction"].changeValue("column-reverse");
  elements["justify-content"].changeValue("space-evenly");
  elements["align-items"].changeValue("baseline");
  elements["flex-wrap"].changeValue("wrap-reverse");
  elements["flex-gap"].input("64");

  selectTestGenerator("grid");
  elements["grid-columns"].input("12");
  elements["grid-rows"].input("8");
  elements["grid-column-gap"].input("64");
  elements["grid-row-gap"].input("64");
  elements["grid-justify-items"].changeValue("end");
  elements["grid-align-items"].changeValue("center");

  const meaningfulStateSnapshots = Object.fromEntries(
    allGeneratorNames.map((generatorName) => [
      generatorName,
      JSON.stringify(rootState.generators[generatorName]),
    ]),
  );
  check(
    new Set(Object.values(meaningfulStateSnapshots)).size === 5,
    "all five generators hold distinct meaningful non-default states simultaneously",
  );

  const allDirectedTransitions = allGeneratorNames.flatMap((source) =>
    allGeneratorNames.filter((destination) => destination !== source).map((destination) => ({ source, destination })),
  );
  check(allDirectedTransitions.length === 20, "all twenty ordered switch transitions are enumerated");
  for (const { source, destination } of allDirectedTransitions) {
    selectTestGenerator(source);
    const sourceSnapshot = JSON.stringify(rootState.generators[source]);
    selectTestGenerator(destination);
    checkActiveConsistency(destination, `Task 5 ${source} to ${destination}`);
    check(
      JSON.stringify(rootState.generators[source]) === sourceSnapshot,
      `${source} to ${destination}: source state is preserved`,
    );
    selectTestGenerator(source);
    checkActiveConsistency(source, `Task 5 ${source} restored after ${destination}`);
    check(
      JSON.stringify(rootState.generators[source]) === sourceSnapshot,
      `${source} to ${destination}: source state restores exactly`,
    );
  }

  const cycleOrders = [
    ["button", "card", "input", "flexbox", "grid"],
    ["grid", "flexbox", "input", "card", "button"],
    ["input", "grid", "button", "flexbox", "card"],
  ];
  cycleOrders.forEach((order, orderIndex) => {
    for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
      order.forEach((generatorName) => {
        selectTestGenerator(generatorName);
        checkActiveConsistency(generatorName, `Task 5 order ${orderIndex + 1} cycle ${cycleIndex + 1}`);
        check(
          JSON.stringify(rootState.generators[generatorName]) === meaningfulStateSnapshots[generatorName],
          `${generatorName}: state survives order ${orderIndex + 1} cycle ${cycleIndex + 1}`,
        );
      });
    }
  });

  let stabilizationEditIndex = 0;
  function editDestination(generatorName) {
    stabilizationEditIndex += 1;
    const alternate = stabilizationEditIndex % 2 === 0;
    if (generatorName === "button") elements["font-size"].input(alternate ? "21" : "20");
    if (generatorName === "card") elements["card-width"].input(alternate ? "481" : "480");
    if (generatorName === "input") elements["input-focus-outline-offset"].input(alternate ? "7" : "8");
    if (generatorName === "flexbox") elements["flex-direction"].changeValue(alternate ? "row-reverse" : "column-reverse");
    if (generatorName === "grid") elements["grid-justify-items"].changeValue(alternate ? "center" : "end");
  }

  for (const { source, destination } of allDirectedTransitions) {
    selectTestGenerator(source);
    const staleOperation = deferred();
    setClipboard(() => staleOperation.promise);
    const pendingCopy = copyButton.click();
    selectTestGenerator(destination);
    editDestination(destination);
    const destinationCSS = context.testApi.generatedCSS();
    staleOperation.resolve();
    await pendingCopy;
    check(copyStatus.textContent === "CSS ready to copy.", `${source} to edited ${destination}: stale result leaves ready status`);
    check(context.testApi.generatedCSS() === destinationCSS, `${source} to edited ${destination}: destination CSS remains authoritative`);
    checkActiveConsistency(destination, `${source} to edited ${destination} race`);
  }

  for (const generatorName of allGeneratorNames) {
    selectTestGenerator(generatorName);
    const successfulEditRace = deferred();
    setClipboard(() => successfulEditRace.promise);
    const pendingSuccess = copyButton.click();
    editDestination(generatorName);
    const editedSuccessCSS = context.testApi.generatedCSS();
    successfulEditRace.resolve();
    await pendingSuccess;
    check(copyStatus.textContent === "CSS ready to copy.", `${generatorName}: same-generator stale success leaves ready status`);
    check(context.testApi.generatedCSS() === editedSuccessCSS, `${generatorName}: same-generator success race preserves edited CSS`);

    const failedEditRace = deferred();
    fallbackResult = false;
    setClipboard(() => failedEditRace.promise);
    const pendingFailure = copyButton.click();
    editDestination(generatorName);
    const editedFailureCSS = context.testApi.generatedCSS();
    failedEditRace.reject(new Error(`${generatorName} same-generator delayed failure`));
    await pendingFailure;
    check(copyStatus.textContent === "CSS ready to copy.", `${generatorName}: same-generator stale failure leaves ready status`);
    check(context.testApi.generatedCSS() === editedFailureCSS, `${generatorName}: same-generator failure race preserves edited CSS`);
    checkActiveConsistency(generatorName, `${generatorName} same-generator races`);
  }

  for (const generatorName of allGeneratorNames) {
    selectTestGenerator(generatorName);

    const olderSuccess = deferred();
    const newerSuccess = deferred();
    let attempt = 0;
    setClipboard(() => (attempt++ === 0 ? olderSuccess.promise : newerSuccess.promise));
    const firstSuccess = copyButton.click();
    const secondSuccess = copyButton.click();
    newerSuccess.resolve();
    await secondSuccess;
    olderSuccess.resolve();
    await firstSuccess;
    check(copyStatus.textContent === "CSS copied", `${generatorName}: newest success wins when two successes resolve out of order`);

    const olderFailure = deferred();
    const newerSuccessAfterFailure = deferred();
    attempt = 0;
    fallbackResult = false;
    setClipboard(() => (attempt++ === 0 ? olderFailure.promise : newerSuccessAfterFailure.promise));
    const firstFailure = copyButton.click();
    const secondSuccessAfterFailure = copyButton.click();
    newerSuccessAfterFailure.resolve();
    await secondSuccessAfterFailure;
    olderFailure.reject(new Error(`${generatorName} older failure`));
    await firstFailure;
    check(copyStatus.textContent === "CSS copied", `${generatorName}: an older failure cannot replace a newer success`);

    const olderSuccessBeforeFailure = deferred();
    const newerFailure = deferred();
    attempt = 0;
    fallbackResult = false;
    setClipboard(() => (attempt++ === 0 ? olderSuccessBeforeFailure.promise : newerFailure.promise));
    const firstOlderSuccess = copyButton.click();
    const secondNewerFailure = copyButton.click();
    newerFailure.reject(new Error(`${generatorName} newer failure`));
    await secondNewerFailure;
    olderSuccessBeforeFailure.resolve();
    await firstOlderSuccess;
    check(copyStatus.textContent === "Couldn't copy — select the CSS manually", `${generatorName}: newest failure wins over an older success`);
  }

  for (const generatorName of allGeneratorNames) {
    selectTestGenerator(generatorName);
    const exactCSS = context.testApi.generatedCSS();

    navigator.clipboard = undefined;
    fallbackResult = true;
    copyButton.focused = false;
    const missingApiWriteIndex = fallbackWrites.length;
    await copyButton.click();
    check(fallbackWrites[missingApiWriteIndex] === exactCSS, `${generatorName}: missing Clipboard API fallback writes exact CSS bytes`);
    check(copyStatus.textContent === "CSS copied", `${generatorName}: successful missing-API fallback reports success`);
    check(copyButton.focused, `${generatorName}: missing-API fallback restores Copy focus`);
    check(temporaryElements.at(-1).removed, `${generatorName}: missing-API fallback removes its temporary textarea`);

    fallbackResult = true;
    copyButton.focused = false;
    const rejectedApiWriteIndex = fallbackWrites.length;
    setClipboard(() => Promise.reject(new Error(`${generatorName} clipboard denied`)));
    await copyButton.click();
    check(fallbackWrites[rejectedApiWriteIndex] === exactCSS, `${generatorName}: rejected Clipboard API fallback writes exact CSS bytes`);
    check(copyStatus.textContent === "CSS copied", `${generatorName}: successful rejection fallback reports success`);
    check(copyButton.focused, `${generatorName}: rejection fallback restores Copy focus`);
    check(temporaryElements.at(-1).removed, `${generatorName}: rejection fallback removes its temporary textarea`);

    navigator.clipboard = undefined;
    fallbackResult = false;
    copyButton.focused = false;
    await copyButton.click();
    check(copyStatus.textContent === "Couldn't copy — select the CSS manually", `${generatorName}: failed fallback reports truthful status`);
    check(copyButton.focused, `${generatorName}: failed fallback still restores Copy focus`);
    check(temporaryElements.at(-1).removed, `${generatorName}: failed fallback removes its temporary textarea`);
  }

  // Shared numeric semantics: fractional values survive where a control allows them,
  // while Grid tracks remain integer-only and enum vocabularies remain isolated.
  selectTestGenerator("button");
  elements["font-size"].input("20.5");
  check(buttonState.fontSize === 20.5, "Button preserves a valid fractional shared numeric value");
  checkButtonSynchronization("Task 5 fractional Button");
  selectTestGenerator("card");
  elements["card-width"].input("480.5");
  check(cardState.width === 480.5, "Card preserves a valid fractional shared numeric value");
  checkCardSynchronization("Task 5 fractional Card");
  selectTestGenerator("input");
  elements["input-font-size"].input("20.5");
  check(inputState.fontSize === 20.5, "Input preserves a valid fractional shared numeric value");
  checkInputSynchronization("Task 5 fractional Input");
  selectTestGenerator("flexbox");
  elements["flex-gap"].input("63.5");
  check(flexboxState.gap === 63.5, "Flexbox preserves a valid fractional shared numeric value");
  checkFlexboxSynchronization("Task 5 fractional Flexbox");
  selectTestGenerator("grid");
  elements["grid-column-gap"].input("63.5");
  elements["grid-row-gap"].input("62.5");
  check(gridState.columnGap === 63.5 && gridState.rowGap === 62.5, "Grid gaps preserve valid fractional values");
  const integerColumnsBeforeFraction = gridState.columns;
  const integerRowsBeforeFraction = gridState.rows;
  elements["grid-columns"].input("7.5");
  elements["grid-rows"].input("4.5");
  check(
    gridState.columns === integerColumnsBeforeFraction && gridState.rows === integerRowsBeforeFraction,
    "Grid track counts reject fractional values without corrupting prior state",
  );
  const gridJustifyBeforeForeignEnum = gridState.justifyItems;
  elements["grid-justify-items"].changeValue("space-evenly");
  check(gridState.justifyItems === gridJustifyBeforeForeignEnum, "Grid rejects a Flexbox-only enum token");
  selectTestGenerator("flexbox");
  const flexDirectionBeforeForeignEnum = flexboxState.flexDirection;
  elements["flex-direction"].changeValue("start");
  check(flexboxState.flexDirection === flexDirectionBeforeForeignEnum, "Flexbox rejects a Grid-only enum token");

  const inputPreviewIdentity = document.querySelector(".generated-input");
  for (let index = 0; index < 50; index += 1) {
    selectTestGenerator(allGeneratorNames[index % allGeneratorNames.length]);
  }
  check(document.querySelector(".generated-input") === inputPreviewIdentity, "rapid switching preserves the Input preview node identity");
  check(
    flexboxPreview.children.every((child, index) => child === originalFlexboxChildren[index]),
    "rapid switching preserves every Flexbox child node identity",
  );
  check(
    gridPreview.children.every((child, index) => child === originalGridChildren[index]),
    "rapid switching preserves all 96 Grid child node identities",
  );

  selectTestGenerator("grid");
  for (let value = 1; value <= 12; value += 1) elements["grid-columns"].input(String(value));
  for (let value = 1; value <= 8; value += 1) elements["grid-rows"].input(String(value));
  for (let value = 0; value <= 64; value += 1) elements["grid-column-gap"].input(String(value));
  for (let value = 64; value >= 0; value -= 1) elements["grid-row-gap"].input(String(value));
  checkGridSynchronization("Task 5 rapid Grid edits");

  Object.entries(expectedListenerRegistrations).forEach(([eventType, elementIds]) => {
    elementIds.forEach((id) => {
      check(
        elements[id].listenerRegistrations[eventType] === 1,
        `${id} still has exactly one ${eventType} listener after switching and editing`,
      );
    });
  });

  const markupInputIds = [...html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
  const markupSelectIds = [...html.matchAll(/<select\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
  const labelTargets = [...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((match) => match[1]);
  const buttonControlIds = markupInputIds.filter((id) =>
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
  const cardControlIds = markupInputIds.filter((id) => id.startsWith("card-"));
  const inputControlIds = markupInputIds.filter((id) => id.startsWith("input-"));
  const flexboxControlIds = [
    ...markupSelectIds.filter((id) => !id.startsWith("grid-")),
    "flex-gap",
  ];
  const gridControlIds = [
    ...markupInputIds.filter((id) => id.startsWith("grid-")),
    ...markupSelectIds.filter((id) => id.startsWith("grid-")),
  ];
  check(markupInputIds.length === 38, "markup contains five radios, thirty-two property inputs, and one preview input");
  check(markupSelectIds.length === 6, "markup contains four Flexbox and two Grid native selects");
  check(labelTargets.length === 44, "markup contains a label for every radio, property control, select, and preview input");
  check(buttonControlIds.length === 8, "Button view retains exactly eight controls");
  check(cardControlIds.length === 7, "Card view contains exactly seven controls");
  check(inputControlIds.length === 12, "Input generator contains exactly twelve controls");
  check(flexboxControlIds.length === 5, "Flexbox contains exactly five controls");
  check(gridControlIds.length === 6, "Grid shell contains exactly six property controls");
  check(markupInputIds.every((id) => labelTargets.includes(id)), "every control has an associated label");
  check(markupSelectIds.every((id) => labelTargets.includes(id)), "every Flexbox select has an associated label");
  check(
    html.includes('<fieldset class="generator-selector">') &&
      /id="generator-button"[\s\S]*?type="radio"[\s\S]*?value="button"[\s\S]*?checked/.test(html) &&
      /id="generator-card"[\s\S]*?type="radio"[\s\S]*?value="card"/.test(html) &&
      /id="generator-input"[\s\S]*?type="radio"[\s\S]*?value="input"/.test(html) &&
      /id="generator-flexbox"[\s\S]*?type="radio"[\s\S]*?value="flexbox"/.test(html) &&
      /id="generator-grid"[\s\S]*?type="radio"[\s\S]*?value="grid"/.test(html),
    "generator selector uses five labelled native radios with Button selected",
  );
  check(
    cardControlIds.every((id) => {
      const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return !/\bdisabled\b/.test(input);
    }),
    "all Card property controls are enabled",
  );
  check(
    (html.match(/<input\b[^>]*\bname="generator"[^>]*>/g) || []).length === 5,
    "markup contains exactly five generator radios",
  );
  check(
    !/<input[^>]*id="generator-flexbox"[^>]*\bdisabled\b/.test(html),
    "Flexbox generator radio is enabled",
  );
  check(
    flexboxControlIds.every((id) => {
      const control = html.match(new RegExp(`<(?:input|select)[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return !/\bdisabled\b/.test(control);
    }),
    "all five Flexbox controls are enabled",
  );
  check(
    /<select[^>]*id="flex-direction"[^>]*>[\s\S]*?<option value="row" selected>row<\/option>[\s\S]*?row-reverse[\s\S]*?column[\s\S]*?column-reverse[\s\S]*?<\/select>/.test(html) &&
      /<select[^>]*id="justify-content"[^>]*>[\s\S]*?<option value="flex-start" selected>flex-start<\/option>[\s\S]*?space-evenly[\s\S]*?<\/select>/.test(html) &&
      /<select[^>]*id="align-items"[^>]*>[\s\S]*?<option value="stretch" selected>stretch<\/option>[\s\S]*?baseline[\s\S]*?<\/select>/.test(html) &&
      /<select[^>]*id="flex-wrap"[^>]*>[\s\S]*?<option value="nowrap" selected>nowrap<\/option>[\s\S]*?wrap-reverse[\s\S]*?<\/select>/.test(html),
    "Flexbox selects expose the exact locked options and displayed defaults",
  );
  check(
    /<input[^>]*id="flex-gap"[^>]*type="range"[^>]*min="0"[^>]*max="64"[^>]*step="1"[^>]*value="16"/.test(html) &&
      /id="flex-gap-output"[^>]*>16px<\/output>/.test(html),
    "Flexbox Gap is one enabled 0–64 range with a 16px displayed default",
  );
  check(
    gridControlIds.every((id) => {
      const control = html.match(new RegExp(`<(?:input|select)[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return !/\bdisabled\b/.test(control);
    }),
    "all six Grid property controls are enabled",
  );
  check(
    /<input[^>]*id="grid-columns"[^>]*type="range"[^>]*min="1"[^>]*max="12"[^>]*step="1"[^>]*value="3"/.test(html) &&
      /id="grid-columns-output"[^>]*>3<\/output>/.test(html) &&
      /<input[^>]*id="grid-rows"[^>]*type="range"[^>]*min="1"[^>]*max="8"[^>]*step="1"[^>]*value="2"/.test(html) &&
      /id="grid-rows-output"[^>]*>2<\/output>/.test(html) &&
      !/<input[^>]*id="grid-(?:columns|rows)"[^>]*\bdisabled\b/.test(html),
    "Grid Columns and Rows expose exact enabled bounds and defaults",
  );
  check(
    ["grid-column-gap", "grid-row-gap"].every((id) => {
      const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return input.includes('type="range"') && input.includes('min="0"') && input.includes('max="64"') &&
        input.includes('step="1"') && input.includes('value="16"') && !/\bdisabled\b/.test(input) &&
        new RegExp(`id="${id}-output"[^>]*>16px<\\/output>`).test(html);
    }),
    "Grid gaps expose exact enabled bounds and 16px defaults",
  );
  check(
    ["grid-justify-items", "grid-align-items"].every((id) => {
      const selectMarkup = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/select>`))?.[0] || "";
      const values = [...selectMarkup.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
      return !/\bdisabled\b/.test(selectMarkup.match(/<select[^>]*>/)?.[0] || "") &&
        JSON.stringify(values) === JSON.stringify(["stretch", "start", "center", "end"]) &&
        /<option value="stretch" selected>stretch<\/option>/.test(selectMarkup);
    }),
    "Grid alignment selects expose the exact enabled options and stretch defaults",
  );
  check(
    inputBaseControlIds.every((id) => {
      const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return !/\bdisabled\b/.test(input);
    }),
    "all eight Input Base controls are enabled in markup",
  );
  check(
    inputFocusControlIds.every((id) => {
      const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || "";
      return !/\bdisabled\b/.test(input);
    }),
    "all four Input Focus controls are enabled in markup",
  );
  const expectedInputDefaults = {
    "input-font-size": ["16", "16px"],
    "input-vertical-padding": ["10", "10px"],
    "input-horizontal-padding": ["14", "14px"],
    "input-border-radius": ["6", "6px"],
    "input-border-width": ["1", "1px"],
    "input-background-color": ["#ffffff", "#FFFFFF"],
    "input-text-color": ["#18181b", "#18181B"],
    "input-border-color": ["#d4d4d8", "#D4D4D8"],
    "input-focus-border-color": ["#4f46e5", "#4F46E5"],
    "input-focus-outline-width": ["3", "3px"],
    "input-focus-outline-color": ["#2563eb", "#2563EB"],
    "input-focus-outline-offset": ["2", "2px"],
  };
  check(
    Object.entries(expectedInputDefaults).every(([id, [value, display]]) => {
      const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || "";
      const output = html.match(new RegExp(`id="${id}-output"[^>]*>${display.replace("#", "#")}</`));
      return input.includes(`value="${value}"`) && Boolean(output);
    }),
    "all twelve Input controls expose the planned default and display values",
  );
  check(
    ["Typography", "Spacing", "Shape", "Color", "Focus"].every((heading) =>
      new RegExp(`<h3[^>]*>${heading}</h3>`).test(html),
    ),
    "Input generator uses the five required visible sections",
  );
  check(
    html.includes('data-generator-controls="card" hidden') &&
      html.includes('data-generator-preview="card" hidden'),
    "Card controls and preview start hidden",
  );
  check(
    html.includes('data-generator-controls="input" hidden') &&
      html.includes('data-generator-preview="input" hidden'),
    "Input controls and preview start hidden",
  );
  check(
    html.includes('data-generator-controls="flexbox" hidden') &&
      /data-generator-preview="flexbox"[\s\S]*?aria-hidden="true"[\s\S]*?hidden/.test(html),
    "Flexbox controls and decorative preview start natively hidden",
  );
  check(
    html.includes('data-generator-controls="grid" hidden') &&
      /data-generator-preview="grid"[\s\S]*?aria-hidden="true"[\s\S]*?tabindex="-1"[\s\S]*?hidden/.test(html),
    "Grid controls and decorative preview start natively hidden",
  );
  check((html.match(/class="grid-item"/g) || []).length === 96, "Grid preview contains exactly 96 static items");
  check(
    (html.match(/class="grid-item" hidden/g) || []).length === 90 &&
      /<div class="grid-item">1<\/div>\s*<div class="grid-item">2<\/div>\s*<div class="grid-item">3<\/div>\s*<div class="grid-item">4<\/div>\s*<div class="grid-item">5<\/div>\s*<div class="grid-item">6<\/div>\s*<div class="grid-item" hidden>7<\/div>/.test(html),
    "Grid preview initially shows six items and hides the remaining ninety",
  );
  const gridPreviewMarkup = html.match(
    /<div\s+class="generated-grid"[\s\S]*?data-generator-preview="grid"[\s\S]*?<div class="grid-item" hidden>96<\/div>\s*<\/div>/,
  )?.[0] || "";
  check(
    gridPreviewMarkup.includes('aria-hidden="true"') &&
      gridPreviewMarkup.includes('tabindex="-1"') &&
      !/<(?:button|input|select|a)\b/.test(gridPreviewMarkup) &&
      !/role="(?:grid|gridcell)"/.test(gridPreviewMarkup),
    "Grid preview and all items remain decorative and outside sequential interaction",
  );
  const flexboxPreviewMarkup = html.match(
    /<div\s+class="generated-flexbox"[\s\S]*?data-generator-preview="flexbox"[\s\S]*?<div class="flex-item">1<\/div>\s*<div class="flex-item">2<\/div>\s*<div class="flex-item">3<\/div>\s*<div class="flex-item">4<\/div>\s*<div class="flex-item">5<\/div>\s*<\/div>/,
  )?.[0] || "";
  check(
    (html.match(/class="flex-item"/g) || []).length === 5,
    "Flexbox preview contains exactly five static items",
  );
  check(
    flexboxPreviewMarkup.includes('tabindex="-1"') &&
      !/<(?:button|input|select|a)\b/.test(flexboxPreviewMarkup),
    "scroll-contained Flexbox preview and its items are absent from sequential interaction",
  );
  check(
    /<label[^>]*for="generated-input"[^>]*>Email address<\/label>/.test(html) &&
      /<input[\s\S]*?id="generated-input"[\s\S]*?type="text"[\s\S]*?placeholder="name@example.com"[\s\S]*?>/.test(html) &&
      !/<input[^>]*id="generated-input"[^>]*\bdisabled\b/.test(html),
    "Input preview is a visible-labelled, native, editable text input",
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
  check(
    /\.generator-options\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(64px, 1fr\)\)/.test(css) &&
      /\.generator-options label\s*\{[\s\S]*?padding:\s*7px 4px;/.test(css),
    "selector layout wraps five readable options in DOM order",
  );
  check(
    /select\s*\{[\s\S]*?width:\s*100%;[\s\S]*?border:\s*1px solid var\(--line-strong\);/.test(css) &&
      css.includes(":focus-visible"),
    "native Flexbox selects retain visible shared focus styling",
  );
  check(
    /\.generated-flexbox\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*row;[\s\S]*?justify-content:\s*flex-start;[\s\S]*?align-items:\s*stretch;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?gap:\s*16px;/.test(css) &&
      /box-sizing:\s*border-box;[\s\S]*?width:\s*min\(340px, 100%\);[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?height:\s*340px;[\s\S]*?overflow:\s*auto;/.test(css) &&
      /\.flex-item\s*\{[\s\S]*?flex:\s*0 0 48px;[\s\S]*?min-width:\s*48px;[\s\S]*?min-height:\s*48px;[\s\S]*?margin:\s*0;/.test(css),
    "Flexbox preview uses symmetric, contained preview-only scaffolding",
  );
  check(
    /\.flex-item:nth-child\(2\)\s*\{[\s\S]*?font-size:\s*18px;/.test(css) &&
      /\.flex-item:nth-child\(4\)\s*\{[\s\S]*?font-size:\s*12px;/.test(css),
    "Flexbox preview preserves differing text metrics for baseline alignment",
  );
  const flexItemRule = css.match(/\.flex-item\s*\{([^}]*)\}/)?.[1] || "";
  check(
    /margin:\s*0;/.test(flexItemRule) && !/margin-(?:top|right|bottom|left)/.test(flexItemRule),
    "Flexbox preview items have no margin that can distort Gap",
  );
  check(
    !/(previewFlexbox|flexboxPreview)\.(?:append|appendChild|prepend|replaceChildren|insertBefore|removeChild)|createElement\([^)]*flex/i.test(script),
    "Flexbox rendering never reconstructs preview children",
  );
  check(
    /\.generated-grid\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?column-gap:\s*16px;[\s\S]*?row-gap:\s*16px;[\s\S]*?justify-items:\s*stretch;[\s\S]*?align-items:\s*stretch;/.test(css) &&
      /width:\s*min\(480px, 100%\);[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?height:\s*384px;[\s\S]*?overflow:\s*auto;/.test(css),
    "Grid preview presents the static 3 by 2 default with responsive containment",
  );
  const gridItemRule = css.match(/\.grid-item\s*\{([^}]*)\}/)?.[1] || "";
  check(
    /margin:\s*0;/.test(gridItemRule) &&
      /min-width:\s*0;/.test(gridItemRule) &&
      /min-height:\s*0;/.test(gridItemRule) &&
      !/(?:^|;)\s*(?:width|height):/.test(gridItemRule),
    "Grid preview items have no fixed dimensions or gap-distorting margins",
  );
  check(
    !/(?:grid-auto-flow|grid-auto-columns|grid-auto-rows)/.test(script + css) &&
      !/\.grid-item[^}]*\b(?:grid-column|grid-row)\s*:/.test(css),
    "Grid preview uses no implicit-grid workaround or per-item placement",
  );
  check(
    !/(getBoundingClientRect|ResizeObserver|MutationObserver|requestAnimationFrame|setInterval|setTimeout)/.test(script),
    "runtime contains no JavaScript geometry simulation, observers, polling, timers, or animation loops",
  );
  check(
    /\.generated-input-preview\s*\{[\s\S]*?width:\s*min\(360px, 100%\)/.test(css),
    "Input preview width is responsive",
  );
  check(
    /\.generated-input\s*\{[\s\S]*?box-sizing:\s*border-box;[\s\S]*?font:\s*inherit;/.test(css) &&
      css.includes("padding: var(--input-padding-y) var(--input-padding-x);") &&
      css.includes("border: var(--input-border-width) solid var(--input-border-color);") &&
      css.includes("background-color: var(--input-background-color);") &&
      css.includes("color: var(--input-text-color);") &&
      css.includes("font-size: var(--input-font-size);"),
    "Input preview consumes Base state through CSS custom properties",
  );
  check(
    /\.generated-input:focus\s*\{[\s\S]*?border-color:\s*var\(--input-focus-border-color\);[\s\S]*?outline:\s*var\(--input-focus-outline-width\) solid var\(--input-focus-outline-color\);[\s\S]*?outline-offset:\s*var\(--input-focus-outline-offset\);/.test(css),
    "native Input focus consumes all four configurable focus variables",
  );
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
  check(
    !/INPUT_OUTPUT_PLACEHOLDER|FLEXBOX_OUTPUT_PLACEHOLDER|Input generator coming in Task 3|Flexbox generator coming in Task 3/.test(script + html),
    "released Input and Flexbox placeholder behavior remains removed",
  );
  check(
    !/generatorName === "flexbox"/.test(script) &&
      !/FLEXBOX_OUTPUT_PLACEHOLDER|FLEXBOX_UNAVAILABLE_STATUS/.test(script),
    "functional Flexbox uses shared switching with no dead shell branch",
  );
  check(
    !/GRID_OUTPUT_PLACEHOLDER|GRID_UNAVAILABLE_STATUS|Grid generator coming in Task 3|Grid CSS generation is coming in Task 3/.test(script + html) &&
      !/generatorName === "grid"/.test(script),
    "functional Grid has no Task 2 placeholder constants, wording, or switching branch",
  );
  check(
    /grid:\s*\{\s*columns:\s*3,\s*rows:\s*2,\s*columnGap:\s*16,\s*rowGap:\s*16,\s*justifyItems:\s*"stretch",\s*alignItems:\s*"stretch",\s*\}/.test(script) &&
      /grid:\s*\{[\s\S]*?numericControls:\s*gridNumericControls,[\s\S]*?enumControls:\s*gridEnumControls,[\s\S]*?renderPreview:\s*renderGridPreview,[\s\S]*?generateCSS:\s*generateGridCSS,[\s\S]*?outputFilename:\s*"grid\.css"/.test(script),
    "Grid has exactly the required flat state and an ordinary generator definition",
  );
  check(
    /getElementById\(["']grid-columns["']\)/.test(script) &&
      /getElementById\(["']grid-align-items["']\)/.test(script) &&
      /initializeGeneratorControls\(["']grid["']\)/.test(script) &&
      !/(?:previewGrid|gridPreview)\.(?:append|appendChild|prepend|replaceChildren|insertBefore|removeChild)|createElement\([^)]*grid/i.test(script),
    "Grid property controls use shared initialization and preview nodes are never created or rebuilt",
  );
  check(
    /function normalizeNumber\(value, minimum, maximum, fallback, integer = false\)[\s\S]*?integer &&[\s\S]*?number >= minimum &&[\s\S]*?number <= maximum &&[\s\S]*?!Number\.isInteger\(number\)[\s\S]*?return fallback;[\s\S]*?return Math\.min\(maximum, Math\.max\(minimum, number\)\);/.test(script) &&
      !/Math\.(?:round|floor|ceil|trunc)|parseInt/.test(script.match(/function normalizeNumber[\s\S]*?\n\}/)?.[0] || ""),
    "shared numeric normalization adds only opt-in integer rejection without rounding",
  );
  check(
    /flexbox:\s*\{\s*flexDirection:\s*"row",\s*justifyContent:\s*"flex-start",\s*alignItems:\s*"stretch",\s*flexWrap:\s*"nowrap",\s*gap:\s*16,\s*\}/.test(script) &&
      /flexbox:\s*\{[\s\S]*?numericControls:\s*flexboxNumericControls,[\s\S]*?enumControls:\s*flexboxEnumControls,[\s\S]*?renderPreview:\s*renderFlexboxPreview,[\s\S]*?generateCSS:\s*generateFlexboxCSS,[\s\S]*?outputFilename:\s*"flexbox\.css"/.test(script),
    "Flexbox has exactly the required flat state and an ordinary generator definition",
  );
  check(
    /function\s+normalizeEnum\(value, allowedValues, fallback\)/.test(script) &&
      /Object\.entries\(definition\.enumControls \?\? \{\}\)/.test(script) &&
      /addEventListener\("change"/.test(script),
    "shared optional enumControls use generic allow-list normalization and native change events",
  );
  check(
    /function\s+renderFlexboxPreview\(flexboxState\)[\s\S]*?style\.display = "flex";[\s\S]*?style\.flexDirection[\s\S]*?style\.justifyContent[\s\S]*?style\.alignItems[\s\S]*?style\.flexWrap[\s\S]*?style\.gap/.test(script) &&
      /initializeGeneratorControls\(["']flexbox["']\)/.test(script),
    "Flexbox controls and six preview styles are wired through shared initialization",
  );
  const flexboxStateSource = script.match(/flexbox:\s*\{\s*flexDirection:[\s\S]*?\n\s*\},\n\s*grid:/)?.[0] || "";
  check(
    !/(displayControl|childState|children:\s*\[|itemCount|itemSize|alignContent|rowGap|columnGap|flexGrow|flexShrink|flexBasis|alignSelf)/.test(flexboxStateSource),
    "Flexbox adds no Display control, child state, or out-of-scope property",
  );
  check(
    /input:\s*\{[\s\S]*?numericControls:\s*inputNumericControls,[\s\S]*?colorControls:\s*inputColorControls,[\s\S]*?renderPreview:\s*renderInputPreview,[\s\S]*?generateCSS:\s*generateInputCSS,[\s\S]*?outputFilename:\s*"input\.css"/.test(script),
    "Input participates in the normal generator definition table",
  );
  check(
    /function renderInputPreview\(inputState\)/.test(script) &&
      /function generateInputCSS\(inputState\)/.test(script) &&
      /initializeGeneratorControls\(["']input["']\)/.test(script),
    "Input Base and focus rendering, CSS generation, and shared control wiring are present",
  );
  check(
    /(focusBorderColor|focusOutlineWidth|focusOutlineColor|focusOutlineOffset)/.test(script) &&
      /--input-focus-border-color|--input-focus-outline-width|--input-focus-outline-color|--input-focus-outline-offset/.test(script + css) &&
      /\.input:focus/.test(script),
    "Input focus state, preview variables, and generated focus CSS are present",
  );
  check(
    !/previewInput\.style\.(?:fontSize|padding|borderRadius|backgroundColor|color|borderWidth|borderColor|outline|outlineOffset)/.test(script),
    "Input preview avoids ordinary inline Base and focus properties",
  );
  check(
    !/(focusControls|pseudoControls|stateDefinitions|interactionSchemas|CSSStyleSheet|\.is-focused|addEventListener\(["']focus)/.test(script),
    "focus support adds no pseudo-state framework, synthetic class, or focus listener",
  );
  const expectedInputPreviewVariables = [
    "--input-font-size",
    "--input-padding-y",
    "--input-padding-x",
    "--input-border-radius",
    "--input-background-color",
    "--input-text-color",
    "--input-border-width",
    "--input-border-color",
    "--input-focus-border-color",
    "--input-focus-outline-width",
    "--input-focus-outline-color",
    "--input-focus-outline-offset",
  ];
  const renderedInputPreviewVariables = [
    ...script.matchAll(/previewInput\.style\.setProperty\("([^"]+)"/g),
  ].map((match) => match[1]);
  check(
    JSON.stringify(renderedInputPreviewVariables) === JSON.stringify(expectedInputPreviewVariables),
    "Input preview defines exactly the twelve necessary custom-property mappings",
  );
  check(
    expectedInputPreviewVariables.every((property) => css.includes(`var(${property})`)),
    "every Input preview custom property is consumed by preview CSS",
  );
  check(!/(https?:\/\/|<link[^>]+(?:cdn|fonts))/i.test(html), "markup has no external runtime dependency");
  check(!fs.existsSync(path.join(root, "package.json")), "repository has no package tooling");
  check(readme.includes("## Overview"), "README includes a current overview");
  check(readme.includes("## Current generators"), "README documents current generators");
  check(
    ["Button", "Card", "Input", "Flexbox", "Grid"].every((name) => readme.includes(`### ${name}`)) &&
      (readme.match(/^### /gm) || []).length === 5,
    "README documents exactly the five released generators",
  );
  check(readme.includes("## Architecture"), "README explains the generator architecture");
  check(readme.includes("## Usage") && readme.includes("node tests/regression.cjs"), "README documents usage and tests");
  check(readme.includes("**Pulsar V5 — Grid Layout**"), "README reports the final V5 release status");
  check(
    readme.includes("Eight controls") &&
      readme.includes("Seven controls") &&
      readme.includes("Eight Base controls") &&
      readme.includes("Four Focus controls") &&
      readme.includes("Five container-level controls") &&
      readme.includes("Six container-level controls"),
    "README states the released control scope for all five generators",
  );
  check(
    readme.includes("flex-grow") &&
      readme.includes("flex-shrink") &&
      readme.includes("flex-basis") &&
      readme.includes("order") &&
      readme.includes("align-self") &&
      readme.includes("align-content"),
    "README distinguishes Flexbox container output from unsupported child and content controls",
  );
  check(
    readme.includes("explicit equal-fraction tracks") &&
      readme.includes("row and column gaps remain independent") &&
      readme.includes("static pool of 96 decorative items") &&
      readme.includes("container-level Grid CSS only") &&
      readme.includes("item placement") &&
      readme.includes("minmax()") &&
      readme.includes("auto-fit") &&
      readme.includes("auto-fill") &&
      readme.includes("responsive generated CSS"),
    "README documents Grid container scope without claiming advanced Grid features",
  );
  check(
    readme.includes("## Accessibility and responsive behavior") &&
      readme.includes("labelled native controls") &&
      readme.includes("stacks all panels on narrow screens"),
    "README documents accessibility and responsive behavior",
  );
  check(
    readme.includes("Eight Base controls") &&
      readme.includes("Four Focus controls") &&
      readme.includes("native input") &&
      readme.includes("`.input`") &&
      readme.includes("`.input:focus`"),
    "README explains Input Base controls, Focus controls, native focus, and both output rules",
  );
  check(
    !/Pulsar V1|Pulsar V2|Pulsar V3|Pulsar V4|Task [23456]|Flexbox coming soon|Grid (?:coming|is coming)|future (?:areas|directions) include (?:an? )?(?:Input|Grid) generator/i.test(readme),
    "README contains no stale release, task-status, or future-Grid claims",
  );
  check(
    readme.includes("Five independent in-session generator states") &&
      readme.includes("Zero runtime dependencies and zero test dependencies") &&
      readme.includes("No framework, package manager, or build step required") &&
      readme.includes("does not persist settings"),
    "README accurately documents independence, dependency/build status, and no persistence",
  );
  check(
    html.includes(
      'content="Pulsar is a focused visual CSS generator for Button, Card, Input, Flexbox, and Grid styles."',
    ),
    "Page metadata identifies all five generators",
  );

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
