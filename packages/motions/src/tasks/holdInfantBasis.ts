import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * The rotation that takes a held infant's `+Y` to its body's line and its `+Z`
 * toward its face: the face's way made square to the line first, so a face not
 * across the line still turns the infant about it.
 *
 * @param line The unit line from the infant's seat to its head.
 * @param face The way its face faces.
 * @returns The rotation.
 */
export function holdInfantBasis(
  line: IAutoMovieVector3,
  face: IAutoMovieVector3,
): IAutoMovieQuaternion {
  return HumanHand.align(
    { normal: { x: 0, y: 1, z: 0 }, forward: { x: 0, y: 0, z: 1 } },
    {
      normal: line,
      forward: Vector3.normalize(
        Vector3.subtract(face, Vector3.scale(line, Vector3.dot(face, line))),
      ),
    },
  );
}
