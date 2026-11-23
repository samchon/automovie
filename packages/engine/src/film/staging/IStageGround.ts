import type { IAutoMovieVector3 } from "@automovie/interface";

/** One actor's window starts and world-ground locator. */
export interface IStageGround {
  /** Exact shot-local changes to the set of eligible surfaces. */
  boundaries: readonly number[];

  /** Explicitly authored scope starts in shot seconds. */
  windowStarts: readonly number[];

  /**
   * Index of the authored window active at a shot-local second.
   *
   * @param time The query in shot-local seconds.
   * @returns The zero-based index of the last inclusive start.
   */
  indexAt: (time: number) => number;

  /**
   * The admitted world height, null for ungrounded and undefined for explicitly
   * suspended.
   *
   * @param time The query in shot-local seconds.
   * @param point The world point in metres. XZ selects coverage, and Y ranks
   *   overlapping surfaces.
   * @returns The support height in world metres or the applicable absence
   *   result.
   */
  at: (time: number, point: IAutoMovieVector3) => number | null | undefined;
}
