import { physicalShapeNormalImplementation as implementation } from "./physicalShapeNormalImplementation";
import type { IAutoMoviePhysicalShape, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

/*
 * Read normals on one unchanged admitted frame/shape during an operation. The
 * centre, rotation and the kind's axis, inverse rotation and planes are
 * prepared once here; every point retains the original radial checks, plane
 * heights, exponential weights, summation order and normalization.
 */
export function physicalShapeNormalPrepare(
  frame: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): (
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
) => IAutoMovieVector3 {
  return implementation.physicalShapeNormalPrepare(frame, shape);
}
