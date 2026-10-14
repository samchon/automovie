import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * Refuse a two-dimensional construction point whose `x` or `y` is not a
 * finite number, such as a profile corner or a wall opening's origin.
 *
 * The thrown message is `<label> must be finite`, so the author learns which
 * corner of which input failed before any geometry is emitted.
 *
 * @param point Point in the builder's construction plane, in metres.
 * @param label Path of the point in the diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation `Number.isFinite` rejects NaN and both infinities without coercing, which is exactly the set of values that would poison every later position.
 * @evidence contracts/common.md#clear-and-simple-design One shared admission for the profile, region and wall builders, each passing its own label for the point it checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-finite coordinate throws rather than being replaced by zero or skipped.
 * @evidence contracts/common.md#meaningful-documentation States what is refused, the message shape, and that it runs before geometry is emitted.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed pair of finiteness tests per point, with nothing to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each authored profile corner is admitted exactly once by its builder.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps no reference to the point; a refusal allocates only its error.
 * @author Samchon
 */
export const finitePoint = (
  point: IAutoMovieProfilePoint,
  label: string,
): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new Error(`${label} must be finite`);
};
