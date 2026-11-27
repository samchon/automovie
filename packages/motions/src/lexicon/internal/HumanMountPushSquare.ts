import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/** The unit part of `v` square to the unit `axis`, or null where none is left. */
export function HumanMountPushSquare(
  v: IAutoMovieVector3,
  axis: IAutoMovieVector3,
): IAutoMovieVector3 | null {
  const across: IAutoMovieVector3 = Vector3.subtract(
    v,
    Vector3.scale(axis, Vector3.dot(axis, v)),
  );
  return Vector3.length(across) < 1e-9 ? null : Vector3.normalize(across);
}
