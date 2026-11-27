import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { physicalShapeBoundsImplementation } from "./physicalShapeBoundsImplementation";

/*
 * Refuse a nonfinite or out-of-domain shape before it can leave the declared
 * finite floor.
 */
export function inPhysicalFloorBounds(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  floor: IAutoMoviePhysicalSimulationInput.IInput["floorBounds"],
): boolean {
  const bounds: IAutoMoviePhysicalShapeBounds.IResult = physicalShapeBoundsImplementation.physicalShapeBounds(
    pose,
    shape,
  );
  return (
    bounds.min.x >= floor.min.x &&
    bounds.max.x <= floor.max.x &&
    bounds.min.z >= floor.min.z &&
    bounds.max.z <= floor.max.z
  );
}
