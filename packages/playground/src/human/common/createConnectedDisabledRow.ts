/**
 * One disabled control row: a label, a disabled number input and the named
 * reason it cannot be edited here. The body and person panels list unavailable and
 * body-owned channels with it instead of hiding them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows an uneditable channel with its named reason instead of hiding it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Draws the disabled label, number and reason row the editors use for unavailable channels.
 * @author Samchon
 */
export function createConnectedDisabledRow(dom: Document, id: string, reason: string): HTMLElement {
  const row = dom.createElement("div");
  const label = dom.createElement("label");
  const input = dom.createElement("input");
  const note = dom.createElement("small");
  row.className = "row";
  label.textContent = id.replace(/([a-z])([A-Z])/gu, "$1 $2");
  input.type = "number";
  input.disabled = true;
  input.setAttribute("aria-label", label.textContent + " (not editable here)");
  note.textContent = reason;
  row.append(label, input, note);
  return row;
}
