import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieVector3,
} from "@automovie/interface";
import { clearObservationEye } from "./clearObservationEye";
import { Box } from "./Box";

/** The segment to the intended interior target must also have a pocket. A free
 * eye immediately behind a leaf does not answer the room observation question.
 * Bound sampling is conservative and does not certify farther visibility. */
export function clearObservationView(
  point: IAutoMovieVector3,
  target: IAutoMovieVector3,
  boxes: readonly Box[],
): boolean {
  const direction = Vector3.subtract(target, point),
    length = Vector3.length(direction);
  if (!clearObservationEye(point, boxes)) return false;
  if (!length) return true;
  const reach = length;
  const steps = Math.ceil(reach / 0.05);
  for (let index = 1; index <= steps; index++)
    if (
      !clearObservationEye(
        Vector3.add(
          point,
          Vector3.scale(direction, (reach * index) / steps / length),
        ),
        boxes,
      )
    )
      return false;
  return true;
}

