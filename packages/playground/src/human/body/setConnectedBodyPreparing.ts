/**
 * Name, or stop naming, one part of the body editor that is still preparing.
 *
 * The head view and the whole-person reader behind the simple tier take tens
 * of seconds to load in their workers; until they answer, the head seat and
 * the simple inputs are empty. The `#body-preparing` line names each part
 * still preparing, so an empty slot reads as loading rather than as a fault,
 * and empties itself when nothing is left. A page without the line ignores
 * the call.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor States which editor parts are still loading instead of leaving them silently empty.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows a named preparing state for the head and simple tier.
 * @author Samchon
 */
export function setConnectedBodyPreparing(dom: Document, part: string, active: boolean): void {
  const line = dom.querySelector<HTMLElement>("#body-preparing");
  if (line === null) return;
  const parts = new Set((line.dataset.parts ?? "").split("\n").filter((one) => one !== ""));
  if (active) parts.add(part);
  else parts.delete(part);
  line.dataset.parts = [...parts].join("\n");
  line.textContent = parts.size === 0 ? "" : "Preparing: " + [...parts].join("; ") + "…";
  line.hidden = parts.size === 0;
}
