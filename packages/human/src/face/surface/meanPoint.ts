import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The component-wise mean of a nonempty list of points. An empty list divides
 * by zero, so callers pass at least one point. `fitPortraitEyeSphere` uses it
 * for the centre of the sample set.
 *
 * Coordinates retain the caller's unit. Finite accumulation is also a caller
 * premise; this helper neither admits samples nor checks the resulting mean.
 *
 * @evidence contracts/common.md#principled-implementation Component sums divided by population give the arithmetic centroid; sphere fitting supplies nonempty admitted rim samples, although extreme finite sums can still overflow.
 * @evidence contracts/common.md#clear-and-simple-design The mean is a stateless vector reduction; eye-sphere fitting owns geometric sample admission and interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No padding point or guessed centroid replaces an empty population; nonempty finite accumulation remains a documented caller requirement.
 * @evidence contracts/common.md#meaningful-documentation Prose states the nonempty and finite-accumulation premises, unit retention and absence of result admission.
 * @evidence contracts/performance.md#efficient-algorithms One O(n) reduction visits every point with constant live accumulator space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each arithmetic mean depends on its supplied points; this helper coordinates no persistent requests or phases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reduction retains no input list after return; only its new result vector escapes.
 * @author Samchon
 */
export const meanPoint: (points: IAutoMovieVector3[]) => IAutoMovieVector3 = (points: IAutoMovieVector3[]): IAutoMovieVector3 =>
  Vector3.scale(
    points.reduce(Vector3.add, Vector3.create()),
    1 / points.length,
  );
