import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedSteering } from "./IHumanFaceHairRootedSteering";

/**
 * Construction-turn input reusing the rooted steering's preceding direction.
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
