import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Does a logical space bound a volume at all, in either spelling?
 *
 * A space with neither spelling is a semantic name, such as "the west wing". Volume-dependent prop, visibility and fluid checks distinguish it from a located region; using this query keeps shelled spaces from being mistaken for unlocated ones.
 *
 * Tests presence, not closure or positive volume: a space whose only cells are unbounded still answers true.
 *
 * @param space Logical space to classify.
 * @returns True when the space states at least one cell or a shell.
 *
 * @evidence contracts/common.md#principled-implementation Presence of either authored spelling, a non-empty `cells` list or a `shell`, is the contract's definition of a located space; closure is deliberately not tested, which the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One expression shared by every consumer that must tell a named region from a located one, so none of them reads only `cells`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; an unbounded cell still counts because the test is about a stated spelling, not a measured volume.
 * @evidence contracts/common.md#meaningful-documentation States what an unlocated space means to consumers, why both spellings are read, and that closure is not checked.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Checks the cell list length and the shell field, O(1), leaving nothing to optimize.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads two fields of one supplied space and coordinates no equivalent multi-consumer work; no cross-call cache is retained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds no state, handle or task; the space passed in is only read.
 * @author Samchon
 */
export const builtSpaceStatesVolume: (space: IAutoMovieBuiltSpace) => boolean = (space: IAutoMovieBuiltSpace): boolean =>
  space.cells.length !== 0 || space.shell !== undefined;
