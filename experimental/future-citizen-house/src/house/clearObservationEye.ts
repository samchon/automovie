import type { IAutoMovieVector3 } from "@automovie/interface";
import { Box } from "./Box";

/** A conservative camera pocket, never a body or walkability certificate. */

export function clearObservationEye(
  point: IAutoMovieVector3,
  boxes: readonly Box[]
): boolean {
  const radius = 0.08;
  return boxes.every(
    (box) => box.max.y <= point.y - radius ||
      box.min.y >= point.y + radius ||
      box.max.x <= point.x - radius ||
      box.min.x >= point.x + radius ||
      box.max.z <= point.z - radius ||
      box.min.z >= point.z + radius
  );
}
