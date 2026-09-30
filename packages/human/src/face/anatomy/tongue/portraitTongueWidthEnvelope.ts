/**
 * The transverse half-width of a lingual ring as a fraction of the body's
 * semiaxis, at longitudinal station `v` from the tip (zero) to the root (one).
 *
 * It is the outline of an ellipse, `sqrt(1 - (1 - 2v)^2)`: one at mid-body, so
 * the authored half-width is the mid-body semiaxis, and falling as the square
 * root of the distance from either end, so the tip is rounded. A sine envelope
 * would taper linearly to a point and draw the tongue in dorsal view as a
 * lemon; the tongue's apex is blunt, and the root pole is only a closure of the
 * volume. The vertical extent keeps its own envelope in the builder, so the
 * tip stays thin from above and below while the plan outline stays round.
 *
 * @evidence contracts/common.md#principled-implementation The ellipse outline sqrt(1 - (1 - 2v)^2) is one at mid-body, zero at both ends and rises as a square root from either end, which is the rounded end of an ellipse; the sine envelope it replaces tapers linearly to a point. It is clamped at zero against rounding just outside [0, 1].
 * @evidence contracts/common.md#clear-and-simple-design One function read by the builder for the plan outline; the thickness keeps its own envelope in the builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the envelope is the analytic ellipse and not a curve tuned to a picture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the formula, why the tip is rounded and why the thickness has a separate envelope.
 * @evidence contracts/modeling.md#spatial-conventions The argument is a unitless station and the result a fraction of the authored half-width.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is an envelope and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 * @author Samchon
 */
export const portraitTongueWidthEnvelope = (v: number): number =>
  Math.sqrt(Math.max(0, 1 - (1 - 2 * v) ** 2));
