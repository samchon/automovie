import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedSteering } from "./IHumanFaceHairRootedSteering";

/**
 * Construction-turn input reusing the rooted steering's preceding direction.
 *
 * @evidence contracts/common.md#principled-implementation Previous and requested unit directions plus nominal construction length define a bounded directional change.
 * @evidence contracts/common.md#clear-and-simple-design The input reuses the steering owner's previous-direction field while turn limiting adds only its requested direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is a construction regularizer, not measured biological curvature, and antiparallel direction keeps the prior heading.
 * @evidence contracts/common.md#meaningful-documentation step is metres and this directional calculation adds no collider-epsilon admission requirement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms limitHumanFaceHairTurn owns angular arithmetic; the input type executes none.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The numerical construction-turn rule is shared rather than independently parameterized per trial.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Direction records remain caller-owned and no collision index or history is retained.
 *
 * @author Samchon
 */
export interface IHumanFaceHairTurnProps extends Pick<
  IHumanFaceHairRootedSteering,
  "before"
> {
  /** Requested unit travel direction in the same head frame. */
  direction: IAutoMovieVector3;

  /** Construction length in metres; this direction calculation adds no collider-epsilon precondition. */
  step: number;
}
