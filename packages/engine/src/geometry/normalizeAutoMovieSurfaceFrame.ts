import type {
  IAutoMovieSurfaceFrame,
  IAutoMovieSweepFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Admit a surface request and construct its right-handed orthonormal basis in
 * the caller's coordinate frame. The origin is copied unchanged in metres; x is
 * the normalized projection of forward into the normal's plane, y is normal
 * cross x, and normal is the supplied direction normalized. Direction
 * magnitudes supply no scale. Every returned vector is fresh and mutable; input
 * records are read only and are not retained.
 *
 * The normal takes priority through normal-cross-forward, then
 * side-cross-normal. This is Gram-Schmidt without subtracting nearly equal
 * parallel vectors. Nonfinite coordinates, zero directions and exact zero
 * represented cross products refuse. Near-parallel directions remain sensitive
 * to binary64 rounding, including cross-product underflow; there is no angular
 * tolerance or replacement world axis. This constructs a rigid basis only,
 * without admitting a surface mesh or certifying contact/support. Preparation,
 * placement and callers aligning measured geometry share this public
 * computation owner rather than assembling another basis convention.
 *
 * @param frame Origin and two independent directions, only read.
 * @returns Fresh origin and unit x, y and normal axes with x cross y = normal.
 * @throws Error on nonfinite coordinates or zero/represented-parallel
 *   directions.
 */
export function normalizeAutoMovieSurfaceFrame(
  frame: IAutoMovieSurfaceFrame,
): IAutoMovieSweepFrame {
  if (
    !Vector3.isFinite(frame.origin) ||
    !Vector3.isFinite(frame.forward) ||
    !Vector3.isFinite(frame.normal)
  )
    throw new Error("Surface frame requires finite origin and directions.");

  const normal: IAutoMovieVector3 = Vector3.normalize(frame.normal);
  const candidate: IAutoMovieVector3 = Vector3.normalize(frame.forward);
  const side: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(normal, candidate),
  );
  if (Vector3.length(normal) === 0 || Vector3.length(side) === 0)
    throw new Error("Surface frame requires nonzero independent directions.");

  return {
    origin: { ...frame.origin },
    x: Vector3.normalize(Vector3.cross(side, normal)),
    y: side,
    normal,
  };
}
