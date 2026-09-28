import { Vector3, builtSpaceContainsPoint } from "@automovie/engine";
import type {
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

type Box = { min: IAutoMovieVector3; max: IAutoMovieVector3 };

/** A conservative camera pocket, never a body or walkability certificate. */
export function clearObservationEye(
  point: IAutoMovieVector3,
  boxes: readonly Box[],
): boolean {
  const radius = 0.08;
  return boxes.every(
    (box) =>
      box.max.y <= point.y - radius ||
      box.min.y >= point.y + radius ||
      box.max.x <= point.x - radius ||
      box.min.x >= point.x + radius ||
      box.max.z <= point.z - radius ||
      box.min.z >= point.z + radius,
  );
}

/** The first 35cm of a camera's look direction must also have a pocket. A free
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
  const reach = Math.min(0.35, length);
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

/** Preserve the original question and derive only its additional unobstructed
 * camera. Search the segment toward the existing interior center in 5cm steps. */
export function supplementalObservationEye(
  space: IAutoMovieBuiltSpace,
  original: IAutoMovieVector3,
  center: IAutoMovieVector3,
  boxes: readonly Box[],
): IAutoMovieVector3 | null {
  if (clearObservationView(original, center, boxes)) return null;
  const length = Vector3.length(Vector3.subtract(center, original));
  const steps = Math.max(1, Math.ceil(length / 0.05));
  for (let index = 1; index <= steps; index++) {
    const t = index / steps;
    const point = Vector3.add(
      original,
      Vector3.scale(Vector3.subtract(center, original), t),
    );
    if (
      builtSpaceContainsPoint(space, point) &&
      clearObservationView(point, center, boxes)
    )
      return point;
  }
  return null;
}
