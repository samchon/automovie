import type { IConnectedFaceExpressionPreset } from "../face/IConnectedFaceExpressionPreset";

/**
 * Append one button per expression preset. A click hands an independent expression map to the panel's ordinary editing transaction; that transaction determines accepted history versus a labelled construction draft.
 *
 * @evidence contracts/common.md#principled-implementation structuredClone gives the editing callback an independent map so mutation cannot alter the supplied preset; values retain their authored precision.
 * @evidence contracts/common.md#clear-and-simple-design Each button uses the existing apply callback, leaving model construction, admission and publication to the panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A preset click is not evidence of successful admission or accepted history, and no fixture-specific expression is substituted.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes map ownership from the panel's publication classification.
 * @evidence contracts/performance.md#efficient-algorithms Rendering is O(p) buttons for p presets; a click copies O(c) expression entries for the selected preset before invoking the panel's construction work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each click is a new authored edit with its own mutable map and intent; this renderer caches no numerical build or transaction result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The container retains p buttons and callbacks borrowing presets/apply until its DOM is removed. There is no renderer-local teardown or in-flight request cap; the panel owns the invoked editing work.
 *
 * @author Samchon
 */
export function renderConnectedPersonExpressionPresets(
  dom: Document,
  container: HTMLElement,
  presets: readonly IConnectedFaceExpressionPreset[],
  apply: (expression: Record<string, number>) => void,
): void {
  for (const preset of presets) {
    const button: HTMLButtonElement = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = (): void => apply(structuredClone(preset.expression));
    container.append(button);
  }
}
