import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Evaluate an admitted diagonal Gaussian envelope at a neutral metre-space point. Root rejection sampling uses this as relative area density; parting uses it as a direction-field weight. Neither use changes the neutral point. The exponent is the squared Mahalanobis distance for independent axes, with peak one at the centre. An absent envelope is uniform. Very remote points may underflow to zero; sampling owns its explicit exhaustion refusal.
 *
 * @evidence contracts/common.md#principled-implementation A diagonal Gaussian evaluates relative root density or part influence from squared axis-normalized neutral distance.
 * @evidence contracts/common.md#clear-and-simple-design Absent regions give uniform weight without changing sampled positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Remote values may underflow to zero, so sampling retains its explicit exhaustion refusal rather than inventing roots.
 * @evidence contracts/common.md#meaningful-documentation Points, centres and spreads are metres; independent-axis spread admission remains with the document validator.
 * @evidence contracts/performance.md#efficient-algorithms Three axis terms and one exponential take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Root sampling, tint and combing reuse one envelope formula; evaluations are not cached against mutable regions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar is returned and the borrowed region/point are not retained.
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
            (sum: number, value: number, axis: number): number =>
              sum + ((value - region.center[axis]) / region.spread[axis]) ** 2,
            0,
          ),
      );
}
