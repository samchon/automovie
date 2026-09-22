import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Evaluate an admitted diagonal Gaussian envelope at a neutral metre-space
 * point. Root rejection sampling uses this as relative area density; parting
 * uses it as a direction-field weight. Neither use changes the neutral point.
 * The exponent is the squared Mahalanobis distance for independent axes, with
 * peak one at the centre. An absent envelope is uniform. Very remote points
 * may underflow to zero; sampling owns its explicit exhaustion refusal.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Uses one numerical envelope for local populations and styling.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Keeps spatial weights independent of individual guide coordinates.
 */
export function humanFaceHairEnvelope(
  point: IAutoMovieVector3,
  region: IAutoMovieHumanFaceHair.Region | undefined,
): number {
  return region === undefined
    ? 1
    : Math.exp(
        -0.5 *
          [point.x, point.y, point.z].reduce(
            (sum, value, axis) =>
              sum + ((value - region.center[axis]) / region.spread[axis]) ** 2,
            0,
          ),
      );
}
