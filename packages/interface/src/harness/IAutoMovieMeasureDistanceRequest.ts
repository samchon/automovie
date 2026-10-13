import { IAutoMovieDistanceTarget } from "./IAutoMovieDistanceTarget";

/**
 * Asks for the world distance between two targets at the current staging, the
 * raw range check behind blocking decisions such as whether a pursuer is close
 * enough to lunge.
 *
 * No source in this repository answers this request: `readSlateContext`
 * excludes it by type, and no resolver or tool surface accepts it. Each
 * endpoint is a staged node, a literal point or a group, the kinds the engine's
 * `resolveTargetPoint` already maps to one world point without a rig or shot
 * clock, so a resolver would measure between two such points.
 *
 * @evidence contracts/common.md#principled-implementation A record of the question only, two endpoints restricted by type to the kinds `resolveTargetPoint` places, so the intended answer is the Euclidean distance between two resolved world points.
 * @evidence contracts/common.md#clear-and-simple-design Two endpoints of one shared alias, `IAutoMovieDistanceTarget`, so both ends accept the same kinds and the record holds no time or beat it would not use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states that nothing answers the request, and bone and relative targets are excluded by type instead of being answered with a guessed point.
 * @evidence contracts/common.md#meaningful-documentation States the question, that nothing answers it, which endpoint kinds are admitted and through which function they would resolve; members name the two endpoints.
 * @author Samchon
 */
export interface IAutoMovieMeasureDistanceRequest {
  /** Selects the spatial distance query. */
  type: "measureDistance";

  /** First endpoint of the measured segment. */
  from: IAutoMovieDistanceTarget;

  /** Second endpoint of the measured segment. */
  to: IAutoMovieDistanceTarget;
}
