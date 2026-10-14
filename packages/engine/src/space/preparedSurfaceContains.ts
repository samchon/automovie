import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";
import { footprintContains } from "./footprintContains";

/**
 * Query membership in an already prepared surface footprint.
 *
 * @evidence contracts/common.md#principled-implementation Delegation to footprintContains keeps the authored outer ring, holes and its declared rim convention; the prepared projection must still match the borrowed source.
 * @evidence contracts/common.md#clear-and-simple-design This prepared seam owns no second membership algorithm or convex representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hole interiors stay excluded and rim behavior comes from the ring owner; this is horizontal membership rather than a height or walkability test.
 * @evidence contracts/common.md#meaningful-documentation Documents XZ query coordinates, shared membership semantics and projection freshness as a caller prerequisite.
 * @evidence contracts/performance.md#efficient-algorithms E footprint edges take O(E) worst-case work and constant additional query storage, without rebuilding projections.
 * @evidence contracts/performance.md#reuse-equivalent-work Completed ring projections and areas remain available across independent queries; changed source geometry requires a new preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed preparation is not retained by this call and only a boolean escapes, with no task or host handle.
 * @author Samchon
 */
export const preparedSurfaceContains: (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
) => boolean = (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
): boolean => footprintContains(prepared.footprint, x, z);
