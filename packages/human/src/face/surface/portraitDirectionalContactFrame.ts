import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The right-handed frame of a directional contact: `forward` is the normalized
 * direction and `across` and `up` complete it.
 *
 * The helper axis is world Y unless the direction is nearly vertical
 * (|y| >= 0.9), where world X avoids a degenerate cross product. Refuses a
 * non-finite or zero direction and a negative or non-finite clearance. Shared
 * by the directional intersection, contact and surface-target constructors.
 *
 * @evidence contracts/common.md#principled-implementation The frame is an orthonormal basis (across = normalize(guide x forward), up = forward x across), so across x up = forward and it is right-handed. The helper axis switches from world Y to world X when the direction is within about 26 degrees of vertical (|y| >= 0.9), which keeps the cross product away from zero; a zero or non-finite direction and a negative clearance are refused.
 * @evidence contracts/common.md#clear-and-simple-design One frame owner shared by the intersection, contact and surface-target constructors instead of three copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject-specific special case; the guide switch is a numerical-degeneracy guard with its stated threshold.
 * @evidence contracts/common.md#meaningful-documentation Documents the handedness, the degeneracy guard and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions The direction is read in the caller's frame; the returned axes are unit vectors of that same frame and right-handed as stated.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping portraitDirectionalContactFrame is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels portraitDirectionalContactFrame defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry portraitDirectionalContactFrame decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries portraitDirectionalContactFrame constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation portraitDirectionalContactFrame owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitDirectionalContactFrame carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitDirectionalContactFrame admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitDirectionalContactFrame defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export function portraitDirectionalContactFrame(
  direction: IAutoMovieVector3,
  clearance: number,
) {
  if (
    ![direction.x, direction.y, direction.z, clearance].every(
      Number.isFinite,
    ) ||
    clearance < 0 ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Directional contact needs a finite nonzero direction and nonnegative clearance.",
    );
  const forward = Vector3.normalize(direction);
  const guide =
    Math.abs(forward.y) < 0.9
      ? Vector3.create(0, 1, 0)
      : Vector3.create(1, 0, 0);
  const across = Vector3.normalize(Vector3.cross(guide, forward));
  const up = Vector3.cross(forward, across);
  return { forward, across, up };
}
