import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Refuse a three-dimensional construction vector whose `x`, `y` or `z` is not
 * a finite number, such as a path point, a polyhedron corner or a mesh
 * transform's translation or scale.
 *
 * The thrown message is `<label> must be finite`, naming the input before
 * any buffer is written.
 *
 * @param point Vector to admit.
 * @param label Path of the vector in the diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation `Number.isFinite` on each component rejects NaN and both infinities without coercion, the values that would make every derived position and normal meaningless.
 * @evidence contracts/common.md#clear-and-simple-design One shared admission for the polyhedron, loft, sweep and mesh transform operations, each passing its own label.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-finite component throws instead of being replaced or skipped.
 * @evidence contracts/common.md#meaningful-documentation States what is refused, the message shape, and that it runs before buffers are written.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Three component tests that short-circuit, allocating nothing on success.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every path point or corner is admitted once by the operation that reads it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads the vector and returns; no state survives the call.
 * @author Samchon
 */
export const finiteVector = (point: IAutoMovieVector3, label: string): void => {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  )
    throw new Error(`${label} must be finite`);
};
