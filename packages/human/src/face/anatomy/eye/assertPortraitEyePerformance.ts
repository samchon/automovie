import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";

/**
 * Admit eye performance independently of a mesh or an editor's slider ranges.
 *
 * Closure is a fraction in [0,1] and the closure already present in the
 * observation is in [0,0.95]; gaze yaw is within 50 degrees and pitch within
 * 40 degrees of the observed gaze. Every field must be finite. The limit on
 * the observation keeps the neutral aperture recoverable, because a fully
 * closed observation carries no aperture height to reopen. The gaze bounds
 * are engineering limits of the rigid optical rotation and not measured
 * ocular ductions, and the check reads the performance without changing it.
 * A violation throws one message naming both rules.
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
