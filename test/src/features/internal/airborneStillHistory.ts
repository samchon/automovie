import { integrateAirborneRotation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { airbornePlaced } from "./airbornePlaced";

/**
 * The shape history of a body that does not change shape: its one part sits at
 * the origin throughout.
 *
 * @param body The body, one part riding the hips.
 * @returns The history of that body over any span.
 */
export const airborneStillHistory: (
  body: IAutoMovieResolveCenterOfMass.IModel,
) => integrateAirborneRotation.ICachedHistory = (
  body: IAutoMovieResolveCenterOfMass.IModel,
): integrateAirborneRotation.ICachedHistory =>
  integrateAirborneRotation.history(
    body,
    (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      airbornePlaced({ hips: { x: 0, y: 0, z: 0 } }),
  );
