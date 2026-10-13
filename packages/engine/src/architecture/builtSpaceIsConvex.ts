import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Is the space's stated volume a single convex region?
 *
 * A caller deciding one rectangle against a convex region only has to test its
 * corners; against anything else the middle can fall through a notch, a void,
 * or the gap between two cells. This answers which of the two it is holding, so
 * the cheap test is taken exactly when it is exact.
 *
 * Only a celled space with exactly one cell answers true. A shell answers false
 * even when its triangles happen to bound a convex solid, and so does a space
 * that states no volume.
 *
 * @evidence contracts/common.md#principled-implementation True only for a celled space with one cell, since a single cell is convex by contract while a shell may carry notches or voids the record does not rule out.
 * @evidence contracts/common.md#clear-and-simple-design A single boolean expression over the two volume fields, used by `validateWaterFeatures` to choose the corner-only test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A convex shell answers false, a conservative choice that sends it down the exact path instead of inspecting its triangles; no space id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what a caller decides with the answer, why corner tests are exact only on a convex region, and the shell and volume-less cases that answer false.
 * @evidence contracts/performance.md#cost-and-resources Constant time: one field test and one length comparison with no geometry inspected, nothing allocated and nothing retained.
 * @author Samchon
 */
export const builtSpaceIsConvex = (space: IAutoMovieBuiltSpace): boolean =>
  space.shell === undefined && space.cells.length === 1;
