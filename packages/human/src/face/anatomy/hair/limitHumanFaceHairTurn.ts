import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * The tightest turn the integrator lets a hair take: a path whose radius of
 * curvature is this many metres. A step of length h then turns at most h / 0.006
 * radians, which keeps successive tangents far from antiparallel so the ribbon
 * frame stays well conditioned. The value is the construction limit of this
 * integrator. An earlier note attributes it to the tightest class of the
 * Loussouarn et al. (2007) curliness survey, but that survey's curve diameters
 * were not read here, so no anatomical claim rests on it.
 */
const TIGHTEST_RADIUS = 0.006;

/**
 * Hold the direction a hair is asked to take to the tightest turn it may make
 * in one step. A wanted direction within the limit is returned as it is. A
 * sharper one is rotated from the previous direction toward the wanted one by
 * exactly the limit, in the plane the two span, so the path bends as far as it
 * may and no farther; a wanted direction exactly opposite the previous one
 * spans no plane and the hair keeps going straight.
 *
 * Directions are unit vectors and `step` is the integration step in metres.
 * A field that asks for more turn than the limit is asking for a kink, which
 * has no ribbon frame and no follicle. Inputs are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The angle between two unit vectors is acos of their clamped dot product, and rotating the previous direction by the limit toward the wanted one is cos(limit) * before + sin(limit) * unit(wanted - (wanted . before) before), the unit vector at that angle in their common plane. The clamp keeps rounding from leaving acos's domain, and the opposite-direction case, whose plane is undefined, is answered by going straight.
 * @evidence contracts/common.md#clear-and-simple-design One pure function of the previous direction, the wanted one and the step, apart from the integrator that owns the walk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a subject or style; every step meets the same limit and the limit is stated as a construction bound and not as a measurement.
 * @evidence contracts/common.md#meaningful-documentation The comments state what the limit is for, what is returned within and beyond it, the opposite-direction case and the status of the constant.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function computes a direction and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Directions are dimensionless unit vectors in the caller's head frame, the step and the limit radius are metres, and the turn is radians; nothing is converted beyond turn = step / radius.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; the limit is a constant and the directions come from the integrator.
 */
export function limitHumanFaceHairTurn(props: {
  before: IAutoMovieVector3;
  direction: IAutoMovieVector3;
  step: number;
}): IAutoMovieVector3 {
  const { before, direction } = props;
  const turn = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(before, direction))),
  );
  const limit = props.step / TIGHTEST_RADIUS;
  if (turn <= limit) return direction;
  const across = Vector3.subtract(
    direction,
    Vector3.scale(before, Vector3.dot(direction, before)),
  );
  return Vector3.length(across) > 0
    ? Vector3.add(
        Vector3.scale(before, Math.cos(limit)),
        Vector3.scale(humanFaceHairFrame.direction(across), Math.sin(limit)),
      )
    : before;
}
