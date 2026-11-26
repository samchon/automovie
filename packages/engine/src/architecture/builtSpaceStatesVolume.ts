import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Does a logical space bound a volume at all, in either spelling?
 *
 * A space with neither spelling is a semantic name, such as "the west wing".
 * Volume-dependent prop, visibility and fluid checks distinguish it from a
 * located region; using this query keeps shelled spaces from being mistaken for
 * unlocated ones.
 *
 * Tests presence, not closure or positive volume: a space whose only cells are
 * unbounded still answers true.
 *
 * @param space Logical space to classify.
 * @returns True when the space states at least one cell or a shell.
 */
export function builtSpaceStatesVolume(space: IAutoMovieBuiltSpace): boolean {
  return space.cells.length !== 0 || space.shell !== undefined;
}
