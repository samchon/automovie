import { samplePortraitNasalSection } from "./samplePortraitNasalSection";

/**
 * Sample a closed ring of nasal envelope stations at a phase in `[0, 1)`.
 *
 * The phase selects the segment between two neighbouring stations, wrapping
 * past the end. Each station's derivative is the central difference of its two
 * neighbours (half the span between them), and the segment is sampled by
 * `samplePortraitNasalSection` at its own parameter. Shared by
 * `IPortraitNasalEnvelope` and `createPortraitNasalEnvelope`.
 *
 * @evidence contracts/common.md#principled-implementation A closed C1 curve through the stations is a cubic Hermite spline (samplePortraitNasalSection) whose end slopes are central differences (p[i+1]-p[i-1])/2 per unit index: this is the Catmull-Rom spline, which interpolates every station and is C1 across the wrap because neighbours are taken modulo the count. Its premises are at least three stations and a phase in [0,1); a phase below -1 is outside the wrap arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One function turns an ordered station ring and a phase into a point; the tangent rule is inline because no other caller needs it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a subject or fixture; the result depends only on the ring and the phase.
 * @evidence contracts/common.md#meaningful-documentation The comment states the phase meaning, the wrap, the tangent rule and its two consumers.
 * @evidence contracts/modeling.md#spatial-conventions Stations and result share the caller's frame and unit; the phase is dimensionless and no conversion happens here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal envelope owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives; it returns one value per call.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a human form; it is arithmetic on values the owner already named.
 */
export function sampleCyclicNasalSection(
  points: readonly number[][],
  phase: number,
): number[] {
  const at = phase * points.length,
    index = Math.floor(at),
    t = at - index;
  const p = (i: number) => points[(i + points.length) % points.length];
  return samplePortraitNasalSection(
    {
      point: p(index),
      derivative: p(index + 1).map((v, axis) => (v - p(index - 1)[axis]) / 2),
    },
    {
      point: p(index + 1),
      derivative: p(index + 2).map((v, axis) => (v - p(index)[axis]) / 2),
    },
    1,
    t,
  ).point;
}
