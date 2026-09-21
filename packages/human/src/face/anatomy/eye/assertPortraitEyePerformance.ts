import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";

/**
 * Admit eye performance independently of a mesh or an editor's slider ranges.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Refuses unsupported closure and gaze inputs before constructing posed tissues.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Keeps observed closure invertible and current performance finite.
 */
export function assertPortraitEyePerformance(
  input: IPortraitEyePerformance,
): void {
  if (
    ![input.blink, input.observedBlink, input.yaw, input.pitch].every(
      Number.isFinite,
    ) ||
    input.blink < 0 ||
    input.blink > 1 ||
    input.observedBlink < 0 ||
    input.observedBlink > 0.95 ||
    Math.abs(input.yaw) > 50 ||
    Math.abs(input.pitch) > 40
  )
    throw new Error(
      "Eye performance needs finite closure and supported gaze differences; a fully closed observation cannot define neutral lids.",
    );
}
