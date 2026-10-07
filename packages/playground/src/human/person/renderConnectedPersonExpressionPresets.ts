import type { IConnectedFaceExpressionPreset } from "../face/IConnectedFaceExpressionPreset";

/**
 * Append one button per expression preset; a click hands the preset's
 * expression to the panel, which commits it in one transaction.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Offers each expression preset as a button that changes expression, not identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Hands a clicked preset to the panel, which commits it in one transaction.
 * @author Samchon
 */
export function renderConnectedPersonExpressionPresets(
  dom: Document,
  container: HTMLElement,
  presets: readonly IConnectedFaceExpressionPreset[],
  apply: (expression: Record<string, number>) => void,
): void {
  for (const preset of presets) {
    const button = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = () => apply(structuredClone(preset.expression));
    container.append(button);
  }
}
