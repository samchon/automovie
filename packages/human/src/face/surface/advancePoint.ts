import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point moved `distance` along the unit direction `forward`, refusing a
 * result outside the finite coordinate domain. Shared by the directional
 * contact and intersection constructors.
 *
 * @evidence contracts/common.md#principled-implementation point + distance * forward is exact vector arithmetic for a unit direction; the premise (a unit `forward`) is the caller's, and the only numerical hazard, overflow to a non-finite coordinate, is refused rather than returned.
 * @evidence contracts/common.md#clear-and-simple-design One expression and one refusal, shared by the three directional-contact constructors so the finiteness rule has a single owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case, foreign mutation or compensating path: the result is a function of the three arguments.
 * @evidence contracts/common.md#meaningful-documentation States what is computed, the unit-direction premise and the refusal, and names its consumers.
 * @evidence contracts/modeling.md#spatial-conventions The unit and frame are the caller's (engine metres in every consumer); the function adds a distance in the same unit along a direction in the same frame and converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping advancePoint is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels advancePoint defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry advancePoint decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries advancePoint constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation advancePoint owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source advancePoint carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range advancePoint admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority advancePoint defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export function advancePoint(
  point: IAutoMovieVector3,
  forward: IAutoMovieVector3,
  distance: number,
): IAutoMovieVector3 {
  const result = Vector3.add(point, Vector3.scale(forward, distance));
  if (![result.x, result.y, result.z].every(Number.isFinite))
    throw new Error(
      "Directional contact exceeds its finite coordinate domain.",
    );
  return result;
}
