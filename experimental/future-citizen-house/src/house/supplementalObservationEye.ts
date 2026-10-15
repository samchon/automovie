import { Vector3, builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { clearObservationView } from "./clearObservationView";
import { Box } from "./Box";

/** Preserve the original question and derive only its additional unobstructed
 * camera. Search the segment toward the existing interior center in 5cm steps. */

export function supplementalObservationEye(
  space: IAutoMovieBuiltSpace,
  original: IAutoMovieVector3,
  center: IAutoMovieVector3,
  boxes: readonly Box[]
): IAutoMovieVector3 | null {
  if (clearObservationView(original, center, boxes)) return null;
  const length = Vector3.length(Vector3.subtract(center, original));
  const steps = Math.max(1, Math.ceil(length / 0.05));
  for (let index = 1; index <= steps; index++) {
    const t = index / steps;
    const point = Vector3.add(
      original,
      Vector3.scale(Vector3.subtract(center, original), t)
    );
    if (builtSpaceContainsPoint(space, point) &&
      clearObservationView(point, center, boxes))
      return point;
  }
  return null;
}
