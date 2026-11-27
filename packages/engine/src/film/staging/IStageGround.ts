import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * One actor's window starts and world-ground locator.
 */
export interface IStageGround {
  /*
   * Exact shot-local changes to the set of eligible surfaces.
   */
  boundaries: readonly number[];

  /*
   * Explicitly authored scope starts in shot seconds.
   */
  windowStarts: readonly number[];

  /*
   * Index of the authored window active at a shot-local second.
   * Parameter time: The query in shot-local seconds.
   * Returns: The zero-based index of the last inclusive start.
   */
  indexAt: (time: number) => number;

  /*
   * The admitted world height, null for ungrounded and undefined for explicitly
   * suspended.
   * Parameter time: The query in shot-local seconds.
   * Parameter point: The world point in metres. XZ selects coverage, and Y ranks
   * overlapping surfaces.
   * Returns: The support height in world metres or the applicable absence
   * result.
   */
  at: (time: number, point: IAutoMovieVector3) => number | null | undefined;
}
