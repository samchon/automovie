import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairTurnProps } from "./IHumanFaceHairTurnProps";
import { humanFaceHairConstructionTurn } from "./humanFaceHairConstructionTurn";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Hold a requested direction to the numerical construction turn per step. A wanted direction within the limit is returned as it is. A
 * sharper one is rotated from the previous direction toward the wanted one by
 * exactly the limit (`humanFaceHairConstructionTurn`), in the plane the two span, so the path bends as far as it
 * may and no farther; a wanted direction exactly opposite the previous one
 * spans no plane and the hair keeps going straight.
 *
 * Directions are unit vectors and `step` is the integration step in metres.
 * This regularizer avoids abrupt requested changes and antiparallel ribbon
 * transport; it is not a maximum biological or clinical curvature. Contact
 * projection and clipped chords may change the realised angular metric. Inputs
 * are unchanged.
 */
export function limitHumanFaceHairTurn(
  props: IHumanFaceHairTurnProps,
): IAutoMovieVector3 {
  const { before, direction } = props;
  const turn = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(before, direction))),
  );
  const limit = humanFaceHairConstructionTurn(props.step);
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
