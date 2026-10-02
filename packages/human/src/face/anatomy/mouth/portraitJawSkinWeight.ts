/**
 * Smooth mandibular attachment across the observed oral band in millimetres.
 * A closed or inverted observation retains the four-mm transition used by
 * facial performance; the same field continues onto appended head tissue.
 *
 * @evidence contracts/common.md#principled-implementation The weight is the cubic smoothstep t^2 (3 - 2t) of the height below the observed upper lip over the lip-to-lip span, floored at four millimetres for a closed or inverted observation, so it rises from zero to one across the oral band with zero slope at both ends; that is why the mandibular field joins the fixed maxillary skin without a crease. Differences are checked for overflow before use.
 * @evidence contracts/common.md#clear-and-simple-design One function shared by the facial performance and the jaw continuation, which would otherwise carry two copies of the same field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four-millimetre floor is a documented numerical floor for a degenerate span and no subject or fixture is named.
 * @evidence contracts/common.md#meaningful-documentation The comment states the units, the closed-observation floor and that the same field continues onto appended tissue.
 * @evidence contracts/modeling.md#spatial-conventions Heights and the span are head-frame millimetres; the result is unitless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is a field and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries It is the one definition of where the mandibular field meets the fixed skin, shared by facial performance and the jaw continuation so both agree at the oral band; the join stays continuous while the observation's upper and lower lip heights are the same two values in both consumers.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity beyond finiteness.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function; it is evaluated from measured lip heights.
 */
export function portraitJawSkinWeight(
  y: number,
  upperY: number,
  lowerY: number,
): number {
  if (![y, upperY, lowerY].every(Number.isFinite))
    throw new Error("Jaw attachment heights must be finite millimetres.");
  const offset = upperY - y,
    span = Math.max(4, upperY - lowerY);
  if (![offset, span].every(Number.isFinite))
    throw new Error("Jaw attachment exceeds its finite coordinate domain.");
  const t = Math.max(0, Math.min(1, offset / span));
  return t * t * (3 - 2 * t);
}
