import type { AutoMovieArchetypeQuadrupedRootRange } from "../AutoMovieArchetypeQuadrupedRootRange";

/*
 * Select one whole-body height from its simultaneous physical constraints.
 *
 * The gait's bob is a soft preferred displacement, not a separately imposed
 * vertical path. This explicit constrained trajectory keeps that preference
 * whenever feasible and otherwise chooses its nearest feasible height. Every
 * attachment receives this same root; no limb root or terminal target changes.
 * A representable interior is preferred to a numerical reach tangency.
 * Parameter range: The four-limb/body-floor intersection, metres.
 * Parameter preferred: The gait's soft vertical displacement, metres.
 * Parameter coordinateScale: Maximum coordinate/length magnitude used to form the
 * intersection, metres.
 * Returns: A finite shared root translation inside the original physical
 * interval.
 * For malformed or unrepresentable planning input.
 */
export function chooseQuadrupedBodyRoot(
  range: AutoMovieArchetypeQuadrupedRootRange.IRange,
  preferred: number,
  coordinateScale: number,
): number {
  if (range.minimum > range.maximum || !(coordinateScale > 0))
    throw new RangeError(
      "The quadruped body-root interval must be finite and ordered",
    );

  const roundoff: number =
    256 *
    Number.EPSILON *
    Math.max(
      1,
      coordinateScale,
      Math.abs(range.minimum),
      Math.abs(range.maximum),
    );
  const innerMinimum: number = range.minimum + roundoff;
  const innerMaximum: number = range.maximum - roundoff;
  const minimum: number =
    innerMinimum <= innerMaximum ? innerMinimum : range.minimum;
  const maximum: number =
    innerMinimum <= innerMaximum ? innerMaximum : range.maximum;
  return Math.max(minimum, Math.min(maximum, preferred));
}
