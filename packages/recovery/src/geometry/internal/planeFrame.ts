import type {
  AutoMovieVector3Tuple,
  IAutoMoviePlaneFrameConstruction,
} from "@automovie/interface";

import { cross } from "../../internal/mesh-observations/cross";
import { dot } from "../../internal/mesh-observations/dot";
import { len } from "../../internal/mesh-observations/len";
import { mul } from "../../internal/mesh-observations/mul";
import { norm } from "../../internal/mesh-observations/norm";
import { sub } from "../../internal/mesh-observations/sub";

/*
 * Builds an orthonormal cutting frame whose v follows the projected reference
 * and u cross v = n.
 */
export function planeFrame(
  origin: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[0],
  normal: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[1],
  reference: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[2],
): ReturnType<IAutoMoviePlaneFrameConstruction.Operation> {
  if (len(normal) === 0) throw new Error("Cutting plane normal is zero");
  const n: AutoMovieVector3Tuple = norm(normal);
  const projected: AutoMovieVector3Tuple = sub(
    reference,
    mul(n, dot(reference, n)),
  );
  if (len(projected) < 1e-6)
    throw new Error("Plane reference is parallel to its normal");
  const v: AutoMovieVector3Tuple = norm(projected);
  return { origin, n, u: cross(v, n), v };
}
