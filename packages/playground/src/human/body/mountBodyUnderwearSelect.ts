/**
 * Add the default-underwear selector to the editing panel and return it.
 *
 * The selector sits before the panel's first section heading, so it reads as the top control of the editing fieldset. Its values are the document's `underwear.style` (none, boxer briefs, sports bra and briefs); the panel binds it to edits and refreshes it from the committed document. The garment's anatomical cut and posed skin attachment belong to the package builder, and this selector chooses the style only.
 *
 * @evidence contracts/common.md#principled-implementation The selector uses the body document's closed underwear styles and an empty value for omission, while actual garment geometry and skin attachment remain numerical-builder responsibilities.
 * @evidence contracts/common.md#clear-and-simple-design This mount creates one selection row and returns its native control; the panel owns event binding, document edits and committed-state refresh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed options mirror supported garment styles and do not add a fixture-specific body, geometry or anatomical parameter.
 * @evidence contracts/common.md#meaningful-documentation The comment states supported choices, top-fieldset placement and the separation between style selection and numerical garment construction.
 * @evidence contracts/performance.md#efficient-algorithms One row with a label and three fixed options is created in constant work and storage; finding the first heading scans only the supplied editing subtree as needed for placement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Underwear control acquisition is a mount effect and is not shared across separate document containers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The editing container owns the inserted row until panel retirement; this function registers no listener and opens no GPU or numerical resource.
 *
 * @param dom The document that creates the elements.
 * @param editing The editing fieldset that receives the selector's row.
 */
export function mountBodyUnderwearSelect(
  dom: Document,
  editing: HTMLElement,
): HTMLSelectElement {
  const row: HTMLDivElement = dom.createElement("div");
  row.className = "row";
  const label: HTMLLabelElement = dom.createElement("label");
  label.htmlFor = "body-underwear";
  label.textContent = "Default underwear";
  const select: HTMLSelectElement = dom.createElement("select");
  select.id = "body-underwear";
  select.innerHTML =
    '<option value="">None</option><option value="boxer-briefs">Boxer briefs</option><option value="bra-and-briefs">Sports bra and briefs</option>';
  row.append(label, select);
  editing.querySelector("h2")!.before(row);
  return select;
}
