import { AutoMovieEngineHingedArmSwivel } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/*
 * An elbow search continued along a sequence of requests, each from the seed of
 * the one before (`AutoMovieMotionHumanBendSearch.continued`): the continuation
 * a plan's knot track takes along its knots (`motionHumanBendTrack`).
 */
export namespace AutoMovieMotionHumanBendWalk {
  /*
   * A solved request: its candidate and the seed it was chosen at.
   */
  export type ISolved = Exclude<
    ReturnType<ReturnType<typeof AutoMovieMotionHumanBendSearch.continued>>,
    string
  >;

  /*
   * One allowed solve continued from a seed, walked while the refinement stops
   * at its bracket's end (the minimum lies beyond the step it may move), at
   * most a turn; none when it leaves the allowed places.
   * Parameter solve: The request.
   * Parameter seed: The seed continued.
   * Returns: The allowed candidate and its seed, or null.
   */
  export function walk(
    solve: IAutoMovieMotionHumanBend.ISolve,
    seed: IAutoMovieSwivelSeed,
  ): ISolved | null {
    return walked(AutoMovieMotionHumanBendSearch.continued(solve), seed);
  }

  /*
   * The next request of a sequence: continued from the last one's seed, else
   * solved cold; none where no place is allowed. A cold swivel is read on the
   * turn nearest the last seed's, so two seeds of one branch interpolate the
   * short way.
   * Parameter solve: The request.
   * Parameter last: The last request's seed, or null for the first.
   * Returns: The allowed candidate and its seed, or null.
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
            swivel:
              cold.seed.swivel -
              360 * Math.round((cold.seed.swivel - last.swivel) / 360),
          },
        };
  }
}

/*
 * A request's prepared search (`AutoMovieMotionHumanBendSearch.continued`).
 */
type ISearch = ReturnType<typeof AutoMovieMotionHumanBendSearch.continued>;

/*
 * The walk of `AutoMovieMotionHumanBendWalk.walk` on a prepared search.
 */
function walked(
  search: ISearch,
  seed: IAutoMovieSwivelSeed,
): AutoMovieMotionHumanBendWalk.ISolved | null {
  let near: IAutoMovieSwivelNear = {
    ...seed,
    tolerance: AutoMovieEngineHingedArmSwivel.RESOLUTION,
  };
  for (let step: number = 0; step * AutoMovieEngineHingedArmSwivel.STEP <= 360; ++step) {
    const found: ReturnType<ISearch> = search(near);
    if (typeof found === "string") return null;
    const moved: number = Math.abs(found.seed.swivel - near.swivel);
    if (moved < AutoMovieEngineHingedArmSwivel.STEP - AutoMovieEngineHingedArmSwivel.RESOLUTION)
      return found.candidate.overshoot === 0 ? found : null;
    near = { ...found.seed, tolerance: AutoMovieEngineHingedArmSwivel.RESOLUTION };
  }
  return null;
}
