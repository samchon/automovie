import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { IAutoMovieSurfaceFrame } from "./IAutoMovieSurfaceFrame";
import type { IAutoMovieSweepFrame } from "./sweep/IAutoMovieSweepFrame";

/**
 * Admit a surface request and construct its right-handed orthonormal basis in
 * the caller's coordinate frame. The origin is copied unchanged in metres;
 * x is the normalized projection of forward into the normal's plane, y is
 * normal cross x, and normal is the supplied direction normalized. Direction
 * magnitudes supply no scale. Every returned vector is fresh and mutable;
 * input records are read only and are not retained.
 *
 * The normal takes priority through normal-cross-forward, then
 * side-cross-normal. This is Gram-Schmidt without subtracting nearly equal
 * parallel vectors. Nonfinite coordinates, zero directions and exact zero
 * represented cross products refuse. Near-parallel directions remain
 * sensitive to binary64 rounding, including cross-product underflow; there is
 * no angular tolerance or replacement world axis. This constructs a rigid
 * basis only, without admitting a surface mesh or certifying contact/support.
 * Preparation, placement and callers aligning measured geometry share this
 * public computation owner rather than assembling another basis convention.
 *
 * @param frame Origin and two independent directions, only read.
 * @returns Fresh origin and unit x, y and normal axes with x cross y = normal.
 * @throws Error on nonfinite coordinates or zero/represented-parallel directions.
 *
 * @evidence contracts/common.md#principled-implementation Normalizing each finite direction before crossing avoids input-magnitude overflow; the two cross products produce the normal-priority orthonormal basis in the existing sweep-frame representation.
 * @evidence contracts/common.md#clear-and-simple-design Preparation, placement and public geometry alignment share one basis admission owner, reusing Vector3 algebra and the already public IAutoMovieSurfaceFrame/IAutoMovieSweepFrame contracts rather than another matrix or quaternion convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero directions and exact represented parallelism refuse rather than choosing a world axis; no fixture tolerance conceals ill-conditioned inputs.
 * @evidence contracts/common.md#meaningful-documentation States metre origin, direction magnitude independence, projected x and right-handed y, normal priority, fresh mutable output ownership, every refusal, binary64 conditioning and the distinction from contact/support admission.
 * @evidence contracts/performance.md#efficient-algorithms Three finite-vector checks, normalizations and two cross products take constant time and constant scratch, independent of any mesh population.
 * @evidence contracts/performance.md#reuse-equivalent-work Preparation, placement and measured geometry alignment use this same basis law; current mutable request values are read afresh and no cross-call result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh origin and basis records transfer to the caller; temporary normalized directions expire on return and no input or task is retained.
 */
export function normalizeAutoMovieSurfaceFrame(
  frame: IAutoMovieSurfaceFrame,
): IAutoMovieSweepFrame {
  for (const value of [frame.origin, frame.forward, frame.normal])
    if (![value.x, value.y, value.z].every(Number.isFinite))
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
