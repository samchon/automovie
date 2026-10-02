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
 *
 * @evidence contracts/common.md#principled-implementation Finite numbers inside closed intervals are the exact admission of the record's documented ranges, and the 0.95 ceiling on observed closure is what keeps the reopening ratio (1 - blink) / (1 - observedBlink) finite, which the lid poser divides by.
 * @evidence contracts/common.md#clear-and-simple-design One guard over one record, shared by the lid poser, the optical poser and the upper-lid profile, so the ranges have one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is named after a subject or fixture and the function patches no other module; it tests numbers and throws.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the intervals, why the observed-closure ceiling exists, that the gaze bounds are engineering limits and not measured ductions, and what a violation does.
 * @evidence contracts/modeling.md#spatial-conventions Closure is a dimensionless fraction and gaze is in degrees relative to the observation, as each field of the record states; the function converts nothing.
 * @evidence contracts/anatomy.md#parametric-authority Every field is a named physiological motion (eyelid closure, gaze yaw, gaze pitch); none addresses a vertex or a curve.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function validates a record and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The channels of the performance are declared by the record type; this function tests values and defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing.
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
