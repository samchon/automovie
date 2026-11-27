import {
  type IAutoMovieComputeModelRestExtentY,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { computeModelRestExtent } from "./computeModelRestExtent";

/*
 * A model's rest-pose vertical extent in model space, in metres: the model-Y
 * range of the supplied portable part geometry or registered collision proxy.
 *
 * This is the subject height the framing grammar needs, and the reason it is
 * not computeRestHeight. A rig stops at the joints animation requires
 * and the figure does not: the generated `stickman` has no foot bone and no
 * head-top bone, so its joint span is 0.680 of the declared height, and a
 * `full` shot solved from that number shows an actor from the shins up.
 *
 * Returns null when the model has no vertex to measure, leaving the caller's
 * own fallback in charge rather than inventing a height, and throws when the
 * model's skeleton is malformed, both as computeModelRestExtent does.
 */
export function computeModelRestExtentY(
  model: IAutoMovieModel,
): IAutoMovieComputeModelRestExtentY.IResult {
  const extent: { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null =
    computeModelRestExtent(model);
  return extent === null ? null : { min: extent.min.y, max: extent.max.y };
}
