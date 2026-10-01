import { JSDOM } from "jsdom";

/**
 * Local in-memory elements for the inspection-light component's event contract.
 * The fixture neither installs window globals nor loads a page or filesystem.
 * Each caller owns its document, input values and dispatched local DOM events.
 */
export function createHumanViewerLightControlFixture() {
  const dom = new JSDOM();
  const document = dom.window.document;
  const form = document.createElement("form");
  const name = document.createElement("select");
  const components: [HTMLInputElement, HTMLInputElement, HTMLInputElement] = [document.createElement("input"), document.createElement("input"), document.createElement("input")];
  const reset = document.createElement("button");
  const error = document.createElement("span");
  return { form, name, components, reset, error, window: dom.window };
}
