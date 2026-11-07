import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { physicalShapeBounds } from "./physicalShapeBounds";

/** Refuse a nonfinite or out-of-domain shape before it can leave the declared finite floor. */
export function inPhysicalFloorBounds(
  pose: P.ITransform,
  shape: P.IShape,
  floor: Simulation.IInput["floorBounds"],
): boolean {
  const bounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
    pose,
    shape,
  );
  return (
    Number.isFinite(bounds.min.y) &&
    Number.isFinite(bounds.max.y) &&
    bounds.min.x >= floor.min.x &&
    bounds.max.x <= floor.max.x &&
    bounds.min.z >= floor.min.z &&
    bounds.max.z <= floor.max.z
  );
}
