const state = {
  activeGenerator: "button",
  generators: {
    button: {
      fontSize: 16,
      verticalPadding: 12,
      horizontalPadding: 24,
      borderRadius: 8,
      backgroundColor: "#4f46e5",
      textColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#4338ca",
    },
    card: {
      width: 320,
      padding: 24,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      textColor: "#18181b",
      borderWidth: 1,
      borderColor: "#e4e4e7",
    },
    input: {
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
    },
    flexbox: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexWrap: "nowrap",
      gap: 16,
    },
    grid: {
      columns: 3,
      rows: 2,
      columnGap: 16,
      rowGap: 16,
      justifyItems: "stretch",
      alignItems: "stretch",
    },
  },
};

const buttonNumericControls = {
  fontSize: {
    input: document.getElementById("font-size"),
    output: document.getElementById("font-size-output"),
    min: 10,
    max: 32,
  },
  verticalPadding: {
    input: document.getElementById("vertical-padding"),
    output: document.getElementById("vertical-padding-output"),
    min: 4,
    max: 32,
  },
  horizontalPadding: {
    input: document.getElementById("horizontal-padding"),
    output: document.getElementById("horizontal-padding-output"),
    min: 8,
    max: 64,
  },
  borderRadius: {
    input: document.getElementById("border-radius"),
    output: document.getElementById("border-radius-output"),
    min: 0,
    max: 32,
  },
  borderWidth: {
    input: document.getElementById("border-width"),
    output: document.getElementById("border-width-output"),
    min: 0,
    max: 8,
  },
};

const buttonColorControls = {
  backgroundColor: {
    input: document.getElementById("background-color"),
    output: document.getElementById("background-color-output"),
  },
  textColor: {
    input: document.getElementById("text-color"),
    output: document.getElementById("text-color-output"),
  },
  borderColor: {
    input: document.getElementById("border-color"),
    output: document.getElementById("border-color-output"),
  },
};

const cardNumericControls = {
  width: {
    input: document.getElementById("card-width"),
    output: document.getElementById("card-width-output"),
    min: 160,
    max: 640,
  },
  padding: {
    input: document.getElementById("card-padding"),
    output: document.getElementById("card-padding-output"),
    min: 0,
    max: 64,
  },
  borderRadius: {
    input: document.getElementById("card-border-radius"),
    output: document.getElementById("card-border-radius-output"),
    min: 0,
    max: 48,
  },
  borderWidth: {
    input: document.getElementById("card-border-width"),
    output: document.getElementById("card-border-width-output"),
    min: 0,
    max: 12,
  },
};

const cardColorControls = {
  backgroundColor: {
    input: document.getElementById("card-background-color"),
    output: document.getElementById("card-background-color-output"),
  },
  textColor: {
    input: document.getElementById("card-text-color"),
    output: document.getElementById("card-text-color-output"),
  },
  borderColor: {
    input: document.getElementById("card-border-color"),
    output: document.getElementById("card-border-color-output"),
  },
};

const inputNumericControls = {
  fontSize: {
    input: document.getElementById("input-font-size"),
    output: document.getElementById("input-font-size-output"),
    min: 10,
    max: 32,
  },
  verticalPadding: {
    input: document.getElementById("input-vertical-padding"),
    output: document.getElementById("input-vertical-padding-output"),
    min: 4,
    max: 32,
  },
  horizontalPadding: {
    input: document.getElementById("input-horizontal-padding"),
    output: document.getElementById("input-horizontal-padding-output"),
    min: 8,
    max: 64,
  },
  borderRadius: {
    input: document.getElementById("input-border-radius"),
    output: document.getElementById("input-border-radius-output"),
    min: 0,
    max: 32,
  },
  borderWidth: {
    input: document.getElementById("input-border-width"),
    output: document.getElementById("input-border-width-output"),
    min: 0,
    max: 8,
  },
  focusOutlineWidth: {
    input: document.getElementById("input-focus-outline-width"),
    output: document.getElementById("input-focus-outline-width-output"),
    min: 1,
    max: 6,
  },
  focusOutlineOffset: {
    input: document.getElementById("input-focus-outline-offset"),
    output: document.getElementById("input-focus-outline-offset-output"),
    min: 0,
    max: 8,
  },
};

