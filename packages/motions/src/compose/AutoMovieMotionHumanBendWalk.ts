import { hingedArmSwivel } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/**
 * An elbow search continued along a sequence of requests, each from the
 * seed of the one before (`AutoMovieMotionHumanBendSearch.continued`): the
 * continuation a time-ordered sequence of elbow requests takes, shared by a
 * plan's knot track (`AutoMovieMotionHumanBendTrack`) and a planner's goal
 * reads in time order (`AutoMovieMotionHumanBendScope`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is continued, from what, and who reads it.
 * @evidence contracts/development/design.md#principled-representation A solve and the seed it continues; a solved candidate with its own seed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two steps, `walk` and `next`, read by the track and the scope.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No candidate is kept: each step solves its own request.
 */
export namespace AutoMovieMotionHumanBendWalk {
  /**
   * A solved request: its candidate and the seed it was chosen at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the search's own result.
   * @evidence contracts/development/design.md#principled-representation The search's candidate and seed, unchanged.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An alias of the search's result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is added.
   */
  export type ISolved = Exclude<ReturnType<typeof AutoMovieMotionHumanBendSearch.continued>, string>;

  /**
   * One allowed solve continued from a seed, walked while the refinement
   * stops at its bracket's end (the minimum lies beyond the step it may
   * move), at most a turn; none when it leaves the allowed places.
   *
   * @param solve The request.
   * @param hang The `hang` preset's hint for an upright trunk at the origin.
   * @param seed The seed continued.
   * @returns The allowed candidate and its seed, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the walk, its bound and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Numerical continuation: the search's near refinement, restarted at its result while that result sits at the refinement's edge, so it follows the minimum it started beside.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of continued searches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate outside the allowed places is not returned; the walk is bounded by one turn of steps.
   * @evidence contracts/development/implementation.md#efficient-algorithms A refinement's probes a step walked, at most 360 / STEP steps.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each step solves its own request.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function walk(
    solve: IAutoMovieMotionHumanBend.ISolve,
    hang: Parameters<typeof AutoMovieMotionHumanBendSearch.continued>[1],
    seed: IAutoMovieSwivelSeed,
  ): ISolved | null {
    let near: IAutoMovieSwivelNear = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
    for (let walked: number = 0; walked * hingedArmSwivel.STEP <= 360; ++walked) {
      const found: ReturnType<typeof AutoMovieMotionHumanBendSearch.continued> =
        AutoMovieMotionHumanBendSearch.continued(solve, hang, near);
      if (typeof found === "string") return null;
      const moved: number = Math.abs(found.seed.swivel - near.swivel);
      if (moved < hingedArmSwivel.STEP - hingedArmSwivel.RESOLUTION)
        return found.candidate.overshoot === 0 ? found : null;
      near = { ...found.seed, tolerance: hingedArmSwivel.RESOLUTION };
    }
    return null;
  }

  /**
   * The next request of a sequence: continued from the last one's seed,
   * else solved cold; none where no place is allowed. A cold swivel is read
   * on the turn nearest the last seed's, so two seeds of one branch
   * interpolate the short way.
   *
   * @param solve The request.
   * @param hang The `hang` preset's hint for an upright trunk at the origin.
   * @param last The last request's seed, or null for the first.
   * @returns The allowed candidate and its seed, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two modes, the turn alignment and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Continuation where it stays allowed, the cold sweep otherwise (the search's multiple initialisation), its swivel taken modulo a turn to the seed's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure `walk`, then the cold search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cold candidate outside the allowed places is not returned.
   * @evidence contracts/development/implementation.md#efficient-algorithms A walk's refinements, or one cold sweep.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each request is solved.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function next(
    solve: IAutoMovieMotionHumanBend.ISolve,
    hang: Parameters<typeof AutoMovieMotionHumanBendSearch.continued>[1],
    last: IAutoMovieSwivelSeed | null,
  ): ISolved | null {
    const kept: ISolved | null = last === null ? null : walk(solve, hang, last);
    if (kept !== null) return kept;
    const cold: ReturnType<typeof AutoMovieMotionHumanBendSearch.continued> =
      AutoMovieMotionHumanBendSearch.continued(solve, hang);
    if (typeof cold === "string" || cold.candidate.overshoot !== 0) return null;
    return last === null || last.branch !== cold.seed.branch
      ? cold
      : {
          candidate: cold.candidate,
          seed: {
            branch: cold.seed.branch,
            swivel: cold.seed.swivel - 360 * Math.round((cold.seed.swivel - last.swivel) / 360),
          },
        };
  }
}
