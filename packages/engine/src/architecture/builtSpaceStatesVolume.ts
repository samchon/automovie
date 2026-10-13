import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Does a logical space bound a volume at all, in either spelling?
 *
 * A space that states none is a name, such as "the west wing", and every
 * consumer treats that differently from an empty one: props are not refused
 * inside it, a sight line through it cannot be ruled out, a fluid lattice has
 * nothing to be outside of. Asking through this rather than through
 * `cells.length` is what keeps a shelled space from reading as unlocated.
 *
 * It tests that a spelling is present, not that it closes a volume: a space
 * whose only cells are unbounded still answers true.
 *
 * @param space Logical space to classify.
 * @returns True when the space states at least one cell or a shell.
 *
 * @evidence contracts/common.md#principled-implementation Presence of either authored spelling, a non-empty `cells` list or a `shell`, is the contract's definition of a located space; closure is deliberately not tested, which the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One expression shared by every consumer that must tell a named region from a located one, so none of them reads only `cells`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; an unbounded cell still counts because the test is about a stated spelling, not a measured volume.
 * @evidence contracts/common.md#meaningful-documentation States what an unlocated space means to consumers, why both spellings are read, and that closure is not checked.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Checks the cell list length and the shell field, O(1), leaving nothing to optimize.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each consumer asks it about one space when deciding how to treat it, and the answer costs less than any cache lookup would.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds no state, handle or task; the space passed in is only read.
 * @author Samchon
 */
export const builtSpaceStatesVolume = (space: IAutoMovieBuiltSpace): boolean =>
  space.cells.length !== 0 || space.shell !== undefined;
