import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";

/**
 * A force application site on a person: a humanoid surface region or a point in
 * a named bone's local frame, measured in metres.
 */
export type AutoMovieHumanForceSite =
  | AutoMovieHumanoidRegion
  | {
      /** Bone carrying the force application point. */
      bone: AutoMovieHumanoidBone;
      /** Force application point in that bone's local frame, metres. */
      point: IAutoMovieVector3;
    };
