/**
 * One disabled control row: a label, a disabled number input and the named reason it cannot be edited here. The body and person panels list unavailable and body-owned channels with it instead of hiding them.
 *
 * @evidence contracts/common.md#principled-implementation A disabled numeric input and explicit source reason express uneditable reach while metadata enters DOM text nodes rather than interpreted HTML.
 * @evidence contracts/common.md#clear-and-simple-design One DOM producer supplies the shared unavailable-row presentation without owning search, grouping or document transactions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing controls are named and disabled rather than hidden or replaced by guessed numerical values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the disabled number field, named reason and body/person consumers that retain visible limitations.
 * @evidence contracts/performance.md#efficient-algorithms Construction creates a fixed four DOM elements and formats l id and reason characters in O(l) time and storage, independent of body mesh size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller needs a distinct row node for its container; the producer shares no numerical result or mutable DOM instance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned row transfers DOM ownership to the caller and acquires no event listener, timer or GPU handle.
 */
export function createConnectedDisabledRow(
  dom: Document,
  id: string,
  reason: string,
): HTMLElement {
  const row: HTMLDivElement = dom.createElement("div");
  const label: HTMLLabelElement = dom.createElement("label");
  const input: HTMLInputElement = dom.createElement("input");
  const note: HTMLElement = dom.createElement("small");
  row.className = "row";
  label.textContent = id.replace(/([a-z])([A-Z])/gu, "$1 $2");
  input.type = "number";
  input.disabled = true;
  input.setAttribute("aria-label", label.textContent + " (not editable here)");
  note.textContent = reason;
  row.append(label, input, note);
  return row;
}