const inputColorControls = {
  backgroundColor: {
    input: document.getElementById("input-background-color"),
    output: document.getElementById("input-background-color-output"),
  },
  textColor: {
    input: document.getElementById("input-text-color"),
    output: document.getElementById("input-text-color-output"),
  },
  borderColor: {
    input: document.getElementById("input-border-color"),
    output: document.getElementById("input-border-color-output"),
  },
  focusBorderColor: {
    input: document.getElementById("input-focus-border-color"),
    output: document.getElementById("input-focus-border-color-output"),
  },
  focusOutlineColor: {
    input: document.getElementById("input-focus-outline-color"),
    output: document.getElementById("input-focus-outline-color-output"),
  },
};

const flexboxEnumControls = {
  flexDirection: {
    input: document.getElementById("flex-direction"),
    allowedValues: ["row", "row-reverse", "column", "column-reverse"],
  },
  justifyContent: {
    input: document.getElementById("justify-content"),
    allowedValues: [
      "flex-start",
      "center",
      "flex-end",
      "space-between",
      "space-around",
      "space-evenly",
    ],
  },
  alignItems: {
    input: document.getElementById("align-items"),
    allowedValues: ["stretch", "flex-start", "center", "flex-end", "baseline"],
  },
  flexWrap: {
    input: document.getElementById("flex-wrap"),
    allowedValues: ["nowrap", "wrap", "wrap-reverse"],
  },
};

const flexboxNumericControls = {
  gap: {
    input: document.getElementById("flex-gap"),
    output: document.getElementById("flex-gap-output"),
    min: 0,
    max: 64,
  },
};

const gridNumericControls = {
  columns: {
    input: document.getElementById("grid-columns"),
    output: document.getElementById("grid-columns-output"),
    min: 1,
    max: 12,
    step: 1,
    integer: true,
    unit: "",
  },
  rows: {
    input: document.getElementById("grid-rows"),
    output: document.getElementById("grid-rows-output"),
    min: 1,
    max: 8,
    step: 1,
    integer: true,
    unit: "",
  },
  columnGap: {
    input: document.getElementById("grid-column-gap"),
    output: document.getElementById("grid-column-gap-output"),
    min: 0,
    max: 64,
    step: 1,
  },
  rowGap: {
    input: document.getElementById("grid-row-gap"),
    output: document.getElementById("grid-row-gap-output"),
    min: 0,
    max: 64,
    step: 1,
  },
};

const gridEnumControls = {
  justifyItems: {
    input: document.getElementById("grid-justify-items"),
    allowedValues: ["stretch", "start", "center", "end"],
  },
  alignItems: {
    input: document.getElementById("grid-align-items"),
    allowedValues: ["stretch", "start", "center", "end"],
  },
};

const previewButton = document.querySelector(".generated-button");
const previewCard = document.querySelector(".generated-card");
const previewInput = document.querySelector(".generated-input");
const previewFlexbox = document.querySelector(".generated-flexbox");
const previewGrid = document.querySelector(".generated-grid");
const generatedCode = document.getElementById("generated-css");
const outputFilename = document.querySelector(".output-toolbar-label");
const copyButton = document.getElementById("copy-css");
const copyStatus = document.getElementById("copy-status");
const generatorNameLabel = document.getElementById("generator-name");
const generatorOptions = document.querySelectorAll('input[name="generator"]');
const generatorControlViews = document.querySelectorAll(
  "[data-generator-controls]",
);
const generatorPreviewViews = document.querySelectorAll(
  "[data-generator-preview]",
);
let generatedCSS = "";
let latestCopyAttempt = 0;

