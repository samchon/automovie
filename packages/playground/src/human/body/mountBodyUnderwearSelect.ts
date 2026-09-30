/**
 * Add the default-underwear selector to the editing panel and return it.
 *
 * The selector sits before the panel's first section heading, so it reads as
 * the top control of the editing fieldset. Its values are the document's
 * `underwear.style` (none, boxer briefs, sports bra and briefs); the panel
 * binds it to edits and refreshes it from the committed document. The
 * garment's anatomical cut and posed skin attachment belong to the package
 * builder, and this selector chooses the style only.
 *
 * @param dom The document that creates the elements.
 * @param editing The editing fieldset that receives the selector's row.
 */
export function mountBodyUnderwearSelect(
  dom: Document,
  editing: HTMLElement,
): HTMLSelectElement {
  const row = dom.createElement("div");
  row.className = "row";
  const label = dom.createElement("label");
  label.htmlFor = "body-underwear";
  label.textContent = "Default underwear";
  const select = dom.createElement("select");
  select.id = "body-underwear";
  select.innerHTML =
    '<option value="">None</option><option value="boxer-briefs">Boxer briefs</option><option value="bra-and-briefs">Sports bra and briefs</option>';
  row.append(label, select);
  editing.querySelector("h2")!.before(row);
  return select;
}
