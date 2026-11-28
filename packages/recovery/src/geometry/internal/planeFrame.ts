import type {
  AutoMovieVector3Tuple,
  IAutoMoviePlaneFrameConstruction,
} from "@automovie/interface";

import { cross } from "../../internal/mesh-observations/cross";
import { len } from "../../internal/mesh-observations/len";
import { norm } from "../../internal/mesh-observations/norm";

/*
 * Builds an orthonormal cutting frame whose v follows the projected reference
 * and u cross v = n. The supplied origin stays borrowed.
 */
export function planeFrame(
  origin: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[0],
  normal: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[1],
  reference: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[2],
): ReturnType<IAutoMoviePlaneFrameConstruction.Operation> {
  if (!finiteTuple(origin) || !finiteTuple(normal) || !finiteTuple(reference))
    throw new Error("Cutting frame requires finite Cartesian tuples");
  if (len(normal) === 0) throw new Error("Cutting plane normal is zero");
  const n: AutoMovieVector3Tuple = norm(normal);
  // Its physical norm equals the reference's projected length.
  let transverse: AutoMovieVector3Tuple = cross(reference, n);
  if (len(transverse) < 1e-6)
    throw new Error("Plane reference is parallel to its normal");
  if (!finiteTuple(transverse)) {
    // Only subtraction of two finite products can overflow this cross.
    const scale: number = Math.max(
      Math.abs(reference[0]),
      Math.abs(reference[1]),
      Math.abs(reference[2]),
    );
    transverse = cross(
      [reference[0] / scale, reference[1] / scale, reference[2] / scale],
      n,
    );
  }
  const u: AutoMovieVector3Tuple = norm(transverse);
  return { origin, n, u, v: norm(cross(n, u)) };
}

/* Indexed reads reject sparse Cartesian input. */
function finiteTuple(value: AutoMovieVector3Tuple): boolean {
  return (
    value?.length === 3 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Number.isFinite(value[2])
  );
}
