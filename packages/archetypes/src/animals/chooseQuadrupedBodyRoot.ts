import type { AutoMovieArchetypeQuadrupedRootRange } from "./AutoMovieArchetypeQuadrupedRootRange";

/**
 * Select one whole-body height from its simultaneous physical constraints.
 *
 * The gait's bob is a soft preferred displacement, not a separately imposed
 * vertical path. This explicit constrained trajectory keeps that preference
 * whenever feasible and otherwise chooses its nearest feasible height. Every
 * attachment receives this same root; no limb root or terminal target changes.
 * A representable interior is preferred to a numerical reach tangency.
 *
 * @param range The actual four-limb/body-floor intersection, metres.
 * @param preferred The gait's soft vertical displacement, metres.
 * @param coordinateScale Maximum actual coordinate/length magnitude used to form the intersection, metres.
 * @returns A finite shared root translation inside the original physical interval.
 * @throws {RangeError} For malformed or unrepresentable planning input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the one explicit body trajectory from hard horizontal course placement, unchanged terminal goals and prohibited per-limb root projection; states soft preference and binary64 interior ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Minimize displacement from the declared soft bob over the simultaneous feasible interval. Erode only by a coordinate-scaled arithmetic budget when an interior exists, leaving a narrower exact interval unchanged rather than widening its physical domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit finite ordered bounds, derive a numerical interior and select the nearest point to the soft preference in that interval.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No physical tolerance, anatomical coefficient, species case, cached prior sample or altered foot goal makes an impossible interval feasible. This is the declared whole-body height policy, not a hidden modification of an authored hard root path.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of scalar operations chooses one height; no iterative root search, physical simulation, sampling loop or trajectory cache is introduced.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the common four-limb intersection without recomputing reach or duplicating the exact limb solver.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no model, sample, buffer, callback or external resource.
 */
export function chooseQuadrupedBodyRoot(
  range: AutoMovieArchetypeQuadrupedRootRange.IRange,
  preferred: number,
  coordinateScale: number,
): number {
  if (
    ![range.minimum, range.maximum, preferred, coordinateScale].every(
      Number.isFinite,
    ) ||
    range.minimum > range.maximum ||
    !(coordinateScale > 0)
  )
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