function normalizeNumber(value, minimum, maximum, fallback, integer = false) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  if (
    integer &&
    number >= minimum &&
    number <= maximum &&
    !Number.isInteger(number)
  ) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, number));
}

function normalizeColor(value, fallback) {
  const color = String(value).trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function normalizeEnum(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function renderButtonPreview(buttonState) {
  previewButton.style.fontSize = `${buttonState.fontSize}px`;
  previewButton.style.padding = `${buttonState.verticalPadding}px ${buttonState.horizontalPadding}px`;
  previewButton.style.borderRadius = `${buttonState.borderRadius}px`;
  previewButton.style.backgroundColor = buttonState.backgroundColor;
  previewButton.style.color = buttonState.textColor;
  previewButton.style.borderWidth = `${buttonState.borderWidth}px`;
  previewButton.style.borderColor = buttonState.borderColor;
  previewButton.style.borderStyle = "solid";
}

function generateButtonCSS(buttonState) {
  return `.button {
  font-size: ${buttonState.fontSize}px;
  padding: ${buttonState.verticalPadding}px ${buttonState.horizontalPadding}px;
  border-radius: ${buttonState.borderRadius}px;
  background-color: ${buttonState.backgroundColor};
  color: ${buttonState.textColor};
  border: ${buttonState.borderWidth}px solid ${buttonState.borderColor};
}`;
}

function renderCardPreview(cardState) {
  previewCard.style.boxSizing = "border-box";
  previewCard.style.width = `${cardState.width}px`;
  previewCard.style.maxWidth = "100%";
  previewCard.style.padding = `${cardState.padding}px`;
  previewCard.style.borderRadius = `${cardState.borderRadius}px`;
  previewCard.style.backgroundColor = cardState.backgroundColor;
  previewCard.style.color = cardState.textColor;
  previewCard.style.borderWidth = `${cardState.borderWidth}px`;
  previewCard.style.borderColor = cardState.borderColor;
  previewCard.style.borderStyle = "solid";
}

function generateCardCSS(cardState) {
  return `.card {
  box-sizing: border-box;
  width: ${cardState.width}px;
  max-width: 100%;
  padding: ${cardState.padding}px;
  border-radius: ${cardState.borderRadius}px;
  background-color: ${cardState.backgroundColor};
  color: ${cardState.textColor};
  border: ${cardState.borderWidth}px solid ${cardState.borderColor};
}`;
}

function renderInputPreview(inputState) {
  previewInput.style.setProperty("--input-font-size", `${inputState.fontSize}px`);
  previewInput.style.setProperty("--input-padding-y", `${inputState.verticalPadding}px`);
  previewInput.style.setProperty("--input-padding-x", `${inputState.horizontalPadding}px`);
  previewInput.style.setProperty("--input-border-radius", `${inputState.borderRadius}px`);
  previewInput.style.setProperty("--input-background-color", inputState.backgroundColor);
  previewInput.style.setProperty("--input-text-color", inputState.textColor);
  previewInput.style.setProperty("--input-border-width", `${inputState.borderWidth}px`);
  previewInput.style.setProperty("--input-border-color", inputState.borderColor);
  previewInput.style.setProperty("--input-focus-border-color", inputState.focusBorderColor);
  previewInput.style.setProperty("--input-focus-outline-width", `${inputState.focusOutlineWidth}px`);
  previewInput.style.setProperty("--input-focus-outline-color", inputState.focusOutlineColor);
  previewInput.style.setProperty("--input-focus-outline-offset", `${inputState.focusOutlineOffset}px`);
}

function generateInputCSS(inputState) {
  return `.input {
  box-sizing: border-box;
  font: inherit;
  font-size: ${inputState.fontSize}px;
  padding: ${inputState.verticalPadding}px ${inputState.horizontalPadding}px;
  border-radius: ${inputState.borderRadius}px;
  background-color: ${inputState.backgroundColor};
  color: ${inputState.textColor};
  border: ${inputState.borderWidth}px solid ${inputState.borderColor};
}

.input:focus {
  border-color: ${inputState.focusBorderColor};
  outline: ${inputState.focusOutlineWidth}px solid ${inputState.focusOutlineColor};
  outline-offset: ${inputState.focusOutlineOffset}px;
}`;
}

function renderFlexboxPreview(flexboxState) {
  previewFlexbox.style.display = "flex";
  previewFlexbox.style.flexDirection = flexboxState.flexDirection;
  previewFlexbox.style.justifyContent = flexboxState.justifyContent;
  previewFlexbox.style.alignItems = flexboxState.alignItems;
  previewFlexbox.style.flexWrap = flexboxState.flexWrap;
  previewFlexbox.style.gap = `${flexboxState.gap}px`;
}

function generateFlexboxCSS(flexboxState) {
  return `.flexbox {
  display: flex;
  flex-direction: ${flexboxState.flexDirection};
  justify-content: ${flexboxState.justifyContent};
  align-items: ${flexboxState.alignItems};
  flex-wrap: ${flexboxState.flexWrap};
  gap: ${flexboxState.gap}px;
}`;
}

function renderGridPreview(gridState) {
  previewGrid.style.display = "grid";
  previewGrid.style.gridTemplateColumns = `repeat(${gridState.columns}, 1fr)`;
  previewGrid.style.gridTemplateRows = `repeat(${gridState.rows}, 1fr)`;
  previewGrid.style.columnGap = `${gridState.columnGap}px`;
  previewGrid.style.rowGap = `${gridState.rowGap}px`;
  previewGrid.style.justifyItems = gridState.justifyItems;
  previewGrid.style.alignItems = gridState.alignItems;

  const visibleCount = gridState.columns * gridState.rows;
  Array.from(previewGrid.children).forEach((item, index) => {
    item.hidden = index >= visibleCount;
  });
}

function generateGridCSS(gridState) {
  return `.grid {
  display: grid;
  grid-template-columns: repeat(${gridState.columns}, 1fr);
  grid-template-rows: repeat(${gridState.rows}, 1fr);
  column-gap: ${gridState.columnGap}px;
  row-gap: ${gridState.rowGap}px;
  justify-items: ${gridState.justifyItems};
  align-items: ${gridState.alignItems};
}`;
}

const generatorDefinitions = {
  button: {
    numericControls: buttonNumericControls,
    colorControls: buttonColorControls,
    renderPreview: renderButtonPreview,
    generateCSS: generateButtonCSS,
    outputFilename: "button.css",
  },
  card: {
    numericControls: cardNumericControls,
    colorControls: cardColorControls,
    renderPreview: renderCardPreview,
    generateCSS: generateCardCSS,
    outputFilename: "card.css",
  },
  input: {
    numericControls: inputNumericControls,
    colorControls: inputColorControls,
    renderPreview: renderInputPreview,
    generateCSS: generateInputCSS,
    outputFilename: "input.css",
  },
  flexbox: {
    numericControls: flexboxNumericControls,
    enumControls: flexboxEnumControls,
    renderPreview: renderFlexboxPreview,
    generateCSS: generateFlexboxCSS,
    outputFilename: "flexbox.css",
  },
  grid: {
    numericControls: gridNumericControls,
    enumControls: gridEnumControls,
    renderPreview: renderGridPreview,
    generateCSS: generateGridCSS,
    outputFilename: "grid.css",
  },
};

function renderActive() {
  const definition = generatorDefinitions[state.activeGenerator];
  const generatorState = state.generators[state.activeGenerator];

  if (!definition || !generatorState) {
    return;
  }

  definition.renderPreview(generatorState);

  Object.entries(definition.numericControls ?? {}).forEach(([property, control]) => {
    control.output.textContent = `${generatorState[property]}${control.unit ?? "px"}`;
  });

  Object.entries(definition.colorControls ?? {}).forEach(([property, control]) => {
    control.output.textContent = generatorState[property].toUpperCase();
  });

  Object.entries(definition.enumControls ?? {}).forEach(([property, control]) => {
    control.input.value = generatorState[property];
  });

  generatedCSS = definition.generateCSS(generatorState);
  generatedCode.textContent = generatedCSS;
  outputFilename.textContent = definition.outputFilename;
}

function renderStateEdit() {
  latestCopyAttempt += 1;
  copyStatus.textContent = "CSS ready to copy.";
  renderActive();
}

function updateWorkspaceVisibility(generatorName) {
  generatorControlViews.forEach((view) => {
    view.hidden = view.dataset.generatorControls !== generatorName;
  });

  generatorPreviewViews.forEach((view) => {
    view.hidden = view.dataset.generatorPreview !== generatorName;
  });
}

function switchGenerator(generatorName) {
  state.activeGenerator = generatorName;
  latestCopyAttempt += 1;
  updateWorkspaceVisibility(generatorName);
  generatorNameLabel.textContent = `${generatorName[0].toUpperCase()}${generatorName.slice(1)} generator`;

  copyButton.disabled = false;
  copyStatus.textContent = "CSS ready to copy.";
  renderActive();
}

function initializeGeneratorSelector() {
  generatorOptions.forEach((option) => {
    option.addEventListener("change", (event) => {
      if (event.currentTarget.checked) {
        switchGenerator(event.currentTarget.value);
      }
    });
  });
}

function initializeGeneratorControls(generatorName) {
  const definition = generatorDefinitions[generatorName];
  const generatorState = state.generators[generatorName];

  Object.entries(definition.numericControls ?? {}).forEach(([property, control]) => {
    control.input.value = generatorState[property];
    control.input.addEventListener("input", (event) => {
      const normalizedValue = normalizeNumber(
        event.currentTarget.value,
        control.min,
        control.max,
        generatorState[property],
        control.integer,
      );

      generatorState[property] = normalizedValue;
      event.currentTarget.value = normalizedValue;
      renderStateEdit();
    });
  });

  Object.entries(definition.colorControls ?? {}).forEach(([property, control]) => {
    control.input.value = generatorState[property];
    control.input.addEventListener("input", (event) => {
      const normalizedValue = normalizeColor(
        event.currentTarget.value,
        generatorState[property],
      );

      generatorState[property] = normalizedValue;
      event.currentTarget.value = normalizedValue;
      renderStateEdit();
    });
  });

  Object.entries(definition.enumControls ?? {}).forEach(([property, control]) => {
    control.input.value = generatorState[property];
    control.input.addEventListener("change", (event) => {
      const normalizedValue = normalizeEnum(
        event.currentTarget.value,
        control.allowedValues,
        generatorState[property],
      );

      generatorState[property] = normalizedValue;
      event.currentTarget.value = normalizedValue;
      renderStateEdit();
    });
  });
}

function copyWithFallback(text) {
  if (typeof document.execCommand !== "function") {
    return false;
  }

  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.value = text;
  temporaryTextArea.setAttribute("readonly", "");
  temporaryTextArea.style.position = "fixed";
  temporaryTextArea.style.opacity = "0";
  temporaryTextArea.style.pointerEvents = "none";
  document.body.appendChild(temporaryTextArea);

  try {
    temporaryTextArea.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    temporaryTextArea.remove();
    copyButton.focus();
  }
}

async function copyCurrentCSS() {
  const attempt = ++latestCopyAttempt;
  const cssToCopy = generatedCSS;
  let copied = false;

  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(cssToCopy);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    try {
      copied = copyWithFallback(cssToCopy);
    } catch {
      copied = false;
    }
  }

  if (attempt === latestCopyAttempt) {
    copyStatus.textContent = copied
      ? "CSS copied"
      : "Couldn't copy — select the CSS manually";
  }
}

initializeGeneratorControls("button");
initializeGeneratorControls("card");
initializeGeneratorControls("input");
initializeGeneratorControls("flexbox");
initializeGeneratorControls("grid");
initializeGeneratorSelector();
switchGenerator("button");
copyButton.addEventListener("click", copyCurrentCSS);
