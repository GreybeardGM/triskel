import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  // Klassen mit Typen verknüpfen
  CONFIG.Actor.documentClass = TriskelActor;
  CONFIG.Actor.sheetClasses.character = PlayerCharacterSheet;

  // Sheets registrieren
  Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"],
    label: "Player Character"
  });

  // L<abens für Typen
  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: "Player Character"
  };

  Handlebars.registerHelper("numberInput", function(options = {}) {
    const hash = options?.hash ?? {};
    const {
      name = "",
      value = 0,
      containerClass = "",
      inputClass = "",
      min,
      max,
      step = 1,
      placeholder,
      disabled,
      readonly,
      attributes = {},
      data = {},
      field = name
    } = hash;

    const escape = Handlebars.escapeExpression;
    const containerClasses = ["number-stepper", containerClass].filter(Boolean).join(" ");
    const inputClasses = ["number-stepper__input", inputClass].filter(Boolean).join(" ");

    const attrParts = [
      "type=\"number\"",
      `class=\"${escape(inputClasses)}\"`,
      `step=\"${escape(step)}\"`,
      "data-dtype=\"Number\""
    ];

    if (name) attrParts.push(`name=\"${escape(name)}\"`);

    const numericValue = Number(value);
    const displayValue = Number.isFinite(numericValue) ? numericValue : (value ?? "");
    attrParts.push(`value=\"${escape(displayValue)}\"`);

    if (min !== undefined && min !== null) attrParts.push(`min=\"${escape(min)}\"`);
    if (max !== undefined && max !== null) attrParts.push(`max=\"${escape(max)}\"`);
    if (placeholder !== undefined && placeholder !== null) attrParts.push(`placeholder=\"${escape(placeholder)}\"`);
    if (disabled) attrParts.push("disabled");
    if (readonly) attrParts.push("readonly");

    for (const [attr, attrValue] of Object.entries(attributes ?? {})) {
      if (attrValue === undefined || attrValue === null || attrValue === false) continue;
      if (attrValue === true) {
        attrParts.push(attr);
        continue;
      }
      attrParts.push(`${attr}=\"${escape(attrValue)}\"`);
    }

    const dataAttrs = [];
    for (const [key, dataValue] of Object.entries(data ?? {})) {
      if (dataValue === undefined || dataValue === null || dataValue === false) continue;
      const dashedKey = foundry.utils.slugify(key, { replacement: "-" });
      if (dataValue === true) {
        dataAttrs.push(`data-${dashedKey}`);
        continue;
      }
      dataAttrs.push(`data-${dashedKey}=\"${escape(dataValue)}\"`);
    }

    const i18n = globalThis.game?.i18n;
    const buttonMarkup = [
      {
        action: "decrementNumberInput",
        label: "-",
        extraClass: "number-stepper__button--decrement",
        aria: i18n?.localize?.("TRISKEL.Stepper.Decrement") ?? "Decrease value"
      },
      {
        action: "incrementNumberInput",
        label: "+",
        extraClass: "number-stepper__button--increment",
        aria: i18n?.localize?.("TRISKEL.Stepper.Increment") ?? "Increase value"
      }
    ]
      .map(({ action, label, extraClass, aria }) => {
        const buttonClass = ["number-stepper__button", extraClass].filter(Boolean).join(" ");
        return `<button type=\"button\" class=\"${escape(buttonClass)}\" data-action=\"${action}\" aria-label=\"${escape(aria)}\">${escape(label)}</button>`;
      });

    const inputAttrs = attrParts.concat(dataAttrs).join(" ");
    const fieldAttr = field ? ` data-field=\"${escape(field)}\"` : "";
    const input = `<input ${inputAttrs} />`;
    const [decrementButton, incrementButton] = buttonMarkup;
    const html = `<div class=\"${escape(containerClasses)}\" data-number-input${fieldAttr}>${decrementButton}${input}${incrementButton}</div>`;

    return new Handlebars.SafeString(html);
  });
});
