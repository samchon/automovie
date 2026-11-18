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
 * continuation a plan's knot track takes along its knots
 * (`AutoMovieMotionHumanBendTrack`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is continued, from what, and who reads it.
 * @evidence contracts/development/design.md#principled-representation A solve and the seed it continues; a solved candidate with its own seed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two steps, `walk` and `next`, read by the track.
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
  export type ISolved = Exclude<ReturnType<ReturnType<typeof AutoMovieMotionHumanBendSearch.continued>>, string>;

  /**
   * One allowed solve continued from a seed, walked while the refinement
   * stops at its bracket's end (the minimum lies beyond the step it may
   * move), at most a turn; none when it leaves the allowed places.
   *
   * @param solve The request.
   * @param seed The seed continued.
   * @returns The allowed candidate and its seed, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the walk, its bound and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Numerical continuation: the search's near refinement, restarted at its result while that result sits at the refinement's edge, so it follows the minimum it started beside.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation, then one loop of continued searches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate outside the allowed places is not returned; the walk is bounded by one turn of steps.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation a walk, then a refinement's probes a step walked, at most 360 / STEP steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every step searches the one request, so they share its prepared chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function walk(
    solve: IAutoMovieMotionHumanBend.ISolve,
    seed: IAutoMovieSwivelSeed,
  ): ISolved | null {
    return walked(AutoMovieMotionHumanBendSearch.continued(solve), seed);
  }

  /**
   * The next request of a sequence: continued from the last one's seed,
   * else solved cold; none where no place is allowed. A cold swivel is read
   * on the turn nearest the last seed's, so two seeds of one branch
   * interpolate the short way.
   *
   * @param solve The request.
   * @param last The last request's seed, or null for the first.

   * @returns The allowed candidate and its seed, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two modes, the turn alignment and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Continuation where it stays allowed, the cold sweep otherwise (the search's multiple initialisation), its swivel taken modulo a turn to the seed's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure `walk`, then the cold search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cold candidate outside the allowed places is not returned.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation, then a walk's refinements or one cold sweep.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The walk and the cold search share the request's one prepared chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function next(
    solve: IAutoMovieMotionHumanBend.ISolve,
    last: IAutoMovieSwivelSeed | null,
  ): ISolved | null {
    const search: ISearch = AutoMovieMotionHumanBendSearch.continued(solve);
    const kept: ISolved | null = last === null ? null : walked(search, last);
    if (kept !== null) return kept;
    const cold: ReturnType<ISearch> = search();
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

/** A request's prepared search (`AutoMovieMotionHumanBendSearch.continued`). */
type ISearch = ReturnType<typeof AutoMovieMotionHumanBendSearch.continued>;

/** The walk of `AutoMovieMotionHumanBendWalk.walk` on a prepared search. */
function walked(
  search: ISearch,
  seed: IAutoMovieSwivelSeed,
): AutoMovieMotionHumanBendWalk.ISolved | null {
  let near: IAutoMovieSwivelNear = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
  for (let step: number = 0; step * hingedArmSwivel.STEP <= 360; ++step) {
    const found: ReturnType<ISearch> = search(near);
    if (typeof found === "string") return null;
    const moved: number = Math.abs(found.seed.swivel - near.swivel);
    if (moved < hingedArmSwivel.STEP - hingedArmSwivel.RESOLUTION)
      return found.candidate.overshoot === 0 ? found : null;
    near = { ...found.seed, tolerance: hingedArmSwivel.RESOLUTION };
  }
  return null;
}