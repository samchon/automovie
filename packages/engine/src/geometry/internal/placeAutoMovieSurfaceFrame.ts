import type {
  IAutoMoviePreparedSurfaceFrame,
  IAutoMovieSurfaceFrame,
  IAutoMovieSweepFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { normalizeAutoMovieSurfaceFrame } from "./normalizeAutoMovieSurfaceFrame";
import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";

/**
 * Place a prepared rigid triangle at a requested centroid, heading and normal.
 * Output points retain their source order and pairwise distances up to binary64
 * rounding. The target normal fixes the plane; forward is projected into it and
 * normalized, so neither direction supplies scale. Prepared data is borrowed
 * unchanged and output records are independent. Invalid directions, malformed
 * offset counts, nonfinite offsets or unrepresentable results throw. Three
 * targets constrain a rigid patch; they do not prove whole-body support or IK
 * reachability, which remain with the actual consumer.
 */
export function placeAutoMovieSurfaceFrame(
  prepared: IAutoMoviePreparedSurfaceFrame,
  target: IAutoMovieSurfaceFrame,
): [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] {
  if (prepared.offsets.length !== 3)
    throw new Error("Surface placement requires three prepared offsets.");

  const basis: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(target);
  const points: IAutoMovieVector3[] = prepared.offsets.map(
    (point: Readonly<IAutoMovieVector3>): IAutoMovieVector3 => {
      const out: IAutoMovieVector3 = {
        x: place(basis.origin.x, [
          point.x * basis.x.x,
          point.y * basis.y.x,
          point.z * basis.normal.x,
        ]),
        y: place(basis.origin.y, [
          point.x * basis.x.y,
          point.y * basis.y.y,
          point.z * basis.normal.y,
        ]),
        z: place(basis.origin.z, [
          point.x * basis.x.z,
          point.y * basis.y.z,
          point.z * basis.normal.z,
        ]),
      };
      return out;
    },
  );
  return [points[0], points[1], points[2]];
}

/**
 * Sum one placed coordinate term by term, refusing the first product or
 * partial sum of finite operands that overflows binary64.
 */
function place(origin: number, terms: readonly number[]): number {
  let sum: number = origin;
  for (const term of terms) {
    sum += term;
    if (overflowsBinary64(term) || overflowsBinary64(sum))
      throw new Error("Surface placement exceeds finite coordinates.");
  }
  return sum;
}