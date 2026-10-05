/**
 * One disabled control row: a label, a disabled number input and the named
 * reason it cannot be edited here. The person panel lists unavailable and
 * body-owned channels with it instead of hiding them.
 *
 * @author Samchon
 */
export function createConnectedPersonDisabledRow(dom: Document, id: string, reason: string): HTMLElement {
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
