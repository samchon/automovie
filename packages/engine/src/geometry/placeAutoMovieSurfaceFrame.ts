import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMoviePreparedSurfaceFrame } from "./IAutoMoviePreparedSurfaceFrame";
import type { IAutoMovieSurfaceFrame } from "./IAutoMovieSurfaceFrame";
import { normalizeAutoMovieSurfaceFrame } from "./normalizeAutoMovieSurfaceFrame";
import type { IAutoMovieSweepFrame } from "./sweep/IAutoMovieSweepFrame";

/**
 * Place a prepared rigid triangle at a requested centroid, heading and normal.
 * Output points retain their source order and pairwise distances up to binary64
 * rounding. The target normal fixes the plane; forward is projected into it and
 * normalized, so neither direction supplies scale. Prepared data is borrowed
 * unchanged and output records are independent. Invalid directions, malformed
 * offset counts, nonfinite offsets or unrepresentable results throw. Three
 * targets constrain a rigid patch; they do not prove whole-body support or IK
 * reachability, which remain with the actual consumer.
 *
 * @evidence contracts/common.md#principled-implementation Recombines prepared metre coordinates with one right-handed orthonormal destination basis and translation, the rigid change of frame that preserves triangle edge lengths up to rounding.
 * @evidence contracts/common.md#clear-and-simple-design Placement consumes source preparation and the shared frame normalizer without loading a mesh, interpreting bones or choosing a support policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Target vector lengths never resize the sample; zero/parallel directions and nonfinite represented output refuse instead of producing fitted or fabricated points.
 * @evidence contracts/common.md#meaningful-documentation States centroid placement, normal priority, source order, numerical precision, borrowed/fresh ownership, refusals and the distinction from whole-body support or reachability.
 * @evidence contracts/performance.md#efficient-algorithms One frame construction and three fixed-size point mappings cost constant time and scratch, with no work proportional to mesh vertices or skeleton bones.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the prepared frozen source offsets for each destination; mutable destination values are normalized afresh and effect-free results are returned independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers exactly three fresh points to the caller and retains no destination, prepared sample, native handle or placement history.
 */
export function placeAutoMovieSurfaceFrame(
  prepared: IAutoMoviePreparedSurfaceFrame,
  target: IAutoMovieSurfaceFrame,
): [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] {
  if (
    prepared.offsets.length !== 3 ||
    prepared.offsets.some(
      (point: Readonly<IAutoMovieVector3>): boolean =>
        ![point.x, point.y, point.z].every(Number.isFinite),
    )
  )
    throw new Error("Surface placement requires three finite prepared offsets.");

  const basis: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(target);
  const points: IAutoMovieVector3[] = prepared.offsets.map(
    (point: Readonly<IAutoMovieVector3>): IAutoMovieVector3 => {
      const out: IAutoMovieVector3 = {
        x:
          basis.origin.x +
          point.x * basis.x.x +
          point.y * basis.y.x +
          point.z * basis.normal.x,
        y:
          basis.origin.y +
          point.x * basis.x.y +
          point.y * basis.y.y +
          point.z * basis.normal.y,
        z:
          basis.origin.z +
          point.x * basis.x.z +
          point.y * basis.y.z +
          point.z * basis.normal.z,
      };
      if (![out.x, out.y, out.z].every(Number.isFinite))
        throw new Error("Surface placement exceeds finite coordinates.");
      return out;
    },
  );
  return [points[0], points[1], points[2]];
}
