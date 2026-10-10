import type { IAutoMovieVector3 } from "@automovie/interface";

/** Existing same-frame signed-distance lower-bound inputs, in metres.
 *
 * @author Samchon
 */
export interface IHumanFaceHairFreeDistanceBoundProps {
  /** Point at which the same surface's signed distance was measured, in metres. */
  sampled: IAutoMovieVector3;

  /** Signed sample distance in metres, positive on the oriented exterior. */
  distance: number;

  /** Unqueried point in the sample's metre frame. */
  candidate: IAutoMovieVector3;

  /** Required free distance in metres from the caller's contact rule. */
  required: number;

  /** Nonnegative numerical allowance in metres already used by that rule. */
  allowance: number;
}
