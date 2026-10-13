import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Does a logical space bound a volume at all, in either spelling?
 *
 * A space that states none is a name — "the west wing" — and every consumer
 * treats that differently from an empty one: props are not refused inside it, a
 * sight line through it cannot be ruled out, a fluid lattice has nothing to be
 * outside of. Asking through this rather than through `cells.length` is what
 * keeps a shelled space from reading as unlocated.
 *
 * It tests that a spelling is present, not that it closes a volume: a space
 * whose only cells are unbounded still answers true.
 *
 * @evidence contracts/common.md#principled-implementation A space states a volume when it has at least one cell or a shell; the contract makes the two spellings exclusive, so testing either alone would read the other spelling as unlocated.
 * @evidence contracts/common.md#clear-and-simple-design One exported predicate that about ten consumers ask, instead of each testing `cells.length` and misreading a shelled space.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presence is tested, not closure, so a space with only unbounded cells still counts as stating a volume; no space kind is exempt.
 * @evidence contracts/common.md#meaningful-documentation States what a volume-less space is, how consumers treat it differently from an empty one, why to ask here instead of reading `cells.length`, and that presence rather than closure is tested.
 * @evidence contracts/performance.md#cost-and-resources Two field reads per call with no geometry evaluated, no allocation and no retained state.
 * @author Samchon
 */
export const builtSpaceStatesVolume = (space: IAutoMovieBuiltSpace): boolean =>
  space.cells.length !== 0 || space.shell !== undefined;
