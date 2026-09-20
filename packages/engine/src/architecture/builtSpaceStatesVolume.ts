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
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtSpaceStatesVolume` answers "Does a logical space bound a volume at all, in either spelling?" This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtSpaceStatesVolume` performs declared-volume test when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const builtSpaceStatesVolume = (space: IAutoMovieBuiltSpace): boolean =>
  space.cells.length !== 0 || space.shell !== undefined;
