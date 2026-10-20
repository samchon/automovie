import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Is the space's stated volume a single convex region?
 *
 * A caller deciding one rectangle against a convex region only has to test its corners; against anything else the middle can fall through a notch, a void, or the gap between two cells. This answers which of the two it is holding, so the cheap test is taken exactly when it is exact.
 *
 * Only a celled space with exactly one cell answers true. A shell answers false even when its triangles happen to bound a convex solid, and so does a space that states no volume.
 *
 * @param space Logical space whose stated volume is classified.
 * @returns True only for a shell-less space with exactly one cell.
 *
 * @evidence contracts/common.md#principled-implementation An intersection of half-spaces is convex by construction, so one cell is convex without inspecting its planes; a shell is not tested for convexity and answers false, which only costs a caller the cheap test and never makes it wrong.
 * @evidence contracts/common.md#clear-and-simple-design One expression over the two volume spellings, so callers branch on this answer instead of reading `cells` and `shell` themselves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; the conservative false for a convex shell is the stated contract, not an exception.
 * @evidence contracts/common.md#meaningful-documentation States why a caller asks, the one true case, and that a convex shell and a volume-less space answer false.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reads whether a shell is present and the cell count, O(1), so no algorithm or structure is chosen.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers for one space value at a time and computes nothing a later convexity question could share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Creates no object and keeps no reference to the space once it returns its boolean.
 */
export const builtSpaceIsConvex: (space: IAutoMovieBuiltSpace) => boolean = (
  space: IAutoMovieBuiltSpace,
): boolean => space.shell === undefined && space.cells.length === 1;
